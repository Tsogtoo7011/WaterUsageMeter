const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const apartmentController = require('../controllers/apartmentController');
const authMiddleware = require('../middleware/authMiddleware');
const validator = require('../middleware/validationMiddleware');

router.use(authMiddleware.authenticate);

// Profile routes
router.get('/profile', profileController.getProfile);
router.put('/profile', validator.validateProfileUpdate, profileController.updateProfile);

// Apartment routes
router.get('/profile/apartment', apartmentController.getApartments);
router.post('/profile/apartment', authMiddleware.verifiedOnly, validator.validateApartment, apartmentController.createApartment);
router.get('/profile/apartment/search', authMiddleware.verifiedOnly, apartmentController.searchApartments);
router.post('/profile/apartment/add-by-code', authMiddleware.verifiedOnly, apartmentController.addApartmentByCode);
router.put('/profile/apartment/:id', authMiddleware.verifiedOnly, apartmentController.updateApartment);
router.delete('/profile/apartment/:id', authMiddleware.verifiedOnly, apartmentController.deleteApartment);
router.get('/profile/apartment/:id', apartmentController.getApartmentById);
router.post('/profile/apartment/share', authMiddleware.verifiedOnly, apartmentController.shareApartment);

module.exports = router;