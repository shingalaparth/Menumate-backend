// routes/menuRoutes.js 

const express = require('express');
// We need mergeParams: true to access :shopId from the parent router
const router = express.Router({ mergeParams: true });

const {
    createMenuItem,
    getShopMenuItems, // Renamed from getVendorMenuItems
    updateMenuItem,
    deleteMenuItem,
    restoreMenuItem
} = require('../controllers/menuController');

const { upload } = require('../config/cloudinary');

// Note: 'protect' middleware will be applied in the main shop route file

router.route('/')
    .post(upload.single('image'), createMenuItem) // POST /api/shops/:shopId/menu
    .get(getShopMenuItems);                      // GET /api/shops/:shopId/menu

router.route('/:itemId')
    .put(upload.single('image'), updateMenuItem) // PUT /api/shops/:shopId/menu/:itemId
    .delete(deleteMenuItem);                     // DELETE /api/shops/:shopId/menu/:itemId

router.patch('/:itemId/restore', restoreMenuItem);

module.exports = router;
