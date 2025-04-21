const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware.authenticate);

router.post('/', authMiddleware.verifiedOnly, feedbackController.createFeedback);
router.get('/', feedbackController.getUserFeedback);
router.get('/my-feedback', feedbackController.getUserFeedback);
router.get('/:id', feedbackController.getFeedbackById);
router.put('/:id',  authMiddleware.verifiedOnly, feedbackController.updateFeedback);
router.delete('/:id',  authMiddleware.verifiedOnly, feedbackController.deleteFeedback);

router.get('/admin/all', feedbackController.getAllFeedback);
router.get('/admin/:id', feedbackController.getAdminFeedbackById);

module.exports = router;