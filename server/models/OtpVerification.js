const mongoose = require('mongoose');

const OtpVerificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  phone: { type: String, required: true },
  mode: { type: String, enum: ['self','gift'], required: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  attemptsLeft: { type: Number, default: 3 },
  banned: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// ensure one active OTP per user+phone+mode
OtpVerificationSchema.index({ user: 1, phone: 1, mode: 1 }, { unique: true });

module.exports = mongoose.model('OtpVerification', OtpVerificationSchema);
