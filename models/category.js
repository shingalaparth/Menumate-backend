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
    ref: 'Shop',
    required: [true, 'shop is required']
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
   isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: {
    type: Date // This will be set when the category is archived
  }
}, {
  timestamps: true
});
// This tells MongoDB to automatically delete documents 30 days after the 'archivedAt' date is set.
// 2592000 seconds = 30 days
categorySchema.index({ "archivedAt": 1 }, { expireAfterSeconds: 2592000 });

// Ensure unique category names per shop
categorySchema.index({ shop: 1, name: 1 }, { unique: true });
categorySchema.index({ shop : 1, isActive: 1,isArchived: 1 });

module.exports = mongoose.model('Category', categorySchema);
