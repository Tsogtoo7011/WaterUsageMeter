// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const validator = require('../middleware/validationMiddleware');

// User profile routes
router.get('/profile', authMiddleware.authenticate, userController.getProfile);
router.put('/profile', authMiddleware.authenticate, validator.validateProfileUpdate, userController.updateProfile);

// Apartment routes
router.get('/profile/apartment', authMiddleware.authenticate, userController.getApartments);
router.post('/profile/apartment', authMiddleware.authenticate, validator.validateApartment, userController.createApartment);

module.exports = router;