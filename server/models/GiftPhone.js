// server/models/GiftPhone.js
const mongoose = require('mongoose');

const GiftPhoneSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  gifts: [
    {
      number: { type: String, required: true },
      recipientName: { type: String, required: true },
      verified: { type: Boolean, default: false },
      addedAt: { type: Date, default: Date.now }
    }
  ]
});

module.exports = mongoose.model('GiftPhone', GiftPhoneSchema);
