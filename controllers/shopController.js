// controllers/shopController.js

const Shop = require('../models/shop');
const Vendor = require('../models/vendor');
const { cloudinary } = require('../config/cloudinary');


// @desc    Create a new shop
// @route   POST /api/shops
// @access  Private (Vendor only)
const createShop = async (req, res) => {
    try {
        const { name, address, phone } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: "Shop name is required" });
        }

        // The owner's ID comes from the 'protect' middleware (req.vendor)
        const ownerId = req.vendor._id;

        const newShop = await Shop.create({
            name,
            address,
            phone,
            owner: ownerId
        });

        res.status(201).json({
            success: true,
            message: "Shop created successfully",
            data: newShop
        });

    } catch (error) {
        console.error("Create shop error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// @desc    Get all shops for the logged-in vendor
// @route   GET /api/shops
// @access  Private (Vendor only)
const getMyShops = async (req, res) => {
    try {
        const ownerId = req.vendor._id;
        const shops = await Shop.find({ owner: ownerId });

        res.status(200).json({
            success: true,
            count: shops.length,
            data: shops
        });

    } catch (error) {
        console.error("Get my shops error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }

};

// @desc    Upload or update a UPI QR code for a specific shop
// @route   PUT /api/shops/:shopId/upi-qr
// @access  Private (Vendor only)
const uploadUpiQrCode = async (req, res) => {
    try {
        const { shopId } = req.params;
        const vendorId = req.vendor._id;

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload a QR code image.' });
        }

        // Find the shop and verify ownership
        const shop = await Shop.findById(shopId);
        if (!shop) {
            return res.status(404).json({ success: false, message: 'Shop not found.' });
        }
        if (shop.owner.toString() !== vendorId.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied. You do not own this shop.' });
        }

        if (shop.upiQrCodeUrl) {
            try {
                // Extract public_id from Cloudinary URL
                const urlParts = shop.upiQrCodeUrl.split('/');
                const publicIdWithExtension = urlParts[urlParts.length - 1];
                const publicId = publicIdWithExtension.split('.')[0];
                const fullPublicId = `menumate/qr-codes/${publicId}`;

                await cloudinary.uploader.destroy(fullPublicId);
                console.log(`🗑️ Deleted old QR code: ${fullPublicId}`);
            } catch (deleteError) {
                console.error('Could not delete old QR code, proceeding anyway:', deleteError);
            }
        };

        // Update the shop with the new QR code URL
        shop.upiQrCodeUrl = req.file.path;
        await shop.save();

        res.status(200).json({
            success: true,
            message: "UPI QR code uploaded successfully.",
            data: { upiQrCodeUrl: shop.upiQrCodeUrl }
        });

    } catch (error) {
        console.error("Upload QR Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
// @desc    Delete a shop by ID (vendor can only delete their own)
// @route   DELETE /api/shops/:shopId
// @access  Private (Vendor only)
const deleteShop = async (req, res) => {
    try {
        const { shopId } = req.params;
        const vendorId = req.vendor._id;

        // 1. Find the shop
        const shop = await Shop.findById(shopId);
        if (!shop) {
            return res.status(404).json({
                success: false,
                message: "Shop not found"
            });
        }

        // 2. Check ownership
        if (shop.owner.toString() !== vendorId.toString()) {
            return res.status(403).json({
                success: false,
                message: "Access denied. You do not own this shop"
            });
        }

        // 3. If QR code exists, clean it up from Cloudinary
        if (shop.upiQrCodeUrl) {
            try {
                const urlParts = shop.upiQrCodeUrl.split("/");
                const publicIdWithExtension = urlParts[urlParts.length - 1];
                const publicId = publicIdWithExtension.split(".")[0];
                const fullPublicId = `menumate/qr-codes/${publicId}`;
                await cloudinary.uploader.destroy(fullPublicId);
                console.log(`🗑️ Deleted QR code: ${fullPublicId}`);
            } catch (deleteError) {
                console.error("Error deleting QR code:", deleteError);
            }
        }

        // 4. Delete the shop
        await shop.deleteOne();

        res.status(200).json({
            success: true,
            message: "Shop deleted successfully"
        });

    } catch (error) {
        console.error("Delete shop error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while deleting shop"
        });
    }
};

module.exports = {
    createShop,
    getMyShops,
    uploadUpiQrCode,
    deleteShop
};