// controllers/menuController.js - Optimized with image handling

const MenuItem = require('../models/MenuItem');
const Category = require('../models/category');
const { cloudinary } = require('../config/cloudinary');

// CREATE MENU ITEM WITH IMAGE
const createMenuItem = async (req, res) => {
  try {
    let {
      name,
      description,
      price,
      categoryId,
      preparationTime,
      isVegetarian,
      isVegan,
      spiceLevel,
      tags,
      sortOrder
    } = req.body;

    // Check if image was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image for the menu item'
      });
    }

    // Trim fields if provided
    if (name) name = name.trim();
    if (description) description = description.trim();
    if (categoryId) categoryId = categoryId.trim();
    if (spiceLevel) spiceLevel = spiceLevel.trim();

    // Validation
    if (!name || !description || !price || !categoryId) {
      await cloudinary.uploader.destroy(req.file.filename); // rollback uploaded image
      return res.status(400).json({
        success: false,
        message: 'Please provide name, description, price, and category'
      });
    }

    // Verify category belongs to vendor and is active
    const category = await Category.findOne({
      _id: categoryId,
      vendor: req.vendor._id,
      isActive: true
    });

    if (!category) {
      await cloudinary.uploader.destroy(req.file.filename); // rollback uploaded image
      return res.status(400).json({
        success: false,
        message: 'Invalid category or category does not belong to vendor'
      });
    }

    // Create menu item
    const menuItem = await MenuItem.create({
      name,
      description,
      price: parseFloat(price),
      category: categoryId,
      vendor: req.vendor._id,
      image: {
        url: req.file.path,       // Cloudinary URL
        publicId: req.file.filename // Cloudinary public ID for deletion
      },
      preparationTime: preparationTime || 15,
      isVegetarian: isVegetarian === true || isVegetarian === 'true',
      isVegan: isVegan === true || isVegan === 'true',
      spiceLevel,
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(tag => tag.trim()) : []),
      sortOrder: sortOrder || 0
    });

    await menuItem.populate('category', 'name description'); // Add category info

    res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      data: { menuItem }
    });

  } catch (error) {
    console.error('Create menu item error:', error);

    if (req.file?.filename) {
      try {
        await cloudinary.uploader.destroy(req.file.filename); // rollback uploaded image
      } catch (deleteError) {
        console.error('Error deleting uploaded image:', deleteError);
      }
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// UPDATE MENU ITEM WITH OPTIONAL IMAGE UPDATE
const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    const existingItem = await MenuItem.findOne({ _id: id, vendor: req.vendor._id });
    if (!existingItem) {
      if (req.file?.filename) await cloudinary.uploader.destroy(req.file.filename);
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    // Handle image update
    if (req.file) {
      if (existingItem.image.publicId) {
        try {
          await cloudinary.uploader.destroy(existingItem.image.publicId);
          console.log(`Old image deleted: ${existingItem.image.publicId}`);
        } catch (deleteError) {
          console.error('Error deleting old image:', deleteError);
        }
      }
      updateData.image = { url: req.file.path, publicId: req.file.filename };
    }

    // If updating category, verify it belongs to vendor
    if (updateData.categoryId) {
      const category = await Category.findOne({
        _id: updateData.categoryId,
        vendor: req.vendor._id,
        isActive: true
      });

      if (!category) {
        if (req.file?.filename) await cloudinary.uploader.destroy(req.file.filename);
        return res.status(400).json({ success: false, message: 'Invalid category' });
      }

      updateData.category = updateData.categoryId;
      delete updateData.categoryId;
    }

    // Convert fields properly
    if (updateData.price) updateData.price = parseFloat(updateData.price);
    if (updateData.preparationTime) updateData.preparationTime = parseInt(updateData.preparationTime);
    if (updateData.sortOrder) updateData.sortOrder = parseInt(updateData.sortOrder);

    // Boolean conversions
    ['isVegetarian', 'isVegan', 'isAvailable'].forEach(field => {
      if (updateData[field] !== undefined) {
        updateData[field] = updateData[field] === true || updateData[field] === 'true';
      }
    });

    // Tags handling
    if (updateData.tags && typeof updateData.tags === 'string') {
      updateData.tags = updateData.tags.split(',').map(tag => tag.trim());
    }

    const updatedItem = await MenuItem.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    }).populate('category', 'name description');

    res.status(200).json({
      success: true,
      message: 'Menu item updated successfully',
      data: { menuItem: updatedItem }
    });

  } catch (error) {
    console.error('Update menu item error:', error);

    if (req.file?.filename) {
      try {
        await cloudinary.uploader.destroy(req.file.filename);
      } catch (deleteError) {
        console.error('Error deleting uploaded image:', deleteError);
      }
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors
      });
    }

    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// GET ALL MENU ITEMS FOR VENDOR (GROUPED BY CATEGORY)
const getVendorMenuItems = async (req, res) => {
  try {
    const { categoryId, isAvailable, search, page = 1, limit = 50 } = req.query;

    const filter = { vendor: req.vendor._id };
    if (categoryId) filter.category = categoryId;
    if (isAvailable !== undefined) filter.isAvailable = isAvailable === 'true';
    if (search) filter.$text = { $search: search };

    const menuItems = await MenuItem.find(filter)
      .populate('category', 'name description sortOrder')
      .sort({ 'category.sortOrder': 1, sortOrder: 1, createdAt: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Group items by category
    const groupedItems = menuItems.reduce((acc, item) => {
      const categoryId = item.category._id.toString();
      if (!acc[categoryId]) {
        acc[categoryId] = {
          category: {
            id: categoryId,
            name: item.category.name,
            description: item.category.description,
            sortOrder: item.category.sortOrder
          },
          items: []
        };
      }
      acc[categoryId].items.push(item);
      return acc;
    }, {});

    const result = Object.values(groupedItems).sort(
      (a, b) => (a.category.sortOrder || 0) - (b.category.sortOrder || 0)
    );

    const total = await MenuItem.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        menuByCategory: result,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get menu items error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// GET ITEMS BY SPECIFIC CATEGORY
const getItemsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await Category.findOne({ _id: categoryId, vendor: req.vendor._id });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const items = await MenuItem.find({ category: categoryId, vendor: req.vendor._id })
      .sort({ sortOrder: 1, createdAt: 1 });

    res.status(200).json({
      success: true,
      data: {
        category: {
          id: category._id,
          name: category.name,
          description: category.description
        },
        items,
        count: items.length
      }
    });

  } catch (error) {
    console.error('Get items by category error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// DELETE MENU ITEM
const deleteMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findOneAndDelete({
      _id: req.params.id,
      vendor: req.vendor._id
    });

    if (!menuItem) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    res.status(200).json({ success: true, message: 'Menu item deleted successfully' });

  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  createMenuItem,
  updateMenuItem,
  getVendorMenuItems,
  getItemsByCategory,
  deleteMenuItem
};
