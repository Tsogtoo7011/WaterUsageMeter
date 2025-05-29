const express = require('express');
const router = express.Router();
const AdminReportController = require('../controllers/AdminReportController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware.authenticate);

router.get('/dashboard-stats', authMiddleware.verifiedOnly, authMiddleware.adminOnly, AdminReportController.getDashboardStats);
router.get('/payments', authMiddleware.verifiedOnly, authMiddleware.adminOnly, AdminReportController.getPaymentReport);
router.get('/payment-statistics', authMiddleware.verifiedOnly, authMiddleware.adminOnly, AdminReportController.getPaymentStatistics);
router.get('/water-meters', authMiddleware.verifiedOnly, authMiddleware.adminOnly, AdminReportController.getWaterMeterReport);
router.get('/water-consumption', authMiddleware.verifiedOnly, authMiddleware.adminOnly, AdminReportController.getWaterConsumptionAnalysis);
router.get('/services', authMiddleware.verifiedOnly, authMiddleware.adminOnly, AdminReportController.getServiceReport);
router.get('/service-statistics', authMiddleware.verifiedOnly, authMiddleware.adminOnly, AdminReportController.getServiceStatistics);
router.get('/feedback', authMiddleware.verifiedOnly, authMiddleware.adminOnly, AdminReportController.getFeedbackReport);
router.get('/users', authMiddleware.verifiedOnly, authMiddleware.adminOnly, AdminReportController.getUserReport);
router.get('/apartments', authMiddleware.verifiedOnly, authMiddleware.adminOnly, AdminReportController.getApartmentReport);
router.get('/apartment/:apartmentId/users', authMiddleware.verifiedOnly, authMiddleware.adminOnly, AdminReportController.getApartmentUsers);
router.post('/apartment/:apartmentId/users', authMiddleware.verifiedOnly, authMiddleware.adminOnly, AdminReportController.addApartmentUser);
router.delete('/apartment/:apartmentId/users/:userId', authMiddleware.verifiedOnly, authMiddleware.adminOnly, AdminReportController.removeApartmentUser);
router.put('/payment-amount', authMiddleware.verifiedOnly, authMiddleware.adminOnly, AdminReportController.updatePaymentAmount);
router.put('/water-meter-indication', authMiddleware.verifiedOnly, authMiddleware.adminOnly, AdminReportController.updateWaterMeterIndication);
router.delete('/payment-amount', authMiddleware.verifiedOnly, authMiddleware.adminOnly, AdminReportController.deletePayment);
router.delete('/water-meter-indication', authMiddleware.verifiedOnly, authMiddleware.adminOnly, AdminReportController.deleteWaterMeter);

module.exports = router;