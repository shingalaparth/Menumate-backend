// routes/userRoutes.js

const express = require('express');
const router = express.Router();
const { registerOrLoginUser, verifyOtpAndLogin } = require('../controllers/userController');

// Route to handle user registration or login request (sends OTP)
router.post('/login', registerOrLoginUser);

// Route to verify the OTP and complete the login
router.post('/verify', verifyOtpAndLogin);

module.exports = router;