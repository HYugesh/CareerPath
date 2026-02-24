const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const {
  startSubTopicQuiz,
  submitSubTopicQuiz
} = require('../controllers/subTopicQuizController');

// Start sub-topic quiz
router.post('/:roadmapId/modules/:moduleId/subtopics/:subComponentId/quiz/start', protect, startSubTopicQuiz);

// Submit sub-topic quiz
router.post('/:roadmapId/modules/:moduleId/subtopics/:subComponentId/quiz/:sessionId/submit', protect, submitSubTopicQuiz);

module.exports = router;
