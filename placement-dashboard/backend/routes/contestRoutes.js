const express = require('express');
const router = express.Router();
const {
  getContests,
  getNextBestAction,
  createPrivateContest
} = require('../controllers/contestController');

router.get('/', getContests);
router.get('/next-best-action', getNextBestAction);
router.post('/private', createPrivateContest);

module.exports = router;
