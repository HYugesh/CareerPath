const mongoose = require('mongoose');

const userProgressSummarySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, default: Date.now },
    overallScore: { type: Number },
    strongSkills: [{ type: String }],
    weakSkills: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('UserProgressSummary', userProgressSummarySchema);
