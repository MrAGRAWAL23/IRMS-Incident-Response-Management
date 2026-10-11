const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { login, logout, me } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, login);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);

module.exports = router;
