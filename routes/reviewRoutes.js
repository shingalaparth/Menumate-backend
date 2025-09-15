// routes/reviewRoutes.js
const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams is crucial for nested routes
const { createReview } = require('../controllers/reviewController');
const { protectUser } = require('../middlewares/auth_user'); 

router.use(protectUser);

// The route will be POST /, but the full path will be /api/orders/:orderId/review
router.route('/').post(createReview);

module.exports = router;