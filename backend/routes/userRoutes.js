const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const apartmentController = require('../controllers/apartmentController');
const authMiddleware = require('../middleware/authMiddleware');
const validator = require('../middleware/validationMiddleware');

// Profile routes
router.get('/profile', authMiddleware.authenticate, profileController.getProfile);
router.put('/profile', authMiddleware.authenticate, validator.validateProfileUpdate, profileController.updateProfile);

// Apartment routes
router.get('/profile/apartment', authMiddleware.authenticate, apartmentController.getApartments);
router.post('/profile/apartment', authMiddleware.authenticate, validator.validateApartment, apartmentController.createApartment);
router.get('/profile/apartment/search', authMiddleware.authenticate, apartmentController.searchApartments);
router.post('/profile/apartment/add-by-code', authMiddleware.authenticate, apartmentController.addApartmentByCode);
router.put('/profile/apartment/:id', authMiddleware.authenticate, apartmentController.updateApartment);
router.delete('/profile/apartment/:id', authMiddleware.authenticate, apartmentController.deleteApartment);
router.get('/profile/apartment/:id', authMiddleware.authenticate, apartmentController.getApartmentById);
router.post('/profile/apartment/share', authMiddleware.authenticate, apartmentController.shareApartment);

module.exports = router;