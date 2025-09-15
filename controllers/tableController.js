// controllers/tableController.js
const Table = require('../models/table');
const Shop = require('../models/shop');

// @desc    Create a new table/QR for a specific shop
// @route   POST /api/shops/:shopId/tables
// @access  Private (Admin only)
const createTableForShop = async (req, res) => {
    try {
        const { shopId } = req.params;
        const { tableNumber } = req.body;

        // Check if the shop exists
        const shop = await Shop.findById(shopId);
        if (!shop) {
            return res.status(404).json({ success: false, message: 'Shop not found' });
        }

        const newTable = await Table.create({
            shop: shopId,
            tableNumber: tableNumber || 'General QR' // Use provided number or default
        });

        res.status(201).json({
            success: true,
            message: `Table/QR created successfully for ${shop.name}`,
            data: newTable
        });

    } catch (error) {
        console.error("Create Table error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// @desc    Get all tables/QRs for a specific shop
// @route   GET /api/shops/:shopId/tables
// @access  Private (Admin only)
const getTablesForShop = async (req, res) => {
    try {
        const { shopId } = req.params;

        const tables = await Table.find({ shop: shopId });

        res.status(200).json({
            success: true,
            count: tables.length,
            data: tables
        });

    } catch (error) {
        console.error("Get Tables error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

module.exports = {
    createTableForShop,
    getTablesForShop
};