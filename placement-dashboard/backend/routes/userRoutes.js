const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateTargetTier,
  getUserHeatmap
} = require('../controllers/userController');
const { requireAuth } = require('../middleware/requireAuth');

// All student-specific endpoints are protected by Clerk JWT authentication
router.get('/profile', requireAuth, getUserProfile);
router.patch('/tier', requireAuth, updateTargetTier);
router.put('/tier', requireAuth, updateTargetTier);
router.get('/heatmap', requireAuth, getUserHeatmap);

module.exports = router;
