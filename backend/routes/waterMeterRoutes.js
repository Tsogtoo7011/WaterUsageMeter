const express = require('express');
const waterMeterController = require('../controllers/waterMeterController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.use(authMiddleware.authenticate);

// User routes
router.get('/user', waterMeterController.getUserWaterMeters);
router.get('/details', waterMeterController.getWaterMeterDetails);
router.get('/:id', waterMeterController.getWaterMeterById);
router.post('/add', authMiddleware.verifiedOnly, waterMeterController.addMeterReading);

module.exports = router;