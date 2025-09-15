// routes/publicRoutes.js
const express = require('express');
const router = express.Router();
const { getMenuByQrIdentifier } = require('../controllers/publicController');

// This route is open to anyone who has scanned a QR code
router.get('/menu/:qrIdentifier', getMenuByQrIdentifier);

module.exports = router;