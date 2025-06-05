// server/index.js (backend entrypoint)

require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const passport = require('./config/passport'); // Passport setup
const cors = require('cors'); // Import the cors middleware

// Route imports
const authRoutes = require('./routes/authRoutes'); // Auth-related routes
const jwtAuth = require('./middleware/jwtAuth');    // JWT middleware (make sure this is used correctly on protected routes)
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const addressRoutes = require('./routes/addressRoutes');
const selfPhoneRoutes = require('./routes/selfPhoneRoutes');
const giftPhoneRoutes = require('./routes/giftPhoneRoutes');
const PhoneRoutes = require('./routes/phoneRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes'); // User management routes

const app = express();

// Middleware
app.use(express.json()); // Parses incoming JSON requests
app.use(express.urlencoded({ extended: true })); // Parses incoming URL-encoded requests

// Enable CORS for all origins during development.
// For production, you might want to restrict this to your frontend's domain.
// Example: app.use(cors({ origin: 'https://your-frontend-domain.onrender.com' }));
app.use(cors()); // Use cors middleware

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to Database'))
.catch((err) => console.error('DB connection error:', err));

// Session & Passport (for OAuth)
// These should generally come before API routes that use them
app.use(session({
  secret: process.env.SESSION_SECRET || 'session-secret', // Use a strong secret in production
  resave: false, // Don't save session if unmodified
  saveUninitialized: true // Save new sessions
}));
app.use(passport.initialize()); // Initialize Passport
app.use(passport.session()); // Enable Passport session support

// Auth routes (signup, signin, OTP, etc.)
app.use(authRoutes);

// API routes - these should be defined before the static file serving for the frontend
// Otherwise, the frontend catch-all might intercept API requests
app.use('/api/addresses', addressRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/self-phones', selfPhoneRoutes);
app.use('/api/gift-phones', giftPhoneRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/phone', PhoneRoutes);
app.use('/api/users', userRoutes);

// Serve React frontend from the build directory
// This block should come AFTER all API routes
// Only serve static files if in production mode (e.g., when deployed on Render)
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React build directory
  // path.join(__dirname, '..', 'client', 'build') correctly navigates from server/ to client/build
  app.use(express.static(path.join(__dirname, '..', 'client', 'build')));

  // Handle React routing, return all other requests to React app's index.html
  // This allows client-side routing (e.g., /dashboard, /products) to work
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
  });
}

// Define the port the server will listen on
const PORT = process.env.PORT || 5000; // Use environment variable for port in production
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

