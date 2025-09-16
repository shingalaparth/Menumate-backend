// middlewares/authorize.js

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.vendor.role)) {
            return res.status(403).json({ success: false, message: "Access denied. You do not have permission for this action." });
        }
        next();
    };
};

// This function checks if the vendor is a Food Court Manager
const authorizeManager = (req, res, next) => {
    // We check the 'managesFoodCourt' field on the vendor object
    if (!req.vendor.managesFoodCourt) {
        return res.status(403).json({ success: false, message: "Access denied. You are not a manager of any food court." });
    }
    // If they are a manager, we attach their foodCourtId to the request for easy access in the controller
    req.foodCourtId = req.vendor.managesFoodCourt;
    next();
}

module.exports = { authorize, authorizeManager };
