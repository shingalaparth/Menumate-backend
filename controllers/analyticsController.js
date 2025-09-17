// controllers/analyticsController.js
const mongoose = require('mongoose');
const Order = require('../models/order');
const Shop = require('../models/shop');

// @desc    Get key analytics for a specific shop
// @route   GET /api/shops/:shopId/analytics
// @access  Private (Vendor only)
const getShopAnalytics = async (req, res) => {
    try {
        const { shopId } = req.params;
        const vendorId = req.vendor._id;

        // 1. Security Check: Verify the vendor owns this shop
        const shop = await Shop.findById(shopId);
        if (!shop || shop.owner.toString() !== vendorId.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied.' }); 
        }

        // --- Date setup for "Today's" stats (using IST) ---
        const today = new Date();
        // IST is UTC+5:30. We adjust the date to the beginning of the day in IST.
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
        startOfToday.setHours(startOfToday.getHours() - 5, startOfToday.getMinutes() - 30);
        
        const endOfToday = new Date(startOfToday);
        endOfToday.setDate(endOfToday.getDate() + 1);

        // --- Run all analytic queries in parallel for performance ---
        const [
            totalStats,
            todayStats,
            topSellingItems
        ] = await Promise.all([
            // Query 1: Get total revenue and total orders (all time)
            Order.aggregate([
                { $match: { shop: new mongoose.Types.ObjectId(shopId), orderStatus: 'Completed' } },
                { $group: {
                    _id: null,
                    totalRevenue: { $sum: '$totalAmount' },
                    totalOrders: { $sum: 1 }
                }}
            ]),
            // Query 2: Get today's revenue and orders
            Order.aggregate([
                { $match: { 
                    shop: new mongoose.Types.ObjectId(shopId), 
                    orderStatus: 'Completed',
                    createdAt: { $gte: startOfToday, $lt: endOfToday }
                }},
                { $group: {
                    _id: null,
                    todaysRevenue: { $sum: '$totalAmount' },
                    todaysOrders: { $sum: 1 }
                }}
            ]),
            // Query 3: Get top 5 selling menu items
            Order.aggregate([
                { $match: { shop: new mongoose.Types.ObjectId(shopId), orderStatus: 'Completed' } },
                { $unwind: '$items' },
                { $group: {
                    _id: '$items.menuItem',
                    name: { $first: '$items.name' },
                    totalQuantitySold: { $sum: '$items.quantity' }
                }},
                { $sort: { totalQuantitySold: -1 } },
                { $limit: 5 }
            ])
        ]);

        // --- Format the response ---
        const analyticsData = {
            totalRevenue: totalStats[0]?.totalRevenue || 0,
            totalOrders: totalStats[0]?.totalOrders || 0,
            todaysRevenue: todayStats[0]?.todaysRevenue || 0,
            todaysOrders: todayStats[0]?.todaysOrders || 0,
            topSellingItems: topSellingItems
        };

        res.status(200).json({ success: true, data: analyticsData });

    } catch (error) {
        console.error("Analytics Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};


module.exports = {
    getShopAnalytics
};