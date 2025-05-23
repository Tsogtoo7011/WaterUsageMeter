const express = require('express');
const router = express.Router();
const { EmailVerification } = require('../controllers/verificationController');
const { csrfProtection } = require('../middleware/csrfMiddleware');

router.get('/verify-email', EmailVerification);
router.post('/resend', csrfProtection, EmailVerification);

module.exports = router;
