    // routes/vendorOrderRoutes.js
const express = require('express');
const router = express.Router();
const { updateOrderStatusByVendor } = require('../controllers/orderController');
const { protect } = require('../middlewares/auth'); // <-- Use the VENDOR's protect middleware

// Apply the vendor protection middleware to all routes in this file
router.use(protect);

// Define the route for updating status
router.patch('/:orderId/status', updateOrderStatusByVendor);

module.exports = router;