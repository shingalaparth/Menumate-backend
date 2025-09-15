// controllers/cartController.js
const Cart = require('../models/cart');
const MenuItem = require('../models/menuItem');

// @desc    Get the current user's cart
// @route   GET /api/cart
// @access  Private (User only)
const getMyCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id }).populate({
            path: 'items.menuItem',
            select: 'name description image'
        });

        if (!cart) {
            return res.status(200).json({ success: true, data: { message: "Your cart is empty." } });
        }

        res.status(200).json({ success: true, data: cart });

    } catch (error) {
        console.error("Get Cart Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Add or update an item in the cart
// @route   POST /api/cart
// @access  Private (User only)
const addItemToCart = async (req, res) => {
    try {
        const { menuItemId, quantity } = req.body;
        const userId = req.user._id;

        // 1. Get the menu item to add
        const itemToAdd = await MenuItem.findById(menuItemId);
        if (!itemToAdd || !itemToAdd.isAvailable) {
            return res.status(404).json({ success: false, message: 'Menu item not found or is unavailable.' });
        }

        const shopId = itemToAdd.shop;

        // 2. Get the user's cart
        let cart = await Cart.findOne({ user: userId });

        // 3. Logic to handle the cart
        if (cart) {
            // If the new item is from a different shop, clear the cart
            if (cart.shop.toString() !== shopId.toString()) {
                cart.items = [];
                cart.shop = shopId;
            }

            // Check if the item already exists in the cart
            const itemIndex = cart.items.findIndex(item => item.menuItem.toString() === menuItemId);

            if (itemIndex > -1) {
                // Update quantity
                cart.items[itemIndex].quantity = quantity;
            } else {
                // Add new item
                 cart.items.push({ menuItem: menuItemId, name: itemToAdd.name, quantity, price: itemToAdd.price });
            }
        } else {
            // No cart exists, create a new one
           cart = await Cart.create({
                user: userId,
                shop: shopId,
                // --- AND MODIFIED THIS LINE ---
                items: [{ menuItem: menuItemId, name: itemToAdd.name, quantity, price: itemToAdd.price }]
            });
        }

        await cart.save();
        const populatedCart = await cart.populate('items.menuItem', 'name description image');

        res.status(200).json({ success: true, message: 'Cart updated successfully', data: populatedCart });

    } catch (error) {
        console.error("Add to Cart Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Remove an item from the cart
// @route   DELETE /api/cart/items/:menuItemId
// @access  Private (User only)
const removeItemFromCart = async (req, res) => {
    try {
        const { menuItemId } = req.params;
        const userId = req.user._id;

        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found.' });
        }
        
        // Find and remove the item
        cart.items = cart.items.filter(item => item.menuItem.toString() !== menuItemId);
        
        await cart.save();
        const populatedCart = await cart.populate('items.menuItem', 'name description image');

        res.status(200).json({ success: true, message: 'Item removed from cart', data: populatedCart });

    } catch (error) {
        console.error("Remove from Cart Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};


module.exports = {
    getMyCart,
    addItemToCart,
    removeItemFromCart
};