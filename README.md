# WOT - World of Tshirts (E-Commerce Platform)

A full-stack, premium e-commerce platform built with **React** (frontend) and **Node.js/Express** (backend). The application boasts a sleek, glassmorphic dark theme, multi-device shopping cart persistence, dynamic search/filter chips, real-time size & color variant stock management, Cloudinary-based product uploads, a mock Razorpay payment gateway, and transactional order confirmation emails.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Getting Started](#getting-started)
   * [Prerequisites](#prerequisites)
   * [Environment Variables](#environment-variables)
   * [Installation](#installation)
   * [Running Locally](#running-locally)
5. [API Reference](#api-reference)
6. [Responsive Design & Aesthetics](#responsive-design--aesthetics)
7. [License](#license)

---

## Features

### 🛒 E-Commerce & Checkout Flow
* **Persistent Shopping Cart**: Syncs dynamically across different devices utilizing MongoDB and token validation.
* **Variant-Level Stock Alerts**: Enforces and displays stock levels per size/color combination (e.g., "Only 5 left for M / Blue") and automatically disables adding to cart if a selected variant is sold out.
* **Mock Razorpay Checkout**: Fully integrated with the official Razorpay Checkout SDK for simulated test transactions.
* **Automated Confirmations**: Sends beautiful order receipts via Nodemailer upon successful payment checkout.

### 📊 Admin Control Dashboard
* **Sales Analytics**: Aggregates and displays Total Revenue, Order Counts, and Registered Customers.
* **Inventory Control & Variant Stock Grid**: Dynamically generates size/color combinational inputs for configuring stock individually. The global stock value is auto-computed from the sum of variants.
* **Cloudinary Image Uploader**: Allows uploading of product images directly to Cloudinary with secure signature validation.

### 🛡️ Authentication & Verification
* **Dual-Method Login**: Supports JWT auth (local strategy) and Google OAuth2 integration.
* **OTP Profile Updates**: Requires OTP email verification when updating critical profile settings (phone/email) and secure password change forms.
* **Banning System**: Enables admin to toggle access bans on users, immediately redirecting them to an Access Denied landing page.

---

## Tech Stack

* **Frontend**: React (Context API, React Router, ChartJS), Vanilla CSS (Glassmorphism & HSL variables).
* **Backend**: Node.js, Express.js, MongoDB (Mongoose schemas), Passport.js (JWT & Google OAuth2).
* **Integrations**: Cloudinary (Image management), Razorpay Checkout SDK, Nodemailer (SMTP transactional emails).
* **Process Monitor**: Nodemon (automatic backend hot-reloading).

---

## Project Structure

```
├── client/                     # React Single Page App
│   ├── public/                 # Favicons and HTML entry points
│   └── src/
│       ├── components/         # Unified navigation headers, auth modals
│       ├── context/            # Cart and Auth providers
│       ├── pages/              # Shop, Product Detail, Profile, Admin Panels
│       └── utils/              # Dynamic URL resolution helpers
│
└── server/                     # Node.js REST API
    ├── config/                 # Passport and Cloudinary connection instances
    ├── controllers/            # Route controllers (auth, cart, orders, products)
    ├── middleware/             # JWT and role restriction validation guards
    ├── models/                 # Mongoose collection models (Product, Order, User)
    ├── routes/                 # Express routing mounts
    ├── services/               # SMTP email verification handlers
    └── index.js                # App entrypoint & Database migration triggers
```

---

## Getting Started

### Prerequisites

* Node.js >= 16.x
* MongoDB (Local instance or Atlas Connection URI)

### Environment Variables

#### Backend Server (`server/.env`)
Create a `.env` file in the `server/` directory:
```env
PORT=5000
MONGODB_URI=mongodb+srv://...  # Or local mongodb://localhost:27017/wot
JWT_SECRET=your_jwt_secret_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Cloudinary Config
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Service (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# CORS Settings
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5000
```

#### Frontend Client (`client/.env`)
Create a `.env` file in the `client/` directory:
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_RAZORPAY_KEY_ID=rzp_test_StDPzq5fFb8ioX
```

### Installation

1. Install dependencies for the server:
   ```bash
   cd server
   npm install
   ```

2. Install dependencies for the client:
   ```bash
   cd ../client
   npm install
   ```

### Running Locally

1. Launch the server (hot-reloaded via nodemon on port 5000):
   ```bash
   cd server
   npm run dev
   ```

2. Launch the React app (runs on port 3000):
   ```bash
   cd client
   npm start
   ```

---

## API Reference

### 🔐 Authentication
* `POST /api/auth/register` – Registers a new account
* `POST /api/auth/login` – Logs in and issues JWT
* `GET /api/auth/google` – Triggers Google OAuth callback login flow

### 👤 Profile & Users
* `GET /api/users/profile` – Fetches profile details
* `POST /api/users/profile/request-otp` – Requests email OTP
* `POST /api/users/profile/verify-update` – Verifies email/phone changes
* `POST /api/users/profile/change-password` – Secure password update

### 👕 Product Catalog & Ratings
* `GET /api/products` – Lists all products
* `GET /api/products/:id` – Fetches product detail
* `POST /api/products/:id/rate` – Rate/review product (protected)
* `POST /api/products` – Creates new product (Admin only)
* `PUT /api/products/:id` – Updates product details (Admin only)
* `DELETE /api/products/:id` – Deletes product (Admin only)
* `POST /api/products/upload` – Uploads image to Cloudinary (Admin only)

### 🛒 Shopping Cart
* `GET /api/cart` – Fetches persisting cart items (protected)
* `POST /api/cart` – Adds product variant to cart (protected)
* `PUT /api/cart/:itemId` – Updates quantity (protected)
* `DELETE /api/cart/:itemId` – Removes variant from cart (protected)

### 📦 Orders & Management
* `POST /api/orders` – Submits order on payment success (protected)
* `GET /api/orders/me` – Fetches customer order history (protected)
* `GET /api/orders` – Lists all order logs (Admin only)
* `PUT /api/orders/:id/status` – Updates order delivery status (Admin only)
* `GET /api/admin/stats` – Aggregates analytics totals (Admin only)

---

## Responsive Design & Aesthetics

* **Premium Layouts**: Implemented glassmorphism styling with backdrop blur filters, responsive fonts, and custom HSL gradients.
* **Mobile Slide-Out Drawer**: The navigation header collapses on viewports below `768px` into a responsive overlay drawer with hardware-accelerated drawer transitions (`translateX`).
* **Table Column Flex Wrapping**: Custom media queries convert tabular data into card stacking viewports on mobile devices. Long emails and descriptions use `word-break: break-all` to ensure zero card horizontal overflows.
