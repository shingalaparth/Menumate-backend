// controllers/cartController.js
const Cart = require('../models/cart');
const MenuItem = require('../models/menuItem');

const addItemToCart = async (req, res, next) => {
    try {
        // The frontend now sends the chosen options' IDs
        const { menuItemId, quantity, variantId, addOnIds } = req.body;
        const userId = req.user._id;

        const itemToAdd = await MenuItem.findById(menuItemId).populate('shop');
        if (!itemToAdd || !itemToAdd.isAvailable || itemToAdd.isArchived) {
            return res.status(404).json({ success: false, message: 'Menu item not found or is unavailable.' });
        }

        // --- 1. VALIDATE & CALCULATE PRICE ---
        let calculatedPrice = 0;
        let selectedVariant = null;

        // A. Handle Variants (required choice if exists)
        if (itemToAdd.variants && itemToAdd.variants.length > 0) {
            selectedVariant = itemToAdd.variants.find(v => v._id.toString() === variantId);
            if (!selectedVariant) {
                return res.status(400).json({ success: false, message: 'Invalid variant selected.' });
            }
            calculatedPrice = selectedVariant.price;
        } else {
            calculatedPrice = itemToAdd.price; // Use base price if no variants
        }

        // B. Handle Add-ons (optional extras)
        let selectedAddOns = [];
        if (addOnIds && addOnIds.length > 0) {
            itemToAdd.addOnGroups.forEach(group => {
                group.addOns.forEach(addOn => {
                    if (addOnIds.includes(addOn._id.toString())) {
                        selectedAddOns.push({ _id: addOn._id, name: addOn.name, price: addOn.price });
                        calculatedPrice += addOn.price;
                    }
                });
            });
        }
        // -------------------------------------

        // C. Prepare the new cart item with all details
        const newCartItem = {
            menuItem: menuItemId,
            name: itemToAdd.name,
            quantity,
            price: calculatedPrice, // Final price per unit
            variant: selectedVariant
                ? { _id: selectedVariant._id, name: selectedVariant.name, price: selectedVariant.price }
                : undefined,
            addOns: selectedAddOns,
            shop: itemToAdd.shop._id
        };

        // --- 2. FIND OR CREATE CART ---
        let cart = await Cart.findOne({ user: userId });

        if (!cart) {
            // Create new cart if none exists
            cart = await Cart.create({
                user: userId,
                shop: itemToAdd.shop.foodCourt ? null : itemToAdd.shop._id,
                foodCourt: itemToAdd.shop.foodCourt || null,
                items: [newCartItem]
            });
        } else {
            // Simplified logic for now: just push new item
            // (Full implementation would check context change, merge duplicates, etc.)
            cart.items.push(newCartItem);
        }

        await cart.save();
        res.status(200).json({ success: true, message: 'Cart updated successfully', data: cart });

    } catch (error) {
        next(error);
    }
};


const getMyCart = async (req, res, next) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id }).populate({
            path: 'items.menuItem',
            select: 'name description image'
        });

        if (!cart) {
            return res.status(200).json({ success: true, data: { message: 'Your cart is empty.' } });
        }

        res.status(200).json({ success: true, data: cart });

    } catch (error) {
        next(error);
    }
};



const removeItemFromCart = async (req, res, next) => {
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
        next(error);
    }
};

module.exports = { getMyCart, addItemToCart, removeItemFromCart };
