// controllers/publicController.js
const Table = require('../models/table');
const Shop = require('../models/shop');
const Category = require('../models/category');
const MenuItem = require('../models/menuItem');
const FoodCourt = require('../models/foodCourt');

// const isShopOpen = (openingTime, closingTime) => {
//     const now = new Date();
//     const options = { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false };
//     const [currentHour, currentMinute] = new Intl.DateTimeFormat("en-US", options)
//         .formatToParts(now)
//         .filter(p => p.type === "hour" || p.type === "minute")
//         .map(p => Number(p.value));

//     const currentTimeInMinutes = currentHour * 60 + currentMinute;

//     const [openHour, openMinute] = openingTime.split(':').map(Number);
//     const [closeHour, closeMinute] = closingTime.split(':').map(Number);

//     const openingTimeInMinutes = openHour * 60 + openMinute;
//     const closingTimeInMinutes = closeHour * 60 + closeMinute;

//     if (openingTimeInMinutes > closingTimeInMinutes) {
//         return currentTimeInMinutes >= openingTimeInMinutes || currentTimeInMinutes < closingTimeInMinutes;
//     }
//     return currentTimeInMinutes >= openingTimeInMinutes && currentTimeInMinutes < closingTimeInMinutes;
// };


const getMenuByQrIdentifier = async (req, res) => {
     try {
        const { qrIdentifier } = req.params;
        const table = await Table.findOne({ qrIdentifier }).populate({
            path: 'shop',
            select: 'name foodCourt' // Select only the fields we need
        });

        if (!table || !table.isActive) {
            return res.status(404).json({ success: false, message: 'QR Code is invalid or inactive.' });
        }

        const isFoodCourt = table.shop.foodCourt;
        
        if (isFoodCourt) {
            // --- OPTIMIZED FOOD COURT LOGIC ---
            const foodCourt = await FoodCourt.findById(isFoodCourt);
            if (!foodCourt || !foodCourt.isActive) {
                return res.status(404).json({ success: false, message: 'Food court not found or is currently closed.' });
            }

            // 1. Get all shops in the food court
            const shopsInFoodCourt = await Shop.find({ foodCourt: isFoodCourt, isActive: true }).lean();
            const shopIds = shopsInFoodCourt.map(s => s._id);

            // 2. Fetch all categories and menu items for ALL shops in just TWO queries
          const [allCategories, allMenuItems] = await Promise.all([
                // Find only non-archived categories
                Category.find({ shop: { $in: shopIds }, isActive: true, isArchived: false }).sort({ sortOrder: 1 }).lean(),
                // Find only non-archived menu items
                MenuItem.find({ shop: { $in: shopIds }, isAvailable: true, isArchived: false }).sort({ sortOrder: 1 }).lean()
            ]);

            // 3. Organize the data in our code (much faster than multiple DB calls)
            const shopMenus = shopsInFoodCourt.map(shop => {
                const categoriesForShop = allCategories.filter(cat => cat.shop.toString() === shop._id.toString());
                const menuByCategory = categoriesForShop.map(cat => ({
                    ...cat,
                    items: allMenuItems.filter(item => item.category.toString() === cat._id.toString())
                }));
                return { ...shop, menu: menuByCategory };
            });

            res.status(200).json({
                success: true,
                data: {
                    isFoodCourt: true,
                    foodCourt,
                    table: { _id: table._id, tableNumber: table.tableNumber },
                    shops: shopMenus
                }
            });
            
        } else {
            // --- SINGLE SHOP LOGIC (WITH UPGRADES) ---
            const shopId = table.shop._id;
            const shop = await Shop.findById(shopId).select('name address phone isActive upiQrCodeUrl openingTime closingTime');

            if (!shop || !shop.isActive) {
                return res.status(404).json({ success: false, message: 'Shop not found or is currently closed.' });
            }

            // if (!isShopOpen(shop.openingTime, shop.closingTime)) {
            //     return res.status(200).json({
            //         success: true,
            //         data: { isOpen: false, shop: { name: shop.name }, message: `This shop is currently closed. Opens at ${shop.openingTime}.` }
            //     });
            // }
            
             const [categories, menuItems] = await Promise.all([
                // Find only non-archived categories
                Category.find({ shop: shop._id, isActive: true, isArchived: false }).sort({ sortOrder: 1 }),
                // Find only non-archived menu items
                MenuItem.find({ shop: shop._id, isAvailable: true, isArchived: false }).sort({ sortOrder: 1 })
            ]);
            
            const menuByCategory = categories.map(cat => ({
                ...cat.toObject(),
                items: menuItems.filter(item => item.category.toString() === cat._id.toString())
            }));

            res.status(200).json({
                success: true,
                data: { isOpen: true, isFoodCourt: false, shop, table: { _id: table._id, tableNumber: table.tableNumber }, menu: menuByCategory }
            });
        }
    } catch (error) {
        console.error("Get Menu By QR error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

const getAllFoodCourts = async (req, res, next) => { 
    try {
        const foodCourts = await FoodCourt.find({ isActive: true }).select('name city');
        res.status(200).json({
            success: true,
            count: foodCourts.length,
            data: foodCourts
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getMenuByQrIdentifier, getAllFoodCourts }; 