// app.js

const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");

const connectDB = require("./config/database");


// Import Routes
const qruserRoute = require("./routes/qruserRoutes");
const vendorRoute = require("./routes/vendorRoutes");

const categoryRoutes = require("./routes/categoryRoutes");
const menuRoutes = require("./routes/menuRoutes");

dotenv.config({ path: ".env" });

const app = express();

// Middlewares
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Database
connectDB();

// Routes
app.get("/", (req, res) => res.json({
  success: true,
  message: "MenuMate API with Image Upload Ready!",
  endpoints: {
    categories: "/api/categories",
    menu: "/api/menu",
    vendors: "/api/vendor"
  }
}));

app.use("/api/qruser", qruserRoute);
app.use("/api/vendor", vendorRoute);
app.use("/api/categories", categoryRoutes);
app.use("/api/menu", menuRoutes);


// Image upload error handling
app.use((err, req, res, next) => {
  console.error(err.stack);

  // Handle multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large. Maximum size is 5MB'
    });
  } 

  if (err.message === 'Only image files are allowed!') {
    return res.status(400).json({
      success: false,
      message: 'Only image files are allowed'
    });
  }

  // Handle Cloudinary errors
  if (err.message && err.message.includes('cloudinary')) {
    return res.status(400).json({
      success: false,
      message: 'Image upload failed. Please try again.'
    });
  }

  res.status(500).json({
    success: false,
    message: 'Server Error'
  });
});



// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);