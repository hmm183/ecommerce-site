// server/models/SavedAddress.js
const mongoose = require('mongoose');

const SavedAddressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  address: {
    type: String,
    required: true
  },
  label: {
    type: String,
    default: 'Saved Address'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SavedAddress', SavedAddressSchema);
