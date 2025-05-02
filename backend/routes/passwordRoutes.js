const express = require('express');
const router = express.Router();
const passwordController = require('../controllers/passwordController');
const { csrfProtection } = require('../middleware/csrfMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/forgot', passwordController.forgotPassword);
router.post('/reset', csrfProtection, passwordController.resetPassword);

router.post('/change', authMiddleware.authenticate, passwordController.changePassword);

module.exports = router;