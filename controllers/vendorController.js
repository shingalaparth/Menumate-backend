// controllers/vendorController.js

const Vendor = require("../models/vendor");
const { comparePassword, hashPassword } = require("../utils/hash");
const { createJWT } = require("../utils/jwt");

// REGISTER VENDOR
const registerVendor = async (req, res) => {
    try {
        const { name, email, number, password } = req.body;

        // 1) Corrected Validation Message: Removed 'shopName'
        if (!name || !email || !number || !password) {
            return res.status(400).json({ message: "Please provide name, email, number, and password" });
        }

        // 2) Check duplicate (email or number)
        const existingVendor = await Vendor.findOne({ $or: [{ email }, { number }] });
        if (existingVendor) {
            return res.status(400).json({ message: "Vendor already exists with this email or number" });
        }

        // 3) Create vendor (no 'shopName' field)
        const newVendor = await Vendor.create({ name, email, number, password });

        // 4) Create token without 'shopName'
        const token = createJWT({ id: newVendor._id, email: newVendor.email, role: newVendor.role });

        // 5) Respond without 'shopName'
        return res.status(201).json({
            message: "Vendor registered successfully. Please log in and add your shop details.",
            token,
            vendor: {
                id: newVendor._id,
                name: newVendor.name,
                email: newVendor.email,
            }
        });

    } catch (error) {
        console.error("Vendor registration error:", error);
        // ... error handling
        return res.status(500).json({ message: "Server error" });
    }
};

// LOGIN VENDOR
const loginVendor = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

        const vendor = await Vendor.findOne({ email }).select("+password");
        if (!vendor) return res.status(404).json({ message: "Vendor not found" });

        const isMatch = await comparePassword(password, vendor.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });
        
        // Corrected JWT Payload and Response: Removed 'shopName'
        const token = createJWT({ id: vendor._id, email: vendor.email, role: vendor.role });

        res.status(200).json({
            message: "Login successful",
            token,
            vendor: {
                id: vendor._id,
                name: vendor.name,
                email: vendor.email
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Server error, please try again later" });
    }
};

// UPDATE VENDOR
const updateVendor = async (req, res) => {
    try {
        // Corrected Destructuring: Removed 'shopName'
        const { name, number, password } = req.body;
        const vendor = await Vendor.findById(req.vendor._id);

        if (!vendor) {
            return res.status(404).json({ message: "Vendor not found" });
        }

        // Update fields (no 'shopName')
        if (name) vendor.name = name;
        if (number) vendor.number = number;
        if (password) vendor.password = await hashPassword(password); // Hashing on update is good practice

        const updatedVendor = await vendor.save();

        res.status(200).json({
            message: "Vendor profile updated successfully",
            vendor: {
                id: updatedVendor._id,
                name: updatedVendor.name,
                email: updatedVendor.email
            }
        });
    } catch (error) {
        console.error("Update error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// LOGOUT VENDOR (No changes needed, but included for completeness)
const logoutVendor = (req, res) => {
    res.status(200).json({ message: "Logged out successfully" });
};

// DELETE VENDOR (No changes needed, but included for completeness)
const deleteVendor = async (req, res) => {
    try {
        await Vendor.findByIdAndDelete(req.vendor._id);
        // Also good practice to delete associated shops
        // await Shop.deleteMany({ owner: req.vendor._id });
        res.status(200).json({ message: "Vendor account deleted successfully" });
    } catch (error) {
        console.error("Delete error:", error);
        res.status(500).json({ message: "Server error" });
    }
};


module.exports = { registerVendor, loginVendor, logoutVendor, updateVendor, deleteVendor };