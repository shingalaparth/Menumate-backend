// controllers/adminController.js
const FoodCourt = require('../models/foodCourt');
const Shop = require('../models/shop');
const Vendor = require('../models/vendor');
const Order = require('../models/order');
const mongoose = require('mongoose');

// @desc    Create a new food court
// @route   POST /api/admin/foodcourts
// @access  Private (Super Admin only)
const createFoodCourt = async (req, res) => {
    try {
        const { name, address, city } = req.body;
        if (!name || !address || !city) {
            return res.status(400).json({ success: false, message: 'Name, address, and city are required.' });
        }
        const newFoodCourt = await FoodCourt.create({ name, address, city });
        res.status(201).json({ success: true, message: 'Food court created successfully.', data: newFoodCourt });
    } catch (error) {
        console.error("Create Food Court Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    } 
};

// @desc    Get a list of all food courts
// @route   GET /api/admin/foodcourts
// @access  Private (Super Admin only)
const getAllFoodCourts = async (req, res) => {
    try {
        const foodCourts = await FoodCourt.find({});
        res.status(200).json({ success: true, count: foodCourts.length, data: foodCourts });
    } catch (error) {
        console.error("Get Food Courts Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Assign an existing shop to a food court
// @route   PATCH /api/admin/shops/:shopId/assign-foodcourt
// @access  Private (Super Admin only)
const assignShopToFoodCourt = async (req, res) => {
    try {
        const { shopId } = req.params;
        const { foodCourtId } = req.body;

        const shop = await Shop.findByIdAndUpdate(
            shopId,
            { foodCourt: foodCourtId },
            { new: true, runValidators: true }
        );

        if (!shop) {
            return res.status(404).json({ success: false, message: 'Shop not found.' });
        }
        res.status(200).json({ success: true, message: 'Shop successfully assigned to food court.', data: shop });
    } catch (error) {
        console.error("Assign Shop Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Appoint a vendor as a food court manager
// @route   PATCH /api/admin/vendors/:vendorId/appoint-manager
// @access  Private (Super Admin only)
const appointFoodCourtManager = async (req, res) => {
     try {
        const { vendorId } = req.params;
        const { foodCourtId } = req.body;

        // 1. Find the documents we need to work with
        const newManager = await Vendor.findById(vendorId);
        const foodCourt = await FoodCourt.findById(foodCourtId);

        if (!newManager || !foodCourt) {
            return res.status(404).json({ success: false, message: 'Vendor or Food Court not found.' });
        }

        // 2. If the food court already has a manager, remove their old role to prevent conflicts
        if (foodCourt.manager && foodCourt.manager.toString() !== newManager._id.toString()) {
            await Vendor.findByIdAndUpdate(foodCourt.manager, { $set: { managesFoodCourt: null } });
        }

        // 3. Update the new manager's profile to link them to the food court
        newManager.managesFoodCourt = foodCourtId;
        
        // 4. Update the food court's profile to link it to the new manager
        foodCourt.manager = vendorId;

        // 5. Save all changes to the database
        await newManager.save();
        await foodCourt.save();

        res.status(200).json({ 
            success: true, 
            message: `Vendor '${newManager.name}' successfully appointed as manager for '${foodCourt.name}'.`
        });

    } catch (error) {
        console.error("Appoint Manager Error:", error);
        next(error);
    }
};

// @desc    Get platform-wide analytics for the Super Admin
// @route   GET /api/admin/analytics
// @access  Private (Super Admin only)
const getPlatformAnalytics = async (req, res, next) => {
    try {
        const [
            totalRevenue,
            totalOrders,
            shopCount,
            vendorCount,
            foodCourtCount
        ] = await Promise.all([
            Order.aggregate([
                { $match: { orderStatus: 'Completed' } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ]),
            Order.countDocuments({ orderStatus: 'Completed' }),
            Shop.countDocuments({ isActive: true }),
            Vendor.countDocuments(),
            FoodCourt.countDocuments({ isActive: true })
        ]);

        const analyticsData = {
            totalRevenue: totalRevenue[0]?.total || 0,
            totalOrders: totalOrders || 0,
            activeShops: shopCount || 0,
            totalVendors: vendorCount || 0,
            activeFoodCourts: foodCourtCount || 0
        };

        res.status(200).json({ success: true, data: analyticsData });

    } catch (error) {
        console.error("Platform Analytics Error:", error);
        next(error);
    }
};
// ----------------------------


module.exports = {
    createFoodCourt,
    getAllFoodCourts,
    assignShopToFoodCourt,
    appointFoodCourtManager,
    getPlatformAnalytics
};