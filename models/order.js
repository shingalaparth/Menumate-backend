// models/order.js
const mongoose = require('mongoose');

// We store a copy of the item details at the time of order
const orderedItemSchema = new mongoose.Schema({
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    shortOrderId: {
        type: String,
        unique: true
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
    items: [orderedItemSchema],
    subtotal: { type: Number, required: true },
    taxes: { type: Number, default: 0 }, // Placeholder for taxes
    totalAmount: { type: Number, required: true },
    orderStatus: {
        type: String,
        enum: ['Pending', 'Accepted', 'Preparing', 'Ready', 'Completed', 'Cancelled'],
        default: 'Pending'
    },
    paymentMethod: {
        type: String,
        enum: ['COD', 'Online'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed'],
        default: 'Pending'
    },
    // You can add notes for the kitchen, etc. here later
    notes: { type: String, trim: true }
}, {
    timestamps: true
});

// Helper function to generate a short, random ID
async function generateShortOrderId() {
    const count = await mongoose.model('Order').countDocuments();
    const timestamp = Date.now().toString().slice(-4); // Last 4 digits of timestamp
    return `MM-${count + 1}-${timestamp}`; // e.g., MM-101-5829
}

// Before saving a new order, generate its short ID
orderSchema.pre('save', async function (next) {
    if (this.isNew) {
        this.shortOrderId = await generateShortOrderId();
    }
    next();
});

// Index for faster lookups
orderSchema.index({ user: 1 });
orderSchema.index({ shop: 1 });


module.exports = mongoose.model('Order', orderSchema);