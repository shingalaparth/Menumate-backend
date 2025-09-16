// models/foodCourt.js
const mongoose = require('mongoose');

const foodCourtSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Food court name is required"],
        trim: true,
        unique: true
    },
    address: {
        type: String,
        required: [true, "Address is required"],
        trim: true
    },
    city: {
        type: String,
        required: [true, "City is required"],
        trim: true
    },
    // This flag allows the Super Admin to enable or disable an entire food court
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('FoodCourt', foodCourtSchema);