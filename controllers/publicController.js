// controllers/publicController.js
const Table = require('../models/table');
const Shop = require('../models/shop');
const Category = require('../models/category');
const MenuItem = require('../models/menuItem');
const FoodCourt = require('../models/foodCourt');

const getMenuByQrIdentifier = async (req, res) => {
    try {
        const { qrIdentifier } = req.params;
        const table = await Table.findOne({ qrIdentifier }).populate('shop'); // Populate shop details

        if (!table || !table.isActive) {
            return res.status(404).json({ success: false, message: 'QR Code is invalid or inactive.' });
        }

        const isFoodCourt = table.shop.foodCourt;
        let responseData;

        if (isFoodCourt) {
            // --- FOOD COURT LOGIC ---
            const foodCourt = await FoodCourt.findById(isFoodCourt);
            if (!foodCourt || !foodCourt.isActive) {
                return res.status(404).json({ success: false, message: 'Food court not found or is currently closed.' });
            }

            const shopsInFoodCourt = await Shop.find({ foodCourt: isFoodCourt, isActive: true });
            const shopMenus = await Promise.all(shopsInFoodCourt.map(async (shop) => {
                const categories = await Category.find({ shop: shop._id, isActive: true }).sort({ sortOrder: 1 });
                const menuItems = await MenuItem.find({ shop: shop._id, isAvailable: true }).sort({ sortOrder: 1 });
                
                const menuByCategory = categories.map(cat => ({
                    ...cat.toObject(),
                    items: menuItems.filter(item => item.category.toString() === cat._id.toString())
                }));
                return { ...shop.toObject(), menu: menuByCategory };
            }));

            responseData = {
                isFoodCourt: true,
                foodCourt,
                table: { _id: table._id, tableNumber: table.tableNumber },
                shops: shopMenus
            };

        } else {
            // --- SINGLE SHOP LOGIC (EXISTING) ---
            const shop = await Shop.findById(table.shop._id).select('name address phone isActive upiQrCodeUrl');
            if (!shop || !shop.isActive) {
                return res.status(404).json({ success: false, message: 'Shop not found or is currently closed.' });
            }
            const [categories, menuItems] = await Promise.all([
                Category.find({ shop: shop._id, isActive: true }).sort({ sortOrder: 1 }),
                MenuItem.find({ shop: shop._id, isAvailable: true }).sort({ sortOrder: 1 })
            ]);
            const menuByCategory = categories.map(cat => ({
                ...cat.toObject(),
                items: menuItems.filter(item => item.category.toString() === cat._id.toString())
            }));

            responseData = {
                isFoodCourt: false,
                shop,
                table: { _id: table._id, tableNumber: table.tableNumber },
                menu: menuByCategory
            };
        }

        res.status(200).json({ success: true, data: responseData });

    } catch (error) {
        console.error("Get Menu By QR error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

const getAllFoodCourts = async (req, res) => { /* ... existing code ... */ };

module.exports = { getMenuByQrIdentifier, getAllFoodCourts }; 