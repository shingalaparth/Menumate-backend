// models/category.js
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    minlength: [2, 'Category name must be at least 2 characters'],
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'shop',
    required: [true, 'shop is required']
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Ensure unique category names per shop
categorySchema.index({ shop: 1, name: 1 }, { unique: true });
categorySchema.index({ shop : 1, isActive: 1 });

module.exports = mongoose.model('Category', categorySchema);
