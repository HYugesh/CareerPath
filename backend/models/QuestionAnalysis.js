const mongoose = require('mongoose');

const questionAnalysisSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: String,
    required: true
  },
  questionId: {
    type: String,
    required: true
  },
  questionTitle: {
    type: String,
    required: true
  },
  submissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CodeSubmission',
    required: false,
    default: null
  },
  code: {
    type: String,
    required: false,
    default: ''
  },
  language: {
    type: String,
    required: true
  },
  approach: {
    type: String,
    required: true
  },
  timeComplexity: {
    type: String
  },
  betterApproach: {
    type: String
  },
  feedback: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 0,
    max: 10
  },
  analyzedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
questionAnalysisSchema.index({ user: 1, sessionId: 1 });
questionAnalysisSchema.index({ user: 1, questionId: 1 });

module.exports = mongoose.model('QuestionAnalysis', questionAnalysisSchema);
