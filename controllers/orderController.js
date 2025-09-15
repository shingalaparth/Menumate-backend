// controllers/orderController.js
const Order = require('../models/order');
const Cart = require('../models/cart');
const Shop = require('../models/shop');

// @desc    Place a new order from the user's cart
// @route   POST /api/orders
// @access  Private (User only)
const placeOrder = async (req, res) => {
    try {
        const userId = req.user._id;
        const { paymentMethod, tableId } = req.body;

        if (!paymentMethod || !tableId) {
            return res.status(400).json({ success: false, message: "Payment method and table information are required." });
        }

        // 1. Find the user's cart
        const cart = await Cart.findOne({ user: userId });
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: "Your cart is empty." });
        }

        // 2. Check if the shop is active
        const shop = await Shop.findById(cart.shop);
        if (!shop || !shop.isActive) {
            return res.status(400).json({ success: false, message: "This shop is currently not accepting orders." });
        }

        // 3. Create the order object
        const newOrder = await Order.create({
            user: userId,
            shop: cart.shop,
            table: tableId,
            items: cart.items, // These are copied directly
            subtotal: cart.subtotal,
            totalAmount: cart.subtotal, // For now, total is same as subtotal
            paymentMethod: paymentMethod,
            paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Pending', // Handle payment status
        });

        // 4. IMPORTANT: Clear the user's cart after placing the order
        await Cart.findByIdAndDelete(cart._id);
        
       // --- THIS IS THE NEW, REAL-TIME PART ---
        // Get the 'io' instance we attached in app.js
        const io = req.io;
        // Emit an event ONLY to the room matching the shop's ID
        // The frontend for that specific shop will be listening for this 'new_order' event
        io.to(cart.shop.toString()).emit('new_order', newOrder);
        console.log(`🔔 Emitted 'new_order' to room ${cart.shop.toString()}`);
        // ---------------------------------------


        res.status(201).json({
            success: true,
            message: "Order placed successfully!",
            data: newOrder
        });

    } catch (error) {
        console.error("Place Order Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get all orders for the logged-in user
// @route   GET /api/orders
// @access  Private (User only)
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .populate('shop', 'name address')
            .sort({ createdAt: -1 }); // Newest orders first

        res.status(200).json({ success: true, count: orders.length, data: orders });

    } catch (error) {
        console.error("Get My Orders Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get a single order by its ID
// @route   GET /api/orders/:id
// @access  Private (User only)
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('shop', 'name address')
            .populate('user', 'name phone');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }

        // Security check: Make sure the order belongs to the logged-in user
        if (order.user._id.toString() !== req.user._id.toString()) {
            return res.status(401).json({ success: false, message: 'Not authorized to view this order.' });
        }

        res.status(200).json({ success: true, data: order });

    } catch (error) {
        console.error("Get Order By ID Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
// @desc    Update an order's status (for Vendors)
// @route   PATCH /api/vendor/orders/:orderId/status
// @access  Private (Vendor only)
const updateOrderStatusByVendor = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        const vendorId = req.vendor._id;

        // 1. Validate the new status
        const validStatuses = ['Accepted', 'Preparing', 'Ready', 'Completed', 'Cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid order status.' });
        }

        // 2. Find the order and populate shop details to get the owner
        const order = await Order.findById(orderId).populate('shop');
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }

        // 3. CRITICAL SECURITY CHECK: Ensure the logged-in vendor owns the shop associated with the order
        if (order.shop.owner.toString() !== vendorId.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied. You do not have permission to update this order.' });
        }

        // 4. Update and save the order
        order.orderStatus = status;
        await order.save();

        // 5. REAL-TIME NOTIFICATION to the CUSTOMER
        // Send an event to the specific user's room
        const io = req.io;
        io.to(order.user.toString()).emit('order_status_update', order);
        console.log(`🔔 Emitted 'order_status_update' to room ${order.user.toString()}`);

        res.status(200).json({
            success: true,
            message: `Order status updated to ${status}`,
            data: order
        });

    } catch (error) {
        console.error("Update Order Status Error:", error);
        res.status(500).json({ success: false, message: error.message });

    }
};

// @desc    Get all orders for a specific shop (for Vendors)
// @route   GET /api/shops/:shopId/orders
// @access  Private (Vendor only)
const getOrdersForVendorShop = async (req, res) => {
    try {
        const { shopId } = req.params;
        const vendorId = req.vendor._id;

        // 1. Security Check: Verify the vendor owns this shop
        const shop = await Shop.findById(shopId);
        if (!shop || shop.owner.toString() !== vendorId.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied. You do not own this shop.' });
        }

        // 2. Build the query based on the shop ID
        const query = { shop: shopId };

        // 3. Add filtering based on query parameters (e.g., /orders?status=Pending)
        if (req.query.status) {
            query.orderStatus = req.query.status;
        }

        // 4. Execute the query, populating customer details and sorting by newest first
        const orders = await Order.find(query)
            .populate('user', 'name phone') // Get customer name and phone
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });

    } catch (error) {
        console.error("Get Orders for Vendor Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    placeOrder,
    getMyOrders,
    getOrderById,
    updateOrderStatusByVendor,
    getOrdersForVendorShop
};