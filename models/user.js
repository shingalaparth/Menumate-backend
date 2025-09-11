// models/user.js

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please provide your name"],
        trim: true,
    },
    phone: {
        type: String,
        required: [true, "Phone number is required"],
        unique: true,
        trim: true,
        // Basic validation for a 10-digit Indian phone number
        match: [/^[6-9]\d{9}$/, "Please enter a valid 10-digit phone number"]
    },
    // For OTP-based authentication
    otp: {
        type: String,
    },
    otpExpires: {
        type: Date,
    },
    // You can add more fields here later, like saved addresses, etc.

}, {
    timestamps: true // Adds createdAt and updatedAt timestamps
});

module.exports = mongoose.model('User', userSchema);