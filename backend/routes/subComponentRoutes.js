const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const {
  getModuleSubComponents,
  markSubComponentReviewed,
  generateSubComponentContent
} = require('../controllers/subComponentController');

// Get all sub-components for a module
router.get('/:roadmapId/modules/:moduleId/subcomponents', protect, getModuleSubComponents);

// Mark sub-component as reviewed
router.put('/:roadmapId/modules/:moduleId/subcomponents/:subComponentId/review', protect, markSubComponentReviewed);

// Generate AI content for sub-component
router.post('/:roadmapId/modules/:moduleId/subcomponents/:subComponentId/generate', protect, generateSubComponentContent);

module.exports = router;
