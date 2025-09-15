// app.js

const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/database");

const http = require('http');
const { Server } = require("socket.io");

// Import Routes
const publicRoutes = require("./routes/publicRoutes");
const userRoute = require("./routes/userRoutes");
const vendorRoute = require("./routes/vendorRoutes");
const shopRoutes = require("./routes/shopRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const vendorOrderRoutes = require("./routes/vendorOrderRoutes");

dotenv.config({ path: ".env" });

const app = express();

// socket.io setup
const server = http.createServer(app);
// We add CORS configuration to allow your frontend to connect.
const io = new Server(server, {
  cors: {
    origin: "*", // In production, you should restrict this to your frontend's URL
    methods: ["GET", "POST"]
  }
});

// Middlewares

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use((req, res, next) => {
  req.io = io;
  next();
}); 

// Database 
connectDB();

// Routes
app.get("/", (req, res) => res.json({
  success: true,
  message: "Welcome to MenuMate API v2 (Multi-Shop Ready!)"
}));

// Mount the main routers
app.use("/api/public", publicRoutes)

app.use("/api/users", userRoute);

app.use("/api/vendor", vendorRoute);
app.use("/api/vendor/orders", vendorOrderRoutes);

app.use("/api/shops", shopRoutes);

app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

//SOCKET.IO CONNECTION LOGIC ---
io.on('connection', (socket) => {
  console.log('✅ A client connected:', socket.id);
 
  // Logic for a vendor to join a room specific to their shop
  socket.on('joinShopRoom', (shopId) => {
    socket.join(shopId);
    console.log(`💻 Client ${socket.id} joined room ${shopId}`);
  });

  // --- NEW LOGIC for customers to join their own private room ---
  socket.on('joinUserRoom', (userId) => {
    socket.join(userId);
    console.log(`👤 Customer client ${socket.id} joined room ${userId}`);
  }); 
 
  // Listen for a customer calling a waiter
  socket.on('call_waiter_request', (data) => {
    // 'data' will be an object sent from the customer's frontend,
    // e.g., { shopId: '...', tableNumber: 'Table 5', tableId: '...' }

    if (data.shopId && data.tableNumber) {
      // Forward the alert to the specific shop's room
      io.to(data.shopId).emit('waiter_call_alert', {
        tableNumber: data.tableNumber,
        tableId: data.tableId,
        time: new Date()
      });
      console.log(`🔔 Emitted 'waiter_call_alert' for table ${data.tableNumber} to room ${data.shopId}`);
    }
  });


  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});


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
server.listen(PORT, () => // Use 'server', not 'app'
  console.log(`🚀 Server with real-time support running on http://localhost:${PORT}`)
);