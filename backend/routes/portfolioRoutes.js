const express = require('express');
const router = express.Router();
const { addPortfolio, getPortfolios, deletePortfolio } = require('../controllers/portfolioController');
const protect = require('../middleware/authMiddleware');

router.get('/', protect, getPortfolios);
router.post('/', protect, addPortfolio);
router.delete('/:id', protect, deletePortfolio);

module.exports = router;
