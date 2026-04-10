const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
  scrapeJobs,
  getAlerts,
  createAlert,
  deleteAlert,
  toggleAlert,
  getAlertJobs,
} = require('../controllers/jobController');

router.post('/scrape', auth, scrapeJobs);
router.get('/alerts', auth, getAlerts);
router.post('/alerts', auth, createAlert);
router.delete('/alerts/:id', auth, deleteAlert);
router.patch('/alerts/:id/toggle', auth, toggleAlert);
router.get('/alerts/:id/jobs', auth, getAlertJobs);

module.exports = router;
