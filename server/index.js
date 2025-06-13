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
const orderRoutes = require('./routes/orderRoutes'); // ✅ This was missing earlier
const userRoutes = require('./routes/userRoutes'); // User management routes

const app = express();

// Middleware
app.use(express.json()); // Parses incoming JSON requests
app.use(express.urlencoded({ extended: true })); // Parses incoming URL-encoded requests

// Enable CORS for all origins during development.
// For production, you might want to restrict this to your frontend's domain.
app.use(cors()); // Use cors middleware

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to Database'))
.catch((err) => console.error('❌ DB connection error:', err));

// Session & Passport (for OAuth)
app.use(session({
  secret: process.env.SESSION_SECRET || 'session-secret', // Use a strong secret in production
  resave: false, // Don't save session if unmodified
  saveUninitialized: true // Save new sessions
}));
app.use(passport.initialize());
app.use(passport.session());

// Auth routes (signup, signin, OTP, etc.)
app.use(authRoutes);

// API routes
app.use('/api/addresses', addressRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/self-phones', selfPhoneRoutes);
app.use('/api/gift-phones', giftPhoneRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/phone', PhoneRoutes);
app.use('/api/users', userRoutes);

// Serve React frontend from the build directory
if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
  app.use(express.static(path.join(__dirname, '..', 'client', 'build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
  });
}

// Define the port and start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
