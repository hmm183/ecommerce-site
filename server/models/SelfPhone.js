// server/models/SelfPhone.js
const mongoose = require('mongoose');

const SelfPhoneSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  phones: [
    {
      number: { type: String, required: true },
      verified: { type: Boolean, default: false },
      addedAt: { type: Date, default: Date.now }
    }
  ]
});

module.exports = mongoose.model('SelfPhone', SelfPhoneSchema);
