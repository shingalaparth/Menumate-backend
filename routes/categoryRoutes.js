// routes/categoryRoutes.js

const express = require('express');
const router = express.Router();

const {
  createCategory,
  getVendorCategories,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');

const { protect } = require('../middlewares/auth');

// All routes require vendor authentication
router.use(protect);

router.post('/create', createCategory);
router.get('/', getVendorCategories);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

module.exports = router;