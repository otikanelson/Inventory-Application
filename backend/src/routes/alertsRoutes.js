// backend/src/routes/alertsRoutes.js
// Routes for multi-threshold alert system

const express = require('express');
const router = express.Router();

const {
  getAlerts,
  getSettings,
  updateSettings,
  acknowledgeAlert
} = require('../controllers/alertsController');

// @route   GET /api/alerts
// @desc    Get all alerts with multi-threshold categorization
// @query   ?level=critical&category=dairy&sortBy=urgency
router.get('/', getAlerts);

// @route   GET /api/alerts/settings
// @desc    Get current alert threshold settings
router.get('/settings', getSettings);

// @route   PUT /api/alerts/settings
// @desc    Update alert threshold settings
router.put('/settings', updateSettings);

// @route   POST /api/alerts/acknowledge
// @desc    Acknowledge/dismiss an alert
router.post('/acknowledge', acknowledgeAlert);

module.exports = router;