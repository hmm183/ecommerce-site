require('dotenv').config();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// List of admin emails (assign 'admin' role if matched)
const adminEmails = ['admin@example.com', 'towmaintainer@gmail.com'];

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,          
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      if (!profile.emails || !profile.emails.length) {
        return done(new Error('No email found in Google profile'), null);
      }
      const email = profile.emails[0].value;
      const role = adminEmails.includes(email) ? 'admin' : 'user';

      let user = await User.findOne({ email });
      if (user) {
        // Existing user
        return done(null, user);
      }
      // Create new user (OAuth users are marked verified)
      user = await User.create({
        username: profile.displayName,
        email: email,
        phno: '',
        provider: 'google',
        role: role,
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
