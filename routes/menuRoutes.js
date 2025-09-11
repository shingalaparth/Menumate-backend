// routes/menuRoutes.js

const express = require('express');
const router = express.Router();

const {
  createMenuItem,
  getVendorMenuItems,
  getItemsByCategory,
  updateMenuItem,
  deleteMenuItem
} = require('../controllers/menuController');

const { protect } = require('../middlewares/auth');
const { upload } = require('../config/cloudinary'); 

router.use(protect);


router.post('/create', upload.single('image'), createMenuItem);
router.put('/:id', upload.single('image'), updateMenuItem);

router.get('/', getVendorMenuItems);
router.get('/category/:categoryId', getItemsByCategory);
router.delete('/:id', deleteMenuItem);

module.exports = router;