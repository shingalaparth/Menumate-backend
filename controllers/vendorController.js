// controllers/vendorController.js

const Vendor = require("../models/vendor");
const { comparePassword, hashPassword } = require("../utils/hash");
const { createJWT } = require("../utils/jwt");
const Shop = require("../models/shop"); // Import shop model (for cleanup on delete)

// ==================================================================
// REGISTER VENDOR
// ==================================================================
const registerVendor = async (req, res) => {
    try {
        const { name, email, number, password } = req.body;

        // 1) Validation
        if (!name || !email || !number || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide name, email, number, and password"
            });
        }

        // 2) Normalize email (always lowercase for consistency)
        const emailLower = email.toLowerCase();

        // 3) Check if vendor already exists (email or number)
        const existingVendor = await Vendor.findOne({
            $or: [{ email: emailLower }, { number }]
        });
        if (existingVendor) {
            return res.status(400).json({
                success: false,
                message: "Vendor already exists with this email or number"
            });
        }

        // 4) Create new vendor (password will be hashed in model middleware)
        const newVendor = await Vendor.create({
            name,
            email: emailLower,
            number,
            password
        });

        // 5) Create JWT token
        const token = createJWT({
            id: newVendor._id,
            email: newVendor.email,
            role: newVendor.role
        });

        // 6) Response (no sensitive fields returned)
        return res.status(201).json({
            success: true,
            message: "Vendor registered successfully. Please log in and add your shop details.",
            token,
            data: {
                vendor: {
                    id: newVendor._id,
                    name: newVendor.name,
                    email: newVendor.email
                }
            }
        });

    } catch (error) {
        console.error("Vendor registration error:", error);
        res.status(500).json({ success: false, message: "Server error during registration" });
    }
};

// ==================================================================
// LOGIN VENDOR
// ==================================================================
const loginVendor = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1) Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // 2) Normalize email
        const emailLower = email.toLowerCase();

        // 3) Find vendor (include password for comparison)
        const vendor = await Vendor.findOne({ email: emailLower }).select("+password");
        if (!vendor) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password" // generic message for security
            });
        }

        // 4) Compare passwords
        const isMatch = await comparePassword(password, vendor.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password" // generic message for security
            });
        }
        // 5) Create JWT
        const token = createJWT({
            id: vendor._id,
            email: vendor.email,
            role: vendor.role
        });
        // 6) Response
        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            data: {
                vendor: {
                    id: vendor._id,
                    name: vendor.name,
                    email: vendor.email
                }
            }
        });

    } catch (error) {
        console.error("Vendor registration error:", error);
        res.status(500).json({ success: false, message: "Server error during registration" });
    }
};

// ==================================================================
// UPDATE VENDOR PROFILE
// ==================================================================
const updateVendor = async (req, res) => {
    try {
        const { name, number, password } = req.body;

        // 1) Find vendor
        const vendor = await Vendor.findById(req.vendor._id);
        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: "Vendor not found"
            });
        };
        // 2) Update fields
        if (name) vendor.name = name;
        if (number) vendor.number = number;
        if (password) vendor.password = await hashPassword(password); // hash new password

        // 3) Save updated vendor
        const updatedVendor = await vendor.save();

        // 4) Response
        res.status(200).json({
            success: true,
            message: "Vendor profile updated successfully",
            data: {
                vendor: {
                    id: updatedVendor._id,
                    name: updatedVendor.name,
                    email: updatedVendor.email
                }
            }
        });

    } catch (error) {
        console.error("Update vendor error:", error);
        res.status(500).json({ success: false, message: "Server error during update" });
    }
};

// ==================================================================
// LOGOUT VENDOR
// ==================================================================
const logoutVendor = (req, res) => {
    // NOTE: Since JWT is stateless, logout is handled on client-side
    // Here we just return a success response
    res.status(200).json({
        success: true,
        message: "Logged out successfully"
    });
};

// ==================================================================
// DELETE VENDOR
// ==================================================================
const deleteVendor = async (req, res) => {
    try {
        // 1) Delete vendor
        await Vendor.findByIdAndDelete(req.vendor._id);
        // 2) OPTIONAL: Also delete associated shops
        await Shop.deleteMany({ owner: req.vendor._id });
        res.status(200).json({
            success: true,
            message: "Vendor account and associated shops deleted successfully"
        }); 
    } catch (error) {
        console.error("Delete error:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// ==================================================================
// EXPORTS
// ==================================================================
module.exports = {
    registerVendor,
    loginVendor,
    logoutVendor,
    updateVendor,
    deleteVendor
};
