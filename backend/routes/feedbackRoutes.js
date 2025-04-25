const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware.authenticate);

// User routes
router.get('/', feedbackController.getUserFeedback);
router.post('/', authMiddleware.verifiedOnly, feedbackController.createFeedback);
router.get('/my-feedback', authMiddleware.verifiedOnly, feedbackController.getUserFeedback);
router.get('/:id', authMiddleware.verifiedOnly, feedbackController.getFeedbackById);
router.put('/:id', authMiddleware.verifiedOnly, feedbackController.updateFeedback);
router.delete('/:id', authMiddleware.verifiedOnly, feedbackController.deleteFeedback);

// Admin routes
router.get('/admin/all', authMiddleware.verifiedOnly, authMiddleware.adminOnly, feedbackController.getAllFeedback);
router.get('/admin/:id', authMiddleware.verifiedOnly, authMiddleware.adminOnly, feedbackController.getAdminFeedbackById);

module.exports = router;