const Vendor = require("../models/vendor");
const { comparePassword, hashPassword } = require("../utils/hash"); // used by login
const { createJWT } = require("../utils/jwt");

// REGISTER VENDOR
const registerVendor = async (req, res) => {
  try {
    // include name here — must match your schema
    const { name, email, number, shopName, password } = req.body;

    // 1) Validate input (must include name as schema requires it)
    if (!name || !email || !number || !shopName || !password) {
      return res.status(400).json({ message: "Please provide name, email, number, shopName and password" });
    }

    // 2) Check duplicate (email or number)
    const existingVendor = await Vendor.findOne({ $or: [{ email }, { number }] });
    if (existingVendor) {
      return res.status(400).json({ message: "Vendor already exists with this email or number" });
    }

    // 3) Create vendor (pass plain password — schema pre('save') will hash it)
    const newVendor = await Vendor.create({
      name,
      email,
      number,
      shopName,
      password
    });

    // 4) Create token
    const token = createJWT({
      id: newVendor._id,
      email: newVendor.email,
      shopName: newVendor.shopName
    });

    // 5) Respond
    return res.status(201).json({
      message: "Vendor registered successfully",
      token,
      vendor: {
        id: newVendor._id,
        name: newVendor.name,
        email: newVendor.email,
        number: newVendor.number,
        shopName: newVendor.shopName
      }
    });

  } catch (error) {
    console.error("Vendor registration error:", error);

    // Duplicate key (unique index) — MongoDB error code 11000
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({ message: `${field} already exists` });
    }

    // Mongoose validation error — send readable messages to client
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: "Validation failed", errors });
    }

    // Fallback
    return res.status(500).json({ message: "Server error" });
  }
};


// LOGIN (unchanged, but exporting together)
const loginVendor = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

    const vendor = await Vendor.findOne({ email }).select("+password");
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    const isMatch = await comparePassword(password, vendor.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

    const token = createJWT({ id: vendor._id, email: vendor.email, shopName: vendor.shopName });

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000
      })
      .status(200)
      .json({
        message: "Login successful",
        token,
        vendor: { id: vendor._id, name: vendor.name, email: vendor.email, shopName: vendor.shopName }
      });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error, please try again later" });
  }
};

// LOGOUT VENDOR
const logoutVendor = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production"
  });
  res.status(200).json({ message: "Logged out successfully" });
};


// Update vedor
const updateVendor = async (req, res) => {
  try {
    const { name, number, shopName, password } = req.body;

    // find vendor by ID from req.vendor (set by protect middleware)
    const vendor = await Vendor.findById(req.vendor._id);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    // update fields
    if (name) vendor.name = name;
    if (number) vendor.number = number;
    if (shopName) vendor.shopName = shopName;
    if (password) vendor.password = await hashPassword(password);

    await vendor.save();

    res.status(200).json({ message: "Vendor updated successfully", vendor });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete vendor
const deleteVendor = async (req, res) => {
   try {
    await Vendor.findByIdAndDelete(req.vendor._id);
    res.clearCookie("token");
    res.status(200).json({ message: "Vendor account deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { registerVendor, loginVendor, logoutVendor, updateVendor, deleteVendor };
