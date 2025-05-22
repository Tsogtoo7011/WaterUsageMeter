const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware.authenticate);

// User routes
router.get('/', serviceController.getUserServiceRequests);
router.post('/', authMiddleware.verifiedOnly, serviceController.createServiceRequest);
router.get('/my-services', authMiddleware.verifiedOnly, serviceController.getUserServiceRequests);
router.get('/my-apartments', authMiddleware.verifiedOnly, serviceController.getUserApartments);
router.get('/:id', authMiddleware.verifiedOnly, serviceController.getServiceById);
router.delete('/:id', authMiddleware.verifiedOnly, serviceController.deleteServiceRequest);
router.put('/:id/complete', authMiddleware.verifiedOnly, serviceController.userCompleteService);

// Admin routes
router.get('/admin/all', authMiddleware.verifiedOnly, authMiddleware.adminOnly, serviceController.getAllServices);
router.get('/admin/status/:status', authMiddleware.verifiedOnly, authMiddleware.adminOnly, serviceController.getServicesByStatus);
router.get('/admin/:id', authMiddleware.verifiedOnly, authMiddleware.adminOnly, serviceController.getServiceById);
router.put('/admin/:id', authMiddleware.verifiedOnly, authMiddleware.adminOnly, serviceController.updateServiceResponse);
router.delete('/admin/:id', authMiddleware.verifiedOnly, authMiddleware.adminOnly, serviceController.deleteServiceRequest);

module.exports = router;