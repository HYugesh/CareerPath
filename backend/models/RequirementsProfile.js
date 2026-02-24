const mongoose = require('mongoose');

const requirementsProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // New enhanced fields
  primaryDomain: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  currentSkillLevel: {
    type: String,
    required: true,
    enum: ['Absolute Beginner', 'Beginner', 'Intermediate', 'Advanced']
  },
  timeCommitment: {
    type: Number,
    required: true,
    min: 1,
    max: 168 // hours per week
  },
  learningGoal: {
    type: String,
    required: true,
    enum: ['Job-ready', 'Project-based', 'Certification', 'Knowledge']
  },
  deadline: {
    type: Date,
    required: false
  },
  knownTopics: [{
    type: String,
    trim: true
  }],
  preferredLearningStyle: {
    type: String,
    required: true,
    enum: ['Theory-first', 'Practice-first', 'Balanced']
  },
  // Legacy fields for backward compatibility
  goal: {
    type: String,
    trim: true,
    maxlength: 500
  },
  careerPath: {
    type: String
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced']
  },
  techStack: [{
    type: String,
    trim: true
  }],
  timePerDay: {
    type: String,
    enum: ['30 minutes', '1 hour', '2 hours', '3+ hours']
  },
  learningStyle: {
    type: String,
    enum: ['Theory', 'Hands-On', 'Mixed']
  },
  depthPreference: {
    type: String,
    enum: ['Concise', 'Detailed']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('RequirementsProfile', requirementsProfileSchema);
