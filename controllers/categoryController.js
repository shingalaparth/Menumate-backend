// controllers/categoryController.js

const Category = require('../models/category');
const Shop = require('../models/shop');
const MenuItem = require('../models/menuItem');

// --- HELPER FUNCTION FOR SECURITY ---
// Checks if the logged-in vendor owns the shop they are trying to access
const checkShopOwnership = async (shopId, vendorId) => {
    const shop = await Shop.findById(shopId);
    if (!shop) {
        return { success: false, message: 'Shop not found', status: 404 };
    }
    if (shop.owner.toString() !== vendorId.toString()) {
        return { success: false, message: 'Access denied. You do not own this shop.', status: 403 };
    }
    return { success: true, shop }; // Return the shop object if successful
};


// CREATE CATEGORY
const createCategory = async (req, res) => {
    try {
        const { shopId } = req.params;
        const vendorId = req.vendor._id;

        // 1. Security Check
        const ownershipCheck = await checkShopOwnership(shopId, vendorId);
        if (!ownershipCheck.success) {
            return res.status(ownershipCheck.status).json({ success: false, message: ownershipCheck.message });
        }

        const { name, description, sortOrder } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: 'Category name is required' });
        }

        // 2. Check for duplicate name WITHIN THIS SHOP
        const existingCategory = await Category.findOne({ shop: shopId, name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
        if (existingCategory) {
            return res.status(400).json({ success: false, message: 'Category with this name already exists for this shop' });
        }

        // 3. Create category linked to the SHOP
        const category = await Category.create({
            name: name.trim(),
            description: description ? description.trim() : '',
            shop: shopId,
            sortOrder: sortOrder || 0
        });

        res.status(201).json({ success: true, message: 'Category created successfully', data: category });

    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// GET ALL CATEGORIES FOR A SPECIFIC SHOP
const getShopCategories = async (req, res) => {
    try {
        const { shopId } = req.params;
        const vendorId = req.vendor._id;

        // 1. Security Check
        const ownershipCheck = await checkShopOwnership(shopId, vendorId);
        if (!ownershipCheck.success) {
            return res.status(ownershipCheck.status).json({ success: false, message: ownershipCheck.message });
        }

        // 2. Find all categories for THIS SHOP
        const categories = await Category.find({ shop: shopId }).sort({ sortOrder: 1, name: 1 });

        res.status(200).json({ success: true, count: categories.length, data: categories });

    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// UPDATE CATEGORY
const updateCategory = async (req, res) => {
    try {
        const { shopId, categoryId } = req.params;
        const vendorId = req.vendor._id;

        // 1. Security Check
        const ownershipCheck = await checkShopOwnership(shopId, vendorId);
        if (!ownershipCheck.success) {
            return res.status(ownershipCheck.status).json({ success: false, message: ownershipCheck.message });
        }

        // 2. Find and update the category
        const updatedCategory = await Category.findOneAndUpdate(
            { _id: categoryId, shop: shopId }, // Ensure the category belongs to the shop
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedCategory) {
            return res.status(404).json({ success: false, message: 'Category not found in this shop' });
        }

        res.status(200).json({ success: true, message: 'Category updated successfully', data: updatedCategory });

    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// DELETE CATEGORY
const deleteCategory = async (req, res) => {
    try {
        const { shopId, categoryId } = req.params;
        const vendorId = req.vendor._id;

        // 1. Security Check
        const ownershipCheck = await checkShopOwnership(shopId, vendorId);
        if (!ownershipCheck.success) {
            return res.status(ownershipCheck.status).json({ success: false, message: ownershipCheck.message });
        }

        // 2. Check if the category is empty
        const itemCount = await MenuItem.countDocuments({ category: categoryId });
        if (itemCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete category. It contains ${itemCount} menu items. Please move or delete them first.`
            });
        }
        
        // 3. Find and delete the category
        const category = await Category.findOneAndDelete({ _id: categoryId, shop: shopId });
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found in this shop' });
        }

        res.status(200).json({ success: true, message: 'Category deleted successfully' });

    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};


module.exports = {
    createCategory,
    getShopCategories,
    updateCategory,
    deleteCategory
};