const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware.authenticate);


router.get('/', paymentController.getUserPayments);
router.get('/statistics', authMiddleware.verifiedOnly, paymentController.getPaymentStatistics);
router.get('/:id', authMiddleware.verifiedOnly, paymentController.getPaymentById);
router.post('/process', authMiddleware.verifiedOnly, paymentController.processPayment);
router.post('/generate', authMiddleware.verifiedOnly, paymentController.generateMonthlyPayment);

module.exports = router;