// controllers/registrationController.js
const Vendor = require('../models/vendor');
const Shop = require('../models/shop');
const FoodCourt = require('../models/foodCourt');

// @desc    Register a new Vendor AND their first Shop in one step
// @route   POST /api/register/shop-vendor
// @access  Public
const registerShopAndVendor = async (req, res) => {
    try {
        const { vendorName, email, number, password, shopName, foodCourtId } = req.body;

        // --- 1. Validate all incoming data ---
        if (!vendorName || !email || !number || !password || !shopName) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
        }

        // --- 2. Check for duplicate Vendor ---
        const emailLower = email.toLowerCase();
        const existingVendor = await Vendor.findOne({ $or: [{ email: emailLower }, { number }] });
        if (existingVendor) {
            return res.status(400).json({ success: false, message: 'A user with this email or phone number already exists.' });
        }

        // --- 3. Create the Vendor account ---
        const newVendor = await Vendor.create({
            name: vendorName,
            email: emailLower,
            number,
            password
        });

        // --- 4. Create the Shop with "Smart Status" ---
        const newShop = await Shop.create({
            name: shopName,
            owner: newVendor._id,
            // If a foodCourtId is provided, link it and set status to Pending.
            // If not, it's a standalone shop and is automatically Approved.
            foodCourt: foodCourtId || null,
            status: foodCourtId ? 'Pending' : 'Approved'
        });

        res.status(201).json({
            success: true,
            message: foodCourtId
                ? 'Registration successful! Your application has been submitted for approval by the food court manager.'
                : 'Registration successful! You can now log in and set up your shop.',
            data: {
                vendor: { id: newVendor._id, name: newVendor.name },
                shop: { id: newShop._id, name: newShop.name, status: newShop.status }
            }
        });
        
    } catch (error) {
        console.error("Shop & Vendor Registration Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    registerShopAndVendor
};