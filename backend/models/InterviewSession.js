const mongoose = require("mongoose");

const interviewQuestionSchema = new mongoose.Schema({
  question: String,
  type: String, // technical, behavioral, situational, scenario
  context: String, // optional background info
  difficulty: String, // beginner, intermediate, advanced
});

const userAnswerSchema = new mongoose.Schema({
  questionIndex: Number,
  question: String,
  answer: String,
  timeSpent: Number, // seconds spent on this question
});

const interviewSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  role: { type: String, required: true },
  experience: { type: String, required: true }, // entry, mid, senior
  domain: { type: String, required: true },
  difficulty: { type: String, required: true }, // beginner, intermediate, advanced
  questions: [interviewQuestionSchema],
  userAnswers: [userAnswerSchema],
  timeLimit: { type: Number, default: 1800 }, // 30 minutes default
  startedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  
  // Uniqueness tracking
  uniqueHash: { type: String }, // Unique identifier for this question set
  generatedAt: { type: String }, // ISO timestamp of generation
  
  // Comprehensive Evaluation Results
  overallScore: { type: Number }, // 1-10 scale
  overallFeedback: { type: String },
  strengths: { type: [String], default: [] },
  weaknesses: { type: [String], default: [] },
  improvements: { type: [String], default: [] }, // Keep for backward compatibility
  
  // Detailed Assessments
  technicalAssessment: { type: String },
  communicationAssessment: { type: String },
  behavioralAssessment: { type: String },
  
  // Recommendations and Focus Areas
  recommendations: { type: String },
  focusAreas: { type: [String], default: [] },
  interviewTips: { type: String },
  performanceRating: { 
    type: String, 
    enum: ['Exceptional', 'Strong', 'Adequate', 'Below Average', 'Poor'],
    default: 'Adequate'
  },
  
  isCompleted: { type: Boolean, default: false }
});

module.exports = mongoose.model("InterviewSession", interviewSessionSchema);