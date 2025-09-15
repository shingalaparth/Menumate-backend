// routes/analyticsRoutes.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const { getShopAnalytics } = require('../controllers/analyticsController');

// The full path will be GET /api/shops/:shopId/analytics
router.route('/').get(getShopAnalytics);

module.exports = router;