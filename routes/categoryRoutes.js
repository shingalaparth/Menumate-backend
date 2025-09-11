// routes/categoryRoutes.js

const express = require('express');
const router = express.Router({ mergeParams: true });

const {
    createCategory,
    getShopCategories, // Renamed from getVendorCategories
    updateCategory,
    deleteCategory
} = require('../controllers/categoryController');

router.route('/')
    .post(createCategory)   // POST /api/shops/:shopId/categories
    .get(getShopCategories);  // GET /api/shops/:shopId/categories

router.route('/:categoryId')
    .put(updateCategory)    // PUT /api/shops/:shopId/categories/:categoryId
    .delete(deleteCategory);  // DELETE /api/shops/:shopId/categories/:categoryId

module.exports = router;