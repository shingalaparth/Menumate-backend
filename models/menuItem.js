// models/menuItem.js
const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Menu item name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },

  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },

  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
    validate: {
      validator: function (v) {
        return v > 0;
      },
      message: 'Price must be greater than 0'
    }
  },

  // Reference to Category instead of enum
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },

  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
   // ADD IMAGE FIELDS HERE
  image: {
      url: {
        type: String,
        required: [true, 'Image URL is required']
      },
      publicId: {
        type: String,
        required: [true, 'Image public ID is required']
      }
    },

    isAvailable: {
      type: Boolean,
      default: true
    },

    preparationTime: {
      type: Number,
      default: 15,
      min: [1, 'Preparation time must be at least 1 minute']
    },

    // Food preferences
    isVegetarian: {
      type: Boolean,
      default: false
    },

    isVegan: {
      type: Boolean,
      default: false
    },

    spiceLevel: {
      type: String,
      enum: ['none', 'mild', 'medium', 'hot', 'extra-hot'],
      default: 'none'
    },

    tags: [{
      type: String,
      lowercase: true,
      trim: true
    }],

    sortOrder: {
      type: Number,
      default: 0
    }
  }, {
  timestamps: true
});

// Indexes for performance
menuItemSchema.index({ shop: 1, category: 1 });
menuItemSchema.index({ shop: 1, isAvailable: 1 });
menuItemSchema.index({ name: 'text', description: 'text' });


// Middleware to delete image from Cloudinary when item is deleted
menuItemSchema.pre('findOneAndDelete', async function () {
  const { cloudinary } = require('../config/cloudinary');
  const item = await this.model.findOne(this.getQuery());

  if (item && item.image.publicId) {
    try {
      await cloudinary.uploader.destroy(item.image.publicId);
      console.log(`Image deleted from Cloudinary: ${item.image.publicId}`);
    } catch (error) {
      console.error('Error deleting image from Cloudinary:', error);
    }
  }
});


module.exports = mongoose.model('MenuItem', menuItemSchema);