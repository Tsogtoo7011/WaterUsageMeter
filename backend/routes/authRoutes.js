const express = require('express');
const router = express.Router();

const { 
  verifyEmail, 
  resendVerificationEmail 
} = require('../controllers/authController');

// Import controllers
const { signup, signin } = require('../controllers/authController');
const { 
  getProfile, 
  updateProfile, 
  getApartments, 
  createApartment 
} = require('../controllers/profileController');

// Import middleware
const authenticate = require('../middleware/authMiddleware');

// Authentication routes
router.post('/signup', signup);
router.post('/signin', signin);

// Profile routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);

// Apartment routes
router.get('/Profile/Apartment', authenticate, getApartments);
router.post('/Profile/Apartment', authenticate, createApartment);

module.exports = router;

// Email verification route
router.get('/verify/:token', verifyEmail);

// Resend verification email route
router.post('/resend-verification', resendVerificationEmail);

module.exports = router;