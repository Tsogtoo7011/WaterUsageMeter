const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const apartmentController = require('../controllers/apartmentController');
const authMiddleware = require('../middleware/authMiddleware');
const validator = require('../middleware/validationMiddleware');
const { csrfProtection } = require('../middleware/csrfMiddleware');

router.get('/profile', authMiddleware.authenticate, profileController.getProfile);
router.put('/profile', authMiddleware.authenticate, csrfProtection, validator.validateProfileUpdate, profileController.updateProfile);

router.get('/profile/apartment', authMiddleware.authenticate, apartmentController.getApartments);
router.post('/profile/apartment', authMiddleware.authenticate, csrfProtection, validator.validateApartment, apartmentController.createApartment);

module.exports = router;