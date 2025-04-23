const express = require('express'); 
const waterMeterController = require('../controllers/waterMeterController'); 
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();  
router.get('/user',  waterMeterController.getUserWaterMeters); 
router.get('/details', waterMeterController.getWaterMeterDetails); 
router.post('/add',  waterMeterController.addMeterReading); 
router.get('/:id',  waterMeterController.getWaterMeterById);  
module.exports = router