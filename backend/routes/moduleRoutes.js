const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const {
  getModuleById,
  unlockModule,
  updateModuleStatus,
  reviewSubComponent,
  checkModuleCompletion,
  triggerProgressCheck
} = require('../controllers/moduleController');

// All routes require authentication
router.use(protect);

// Module management
router.get('/:roadmapId/modules/:moduleId', getModuleById);
router.post('/:roadmapId/modules/:moduleId/unlock', unlockModule);
router.put('/:roadmapId/modules/:moduleId/status', updateModuleStatus);
router.get('/:roadmapId/modules/:moduleId/completion-check', checkModuleCompletion);
router.post('/:roadmapId/modules/:moduleId/check-progress', triggerProgressCheck);

// Sub-component management
router.put('/:roadmapId/modules/:moduleId/subcomponents/:subId/review', reviewSubComponent);

module.exports = router;