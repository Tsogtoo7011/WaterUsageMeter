const express = require('express');
const waterMeterController = require('../controllers/waterMeterController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Routes
router.get('/user', authMiddleware.authenticate, waterMeterController.getUserWaterMeters);
router.get('/details', authMiddleware.authenticate, waterMeterController.getWaterMeterDetails);
router.post('/add', authMiddleware.authenticate, waterMeterController.addMeterReading);
router.get('/:id', authMiddleware.authenticate, waterMeterController.getWaterMeterById);

module.exports = router;