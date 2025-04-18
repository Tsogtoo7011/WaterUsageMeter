const express = require('express');
const router = express.Router();
const { EmailVerification } = require('../controllers/verificationController');

router.get('/verify-email', EmailVerification);
router.post('/resend', EmailVerification);

module.exports = router;