// server/index.js (backend entrypoint)
require('dotenv').config(); // Loads environment variables from .env file (for local development)
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const passport = require('./config/passport');       // Passport setup
const cors = require('cors'); // Import cors middleware

// --- Route Imports ---
const authRoutes = require('./routes/authRoutes');   // Auth-related routes
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const addressRoutes = require('./routes/addressRoutes');
const selfPhoneRoutes = require('./routes/selfPhoneRoutes');
const giftPhoneRoutes = require('./routes/giftPhoneRoutes');
const PhoneRoutes = require('./routes/phoneRoutes'); // Corrected variable name if needed
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');   // User management routes

const app = express();

// --- Middleware ---
app.use(express.json()); // To parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded request bodies

// Enable CORS for all origins (useful for local development, Vercel handles it for same-domain)
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to Database'))
  .catch((err) => console.error('DB connection error:', err));

// Session & Passport (for OAuth flows, if used)
app.use(session({
  secret: process.env.SESSION_SECRET || 'session-secret-fallback-key', // Use a strong secret in production
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production (HTTPS)
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// --- API Routes ---
// It's crucial that your API routes are defined *before* the static file serving
// so that API requests don't get caught by the '*' route.
app.use(authRoutes); // OAuth/local auth routes
app.use('/api/addresses', addressRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/self-phones', selfPhoneRoutes);
app.use('/api/gift-phones', giftPhoneRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/phone', PhoneRoutes); // Ensure PhoneRoutes matches your import name
app.use('/api/users', userRoutes);

// --- Serve React Frontend in Production ---
// This block ensures that your Express server serves the React build
// only when deployed (NODE_ENV is 'production' on Vercel).
// During local development, React's own dev server handles the frontend.
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the 'public' directory within the server folder
  // This 'public' directory is where the vercel.json buildCommand moves the React build.
  app.use(express.static(path.join(__dirname, 'public')));

  // For any other GET request (not an API call), serve the React app's index.html
  // This allows client-side routing (React Router) to work.
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
} else {
  // Optional: In development, you might want a message indicating API is ready
  app.get('/', (req, res) => {
    res.send('Backend API is running in development mode. Access frontend via React dev server.');
  });
}

// --- Basic Error Handling (Optional but Recommended) ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke on the server!');
});


// --- Start the Server ---
const PORT = process.env.PORT || 5000; // Vercel provides a PORT environment variable
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  if (process.env.NODE_ENV === 'production') {
    console.log('Serving React app from:', path.join(__dirname, 'public'));
  }
});