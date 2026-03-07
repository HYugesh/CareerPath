/**
 * Code Execution Routes
 * Handles routing for code execution endpoints
 * Requirements: 12.1, 12.2, 12.3, 12.4
 */

const express = require('express');
const router = express.Router();
const { runCode, submitCode, getSupportedLanguages, getUserSubmissions } = require('../controllers/codeExecutionController');
const auth = require('../middleware/authMiddleware');

// POST /api/code/run - Execute code with public test cases (requires authentication)
router.post('/run', auth, runCode);

// POST /api/code/submit - Submit code with all test cases (requires authentication)
router.post('/submit', auth, submitCode);

// GET /api/code/languages - Get supported languages (no authentication required)
router.get('/languages', getSupportedLanguages);

// GET /api/code/submissions - Get user's code submissions (requires authentication)
router.get('/submissions', auth, getUserSubmissions);

module.exports = router;
