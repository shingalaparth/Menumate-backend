// middlewares/auth_user.js
const jwt = require("jsonwebtoken");
const User = require("../models/user"); // Use the User model

const protectUser = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({ success: false, message: "Not authorized, no token" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Find the user by ID from the token and attach it to the request
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ success: false, message: "User not found" });
        }
        
        req.user = user; // Attach user object to req
        next();

    } catch (error) {
        console.error("User Auth error:", error);
        res.status(401).json({ success: false, message: "Not authorized, token failed" });
    }
};

module.exports = { protectUser };