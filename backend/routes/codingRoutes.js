const express = require('express');
const router = express.Router();
const { generateCodingQuestions, executeCodingSubmission, analyzePerformance } = require('../controllers/codingController');
const auth = require('../middleware/authMiddleware');

// Generate coding questions
router.post('/generate-questions', auth, generateCodingQuestions);

// Execute code submission
router.post('/execute-code', auth, executeCodingSubmission);

// Analyze coding performance
router.post('/analyze-performance', auth, analyzePerformance);

module.exports = router;