// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');

const {createFoodCourt,getAllFoodCourts,assignShopToFoodCourt,appointFoodCourtManager,getPlatformAnalytics } = require('../controllers/adminController');

// All routes in this file are protected and admin-only
router.use(protect, authorize('admin'));

router.get('/analytics', getPlatformAnalytics);

// Routes for managing food courts
router.route('/foodcourts')
    .post(createFoodCourt)
    .get(getAllFoodCourts);

// Route for assigning a shop to a food court
router.patch('/shops/:shopId/assign-foodcourt', assignShopToFoodCourt);

// Route for appointing a food court manager
router.patch('/vendors/:vendorId/appoint-manager', appointFoodCourtManager);



module.exports = router;