const express = require('express');
const router = express.Router();
const {
  getContests,
  getNextBestAction,
  createCustomContest
} = require('../controllers/contestController');
const { adminAuth } = require('../middleware/authMiddleware');
const { requireAuth } = require('../middleware/requireAuth');

// Public contest endpoints
router.get('/', getContests); // Global contest fetch (public)
router.get('/next-best-action', requireAuth, getNextBestAction); // Student-tailored recommendation (protected)

// Secure manual injection endpoints for administrators
router.post('/custom', adminAuth, createCustomContest);
router.post('/private', adminAuth, createCustomContest); // backward compatibility alias

module.exports = router;
