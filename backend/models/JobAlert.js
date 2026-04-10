const mongoose = require('mongoose');

const jobAlertSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, required: true },          // e.g. "Software Engineer"
  location: { type: String, default: 'India' },
  active: { type: Boolean, default: true },
  lastTriggered: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('JobAlert', jobAlertSchema);
