const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getStats, getRecentIncidents, getActivity } = require('../controllers/dashboardController');

router.get('/stats', authenticate, getStats);
router.get('/recent-incidents', authenticate, getRecentIncidents);
router.get('/activity', authenticate, getActivity);

module.exports = router;
