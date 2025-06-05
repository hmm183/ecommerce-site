// server/index.js (backend entrypoint)

require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const passport = require('./config/passport'); // Passport setup

// Route imports
const authRoutes = require('./routes/authRoutes'); // Auth-related routes
const jwtAuth = require('./middleware/jwtAuth');   // JWT middleware
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const addressRoutes = require('./routes/addressRoutes');
const selfPhoneRoutes = require('./routes/selfPhoneRoutes');
const giftPhoneRoutes = require('./routes/giftPhoneRoutes');
const PhoneRoutes = require('./routes/phoneRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes'); // ✅ Add this line

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to Database'))
.catch((err) => console.error('DB connection error:', err));

// Session & Passport (for OAuth)
app.use(session({
  secret: process.env.SESSION_SECRET || 'session-secret',
  resave: false,
  saveUninitialized: true
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
app.use('/api/users', userRoutes); // ✅ This enables user management

// Serve React frontend from the build directory
app.use(express.static(path.join(__dirname, '..', 'client', 'build')));
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
