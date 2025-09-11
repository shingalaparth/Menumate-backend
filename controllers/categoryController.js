// controllers/categoryController.js
const Category = require('../models/category');
const MenuItem = require('../models/MenuItem');

// CREATE CATEGORY
const createCategory = async (req, res) => {
  try {
    const { name, description, sortOrder } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    // Check if category already exists for this vendor (case-insensitive)
    const existingCategory = await Category.findOne({
      vendor: req.vendor._id,
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    // Create new category
    const category = await Category.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      vendor: req.vendor._id,
      sortOrder: sortOrder || 0
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: {
        category
      }
    });

  } catch (error) {
    console.error('Create category error:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// GET ALL CATEGORIES FOR VENDOR
const getVendorCategories = async (req, res) => {
  try {
    const { includeInactive } = req.query;

    // Build filter
    const filter = { vendor: req.vendor._id };
    if (includeInactive !== 'true') {
      filter.isActive = true;
    }

    // Get categories with item counts
    const categories = await Category.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'menuitems',
          let: { categoryId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$category', '$$categoryId'] },
                    { $eq: ['$vendor', filter.vendor] }
                  ]
                }
              }
            }
          ],
          as: 'items'
        }
      },
      {
        $addFields: {
          itemCount: { $size: '$items' },
          availableItemCount: {
            $size: {
              $filter: {
                input: '$items',
                cond: { $eq: ['$$this.isAvailable', true] }
              }
            }
          }
        }
      },
      {
        $project: {
          items: 0 // Remove items array from output
        }
      },
      { $sort: { sortOrder: 1, createdAt: 1 } }
    ]);

    res.status(200).json({
      success: true,
      count: categories.length,
      data: {
        categories
      }
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// UPDATE CATEGORY
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive, sortOrder } = req.body;

    const category = await Category.findOne({
      _id: id,
      vendor: req.vendor._id
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check for duplicate name if updating name
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({
        vendor: req.vendor._id,
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        _id: { $ne: id }
      });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }
    }

    // Update fields
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (isActive !== undefined) updateData.isActive = isActive;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: {
        category: updatedCategory
      }
    });

  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// DELETE CATEGORY
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findOne({
      _id: id,
      vendor: req.vendor._id
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category has menu items
    const itemCount = await MenuItem.countDocuments({
      category: id,
      vendor: req.vendor._id
    });

    if (itemCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It contains ${itemCount} menu items. Please move or delete the items first.`
      });
    }

    await Category.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

module.exports = {
  createCategory,
  getVendorCategories,
  updateCategory,
  deleteCategory
};