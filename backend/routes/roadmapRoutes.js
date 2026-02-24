const express = require('express');
const router = express.Router();
const {
  getUserRoadmaps,
  createRoadmap,
  getRoadmapById,
  updateRoadmapProgress,
  deleteRoadmap,
  hydrateModule
} = require('../controllers/roadmapController');
const authMiddleware = require('../middleware/authMiddleware');

// Health check endpoint (no auth required)
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Roadmap API is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      'GET /api/roadmaps/health': 'Health check (no auth)',
      'GET /api/roadmaps/test-auth': 'Test authentication',
      'GET /api/roadmaps/test-requirements': 'Check user requirements',
      'GET /api/roadmaps/test-create': 'Test roadmap generation',
      'GET /api/roadmaps': 'Get all user roadmaps',
      'POST /api/roadmaps': 'Create new roadmap'
    }
  });
});

// Test authentication endpoint
router.get('/test-auth', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Authentication working',
    userId: req.user.id,
    userEmail: req.user.email
  });
});

// Test requirements endpoint
router.get('/test-requirements', authMiddleware, async (req, res) => {
  try {
    const RequirementsProfile = require('../models/RequirementsProfile');
    const requirements = await RequirementsProfile.findOne({ userId: req.user.id });

    if (!requirements) {
      return res.status(404).json({
        success: false,
        message: 'No requirements found for this user',
        userId: req.user.id,
        hint: 'Create requirements first by submitting the roadmap form'
      });
    }

    res.json({
      success: true,
      message: 'Requirements found',
      userId: req.user.id,
      requirements: {
        primaryDomain: requirements.primaryDomain,
        currentSkillLevel: requirements.currentSkillLevel,
        timeCommitment: requirements.timeCommitment,
        learningGoal: requirements.learningGoal,
        preferredLearningStyle: requirements.preferredLearningStyle,
        knownTopics: requirements.knownTopics,
        deadline: requirements.deadline,
        createdAt: requirements.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking requirements',
      error: error.message
    });
  }
});

// All routes below require authentication
router.use(authMiddleware);

// TEST ENDPOINT - Check if roadmap creation works
router.get('/test-create', async (req, res) => {
  try {
    const userId = req.user.id;
    const RequirementsProfile = require('../models/RequirementsProfile');
    const { generateRoadmapBlueprint } = require('../services/roadmapAIService');

    // Check if user has requirements
    const requirements = await RequirementsProfile.findOne({ userId });

    if (!requirements) {
      return res.status(404).json({
        success: false,
        message: 'No requirements found. Please create requirements first.',
        userId: userId
      });
    }

    // Try to generate roadmap
    console.log('🧪 TEST: Generating roadmap for user:', userId);
    const aiRoadmap = await generateRoadmapBlueprint(userId);

    return res.status(200).json({
      success: true,
      message: 'Roadmap generation test successful',
      userId: userId,
      requirements: {
        primaryDomain: requirements.primaryDomain,
        currentSkillLevel: requirements.currentSkillLevel,
        timeCommitment: requirements.timeCommitment
      },
      generatedRoadmap: {
        pathTitle: aiRoadmap.pathTitle,
        totalModules: aiRoadmap.totalModules || aiRoadmap.modules.length,
        moduleCount: aiRoadmap.modules.length,
        estimatedTotalHours: aiRoadmap.estimatedTotalHours,
        usedFallback: aiRoadmap.usedFallback,
        modules: aiRoadmap.modules.map(m => ({
          id: m.moduleId,
          title: m.title,
          type: m.moduleType,
          difficulty: m.difficultyLevel
        }))
      }
    });

  } catch (error) {
    console.error('🧪 TEST ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Test failed',
      error: error.message,
      stack: error.stack
    });
  }
});

// GET /api/roadmaps - Get all user's roadmaps
router.get('/', getUserRoadmaps);

// POST /api/roadmaps - Create new roadmap from requirements
router.post('/', createRoadmap);

// GET /api/roadmaps/:id - Get specific roadmap
router.get('/:id', getRoadmapById);

// PUT /api/roadmaps/:id - Update roadmap progress
router.put('/:id', updateRoadmapProgress);

// POST /api/roadmaps/:id/modules/:moduleId/hydrate - Hydrate module content
router.post('/:id/modules/:moduleId/hydrate', hydrateModule);

// DELETE /api/roadmaps/:id - Delete roadmap
router.delete('/:id', deleteRoadmap);

module.exports = router;
