// routes/publicRoutes.js
const express = require('express');
const router = express.Router();
const { getMenuByQrIdentifier, getAllFoodCourts } = require('../controllers/publicController');

// This route is open to anyone who has scanned a QR code
router.get('/menu/:qrIdentifier', getMenuByQrIdentifier);

// route to list all food courts
router.get('/foodcourts', getAllFoodCourts);

module.exports = router;