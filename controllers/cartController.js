// controllers/cartController.js
const Cart = require('../models/cart');
const MenuItem = require('../models/menuItem');
const Shop = require('../models/shop');

const addItemToCart = async (req, res) => {
    try {
        const { menuItemId, quantity } = req.body;
        const userId = req.user._id;

        const itemToAdd = await MenuItem.findById(menuItemId).populate('shop');
        if (!itemToAdd || !itemToAdd.isAvailable) {
            return res.status(404).json({ success: false, message: 'Menu item not found or unavailable.' });
        }

        const shopId = itemToAdd.shop._id;
        const foodCourtId = itemToAdd.shop.foodCourt;
        let cart = await Cart.findOne({ user: userId });

        if (cart) {
            // Logic to clear cart if context changes (e.g., from food court to standalone shop)
            const isNewItemInFoodCourt = !!foodCourtId;
            const isCartForFoodCourt = !!cart.foodCourt;

            if (isNewItemInFoodCourt && isCartForFoodCourt && cart.foodCourt.toString() === foodCourtId.toString()) {
                // Same food court, do nothing
            } else if (!isNewItemInFoodCourt && !isCartForFoodCourt && cart.shop.toString() === shopId.toString()) {
                // Same standalone shop, do nothing
            } else {
                // Context has changed, clear the cart
                cart.items = [];
            }
            
            cart.shop = isNewItemInFoodCourt ? null : shopId;
            cart.foodCourt = isNewItemInFoodCourt ? foodCourtId : null;
            
            // Add or update item logic
            const itemIndex = cart.items.findIndex(item => item.menuItem.toString() === menuItemId);
            if (itemIndex > -1) {
                cart.items[itemIndex].quantity = quantity;
            } else {
                cart.items.push({ menuItem: menuItemId, name: itemToAdd.name, quantity, price: itemToAdd.price, shop: shopId });
            }
        } else {
            // Create new cart
            const newCartData = {
                user: userId,
                items: [{ menuItem: menuItemId, name: itemToAdd.name, quantity, price: itemToAdd.price, shop: shopId }]
            };
            if (foodCourtId) {
                newCartData.foodCourt = foodCourtId;
            } else {
                newCartData.shop = shopId;
            }
            cart = await Cart.create(newCartData);
        }

        await cart.save();
        // ... populate and respond
        res.status(200).json({ success: true, message: 'Cart updated', data: cart });

    } catch (error) {
        console.error("Add to Cart Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const getMyCart = async (req, res) => { /* ... existing code ... */ };
const removeItemFromCart = async (req, res) => { /* ... existing code ... */ };

module.exports = { getMyCart, addItemToCart, removeItemFromCart };