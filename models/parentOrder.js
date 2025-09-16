// models/parentOrder.js
const mongoose = require('mongoose');

const parentOrderSchema = new mongoose.Schema({
    shortOrderId: { type: String, unique: true, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    foodCourt: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodCourt', required: true },
    table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['COD', 'Online'], required: true },
    paymentStatus: { type: String, enum: ['Pending', 'Completed', 'Failed'], default: 'Pending' },
    subOrders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }]
}, {
    timestamps: true
});

// REMOVED the pre-save hook. The controller will now handle ID generation.

module.exports = mongoose.model('ParentOrder', parentOrderSchema);