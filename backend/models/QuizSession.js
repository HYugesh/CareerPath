// models/QuizSession.js
const mongoose = require("mongoose");

const sessionQuestionSchema = new mongoose.Schema({
  questionText: String,
  options: [String],
  correctAnswer: String, // Store the actual correct answer text
  difficulty: String,
});

const quizSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  domain: String,
  difficulty: String,
  questions: [sessionQuestionSchema],
  timeLimitSeconds: { type: Number, default: 300 }, // default 5min
  startedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  userAnswers: { type: Array, default: [] },
  score: { type: Number },
  report: { type: String },
  upskillAreas: { type: [String], default: [] },
  strengths: { type: [String], default: [] },
  recommendations: { type: String },
  isCompleted: { type: Boolean, default: false },
  
  // Roadmap integration
  roadmapModule: {
    roadmapId: { type: mongoose.Schema.Types.ObjectId, ref: 'Roadmap' },
    moduleId: Number,
    isRoadmapMode: { type: Boolean, default: false }
  }
});

module.exports = mongoose.model("QuizSession", quizSessionSchema);