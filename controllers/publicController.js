// controllers/publicController.js
const Table = require('../models/table');
const Shop = require('../models/shop');
const Category = require('../models/category');
const MenuItem = require('../models/menuItem');

// @desc    Fetch a shop and its full menu using a QR identifier
// @route   GET /api/public/menu/:qrIdentifier
// @access  Public
const getMenuByQrIdentifier = async (req, res) => {
    try {
        const { qrIdentifier } = req.params;

        // 1. Find the table by its unique QR identifier
        const table = await Table.findOne({ qrIdentifier });

        if (!table || !table.isActive) {
            return res.status(404).json({ success: false, message: 'QR Code is invalid or inactive.' });
        }

        const shopId = table.shop;
        
        // 2. Fetch the shop details, categories, and menu items in parallel for speed

        const [shop, categories, menuItems] = await Promise.all([
            Shop.findById(shopId).select('name address phone isActive upiQrCodeUrl'), // <-- ADDED 'upiQrCodeUrl'
            Category.find({ shop: shopId, isActive: true }).sort({ sortOrder: 1 }),
            MenuItem.find({ shop: shopId, isAvailable: true }).sort({ sortOrder: 1 })
        ]);

        if (!shop || !shop.isActive) {
            return res.status(404).json({ success: false, message: 'Shop not found or is currently closed.' });
        }
        

        // 3. Structure the menu by grouping items under their categories
        const menuByCategory = categories.map(category => {
            const items = menuItems.filter(item => item.category.toString() === category._id.toString());
            return {
                _id: category._id,
                name: category.name,
                description: category.description,
                items: items
            };
        });

        // 4. Send the complete, structured response
        res.status(200).json({
            success: true,
            data: {
                shop: shop,
                table: {
                    _id: table._id,
                    tableNumber: table.tableNumber
                },
                menu: menuByCategory
            }
        });

    } catch (error) {
        console.error("Get Menu By QR error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

module.exports = {
    getMenuByQrIdentifier
};