// controllers/menuController.js

const MenuItem = require('../models/menuItem');
const Category = require('../models/category');
const { cloudinary } = require('../config/cloudinary');
const { checkShopOwnership } = require('../utils/checkOwnership');


// CREATE MENU ITEM 
const createMenuItem = async (req, res) => {
    try {
        const { shopId } = req.params;
        const ownershipCheck = await checkShopOwnership(shopId, req.vendor);
        if (!ownershipCheck.success) {
            return res.status(ownershipCheck.status).json({ success: false, message: ownershipCheck.message });
        }

        if (!req.file) { return res.status(400).json({ success: false, message: 'Please upload an image' }); }

        // --- NEW, MORE ROBUST DATA HANDLING ---
        const {
            name, description, categoryId, isVegetarian, preparationTime,
            price, // Base price is optional
            variants, // This will be a JSON string
            addOnGroups // This will also be a JSON string
        } = req.body;

        if (!name || !price || !categoryId) {
            await cloudinary.uploader.destroy(req.file.filename);
            return res.status(400).json({ success: false, message: 'Name, price, and category are required' });
        }
        // Safely parse Variants
        let parsedVariants = [];
        if (variants) {
            try {
                parsedVariants = JSON.parse(variants);
                if (!Array.isArray(parsedVariants)) throw new Error();
            } catch (e) {
                await cloudinary.uploader.destroy(req.file.filename);
                return res.status(400).json({ success: false, message: 'Invalid format for variants. It must be a JSON array string.' });
            }
        }

        // Safely parse Add-on Groups
        let parsedAddOnGroups = [];
        if (addOnGroups) {
            try {
                parsedAddOnGroups = JSON.parse(addOnGroups);
                if (!Array.isArray(parsedAddOnGroups)) throw new Error();
            } catch (e) {
                await cloudinary.uploader.destroy(req.file.filename);
                return res.status(400).json({ success: false, message: 'Invalid format for add-on groups. It must be a JSON array string.' });
            }
        } 
        // 2. Verify the category belongs to the shop
        const category = await Category.findOne({ _id: categoryId, shop: shopId });
        if (!category) {
            await cloudinary.uploader.destroy(req.file.filename);
            return res.status(400).json({ success: false, message: 'Invalid category. It does not belong to this shop.' });
        }

        // 3. Create the menu item, linking it to the SHOP
        const menuItemData = {
            name, description, category: categoryId, shop: shopId,
            isVegetarian: isVegetarian === 'true',
            preparationTime: preparationTime || 15,
            price: price ? parseFloat(price) : undefined,
            variants: parsedVariants,
            addOnGroups: parsedAddOnGroups,
            image: {
                url: req.file.path,
                publicId: req.file.filename
            }
        };

        const newMenuItem = await MenuItem.create(menuItemData);
        
        res.status(201).json({ success: true, message: 'Menu item created successfully', data: menuItemData });

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
        const ownershipCheck = await checkShopOwnership(shopId, req.vendor);
        if (!ownershipCheck.success) {
            return res.status(ownershipCheck.status).json({ success: false, message: ownershipCheck.message });
        }

        // 2. Find all menu items for THIS SHOP
        const menuItems = await MenuItem.find({ shop: shopId, isArchived: false })
            .populate('category', 'name')
            .sort({ 'category.name': 1, sortOrder: 1 });

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
        const ownershipCheck = await checkShopOwnership(shopId, req.vendor);
        if (!ownershipCheck.success) {
            return res.status(ownershipCheck.status).json({ success: false, message: ownershipCheck.message });
        }

        // Find the existing item to handle image deletion if needed
        const existingItem = await MenuItem.findOne({ _id: itemId, shop: shopId });
        if (!existingItem) {
            return res.status(404).json({ success: false, message: 'Menu item not found in this shop' });
        }

        const updateData = { ...req.body };
        // Safely parse variants and addOnGroups if they exist in the update
        if (updateData.variants) {
            try {
                updateData.variants = JSON.parse(updateData.variants);
            } catch (e) {
                return res.status(400).json({ success: false, message: 'Invalid format for variants.' });
            }
        }
        if (updateData.addOnGroups) {
            try {
                updateData.addOnGroups = JSON.parse(updateData.addOnGroups);
            } catch (e) {
                return res.status(400).json({ success: false, message: 'Invalid format for add-on groups.' });
            }
        }

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
        const ownershipCheck = await checkShopOwnership(shopId, req.vendor);
        if (!ownershipCheck.success) {
            return res.status(ownershipCheck.status).json({ success: false, message: ownershipCheck.message });
        }

        // 2. Find and delete
        const menuItem = await MenuItem.findOneAndDelete(
            { _id: itemId, shop: shopId },
            { isArchived: true, isAvailable: false, archivedAt: new Date() }, // Also set as unavailable
            { new: true }
        );

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
const restoreMenuItem = async (req, res, next) => {
    try {
        const { shopId, itemId } = req.params;
        const ownershipCheck = await checkShopOwnership(shopId, req.vendor);
        if (!ownershipCheck.success) {
            return res.status(ownershipCheck.status).json({ success: false, message: ownershipCheck.message });
        }

        const menuItem = await MenuItem.findOneAndUpdate(
            { _id: itemId, shop: shopId },
            { isArchived: false, isAvailable: true, $unset: { archivedAt: "" } },
            { new: true }
        );
        if (!menuItem) return res.status(404).json({ success: false, message: 'Archived item not found.' });
        res.status(200).json({ success: true, message: 'Menu item restored successfully.', data: menuItem });
    } catch (error) { next(error); }
};

module.exports = {
    createMenuItem,
    getShopMenuItems,
    updateMenuItem,
    deleteMenuItem,
    restoreMenuItem
};
