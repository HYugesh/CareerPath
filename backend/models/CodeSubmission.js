const mongoose = require('mongoose');

const codeSubmissionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  questionId: {
    type: String,
    required: true
  },
  questionTitle: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true
  },
  language: {
    type: String,
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    required: true
  },
  testResults: {
    passed: { type: Number, required: true },
    total: { type: Number, required: true },
    score: { type: Number, required: true }
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
codeSubmissionSchema.index({ user: 1, submittedAt: -1 });
codeSubmissionSchema.index({ user: 1, questionId: 1 });

module.exports = mongoose.model('CodeSubmission', codeSubmissionSchema);
