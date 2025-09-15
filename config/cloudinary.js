// config/cloudinary.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Storage for regular menu item images
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'menumate/menu-items',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 600, crop: 'fill', quality: 'auto' }]
  }
});

// Your excellent addition: Separate storage for UPI QR codes
const qrStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'menumate/qr-codes', // Separate folder
    allowed_formats: ['png', 'jpg', 'jpeg'],
    transformation: [{ width: 400, height: 400, crop: 'fit', quality: 'auto' }]
  }
});

// Middleware for menu item images
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) { cb(null, true); } 
    else { cb(new Error('Only image files are allowed!'), false); }
  }
});

// Middleware for UPI QR code images
const uploadQR = multer({
  storage: qrStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) { cb(null, true); } 
    else { cb(new Error('Only image files are allowed!'), false); }
  }
});

module.exports = { cloudinary, upload, uploadQR };