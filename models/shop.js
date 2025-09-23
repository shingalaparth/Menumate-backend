// models/shop.js

const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Shop name is required"],
        trim: true,
    },
    address: {
        type: String,
        trim: true,
    },
    phone: {
        type: String,
        trim: true,
    },
    // This is the crucial link to the owner
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true
    },
    foodCourt: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FoodCourt',
        default: null // If null, it's a standalone shop.
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Approved' // Default is 'Approved' for standalone shops. We'll set it to 'Pending' in our logic for food court shops.
    },
    // openingTime: {
    //     type: String, // Format: "HH:MM" (e.g., "09:00")
    //     trim: true,
    //     default: "09:00",
    //     validate: {
    //         validator: function(v) { return /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/.test(v); },
    //         message: props => `${props.value} is not a valid 24-hour time format (HH:MM)!`
    //     }
    // },
    // closingTime: {
    //     type: String, // Format: "HH:MM" (e.g., "22:00")
    //     trim: true,
    //     default: "22:00",
    //     validate: {
    //         validator: function(v) { return /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/.test(v); },
    //         message: props => `${props.value} is not a valid 24-hour time format (HH:MM)!`
    //     }
    // },
    isActive: {
        type: Boolean,
        default: true // Allows admin to deactivate a shop
    },
    upiQrCodeUrl: {
        type: String, // This will store the Cloudinary URL of the QR image
        default: ''
    }
}, {
    timestamps: true
});

// Index for performance: quickly find all shops for an owner
shopSchema.index({ owner: 1 });
shopSchema.index({ foodCourt: 1 });

module.exports = mongoose.model('Shop', shopSchema);