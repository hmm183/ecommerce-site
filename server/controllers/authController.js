require('dotenv').config();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Analytics = require('../models/Analytics');
const Log = require('../models/Log');
const { sendOTPEmail, sendPasswordEmail } = require('../services/emailService');

// In-memory store for pending signups (email → {name, phno, password, otp})
const tempSignups = {};

// Helper: cooldown time in ms
const OTP_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes

exports.requestOTP = async (req, res) => {
  const { name, email, phno, password } = req.body;

  if (!name || !email || !password || !phno) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Step 1: Check for existing registered users
    const existingUser = await User.findOne({
      $or: [{ email }, { phno }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email
          ? 'Email already registered'
          : 'Phone number already registered'
      });
    }

    // Step 2: Check if OTP was recently sent
    const existingSignup = tempSignups[email];
    if (existingSignup?.lastSentAt) {
      const timeSinceLast = Date.now() - existingSignup.lastSentAt;
      if (timeSinceLast < OTP_COOLDOWN_MS) {
        const minutesLeft = Math.ceil((OTP_COOLDOWN_MS - timeSinceLast) / 60000);
        return res.status(429).json({
          message: `Please wait ${minutesLeft} more minute(s) before requesting another OTP.`
        });
      }
    }

    // Step 3: Generate OTP and store temp data
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    tempSignups[email] = {
      name, email, phno, password, otp,
      lastSentAt: Date.now() // store cooldown timestamp
    };

    await sendOTPEmail(email, otp);

    return res.status(200).json({
      message: 'OTP sent to your email. Please verify to complete signup.'
    });
  } catch (error) {
    console.error('Error in OTP request:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /verify-otp
exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  const pending = tempSignups[email];
  if (!pending) {
    return res.status(400).json({ message: 'No pending signup found for this email' });
  }
  if (pending.otp !== otp) {
    return res.status(400).json({ message: 'Invalid OTP' });
  }
  // Create user
  const hashedPassword = await bcrypt.hash(pending.password, 10);
  try {
    const user = await User.create({
      username: pending.name,
      email: pending.email,
      phno: pending.phno,
      password: hashedPassword,
      provider: 'local',
      role: 'user',
      verified: true
    });
    delete tempSignups[email];  // cleanup

    // Generate JWT
    const token = jwt.sign({ id: user._id, role: user.role,banned: user.banned },
                            process.env.JWT_SECRET || 'jwt-secret',
                            { expiresIn: '1h' });
    res.status(201).json({ message: 'User created successfully', token });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /signin
exports.signIn = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !user.verified) {
      return res.status(400).json({ message: 'Invalid credentials or account not verified' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    // Successful login
    const token = jwt.sign({ id: user._id, role: user.role,banned: user.banned },
                           process.env.JWT_SECRET || 'jwt-secret',
                           { expiresIn: '1h' });
    // Log analytics
    await new Analytics({ userId: user._id, actions: ['logged_in'] }).save();
    res.json({ message: 'Sign-in successful', token });
  } catch (error) {
    console.error('Sign-in error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /auth/google (Passport handles redirect)

// In your authController.js file

// GET /auth/google/callback
exports.googleCallback = async (req, res) => {
  // Passport has attached user to req.user
  let user = req.user;

  // If first-time OAuth (no local password), generate one and email it
  if (!user.password) {
    const randomPassword = crypto.randomBytes(5).toString('hex');
    user.password = await bcrypt.hash(randomPassword, 10);
    await user.save();
    try {
      await sendPasswordEmail(user.email, randomPassword);
    } catch (e) {
      console.error('Error sending password email:', e);
    }
  }

  // Issue JWT token
  // Ensure that user.role and user.banned are correctly populated from your User model
  const token = jwt.sign({ id: user._id, role: user.role, banned: user.banned },
                          process.env.JWT_SECRET || 'jwt-secret',
                          { expiresIn: '1h' });

  // *** CRUCIAL CHANGE: Determine redirect URL based on user role ***
  let redirectUrl = `/shop`; // Default redirect for non-admin users

  if (user.role === 'admin') { // Check the user's role obtained from Passport/database
    redirectUrl = `/admin`;   // Redirect to admin panel if user is an admin
  }

  // Redirect to the determined URL with the token as a query parameter
  res.redirect(`${redirectUrl}?token=${token}`); // <--- Use the dynamic redirectUrl
};


// POST /logout
exports.logout = (req, res) => {
  // Client simply deletes token; optionally handle server-side cleanup here
  res.json({ message: 'User logged out successfully' });
};
