const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateTargetTier,
  getUserHeatmap
} = require('../controllers/userController');

router.get('/profile', getUserProfile);
router.patch('/tier', updateTargetTier);
router.get('/heatmap', getUserHeatmap);

module.exports = router;
