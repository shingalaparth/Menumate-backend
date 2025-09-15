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

module.exports = mongoose.model('Shop', shopSchema);