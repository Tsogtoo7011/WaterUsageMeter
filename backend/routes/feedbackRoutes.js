const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedback.controller');
const authMiddleware = require('../middleware/authMiddleware');
const verificationMiddleware = require('../middleware/verificationMiddleware');

router.use(authMiddleware);

router.post('/', verificationMiddleware, feedbackController.createFeedback);

router.get('/my-feedback', feedbackController.getUserFeedback);

module.exports = router;