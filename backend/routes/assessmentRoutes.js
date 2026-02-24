// backend/routes/assessmentRoutes.js
const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  startAssessment,
  submitAssessment,
  getAssessment,
} = require("../controllers/assessmentController");

// Test endpoint to check if API is working
router.get("/test", (req, res) => {
  res.json({ message: "Assessment API is working", timestamp: new Date().toISOString() });
});

// Start a new assessment session - Authentication required
router.post("/start", protect, startAssessment);

// Submit assessment and receive full AI-like feedback
router.post("/:id/submit", protect, submitAssessment);

// Get a specific assessment
router.get("/:id", protect, getAssessment);

// Optional: mimic Flask-style endpoint for flexibility
router.post("/submit", async (req, res) => {
  try {
    const { answers } = req.body;

    // Simulate evaluation (in a real system, integrate AI model or service)
    const mockReport = {
      score: 80,
      rawReport: "Detailed AI feedback: Great attempt! Revise some key concepts.",
      questions: [
        { qNo: 1, yourAnswer: "A", correctAnswer: "B", result: "incorrect", feedback: "Revise topic: Data Structures" },
        { qNo: 2, yourAnswer: "C", correctAnswer: "C", result: "correct", feedback: "Good job on algorithms!" },
        { qNo: 3, yourAnswer: "B", correctAnswer: "B", result: "correct", feedback: "Excellent understanding!" }
      ]
    };

    res.json(mockReport);
  } catch (error) {
    console.error("Assessment submission error:", error);
    res.status(500).json({ message: "Error processing assessment results" });
  }
});

module.exports = router;