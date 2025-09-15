# 🍽️ MenuMate Backend (V1)

This repository contains the complete, feature-rich backend for **MenuMate**, a QR code-based digital menu and ordering system.
This **V1 release** is a production-ready foundation for a **Single Shop / Café** business model, including **real-time capabilities** and a **multi-role architecture**.

---

## ✨ Core Features

### 🔐 Multi-Role Architecture

* Secure, token-based (JWT) authentication for three distinct roles:

  * **Customers**
  * **Vendors**
  * **Super Admin**

### 🏪 Vendor & Multi-Shop Management

* A single vendor account can **own and manage multiple shops**.

### 📖 Full Menu Control

* Complete CRUD (Create, Read, Update, Delete) for **nested menus**, including:

  * Categories
  * Items
  * Image uploads via **Cloudinary**

### ⚡ Real-Time Order Pipeline

* Customers **place orders**.
* Vendors **instantly receive them** on their dashboard via **Socket.IO** (no refresh required).

### 🔄 Two-Way Real-Time Updates

* Vendors update order statuses (**Accepted, Preparing, Completed**).
* Customers get **real-time notifications** of updates.

### 🛠️ Supporting Features

* **QR Code System** → Each table has a unique QR linked to its shop.
* **Reviews & Ratings** → Customers can review completed orders; vendors see ratings & feedback.
* **Vendor Analytics** → Stats like total revenue, today’s sales, and top-selling items.
* **Waiter Call** → Real-time feature for customers to request assistance from their table.
* **Manual UPI Payments** → Vendors can upload their **UPI QR Code** for customers to scan & pay.

---

## 🛠️ Tech Stack

* **Framework**: Node.js, Express.js
* **Database**: MongoDB + Mongoose ODM
* **Authentication**: JSON Web Tokens (JWT)
* **Real-Time**: Socket.IO
* **Image Storage**: Cloudinary
* **File Uploads**: Multer

---

## 📂 Project Structure

```
menumate-backend/
├── config/
│   ├── cloudinary.js
│   └── database.js
├── controllers/
│   ├── analyticsController.js
│   ├── cartController.js
│   ├── categoryController.js
│   ├── menuController.js
│   ├── orderController.js
│   ├── publicController.js
│   ├── reviewController.js
│   ├── shopController.js
│   ├── tableController.js
│   ├── userController.js
│   └── vendorController.js
├── middlewares/
│   ├── auth_user.js      # Protects customer routes
│   ├── auth.js           # Protects vendor routes
│   └── authorize.js      # Authorizes admin-only routes
├── models/
│   ├── cart.js
│   ├── category.js
│   ├── menuItem.js
│   ├── order.js
│   ├── review.js
│   ├── shop.js
│   ├── table.js
│   ├── user.js
│   └── vendor.js
├── routes/
│   ├── analyticsRoutes.js
│   ├── cartRoutes.js
│   ├── categoryRoutes.js
│   ├── menuRoutes.js
│   ├── orderRoutes.js
│   ├── publicRoutes.js
│   ├── reviewRoutes.js
│   ├── shopRoutes.js
│   ├── tableRoutes.js
│   ├── userRoutes.js
│   ├── vendorOrderRoutes.js
│   └── vendorRoutes.js
├── utils/
│   ├── hash.js
│   └── jwt.js
├── .env
├── .env.example
└── app.js
```

---

## 📚 API Endpoints

### \[PUBLIC] – No Authentication Required

| Method   | Endpoint                         | Description                                        |
| -------- | -------------------------------- | -------------------------------------------------- |
| **GET**  | `/api/public/menu/:qrIdentifier` | Fetch shop, table & menu details for a scanned QR. |
| **POST** | `/api/users/login`               | Customer login (name + phone).                     |
| **POST** | `/api/vendor/register`           | Vendor account creation.                           |
| **POST** | `/api/vendor/login`              | Vendor login.                                      |

---

### \[CUSTOMER] – Requires Customer JWT

| Method     | Endpoint                      | Description                          |
| ---------- | ----------------------------- | ------------------------------------ |
| **GET**    | `/api/cart`                   | Get current user’s cart.             |
| **POST**   | `/api/cart`                   | Add or update an item in cart.       |
| **DELETE** | `/api/cart/items/:menuItemId` | Remove item from cart.               |
| **POST**   | `/api/orders`                 | Place order from cart.               |
| **GET**    | `/api/orders`                 | Get customer order history.          |
| **GET**    | `/api/orders/:id`             | Get details of one order.            |
| **POST**   | `/api/orders/:id/review`      | Submit review for a completed order. |

---

### \[VENDOR] – Requires Vendor JWT

| Method     | Endpoint                                    | Description                                |
| ---------- | ------------------------------------------- | ------------------------------------------ |
| **PATCH**  | `/api/vendor/profile`                       | Update vendor profile.                     |
| **POST**   | `/api/shops`                                | Create a new shop.                         |
| **GET**    | `/api/shops`                                | Get all shops owned by vendor.             |
| **PUT**    | `/api/shops/:shopId/upi-qr`                 | Upload UPI QR for a shop.                  |
| **POST**   | `/api/shops/:shopId/categories`             | Add category to shop.                      |
| **PUT**    | `/api/shops/:shopId/categories/:categoryId` | Update category.                           |
| **DELETE** | `/api/shops/:shopId/categories/:categoryId` | Delete category.                           |
| **POST**   | `/api/shops/:shopId/menu`                   | Add menu item with image.                  |
| **PUT**    | `/api/shops/:shopId/menu/:itemId`           | Update menu item.                          |
| **DELETE** | `/api/shops/:shopId/menu/:itemId`           | Delete menu item.                          |
| **GET**    | `/api/shops/:shopId/orders`                 | Get all orders of shop (filter by status). |
| **PATCH**  | `/api/vendor/orders/:orderId/status`        | Update order status.                       |
| **GET**    | `/api/shops/:shopId/reviews`                | Get reviews & average rating.              |
| **GET**    | `/api/shops/:shopId/analytics`              | Get sales & top items.                     |

---

### \[ADMIN] – Requires Admin JWT

| Method   | Endpoint                    | Description                |
| -------- | --------------------------- | -------------------------- |
| **POST** | `/api/shops/:shopId/tables` | Create new table with QR.  |
| **GET**  | `/api/shops/:shopId/tables` | Get all tables for a shop. |

---

## ⚡ Real-Time Events (Socket.IO)

| Event                 | Direction       | Emitter           | Listener          | Data Payload            | Description                                    |
| --------------------- | --------------- | ----------------- | ----------------- | ----------------------- | ---------------------------------------------- |
| `joinShopRoom`        | Client → Server | Vendor Frontend   | Server            | `shopId`                | Vendor joins private room for shop orders.     |
| `joinUserRoom`        | Client → Server | Customer Frontend | Server            | `userId`                | Customer joins private room for order updates. |
| `call_waiter_request` | Client → Server | Customer Frontend | Server            | `{shopId, tableNumber}` | Customer requests assistance.                  |
| `new_order`           | Server → Client | Server            | Vendor Frontend   | `{order}`               | New order pushed to vendor instantly.          |
| `order_status_update` | Server → Client | Server            | Customer Frontend | `{order}`               | Live status update for customer.               |
| `waiter_call_alert`   | Server → Client | Server            | Vendor Frontend   | `{tableNumber, time}`   | Waiter call alert for vendor.                  |

---

## ⚙️ Installation & Setup

```bash
# Clone the repository
git clone https://github.com/shingalaparth/Menumate-backend.git
cd Menumate-backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Fill in MongoDB URI, JWT secret, Cloudinary keys

# Create first Admin
npm run dev
# Register vendor via Postman → Update role to "admin" in MongoDB
```

Start server:

```bash
npm run dev
```

The server runs on:
👉 `http://localhost:3000` with real-time support.




