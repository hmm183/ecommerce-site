// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  phno:     { type: String, default: "" },
  password: { type: String },
  provider: { type: String, required: true }, // 'local' or 'google'
  role:     { type: String, default: 'user' },
  verified: { type: Boolean, default: false },
  banned:   { type: Boolean, default: false } // ✅ NEW FIELD
});

module.exports = mongoose.model('User', userSchema);
