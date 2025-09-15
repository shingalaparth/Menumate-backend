// models/cart.js
const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    menuItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem',
        required: true
    },
     name: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity cannot be less than 1.'],
        default: 1
    },
    price: { // Storing the price at the time of adding to cart
        type: Number,
        required: true
    }
}, {
    _id: false // Don't create a separate _id for each cart item
});

const cartSchema = new mongoose.Schema({
    // The link to the user who owns this cart
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // Each user can only have one cart
    },
    // The link to the shop the items are from
    shop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop',
        required: true
    },
    // The array of items in the cart
    items: [cartItemSchema],

    // We will use a virtual field to calculate the total on the fly
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual property to calculate the subtotal
cartSchema.virtual('subtotal').get(function() {
    return this.items.reduce((total, item) => {
        return total + item.quantity * item.price;
    }, 0);
});

module.exports = mongoose.model('Cart', cartSchema);