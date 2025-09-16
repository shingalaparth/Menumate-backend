# 🍽️ MenuMate Backend (V1 & V2)

This repository contains the **production-ready backend** for **MenuMate**, a QR code-based digital menu and ordering system.
It supports two business models in a single codebase:

* **V1 – Single Shop / Café**
* **V2 – Multi-Vendor Food Court**

---

## ✨ Core Features

### 🏷️ Foundational Features (V1 Core)

Available for both standalone shops and food court stalls:

* **Multi-Role Authentication (JWT)**

  * Customers → Place orders
  * Vendors → Manage shops
  * Super Admin → Full system control
* **Vendor & Multi-Shop Management**
* **Menu Management (CRUD)** with Cloudinary image uploads
* **Real-Time Orders (Socket.IO)**

  * Instant vendor notifications
  * Live customer status updates
* **Supporting Features**

  * Reviews & Ratings
  * Vendor Analytics (sales, revenue, top items)
  * Waiter Call system
  * Manual UPI Payments (upload UPI QR)

---

### 🏢 Food Court Features (V2 Upgrade)

Advanced features to support multi-vendor food courts:

* **Food Court Entity** (container for many shops)
* **Food Court Manager Role** (assigned by Super Admin)
* **Vendor Approval Workflow** → New shops pending until approved
* **Unified Menu Display** → One QR = all shops in that court
* **Unified Cart** → Customers order from multiple shops in one checkout
* **Automatic Order Splitting** → Single customer order → Multiple sub-orders routed to vendors

---

## 🏗️ System Models

### 📍 V1 – Single Shop

* Vendor owns one or more shops
* Shop has categories & menu items
* QR → tied to one shop’s menu
* Cart & checkout → single `Order` document

### 📍 V2 – Food Court

* Super Admin creates a `FoodCourt`
* Vendors’ shops assigned to it
* QR → fetches menus from **all shops** in that court
* Cart → unified, multi-shop
* Checkout →

  * `ParentOrder` (overall bill)
  * Multiple `SubOrders` (per shop kitchen ticket)

---

## 🛠️ Tech Stack

* **Backend Framework**: Node.js + Express.js
* **Database**: MongoDB (Mongoose ODM)
* **Authentication**: JWT
* **Real-Time**: Socket.IO
* **Media Storage**: Cloudinary (Multer for uploads)

---

## 📂 Project Structure

```
menumate-backend/
├── config/
│   ├── cloudinary.js
│   └── database.js
├── controllers/
│   ├── adminController.js
│   ├── analyticsController.js
│   ├── cartController.js
│   ├── categoryController.js
│   ├── foodCourtAdminController.js
│   ├── menuController.js
│   ├── orderController.js
│   ├── publicController.js
│   ├── registrationController.js
│   ├── reviewController.js
│   ├── shopController.js
│   ├── tableController.js
│   ├── userController.js
│   └── vendorController.js
├── middlewares/
│   ├── auth.js
│   ├── auth_user.js
│   └── authorize.js
├── models/
│   ├── cart.js
│   ├── category.js
│   ├── foodCourt.js
│   ├── menuItem.js
│   ├── order.js
│   ├── parentOrder.js
│   ├── review.js
│   ├── shop.js
│   ├── table.js
│   ├── user.js
│   └── vendor.js
├── routes/
│   ├── adminRoutes.js
│   ├── analyticsRoutes.js
│   ├── cartRoutes.js
│   ├── categoryRoutes.js
│   ├── foodCourtAdminRoutes.js
│   ├── menuRoutes.js
│   ├── orderRoutes.js
│   ├── publicRoutes.js
│   ├── registrationRoutes.js
│   ├── reviewRoutes.js
│   ├── shopRoutes.js
│   ├── tableRoutes.js
│   ├── userRoutes.js
│   ├── vendorOrderRoutes.js
│   └── vendorRoutes.js
├── utils/
│   ├── hash.js
│   └── jwt.js
└── app.js
```

---

## 📚 API Endpoints

### 🌍 Public (No Auth)

| Method | Endpoint                         | Description                                         |
| ------ | -------------------------------- | --------------------------------------------------- |
| GET    | `/api/public/menu/:qrIdentifier` | Fetch menu → single shop (V1) or food court (V2)    |
| GET    | `/api/public/foodcourts`         | List all active food courts (for registration form) |
| POST   | `/api/register/shop-vendor`      | Apply for shop (standalone or food court)           |
| POST   | `/api/users/login`               | Customer login/register                             |
| POST   | `/api/vendor/login`              | Vendor / Manager / Admin login                      |

---

### 👤 Customer (JWT Required)

| Method | Endpoint                 | Description                                   |
| ------ | ------------------------ | --------------------------------------------- |
| GET    | `/api/cart`              | Get current cart                              |
| POST   | `/api/cart`              | Add/update item (single shop or unified cart) |
| POST   | `/api/orders`            | Place order (→ Order / Parent+SubOrders)      |
| GET    | `/api/orders`            | Customer’s order history                      |
| POST   | `/api/orders/:id/review` | Submit review for a completed sub-order       |

---

### 🏪 Vendor (JWT Required)

| Method | Endpoint                             | Description                      |
| ------ | ------------------------------------ | -------------------------------- |
| PATCH  | `/api/vendor/profile`                | Update vendor profile            |
| POST   | `/api/shops`                         | Create new shop                  |
| GET    | `/api/shops`                         | Get all shops owned by vendor    |
| PUT    | `/api/shops/:shopId/upi-qr`          | Upload UPI QR                    |
| GET    | `/api/shops/:shopId/orders`          | Get orders/sub-orders of a shop  |
| PATCH  | `/api/vendor/orders/:orderId/status` | Update order/sub-order status    |
| GET    | `/api/shops/:shopId/reviews`         | Get reviews & average rating     |
| GET    | `/api/shops/:shopId/analytics`       | Get sales stats                  |
| ...    | `/api/shops/:shopId/...`             | Full CRUD for categories & items |

---

### 🏢 Food Court Manager (JWT Required)

| Method | Endpoint                            | Description                       |
| ------ | ----------------------------------- | --------------------------------- |
| GET    | `/api/manager/pending-shops`        | List pending shop applications    |
| PATCH  | `/api/manager/shops/:shopId/status` | Approve / Reject shop application |

---

### 👑 Super Admin (JWT Required)

| Method | Endpoint                                       | Description               |
| ------ | ---------------------------------------------- | ------------------------- |
| POST   | `/api/admin/foodcourts`                        | Create new food court     |
| GET    | `/api/admin/foodcourts`                        | List all food courts      |
| PATCH  | `/api/admin/shops/:shopId/assign-foodcourt`    | Assign shop to food court |
| PATCH  | `/api/admin/vendors/:vendorId/appoint-manager` | Appoint vendor as manager |
| POST   | `/api/shops/:shopId/tables`                    | Create new table + QR     |

---

## ⚡ Real-Time Events (Socket.IO)

| Event                 | Direction       | Description                            |
| --------------------- | --------------- | -------------------------------------- |
| `joinShopRoom`        | Client → Server | Vendor joins room to receive orders    |
| `joinUserRoom`        | Client → Server | Customer joins room for status updates |
| `call_waiter_request` | Client → Server | Customer requests waiter               |
| `new_order`           | Server → Client | Push new order/sub-order to vendor     |
| `order_status_update` | Server → Client | Push status updates to customer        |
| `waiter_call_alert`   | Server → Client | Notify vendor of waiter call           |

---

## ⚙️ Installation & Setup

```bash
# Clone & install
git clone https://github.com/shingalaparth/menumate-backend.git
cd menumate-backend
npm install

# Environment
cp .env.example .env
# Add your MongoDB URI, JWT secret, Cloudinary keys, etc.

# Start server
npm run dev
```

### Create Super Admin

1. Register a new vendor (via `/api/vendor/login`).
2. In MongoDB, open the `vendors` collection.
3. Change their `role` from `"vendor"` to `"admin"`.

---

## ✅ Summary

* **V1** → Single shop with independent orders.
* **V2** → Food court with unified cart + auto order splitting.
* Real-time updates, analytics, ratings, UPI payments, and waiter calls.
* One backend, two business models.

