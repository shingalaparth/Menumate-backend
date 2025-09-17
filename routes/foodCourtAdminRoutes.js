// routes/foodCourtAdminRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { authorizeManager } = require('../middlewares/authorize'); // Import the new middleware

const {
    getPendingShops,
    updateShopStatus,
    getFoodCourtAnalytics
} = require('../controllers/foodCourtAdminController');

// All routes in this file require the user to be a logged-in Food Court Manager
router.use(protect, authorizeManager);

router.get('/analytics', getFoodCourtAnalytics);

// Route to get the list of pending applications
router.get('/pending-shops', getPendingShops);

// Route to approve or reject a specific shop
router.patch('/shops/:shopId/status', updateShopStatus);

module.exports = router;