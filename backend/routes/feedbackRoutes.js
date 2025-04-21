const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const authMiddleware = require('../middleware/authMiddleware');
const verificationMiddleware = require('../middleware/verificationMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware.authenticate);

// User feedback routes
router.post('/', verificationMiddleware, feedbackController.createFeedback);
router.get('/', feedbackController.getUserFeedback);
router.get('/my-feedback', feedbackController.getUserFeedback);
router.get('/:id', feedbackController.getFeedbackById);
router.put('/:id', verificationMiddleware, feedbackController.updateFeedback);
router.delete('/:id', verificationMiddleware, feedbackController.deleteFeedback);

// Admin feedback routes
router.get('/admin/all', feedbackController.getAllFeedback);
router.get('/admin/:id', feedbackController.getAdminFeedbackById);

module.exports = router;