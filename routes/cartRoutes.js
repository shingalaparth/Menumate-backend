// routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const { getMyCart, addItemToCart, removeItemFromCart } = require('../controllers/cartController');
const { protectUser } = require('../middlewares/auth_user');

// Apply the user protection middleware to all cart routes
router.use(protectUser);

router.route('/')
    .get(getMyCart)
    .post(addItemToCart);

router.delete('/items/:menuItemId', removeItemFromCart);

module.exports = router;