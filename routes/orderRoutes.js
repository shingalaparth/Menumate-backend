// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const { placeOrder, getMyOrders, getOrderById } = require('../controllers/orderController');
const { protectUser } = require('../middlewares/auth_user');
const reviewRouter = require('./reviewRoutes'); 

// Forward any requests like /:id/review to the reviewRouter
router.use('/:orderId/review', reviewRouter);

// Apply the user protection middleware to all order routes
router.use(protectUser);

router.use('/:id/review', reviewRouter);

router.route('/')
    .post(placeOrder)
    .get(getMyOrders);

router.route('/:id')
    .get(getOrderById);

module.exports = router;