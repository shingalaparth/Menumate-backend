// utils/checkOwnership.js
const Shop = require('../models/shop');

const checkShopOwnership = async (shopId, vendor) => {
    // A Super Admin can bypass the ownership check
    if (vendor.role === 'admin') {
        const shop = await Shop.findById(shopId);
        if (!shop) return { success: false, message: 'Shop not found', status: 404 };
        return { success: true, shop };
    }

    // A regular vendor must be the direct owner
    const shop = await Shop.findOne({ _id: shopId, owner: vendor._id });
    if (!shop) {
        return { success: false, message: 'Access denied. You do not own this shop or the shop does not exist.', status: 403 };
    }
    
    return { success: true, shop };
};

module.exports = { checkShopOwnership };
