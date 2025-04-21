const express = require('express');
const router = express.Router();
const passwordController = require('../controllers/passwordController');
const { csrfProtection } = require('../middleware/csrfMiddleware');

router.post('/forgot', passwordController.forgotPassword);
router.post('/reset', csrfProtection, passwordController.resetPassword);

module.exports = router;