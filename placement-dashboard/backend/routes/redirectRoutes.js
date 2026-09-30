const express = require('express');
const router = express.Router();
const { handleSmartRedirect } = require('../controllers/redirectController');

// GET /api/redirect?targetUrl=<encoded_url>&contestId=<id>&userId=<userId>
router.get('/', handleSmartRedirect);

module.exports = router;
