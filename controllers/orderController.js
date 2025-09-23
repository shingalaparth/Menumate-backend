// controllers/orderController.js
const mongoose = require('mongoose');
const Order = require('../models/order');
const ParentOrder = require('../models/parentOrder');
const Cart = require('../models/cart');
const Shop = require('../models/shop');
const User = require('../models/user');
const MenuItem = require('../models/menuItem');

// Helper function to generate IDs
async function generateShortOrderId(modelName, prefix) {
    const Model = mongoose.model(modelName);
    const count = await Model.countDocuments();
    const timestamp = Date.now().toString().slice(-4);
    return `${prefix}-${count + 1}-${timestamp}`;
}

const placeOrder = async (req, res, next) => {
    // NOTE: consider wrapping the whole handler in a mongoose transaction for atomicity
    try {
        const userId = req.user._id;
        const { paymentMethod, tableId } = req.body;
        const cart = await Cart.findOne({ user: userId }).lean(); // lean -> plain JS object for safe reads

        if (!cart || !cart.items || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: "Your cart is empty." });
        }

        // Collect all unique MenuItem IDs referenced in the cart
        const menuItemIds = [...new Set(cart.items.map(item => item.menuItem.toString()))];

        // Fetch master MenuItem documents once (includes variants and addOnGroups)
        const masterItems = await MenuItem.find({ _id: { $in: menuItemIds } }).lean();
        const masterMap = masterItems.reduce((m, it) => { m[it._id.toString()] = it; return m; }, {});

        // NEW SECURE RECALCULATION (variant + add-ons verification)
        let trueGrandTotal = 0;

        // We'll construct ordered items from cart items after verifying each
        const verifiedOrderedItems = []; // full list for single-shop orders
        const itemsByShop = {}; // shopId => [orderedItem]
        const shopTotals = {}; // shopId => subtotal

        for (const cartItem of cart.items) {
            const menuItemIdStr = cartItem.menuItem.toString();
            const masterItem = masterMap[menuItemIdStr];
            if (!masterItem) {
                // Missing master item (deleted?), fail fast
                return res.status(400).json({ success: false, message: `Menu item ${cartItem.name || cartItem.menuItem} not found.` });
            }

            // Determine base price: variant or base price
            let itemUnitPrice = 0;
            let orderedVariant = null;

            if (masterItem.variants && masterItem.variants.length > 0) {
                // Variant MUST be present in the cart item
                if (!cartItem.variant || !cartItem.variant._id) {
                    return res.status(400).json({ success: false, message: `Variant required for item ${masterItem.name}.` });
                }
                // Locate the variant in the master item
                const cartVariantId = cartItem.variant._id.toString();
                const masterVariant = masterItem.variants.find(v => v._id.toString() === cartVariantId);
                if (!masterVariant) {
                    return res.status(400).json({ success: false, message: `Invalid variant selected for ${masterItem.name}.` });
                }
                itemUnitPrice = Number(masterVariant.price);
                orderedVariant = { name: masterVariant.name, price: masterVariant.price };
            } else {
                // No variants exist on master item — use base price
                if (masterItem.price === undefined || masterItem.price === null) {
                    return res.status(400).json({ success: false, message: `Price missing for item ${masterItem.name}.` });
                }
                itemUnitPrice = Number(masterItem.price);
            }

            // Verify add-ons (if any) and sum their prices
            const verifiedAddOns = [];
            if (cartItem.addOns && cartItem.addOns.length > 0) {
                for (const cartAddOn of cartItem.addOns) {
                    const addOnIdStr = cartAddOn._id?.toString?.() || cartAddOn._id;
                    let foundAddOn = null;
                    if (masterItem.addOnGroups && masterItem.addOnGroups.length) {
                        for (const group of masterItem.addOnGroups) {
                            const found = (group.addOns || []).find(a => a._id.toString() === addOnIdStr);
                            if (found) { foundAddOn = found; break; }
                        }
                    }
                    if (!foundAddOn) {
                        return res.status(400).json({ success: false, message: `Invalid add-on selected for ${masterItem.name}.` });
                    }
                    verifiedAddOns.push({ name: foundAddOn.name, price: Number(foundAddOn.price), _id: foundAddOn._id });
                    itemUnitPrice += Number(foundAddOn.price);
                }
            }

            // Compute line total and accumulate grand total
            const quantity = Number(cartItem.quantity || 1);
            const lineTotal = itemUnitPrice * quantity;
            trueGrandTotal += lineTotal;

            // Build the ordered item payload (what will go into Order.items)
            const orderedItem = {
                menuItem: masterItem._id,
                name: masterItem.name,
                price: itemUnitPrice, // final per-unit price (verified)
                variant: orderedVariant || undefined,
                addOns: verifiedAddOns,
                quantity
            };

            // Keep for full order (single-shop)
            verifiedOrderedItems.push(orderedItem);

            // Group for sub-orders by shop
            const shopId = (cartItem.shop || masterItem.shop).toString();
            if (!itemsByShop[shopId]) { itemsByShop[shopId] = []; shopTotals[shopId] = 0; }
            itemsByShop[shopId].push(orderedItem);
            shopTotals[shopId] += lineTotal;
        }

        // Verified totals ready. Use these for order creation.
        const io = req.io;

        if (cart.foodCourt) {
            // Food Court: create ParentOrder and suborders per shop
            const parentOrderId = await generateShortOrderId('ParentOrder', 'FC');
            const newParentOrder = new ParentOrder({
                shortOrderId: parentOrderId,
                user: userId,
                foodCourt: cart.foodCourt,
                table: tableId,
                totalAmount: trueGrandTotal,
                paymentMethod,
                paymentStatus: 'Pending'
            });
            const parentOrder = await newParentOrder.save();

            // Create suborders (parallel)
            const subOrderPromises = Object.keys(itemsByShop).map(async (shopId) => {
                const orderedItemsForShop = itemsByShop[shopId];
                const shopSubtotal = shopTotals[shopId] || 0;

                const subOrderId = await generateShortOrderId('Order', 'MM');
                const newSubOrder = new Order({
                    shortOrderId: subOrderId,
                    parentOrder: parentOrder._id,
                    user: userId,
                    shop: shopId,
                    table: tableId,
                    items: orderedItemsForShop,
                    subtotal: shopSubtotal,
                    totalAmount: shopSubtotal,
                    paymentMethod,
                    paymentStatus: 'Pending'
                });

                const subOrder = await newSubOrder.save();
                parentOrder.subOrders.push(subOrder._id);

                // Notify vendor/shop in realtime
                io.to(shopId).emit('new_order', subOrder);
            });

            await Promise.all(subOrderPromises);
            await parentOrder.save();

            // delete the cart once everything is written
            await Cart.findByIdAndDelete(cart._id);

            // Populate & notify user
            const finalParentOrder = await ParentOrder.findById(parentOrder._id).populate({
                path: 'subOrders',
                populate: { path: 'shop', select: 'name' }
            });
            io.to(userId.toString()).emit('order_confirmed', { success: true, order: finalParentOrder });
            return res.status(201).json({ success: true, message: "Order placed successfully!", data: finalParentOrder });

        } else {
            // Single shop: ensure that the shop is active
            const shop = await Shop.findById(cart.shop);
            if (!shop || !shop.isActive) {
                return res.status(400).json({ success: false, message: "This shop is not accepting orders." });
            }

            const singleOrderId = await generateShortOrderId('Order', 'MM');
            const newSingleOrder = new Order({
                shortOrderId: singleOrderId,
                user: userId,
                shop: cart.shop,
                table: tableId,
                items: verifiedOrderedItems,
                subtotal: trueGrandTotal,
                totalAmount: trueGrandTotal,
                paymentMethod,
                paymentStatus: 'Pending'
            });

            const savedOrder = await newSingleOrder.save();

            await Cart.findByIdAndDelete(cart._id);
            io.to(cart.shop.toString()).emit('new_order', savedOrder);
            io.to(userId.toString()).emit('order_confirmed', { success: true, order: savedOrder });
            return res.status(201).json({ success: true, message: "Order placed successfully!", data: savedOrder });
        }

    } catch (error) {
        next(error);
    }
};

const getOrdersForVendorShop = async (req, res, next) => {
    try {
        const { shopId } = req.params;
        const vendorId = req.vendor._id;
        const shop = await Shop.findById(shopId);
        if (!shop || shop.owner.toString() !== vendorId.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied. You do not own this shop.' });
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const query = { shop: shopId };
        if (req.query.status) { query.orderStatus = req.query.status; }

        const totalOrders = await Order.countDocuments(query);
        const orders = await Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();

        const userIds = [...new Set(orders.map(order => order.user))];
        const users = await User.find({ '_id': { $in: userIds } }).select('name phone').lean();
        const userMap = users.reduce((acc, user) => { acc[user._id.toString()] = user; return acc; }, {});
        const populatedOrders = orders.map(order => ({ ...order, user: userMap[order.user.toString()] || null }));

        res.status(200).json({
            success: true, count: populatedOrders.length,
            pagination: { currentPage: page, totalPages: Math.ceil(totalOrders / limit), totalOrders },
            data: populatedOrders
        });
    } catch (error) { next(error); }
};

const updateOrderStatusByVendor = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        const vendorId = req.vendor._id;
        const validStatuses = ['Accepted', 'Preparing', 'Ready', 'Completed', 'Cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid order status.' });
        }
        const order = await Order.findById(orderId).populate('shop');
        if (!order) { return res.status(404).json({ success: false, message: 'Order not found.' }); }
        if (order.shop.owner.toString() !== vendorId.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }
        order.orderStatus = status;
        if (status === 'Completed') { order.completedAt = new Date(); }
        await order.save();
        req.io.to(order.user.toString()).emit('order_status_update', order);
        res.status(200).json({ success: true, message: `Order status updated to ${status}`, data: order });
    } catch (error) { next(error); }
};

// @desc    Get all orders for the logged-in user
// @route   GET /api/orders
// @access  Private (User only)
const getMyOrders = async (req, res, next) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .populate('shop', 'name address')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: orders.length, data: orders });
    } catch (error) { next(error); }
};

// @desc    Get a single order by its ID
// @route   GET /api/orders/:id
// @access  Private (User only)
const getOrderById = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id).populate('shop', 'name address');
        if (!order) { return res.status(404).json({ success: false, message: 'Order not found.' }); }
        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ success: false, message: 'Not authorized to view this order.' });
        }
        res.status(200).json({ success: true, data: order });
    } catch (error) { next(error); }
};

module.exports = { placeOrder, getMyOrders, getOrderById, updateOrderStatusByVendor, getOrdersForVendorShop };