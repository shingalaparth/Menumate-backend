// controllers/menuController.js

const MenuItem = require('../models/menuItem');
const Category = require('../models/category');
const Shop = require('../models/shop');
const { cloudinary } = require('../config/cloudinary');

// --- HELPER FUNCTION FOR SECURITY ---
// We can reuse the same logic, or import it from a shared utils file
const checkShopOwnership = async (shopId, vendorId) => {
    const shop = await Shop.findById(shopId);
    if (!shop) { return { success: false, message: 'Shop not found', status: 404 }; }
    if (shop.owner.toString() !== vendorId.toString()) { return { success: false, message: 'Access denied. You do not own this shop.', status: 403 }; }
    return { success: true };
};


// CREATE MENU ITEM
const createMenuItem = async (req, res) => {
    try {
        const { shopId } = req.params;
        const vendorId = req.vendor._id;

        // 1. Security Check
        const ownershipCheck = await checkShopOwnership(shopId, vendorId);
        if (!ownershipCheck.success) { return res.status(ownershipCheck.status).json({ success: false, message: ownershipCheck.message }); }

        if (!req.file) { return res.status(400).json({ success: false, message: 'Please upload an image' }); }

        const { name, description, price, categoryId, ...otherDetails } = req.body;
        if (!name || !price || !categoryId) {
            await cloudinary.uploader.destroy(req.file.filename);
            return res.status(400).json({ success: false, message: 'Name, price, and category are required' });
        }

        // 2. Verify the category belongs to the shop
        const category = await Category.findOne({ _id: categoryId, shop: shopId });
        if (!category) {
            await cloudinary.uploader.destroy(req.file.filename);
            return res.status(400).json({ success: false, message: 'Invalid category. It does not belong to this shop.' });
        }

        // 3. Create the menu item, linking it to the SHOP
        const menuItem = await MenuItem.create({
            ...otherDetails,
            name,
            description,
            price: parseFloat(price),
            category: categoryId,
            shop: shopId, // Link to the shop
            image: {
                url: req.file.path,
                publicId: req.file.filename
            }
        });

        res.status(201).json({ success: true, message: 'Menu item created successfully', data: menuItem });

    } catch (error) {
        console.error('Create menu item error:', error);
        if (req.file?.filename) { await cloudinary.uploader.destroy(req.file.filename); }
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// GET ALL MENU ITEMS FOR A SHOP
const getShopMenuItems = async (req, res) => {
    try {
        const { shopId } = req.params;
        const vendorId = req.vendor._id;

        // 1. Security Check
        const ownershipCheck = await checkShopOwnership(shopId, vendorId);
        if (!ownershipCheck.success) { return res.status(ownershipCheck.status).json({ success: false, message: ownershipCheck.message }); }
        
        // 2. Find all menu items for THIS SHOP
        const menuItems = await MenuItem.find({ shop: shopId }).populate('category', 'name').sort({ 'category.name': 1, sortOrder: 1 });

        res.status(200).json({ success: true, count: menuItems.length, data: menuItems });

    } catch (error) {
        console.error('Get menu items error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// UPDATE MENU ITEM
const updateMenuItem = async (req, res) => {
    try {
        const { shopId, itemId } = req.params;
        const vendorId = req.vendor._id;

        // 1. Security Check
        const ownershipCheck = await checkShopOwnership(shopId, vendorId);
        if (!ownershipCheck.success) { return res.status(ownershipCheck.status).json({ success: false, message: ownershipCheck.message }); }

        // Find the existing item to handle image deletion if needed
        const existingItem = await MenuItem.findOne({ _id: itemId, shop: shopId });
        if (!existingItem) {
            return res.status(404).json({ success: false, message: 'Menu item not found in this shop' });
        }

        const updateData = { ...req.body };

        // Handle image update
        if (req.file) {
            if (existingItem.image?.publicId) {
                await cloudinary.uploader.destroy(existingItem.image.publicId);
            }
            updateData.image = { url: req.file.path, publicId: req.file.filename };
        }
        
        // 2. Find and update
        const updatedItem = await MenuItem.findByIdAndUpdate(itemId, updateData, { new: true, runValidators: true });
        
        res.status(200).json({ success: true, message: 'Menu item updated successfully', data: updatedItem });

    } catch (error) {
        console.error('Update menu item error:', error);
        if (req.file?.filename) { await cloudinary.uploader.destroy(req.file.filename); }
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// DELETE MENU ITEM
const deleteMenuItem = async (req, res) => {
    try {
        const { shopId, itemId } = req.params;
        const vendorId = req.vendor._id;

        // 1. Security Check
        const ownershipCheck = await checkShopOwnership(shopId, vendorId);
        if (!ownershipCheck.success) { return res.status(ownershipCheck.status).json({ success: false, message: ownershipCheck.message }); }

        // 2. Find and delete
        const menuItem = await MenuItem.findOneAndDelete({ _id: itemId, shop: shopId });

        if (!menuItem) {
            return res.status(404).json({ success: false, message: 'Menu item not found in this shop' });
        }
        
        // The pre-delete hook in the model will handle image deletion from Cloudinary

        res.status(200).json({ success: true, message: 'Menu item deleted successfully' });

    } catch (error) {
        console.error('Delete menu item error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};


module.exports = {
    createMenuItem,
    getShopMenuItems,
    updateMenuItem,
    deleteMenuItem
};