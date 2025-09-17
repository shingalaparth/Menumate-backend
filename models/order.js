// models/order.js
const mongoose = require('mongoose');

const orderedItemSchema = new mongoose.Schema({
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    shortOrderId: { type: String, unique: true, required: true },
    parentOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'ParentOrder', default: null },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
    items: [orderedItemSchema],
    subtotal: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    orderStatus: { type: String, enum: ['Pending', 'Accepted', 'Preparing', 'Ready', 'Completed', 'Cancelled'], default: 'Pending' },
    paymentMethod: { type: String, enum: ['COD', 'Online'], required: true },
    paymentStatus: { type: String, enum: ['Pending', 'Completed', 'Failed'], default: 'Pending' },
    notes: { type: String, trim: true },
    completedAt: {
        type: Date // This will be set when the order status becomes 'Completed'
    }
}, {
    timestamps: true
});

// REMOVED the pre-save hook. The controller will now handle ID generation.

module.exports = mongoose.model('Order', orderSchema);