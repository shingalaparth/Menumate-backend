// models/table.js
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid'); // Import the UUID generator

const tableSchema = new mongoose.Schema({
    tableNumber: {
        type: String,
        required: true,
        trim: true,
        // A default value for general QR codes like at a takeaway counter
        default: 'General QR' 
    },
    // The link to the shop this table/QR code belongs to
    shop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop',
        required: true
    },
    // The unique ID that will be embedded in the QR code URL.
    // It's automatically generated when a new table is created.
    qrIdentifier: {
        type: String,
        default: uuidv4,
        unique: true,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for quickly finding all tables for a given shop
tableSchema.index({ shop: 1 });

module.exports = mongoose.model('Table', tableSchema);