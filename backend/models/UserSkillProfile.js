const mongoose = require('mongoose');

const userSkillProfileSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, required: true },
    skillScores: { type: Map, of: Number }, // skillTag -> averageScore
    strongSkills: [{ type: String }],
    weakSkills: [{ type: String }],
    overallScore: { type: Number },
}, { timestamps: true });

module.exports = mongoose.model('UserSkillProfile', userSkillProfileSchema);
