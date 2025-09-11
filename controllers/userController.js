// controllers/userController.js

const User = require('../models/user');
const { createJWT } = require('../utils/jwt');

// A simple function to generate a 4-digit OTP
const generateOTP = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};

// @desc    Register or Login a user by sending an OTP
// @route   POST /api/users/login
// @access  Public
const registerOrLoginUser = async (req, res) => {
    try {
        const { name, phone } = req.body;
        if (!phone) {
            return res.status(400).json({ success: false, message: 'Phone number is required.' });
        }

        // Find user by phone number
        let user = await User.findOne({ phone });

        // If user doesn't exist, create a new one
        if (!user) {
            if (!name) {
                return res.status(400).json({ success: false, message: 'Name is required for new registration.' });
            }
            user = await User.create({ name, phone });
        }

        // Generate OTP
        const otp = generateOTP();
        user.otp = otp;
        // Set OTP to expire in 10 minutes
        user.otpExpires = Date.now() + 10 * 60 * 1000;
        await user.save();

        // In a real production app, you would send this OTP via an SMS gateway (e.g., Twilio, MSG91)
        // For now, we will send it in the response for easy testing.
        res.status(200).json({
            success: true,
            message: `OTP sent to ${phone}. It is valid for 10 minutes.`,
            otp: otp // <-- For testing purposes ONLY. Remove in production.
        });

    } catch (error) {
        console.error("User login error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Verify OTP and log in the user
// @route   POST /api/users/verify
// @access  Public
const verifyOtpAndLogin = async (req, res) => {
    try {
        const { phone, otp } = req.body;
        if (!phone || !otp) {
            return res.status(400).json({ success: false, message: 'Phone and OTP are required.' });
        }

        // Find the user and check if OTP is valid and not expired
        const user = await User.findOne({
            phone,
            otp,
            otpExpires: { $gt: Date.now() } // Check if the expiration time is greater than now
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid OTP or OTP has expired.' });
        }

        // Clear OTP fields after successful verification for security
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        // Create a JWT token for the user session
        const token = createJWT({ id: user._id, phone: user.phone });

        res.status(200).json({
            success: true,
            message: 'Login successful!',
            token,
            user: {
                id: user._id,
                name: user.name,
                phone: user.phone
            }
        });

    } catch (error) {
        console.error("OTP verification error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    registerOrLoginUser,
    verifyOtpAndLogin
};