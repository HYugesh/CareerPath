const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const {
  startModuleQuiz,
  submitModuleQuiz,
  getModuleQuizSession
} = require('../controllers/roadmapQuizController');

// All routes require authentication
router.use(protect);

// Roadmap-integrated quiz routes
router.post('/:roadmapId/modules/:moduleId/quiz/start', startModuleQuiz);
router.post('/:roadmapId/modules/:moduleId/quiz/:sessionId/submit', submitModuleQuiz);
router.get('/quiz-session/:sessionId', getModuleQuizSession);

module.exports = router;
