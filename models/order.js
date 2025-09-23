// models/order.js
const mongoose = require('mongoose');

// --- Sub-schema for each ordered item ---
const orderedItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },

  // Selected variant (optional)
  variant: {
    name: String,
    price: Number
  },

  // Selected add-ons (optional)
  addOns: [{
    name: String,
    price: Number
  }],

  quantity: { type: Number, required: true }
}, { _id: false });

// --- Main order schema ---
const orderSchema = new mongoose.Schema({
  shortOrderId: { type: String, unique: true, required: true },

  // For food court: orders can belong to a parent order
  parentOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'ParentOrder', default: null },

  // Relations
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },

  // Ordered items
  items: [orderedItemSchema],

  // Pricing
  subtotal: { type: Number, required: true },
  totalAmount: { type: Number, required: true },

  // Status
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

  // Extra info
  notes: { type: String, trim: true },
  completedAt: { type: Date } // set when order is completed
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
