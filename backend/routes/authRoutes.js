const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validator = require('../middleware/validationMiddleware');

router.post('/signup', validator.validateSignup, authController.signup);
router.post('/signin', validator.validateSignin, authController.signin);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);

module.exports = router;