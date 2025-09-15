// controllers/reviewController.js

const mongoose = require('mongoose');
const Review = require('../models/review');
const Order = require('../models/order');
const Shop = require('../models/shop');

// @desc    Create a review for a completed order
// @route   POST /api/orders/:orderId/review
// @access  Private (User only)
const createReview = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { rating, comment } = req.body;
        const userId = req.user._id;

        // 1. Find the order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }

        // 2. Security & Validation Checks
        // - Check if the logged-in user is the one who placed the order
        if (order.user.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: 'You can only review your own orders.' });
        }
        // - Check if the order status is 'Completed'
        if (order.orderStatus !== 'Completed') {
            return res.status(400).json({ success: false, message: 'You can only review completed orders.' });
        }
        // - Check if a review already exists for this order
        const existingReview = await Review.findOne({ order: orderId });
        if (existingReview) {
            return res.status(400).json({ success: false, message: 'You have already submitted a review for this order.' });
        }

        // 3. Create and save the new review
        const review = await Review.create({
            rating,
            comment,
            user: userId,
            shop: order.shop,
            order: orderId
        });

        res.status(201).json({ success: true, message: 'Thank you for your review!', data: review });

    } catch (error) {
        console.error("Create Review Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get all reviews for a specific shop (for Vendors)
// @route   GET /api/shops/:shopId/reviews
// @access  Private (Vendor only)
const getReviewsForShop = async (req, res) => {
    try {
        const { shopId } = req.params;
        const vendorId = req.vendor._id;

        // 1. Security Check: Verify the vendor owns this shop
        const shop = await Shop.findById(shopId);
        if (!shop || shop.owner.toString() !== vendorId.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied. You do not own this shop.' });
        }

        // 2. Get all reviews for the shop, populating the user's name
        const reviews = await Review.find({ shop: shopId })
            .populate('user', 'name') // Only get the user's name
            .sort({ createdAt: -1 });

        // 3. Calculate the average rating (Bonus feature)
        const stats = await Review.aggregate([
            { $match: { shop: new mongoose.Types.ObjectId(shopId) } },
            {
                $group: {
                    _id: '$shop',
                    averageRating: { $avg: '$rating' },
                    reviewCount: { $sum: 1 }
                }
            }
        ]);
        
        const averageRating = stats.length > 0 ? stats[0].averageRating.toFixed(1) : 0;
        const reviewCount = stats.length > 0 ? stats[0].reviewCount : 0;

        res.status(200).json({
            success: true,
            count: reviews.length,
            averageRating: parseFloat(averageRating),
            data: reviews
        });

    } catch (error) {
        console.error("Get Reviews Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};


module.exports = {
    createReview,
    getReviewsForShop
};