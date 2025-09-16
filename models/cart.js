// models/cart.js
const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: [1, 'Quantity cannot be less than 1.'], default: 1 },
    price: { type: Number, required: true },
    // We need to know which shop this specific item belongs to for order splitting
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true }
}, { _id: false });

const cartSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    // A cart can belong to a standalone shop OR a food court
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: false, default: null },
    foodCourt: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodCourt', required: false, default: null },
    items: [cartItemSchema],
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

cartSchema.virtual('subtotal').get(function() {
    return this.items.reduce((total, item) => total + item.quantity * item.price, 0);
});

module.exports = mongoose.model('Cart', cartSchema);