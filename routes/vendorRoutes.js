// routes/vendorRoutes.js

const express = require("express");
const router = express.Router();
const { loginVendor, registerVendor, logoutVendor, updateVendor, deleteVendor } = require("../controllers/vendorController");
const { protect } = require("../middlewares/auth");
const { authorize } = require("../middlewares/authorize");
const Vendor = require("../models/vendor");


// ------------------- 📌 PUBLIC ROUTES ------------------- //

// 👉 Register a new vendor
// No login required
router.post("/register", registerVendor);

// 👉 Login vendor
// Returns JWT token in cookies
router.post("/login", loginVendor);


// ------------------- 📌 PROTECTED ROUTES ------------------- //

router.get("/profile", protect, (req, res) => { 
  res.json({
    message: "Vendor profile fetched successfully",
    vendor: {
      id: req.vendor._id,
      email: req.vendor.email,
      shopName: req.vendor.shopName,
    },
  });
});
router.post("/logout", protect, logoutVendor);
router.patch("/update", protect, updateVendor);
router.delete("/delete", protect, deleteVendor);

// ------------------- 📌 ADMIN ROUTES ------------------- //

router.get("/all", protect, authorize("admin"), async (req, res) => {
  try {
    const vendors = await Vendor.find();
    res.json({ vendors });
  } catch (error) {
  console.error(error);
  res.status(500).json({ message: "Server error", error: error.message });
}
});


module.exports = router;
