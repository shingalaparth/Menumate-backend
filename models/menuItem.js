// models/menuItem.js
const mongoose = require('mongoose');

// Schema for a single, optional add-on (e.g., "Extra Cheese")
const addOnSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 } // The additional cost for this add-on
}, { _id: true }); // Use default _id for selecting in cart

// Schema for a group of add-ons (e.g., "Toppings")
const addOnGroupSchema = new mongoose.Schema({
    groupName: { type: String, required: true, trim: true }, // e.g., "Toppings", "Crust Type"
    // 'single' means customer can only pick one (like crust type)
    // 'multiple' means customer can pick many (like toppings)
    selectionType: { type: String, enum: ['single', 'multiple'], required: true, default: 'multiple' },
    addOns: [addOnSchema]
});

// Schema for a mandatory choice/variant (e.g., "Medium Pizza")
const variantSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true }, // e.g., "Small", "Medium", "Large"
    price: { type: Number, required: true, min: 0 },   // The price for THIS specific variant
    isAvailable: { type: Boolean, default: true }
}, { _id: true }); // Use default _id for selecting in cart

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
   // Variants are for mandatory choices like Size (Small, Medium, Large).
    // If a menu item has variants, the customer MUST choose one.
    variants: [variantSchema],
    // Add-on groups are for optional extras like toppings.
    addOnGroups: [addOnGroupSchema],
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
    },
    isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: {
    type: Date // This will be set when the category is archived
  }
  },
  {
  timestamps: true
});

// A menu item MUST have either a base price OR at least one variant with a price.
menuItemSchema.pre('validate', function(next) {
    if ((this.price === null || this.price === undefined) && (!this.variants || this.variants.length === 0)) {
        next(new Error('A menu item must have either a base price or at least one variant.'));
    } else {
        next();
    }
});

// --- NEW TTL INDEX ADDED HERE ---
menuItemSchema.index({ "archivedAt": 1 }, { expireAfterSeconds: 2592000 });
// Indexes for performance
menuItemSchema.index({ shop: 1, category: 1,isArchived: 1 });
menuItemSchema.index({ shop: 1, isAvailable: 1,isArchived: 1 });
menuItemSchema.index({ name: 'text', description: 'text' });



const { cloudinary } = require('../config/cloudinary');

// Middleware: delete Cloudinary image when item is permanently deleted
menuItemSchema.pre('findOneAndDelete', async function () {
  try {
    const item = await this.model.findOne(this.getQuery());
    if (item?.image?.publicId) {
      await cloudinary.uploader.destroy(item.image.publicId);
      console.log(`🗑️ Image deleted from Cloudinary: ${item.image.publicId}`);
    }
  } catch (error) {
    console.error('❌ Error deleting image from Cloudinary:', error);
  }
});

module.exports = mongoose.model('MenuItem', menuItemSchema);