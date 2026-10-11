const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getReport, listReports } = require('../controllers/reportController');
const { getAnalytics } = require('../controllers/analyticsController');
const { listUsers, createUser, updateUser, getAnalysts } = require('../controllers/userController');

// Reports
router.get('/reports', authenticate, listReports);
router.get('/reports/:id', authenticate, getReport);

// Analytics
router.get('/analytics', authenticate, getAnalytics);

// Users
router.get('/users', authenticate, listUsers);
router.post('/users', authenticate, createUser);
router.patch('/users/:id', authenticate, updateUser);
router.get('/analysts', authenticate, getAnalysts);

module.exports = router;
