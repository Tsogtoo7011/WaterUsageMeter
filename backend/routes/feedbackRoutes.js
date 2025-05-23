const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware.authenticate);

// Admin routes 
router.get('/admin/all', authMiddleware.verifiedOnly, authMiddleware.adminOnly, feedbackController.getAllFeedback);
router.get('/admin/:id', authMiddleware.verifiedOnly, authMiddleware.adminOnly, feedbackController.getAdminFeedbackById);
router.put('/admin/:id', authMiddleware.verifiedOnly, authMiddleware.adminOnly, feedbackController.updateFeedback);
router.put('/admin/:id/cancel', authMiddleware.verifiedOnly, authMiddleware.adminOnly, feedbackController.adminCancelFeedback);
router.put('/admin/:id/restore', authMiddleware.verifiedOnly, authMiddleware.adminOnly, feedbackController.adminRestoreFeedback);

// User routes
router.post('/', authMiddleware.verifiedOnly, feedbackController.createFeedback);
router.get('/my-feedback', authMiddleware.verifiedOnly, feedbackController.getUserFeedback);
router.get('/:id', authMiddleware.verifiedOnly, feedbackController.getFeedbackById);
router.put('/:id', authMiddleware.verifiedOnly, feedbackController.updateFeedback);
router.delete('/:id', authMiddleware.verifiedOnly, feedbackController.deleteFeedback);

router.get('/', authMiddleware.verifiedOnly, feedbackController.getUserFeedback);

module.exports = router;