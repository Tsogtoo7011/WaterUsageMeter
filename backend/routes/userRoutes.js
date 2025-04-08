const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const apartmentController = require('../controllers/apartmentController');
const authMiddleware = require('../middleware/authMiddleware');
const validator = require('../middleware/validationMiddleware');

// User profile routes - protected by authentication
router.get('/profile', authMiddleware.authenticate, profileController.getProfile);
router.put('/profile', authMiddleware.authenticate, validator.validateProfileUpdate, profileController.updateProfile);

// Apartment routes - protected by authentication
router.get('/profile/apartment', authMiddleware.authenticate, apartmentController.getApartments);
router.post('/profile/apartment', authMiddleware.authenticate, validator.validateApartment, apartmentController.createApartment);

module.exports = router;