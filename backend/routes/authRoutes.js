// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const validator = require('../middleware/validationMiddleware');

// Auth routes
router.post('/signup', validator.validateSignup, userController.signup);
router.post('/signin', validator.validateSignin, userController.signin);
router.get('/verify-email', userController.verifyEmail);
router.post('/resend-verification', userController.resendVerification);

module.exports = router;