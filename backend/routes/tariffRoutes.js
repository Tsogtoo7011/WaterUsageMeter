const express = require('express');
const router = express.Router();
const tariffController = require('../controllers/tariffController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware.authenticate);
router.use(authMiddleware.verifiedOnly);
router.use(authMiddleware.adminOnly);

router.get('/', tariffController.getTariff);
router.get('/history', authMiddleware.verifiedOnly, tariffController.getTariffHistory);
router.put('/', authMiddleware.verifiedOnly, tariffController.updateTariff);
router.post('/toggle-status', authMiddleware.verifiedOnly,  tariffController.toggleTariffStatus);

module.exports = router;