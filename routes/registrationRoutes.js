// routes/registrationRoutes.js
const express = require('express');
const router = express.Router();
const { registerShopAndVendor } = require('../controllers/registrationController');

// A single endpoint to handle the combined registration
router.post('/shop-vendor', registerShopAndVendor);

module.exports = router;