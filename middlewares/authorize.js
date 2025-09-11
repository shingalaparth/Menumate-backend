// middlewares/authorize.js

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.vendor.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};

module.exports = { authorize };
