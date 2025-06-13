require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const cors = require('cors');
const passport = require('./config/passport');

// Route imports
const authRoutes = require('./routes/authRoutes');
const jwtAuth = require('./middleware/jwtAuth');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const addressRoutes = require('./routes/addressRoutes');
const selfPhoneRoutes = require('./routes/selfPhoneRoutes');
const giftPhoneRoutes = require('./routes/giftPhoneRoutes');
const PhoneRoutes = require('./routes/phoneRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to Database'))
.catch((err) => console.error('❌ DB connection error:', err));

// Session & Passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'session-secret',
  resave: false,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

// API Routes
app.use(authRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/self-phones', selfPhoneRoutes);
app.use('/api/gift-phones', giftPhoneRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/phone', PhoneRoutes);
app.use('/api/users', userRoutes);

// === Serve React Frontend (after API routes) ===
// Ensure it's available in both production and Render environments
const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER;
if (isProduction) {
  const buildPath = path.join(__dirname, '..', 'client', 'build');
  app.use(express.static(buildPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
