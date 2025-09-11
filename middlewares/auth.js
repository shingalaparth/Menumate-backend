// middlewares/auth.js

const jwt = require("jsonwebtoken");
const Vendor = require("../models/vendor");

// Middleware to protect routes
const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Get token from cookie or header
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1]; // Get after "Bearer"
    }

    // 2. If no token found
    if (!token) {
      return res.status(401).json({ message: "Not authorized, token missing" });
    }

    // 3. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Find vendor in DB and attach to req
    const vendor = await Vendor.findById(decoded.id);
    if (!vendor) {
      return res.status(401).json({ message: "Vendor not found" });
    }

    req.vendor = vendor; // ✅ Now routes can use req.vendor
    next(); // Pass control to next middleware/route
  } catch (error) {
    console.error("Auth error:", error);
    res.status(401).json({ message: "Not authorized, invalid token" });
  }
};

module.exports = { protect };
