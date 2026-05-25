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

// Enable CORS dynamically based on ALLOWED_ORIGINS env
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(async () => {
    console.log('✅ Connected to Database');
    // Run DB cleanup migration to reset ratings for products with no real reviews
    try {
      const Product = require('./models/Product');
      const result = await Product.updateMany(
        { $or: [{ ratings: { $exists: false } }, { ratings: { $size: 0 } }] },
        { $set: { rating: 0, reviewCount: 0 } }
      );
      console.log(`🧹 Database migration completed: Cleared rating defaults for ${result.modifiedCount} products.`);
    } catch (err) {
      console.error('❌ Database migration error:', err);
    }
  })
  .catch((err) => console.error('❌ DB connection error:', err));

// Session & Passport (for OAuth)
app.use(session({
  secret: process.env.SESSION_SECRET || 'session-secret', // Use a strong secret in production
  resave: false, // Don't save session if unmodified
  saveUninitialized: true // Save new sessions
}));
app.use(passport.initialize());
app.use(passport.session());

// Auth routes (signup, signin, OTP, Google OAuth, etc.)
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

// GET /api/admin/stats - Admin Dashboard Metrics
const Order = require('./models/Order');
const User = require('./models/User');
app.get('/api/admin/stats', jwtAuth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden. Admins only.' });
  }
  try {
    const totalUsers = await User.countDocuments();
    const totalOrders = await Order.countDocuments();
    const revenueResult = await Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    res.json({
      totalUsers,
      totalOrders,
      totalRevenue
    });
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    res.status(500).json({ message: 'Failed to fetch admin stats' });
  }
});

// Root health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'E-commerce API is running' });
});


// Define the port and start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
