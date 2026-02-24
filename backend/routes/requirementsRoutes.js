const express = require('express');
const router = express.Router();
const { saveRequirements, getRequirements, updateRequirements } = require('../controllers/requirementsController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// POST /api/requirements - Save new requirements profile
router.post('/', saveRequirements);

// GET /api/requirements - Get user's requirements profile
router.get('/', getRequirements);

// PUT /api/requirements - Update requirements profile
router.put('/', updateRequirements);

module.exports = router;