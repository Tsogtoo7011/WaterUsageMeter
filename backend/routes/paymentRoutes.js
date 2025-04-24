const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware.authenticate);

router.get('/', paymentController.getUserPayments);
router.get('/statistics', paymentController.getPaymentStatistics);
router.get('/:id', paymentController.getPaymentById);
router.post('/generate', paymentController.generateMonthlyPayment);
router.post('/process', paymentController.processPayment);

module.exports = router;