// models/cart.js
const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: [1, 'Quantity cannot be less than 1.'], default: 1 },
        // The calculated price for a single unit of this item with its options
    price: { type: Number, required: true }, 
    
    // The specific variant chosen by the user (e.g., { name: 'Large', price: 500 })
    variant: {
        _id: mongoose.Schema.Types.ObjectId,
        name: String,
        price: Number
    },
    // An array of add-ons chosen by the user (e.g., [{ name: 'Extra Cheese', price: 50 }])
    addOns: [{
        _id: mongoose.Schema.Types.ObjectId,
        name: String,
        price: Number
    }],
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

// The subtotal will now be calculated based on the final price of each customized item
cartSchema.virtual('subtotal').get(function() {
    return this.items.reduce((total, item) => total + item.quantity * item.price, 0);
});


module.exports = mongoose.model('Cart', cartSchema);