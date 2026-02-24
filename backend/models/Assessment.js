// In backend/models/Assessment.js
const mongoose = require('mongoose');

// This schema defines the structure of each question
const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: String, required: true },
});

// This schema stores a specific quiz session a user starts
const quizSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  domain: { type: String, required: true },
  difficulty: { type: String, required: true },
  questions: [questionSchema],
  userAnswers: [{
    questionIndex: Number,
    selectedAnswer: String,
  }],
  score: { type: Number, default: 0 },
  report: { type: String, default: '' },
  isCompleted: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('QuizSession', quizSessionSchema);