const express = require('express');
const router = express.Router();
const tariffController = require('../controllers/tariffController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware.authenticate);
 
router.get('/', tariffController.getTariff);
router.get('/history', authMiddleware.adminOnly, tariffController.getTariffHistory);
router.put('/', authMiddleware.adminOnly, tariffController.updateTariff);
router.post('/toggle-status', authMiddleware.adminOnly, tariffController.toggleTariffStatus);

module.exports = router;