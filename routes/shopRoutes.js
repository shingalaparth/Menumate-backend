// routes/shopRoutes.js

const express = require('express');
const router = express.Router();
const { createShop, getMyShops } = require('../controllers/shopController');
const { protect } = require('../middlewares/auth');

// Import routers for nested routes
const menuRouter = require('./menuRoutes');
const categoryRouter = require('./categoryRoutes');

// Apply the 'protect' middleware to all routes in this file
// Any route defined after this line will be protected
router.use(protect);

// Routes for /api/shops
router.route('/')
    .post(createShop)
    .get(getMyShops);

// --- THIS IS THE CRUCIAL ADDITION ---
// Re-route requests for specific shops to their respective routers
// e.g., a request to /api/shops/123/menu will be handled by menuRouter
router.use('/:shopId/menu', menuRouter);
router.use('/:shopId/categories', categoryRouter);
// ------------------------------------

module.exports = router;