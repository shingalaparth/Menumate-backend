// models/review.js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: [true, 'Please provide a rating between 1 and 5.'],
    },
    comment: {
        type: String,
        trim: true,
        maxlength: [500, 'Comment cannot be more than 500 characters.'],
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    shop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop',
        required: true,
    },
    // We link the review to a specific order to ensure only legitimate customers can review
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        unique: true, // A user can only leave one review per order
    }
}, {
    timestamps: true
});

reviewSchema.index({ shop: 1 });
reviewSchema.index({ user: 1 });

module.exports = mongoose.model('Review', reviewSchema);