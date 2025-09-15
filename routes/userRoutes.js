// routes/userRoutes.js

const express = require('express');
const router = express.Router();
const { registerOrLoginUser } = require('../controllers/userController');

// This single route now handles both registration and login
router.post('/login', registerOrLoginUser);

module.exports = router;
