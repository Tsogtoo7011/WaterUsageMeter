const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verificationController = require('../controllers/verificationController');
const passwordController = require('../controllers/passwordController');
const validator = require('../middleware/validationMiddleware');

// Authentication routes
router.post('/signup', validator.validateSignup, authController.signup);
router.post('/signin', validator.validateSignin, authController.signin);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);

// Email verification routes
router.get('/verify-email', verificationController.verifyEmail);
router.post('/resend-verification', verificationController.resendVerification);

// Password reset routes
router.post('/forgot-password', passwordController.forgotPassword);
router.post('/reset-password', passwordController.resetPassword);

module.exports = router;