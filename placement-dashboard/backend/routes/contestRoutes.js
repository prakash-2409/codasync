const express = require('express');
const router = express.Router();
const {
  getContests,
  getNextBestAction,
  createCustomContest
} = require('../controllers/contestController');
const { adminAuth } = require('../middleware/authMiddleware');

// Public contest endpoints
router.get('/', getContests);
router.get('/next-best-action', getNextBestAction);

// Secure manual injection endpoints for administrators
router.post('/custom', adminAuth, createCustomContest);
router.post('/private', adminAuth, createCustomContest); // backward compatibility alias

module.exports = router;
