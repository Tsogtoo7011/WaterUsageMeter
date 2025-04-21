const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validator = require('../middleware/validationMiddleware');
const { csrfProtection } = require('../middleware/csrfMiddleware');

router.post('/signup', validator.validateSignup, authController.signup);
router.post('/signin', validator.validateSignin, authController.signin);

router.post('/refresh', csrfProtection, authController.refreshToken);
router.post('/logout', csrfProtection, authController.logout);

module.exports = router;
