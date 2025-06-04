const mongoose = require('mongoose');
const analyticsSchema = new mongoose.Schema({
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  loginTime:       { type: Date, default: Date.now },
  logoutTime:      { type: Date },
  sessionDuration: { type: Number },            // in minutes
  actions:         [{ type: String }]           // e.g. ["logged_in", "enabled_disconnection"]
});
module.exports = mongoose.model('Analytics', analyticsSchema);
