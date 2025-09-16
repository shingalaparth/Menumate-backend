// controllers/foodCourtAdminController.js
const Shop = require('../models/shop');

// @desc    Get all shops with 'Pending' status for the manager's food court
// @route   GET /api/manager/pending-shops
// @access  Private (Food Court Manager only)
const getPendingShops = async (req, res) => {
    try {
        // The req.foodCourtId is attached by our new 'authorizeManager' middleware
        const foodCourtId = req.foodCourtId;

        const pendingShops = await Shop.find({
            foodCourt: foodCourtId,
            status: 'Pending'
        }).populate('owner', 'name email number'); // Show owner details

        res.status(200).json({
            success: true,
            count: pendingShops.length,
            data: pendingShops
        });
    } catch (error) {
        console.error("Get Pending Shops Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Approve or Reject a pending shop application
// @route   PATCH /api/manager/shops/:shopId/status
// @access  Private (Food Court Manager only)
const updateShopStatus = async (req, res) => {
    try {
        const { shopId } = req.params;
        const { status } = req.body; // Expecting 'Approved' or 'Rejected'
        const foodCourtId = req.foodCourtId;

        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status provided.' });
        }

        const shop = await Shop.findById(shopId);
        if (!shop) {
            return res.status(404).json({ success: false, message: 'Shop not found.' });
        }

        // CRITICAL SECURITY CHECK: Ensure the shop belongs to the manager's food court
        if (shop.foodCourt.toString() !== foodCourtId.toString()) {
            return res.status(403).json({ success: false, message: "Access denied. This shop is not in your food court." });
        }

        shop.status = status;
        await shop.save();

        res.status(200).json({
            success: true,
            message: `Shop has been successfully ${status}.`,
            data: shop
        });

    } catch (error) {
        console.error("Update Shop Status Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    getPendingShops,
    updateShopStatus
};