const User = require('../models/User');
const { sendOTPEmail } = require('../services/emailService');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const pendingProfileUpdates = {};
const OTP_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};

exports.requestProfileUpdateOTP = async (req, res) => {
  const { username, email, phno } = req.body;
  const userId = req.user.id;

  if (!username || !email || !phno) {
    return res.status(400).json({ message: 'Name, email, and phone number are required' });
  }

  try {
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Google/OAuth users cannot edit their email
    if (currentUser.provider === 'google') {
      if (email !== currentUser.email) {
        return res.status(400).json({ message: 'Google users cannot change their email address' });
      }
    }

    // Check if new email is already taken by another user
    if (email !== currentUser.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: 'Email is already taken by another account' });
      }
    }

    // Check if new phone number is already taken by another user
    if (phno !== currentUser.phno) {
      const phnoExists = await User.findOne({ phno });
      if (phnoExists) {
        return res.status(400).json({ message: 'Phone number is already taken by another account' });
      }
    }

    // Check OTP cooldown
    const existingPending = pendingProfileUpdates[userId];
    if (existingPending?.lastSentAt) {
      const timeSinceLast = Date.now() - existingPending.lastSentAt;
      if (timeSinceLast < OTP_COOLDOWN_MS) {
        const minutesLeft = Math.ceil((OTP_COOLDOWN_MS - timeSinceLast) / 60000);
        return res.status(429).json({
          message: `Please wait ${minutesLeft} more minute(s) before requesting another OTP.`
        });
      }
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in-memory
    pendingProfileUpdates[userId] = {
      username,
      email,
      phno,
      otp,
      lastSentAt: Date.now()
    };

    // Send OTP email (to the target email)
    await sendOTPEmail(email, otp);

    res.status(200).json({ message: `OTP sent to ${email}. Please verify to apply changes.` });
  } catch (err) {
    console.error('Error requesting profile OTP:', err);
    res.status(500).json({ message: 'Server error requesting profile OTP' });
  }
};

exports.verifyProfileUpdate = async (req, res) => {
  const { otp } = req.body;
  const userId = req.user.id;

  const pending = pendingProfileUpdates[userId];
  if (!pending) {
    return res.status(400).json({ message: 'No pending profile update found. Request OTP first.' });
  }

  if (pending.otp !== otp) {
    return res.status(400).json({ message: 'Invalid OTP' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Apply updates
    user.username = pending.username;
    if (user.provider !== 'google') {
      user.email = pending.email;
    }
    user.phno = pending.phno;

    await user.save();
    delete pendingProfileUpdates[userId]; // clean up

    // Issue a fresh JWT with updated details
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, banned: user.banned },
      process.env.JWT_SECRET || 'jwt-secret',
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'Profile updated successfully!',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        banned: user.banned
      }
    });
  } catch (err) {
    console.error('Error verifying profile update:', err);
    res.status(500).json({ message: 'Server error applying profile update' });
  }
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current password and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters long' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Google/OAuth users who haven't logged in locally or set a password might still have the random password generated.
    // In any case, we verify current password.
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully!' });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ message: 'Server error updating password' });
  }
};
