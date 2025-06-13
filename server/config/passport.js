// server/config/passport.js

require('dotenv').config();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// List of admin emails (assign 'admin' role if matched)
const adminEmails = [
  'admin@example.com',
  'towmaintainer@gmail.com'
];

passport.use(new GoogleStrategy({
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    // Use backticks so the env var is interpolated at runtime:
    callbackURL:  `${process.env.BASE_URL}/auth/google/callback`
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Ensure we got an email
      if (!profile.emails || !profile.emails.length) {
        return done(new Error('No email found in Google profile'), null);
      }

      const email = profile.emails[0].value;
      const role  = adminEmails.includes(email) ? 'admin' : 'user';

      // Find existing user
      let user = await User.findOne({ email });
      if (user) {
        return done(null, user);
      }

      // Otherwise create a new one
      user = await User.create({
        username: profile.displayName,
        email,
        phno: '',
        provider: 'google',
        role,
        verified: true
      });
      return done(null, user);

    } catch (err) {
      return done(err, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
