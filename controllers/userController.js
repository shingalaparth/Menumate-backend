// controllers/userController.js

const User = require('../models/user');
const { createJWT } = require('../utils/jwt');

// @desc    Register or Login a user 
// @route   POST /api/users/login
// @access  Public
const registerOrLoginUser = async (req, res) => {
    try {
        const { name, phone } = req.body;

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required.'
            });
        }

        // Check if user exists
        let user = await User.findOne({ phone });
        let isNew = false;

        // If new user → require name
        if (!user) {
            if (!name) {
                return res.status(400).json({
                    success: false,
                    message: 'Name is required for new registration.'
                });
            }
            user = await User.create({ name, phone });
            isNew = true;
        }

        // Generate JWT token
        const token = createJWT({ id: user._id, phone: user.phone },'3h');

        // Send response
        res.status(200).json({
            success: true,
            message: isNew ? 'Registration successful!' : 'Login successful!',
            token,
            user: {
                id: user._id,
                name: user.name,
                phone: user.phone
            }
        });

    } catch (error) {
        console.error("User login error:", error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

module.exports = {
    registerOrLoginUser
};
