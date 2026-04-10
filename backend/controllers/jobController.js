const axios = require('axios');
const JobAlert = require('../models/JobAlert');

const JOB_SERVICE_URL = process.env.JOB_SERVICE_URL || 'http://localhost:8001';

// ── Scrape jobs on demand ──────────────────────────────────────────────────
const scrapeJobs = async (req, res) => {
  const {
    search_term,
    location = 'India',
    results_wanted = 20,
    hours_old = 72,
    sites = ['indeed', 'linkedin', 'zip_recruiter', 'google'],
  } = req.body;

  if (!search_term?.trim()) {
    return res.status(400).json({ success: false, message: 'search_term is required' });
  }

  try {
    const response = await axios.post(`${JOB_SERVICE_URL}/scrape`, {
      search_term,
      location,
      results_wanted,
      hours_old,
      sites,
    }, { timeout: 60000 });

    res.json({ success: true, jobs: response.data, count: response.data.length });
  } catch (err) {
    const detail = err.response?.data?.detail || err.message;
    console.error('[JOB] Scrape error:', detail);
    res.status(500).json({ success: false, message: 'Job scraping failed', detail });
  }
};

// ── Job Alerts CRUD ────────────────────────────────────────────────────────
const getAlerts = async (req, res) => {
  const alerts = await JobAlert.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.json({ success: true, alerts });
};

const createAlert = async (req, res) => {
  const { role, location } = req.body;
  if (!role?.trim()) return res.status(400).json({ success: false, message: 'role is required' });

  // Prevent duplicates
  const exists = await JobAlert.findOne({ user: req.user.id, role: role.trim(), active: true });
  if (exists) return res.status(409).json({ success: false, message: 'Alert already exists for this role' });

  const alert = await JobAlert.create({ user: req.user.id, role: role.trim(), location: location || 'India' });
  res.status(201).json({ success: true, alert });
};

const deleteAlert = async (req, res) => {
  const alert = await JobAlert.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
  res.json({ success: true });
};

const toggleAlert = async (req, res) => {
  const alert = await JobAlert.findOne({ _id: req.params.id, user: req.user.id });
  if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
  alert.active = !alert.active;
  await alert.save();
  res.json({ success: true, alert });
};

// ── Fetch jobs for a specific alert ───────────────────────────────────────
const getAlertJobs = async (req, res) => {
  const alert = await JobAlert.findOne({ _id: req.params.id, user: req.user.id });
  if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });

  try {
    const response = await axios.post(`${JOB_SERVICE_URL}/scrape`, {
      search_term: alert.role,
      location: alert.location,
      results_wanted: 15,
      hours_old: 48,
    }, { timeout: 60000 });

    alert.lastTriggered = new Date();
    await alert.save();

    res.json({ success: true, jobs: response.data, count: response.data.length, alert });
  } catch (err) {
    const detail = err.response?.data?.detail || err.message;
    res.status(500).json({ success: false, message: 'Failed to fetch jobs for alert', detail });
  }
};

module.exports = { scrapeJobs, getAlerts, createAlert, deleteAlert, toggleAlert, getAlertJobs };
