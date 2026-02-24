const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getUserStats } = require('../controllers/userController');
const protect = require('../middleware/authMiddleware');

router.route('/profile')
    .get(protect, getProfile)
    .put(protect, updateProfile);

router.get('/stats', protect, getUserStats);

module.exports = router;
