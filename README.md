**E-Commerce Site**

A full-stack e-commerce web application built with React (frontend) and Node.js/Express (backend), deployed on Render. This project provides user authentication, product browsing, shopping cart, order placement, and phone/address verification via SMS/email.

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
6. [Deployment](#deployment)
7. [Contributing](#contributing)
8. [License](#license)

---

## Features

* User registration & login with JWT authentication
* OAuth 2.0 login (Google OAuth2 integration)
* Phone number verification (self & gift) via OTP (Fast2SMS integration)
* Email notifications for order confirmations
* CRUD operations for products, cart, orders, addresses
* Separate API routes for modularity (auth, OAuth, products, cart, orders, phone verification, address management)
* Logger utility for centralized request/error logging
* Responsive React frontend with routing and state management
* Deployment-ready configuration for Vercel

---

## Tech Stack

* **Frontend:** React, React Router, Context API, Fetch API
* **Backend:** Node.js, Express.js, MongoDB (Mongoose)
* **Auth:** Passport.js (local strategy & Google OAuth2), JSON Web Tokens (JWT)
* **SMS:** Fast2SMS API
* **Email:** Nodemailer
* **Deployment:** Vercel (serverless functions)

---

## Project Structure

```
└── ecommerce-site-main/
    ├── client/               # React frontend
    │   ├── public/           # Static assets
    │   └── src/              # React components & pages
    ├── server/               # Express backend
    │   ├── config/           # Passport configuration
    │   ├── controllers/      # Route handlers
    │   ├── middleware/       # JWT auth middleware
    │   ├── models/           # Mongoose schemas
    │   ├── routes/           # Express routes
    │   ├── services/         # SMS & email services
    │   ├── utils/            # Logger & helpers
    │   └── index.js          # Entry point
    ├── .gitignore
    ├── vercel.json           # Vercel configuration
    └── README.md             # Project overview
```

---

## Getting Started

### Prerequisites

* Node.js >= 14.x
* npm or yarn
* MongoDB instance (local or Atlas)

### Environment Variables

Create a `.env` file in the `server/` directory with the following variables:

```
MONGODB_URI=<Your MongoDB connection string>
JWT_SECRET=<Your JWT secret key>
GOOGLE_CLIENT_ID=<Your Google OAuth Client ID>
GOOGLE_CLIENT_SECRET=<Your Google OAuth Client Secret>
FAST2SMS_API_KEY=<Your Fast2SMS API key>
EMAIL_HOST=<SMTP host>
EMAIL_PORT=<SMTP port>
EMAIL_USER=<SMTP username>
EMAIL_PASS=<SMTP password>
```

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/ecommerce-site-main.git
   cd ecommerce-site-main
   ```

2. Install server dependencies:

   ```bash
   cd server
   npm install
   ```

3. Install client dependencies:

   ```bash
   cd ../client
   npm install
   ```

### Running Locally

1. Start the backend server (runs on port 5000 by default):

   ```bash
   cd server
   npm run dev
   ```

2. Start the React frontend (runs on port 3000 by default):

   ```bash
   cd client
   npm start
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the app.

---

## API Reference

### Auth Routes

* `POST /api/auth/register` – Register a new user
* `POST /api/auth/login` – Login and receive JWT

### Product Routes

* `GET /api/products` – List all products
* `GET /api/products/:id` – Get product details
* `POST /api/products` – Create a product (protected)
* `PUT /api/products/:id` – Update product (protected)
* `DELETE /api/products/:id` – Delete product (protected)

### Cart Routes

* `GET /api/cart` – Get current user's cart (protected)
* `POST /api/cart` – Add item to cart (protected)
* `PUT /api/cart/:itemId` – Update cart item (protected)
* `DELETE /api/cart/:itemId` – Remove cart item (protected)

### Order Routes

* `GET /api/orders` – Get user's orders (protected)
* `POST /api/orders` – Create a new order (protected)

### Phone Verification

* `POST /api/self-phones` – Verify user's phone number
* `POST /api/gift-phones` – Verify gift phone number

### Address Routes

* `GET /api/addresses` – List user addresses (protected)
* `POST /api/addresses` – Add a new address (protected)

---

## Deployment

This project is configured for deployment on Render. To deploy:

1. Push your code to a Git repository (GitHub/GitLab).
2. Sign up or log in to [Render](https://render.com) and create a new **Web Service** for the backend.
3. Connect your repository and select the `server` directory.
4. In **Environment** settings, add the same variables from the **Environment Variables** section.
5. Set the **Build Command** to `npm install` and the **Start Command** to `npm run dev` (or `npm start` for production).
6. Set up the website
---

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
