// controllers/shopController.js

const Shop = require('../models/shop');
const Vendor = require('../models/vendor');

// @desc    Create a new shop
// @route   POST /api/shops
// @access  Private (Vendor only)
const createShop = async (req, res) => {
    try {
        const { name, address, phone } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: "Shop name is required" });
        }

        // The owner's ID comes from the 'protect' middleware (req.vendor)
        const ownerId = req.vendor._id;

        const newShop = await Shop.create({
            name,
            address,
            phone,
            owner: ownerId
        });

        res.status(201).json({
            success: true,
            message: "Shop created successfully",
            data: newShop
        });

    } catch (error) {
        console.error("Create shop error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// @desc    Get all shops for the logged-in vendor
// @route   GET /api/shops
// @access  Private (Vendor only)
const getMyShops = async (req, res) => {
    try {
        const ownerId = req.vendor._id;
        const shops = await Shop.find({ owner: ownerId });

        res.status(200).json({
            success: true,
            count: shops.length,
            data: shops
        });
        
    } catch (error) {
        console.error("Get my shops error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

module.exports = {
    createShop,
    getMyShops
};