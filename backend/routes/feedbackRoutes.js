const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const authMiddleware = require('../middleware/authMiddleware');
const verificationMiddleware = require('../middleware/verificationMiddleware');

router.use(authMiddleware.authenticate);

router.post('/', verificationMiddleware, feedbackController.createFeedback);

router.get('/my-feedback', feedbackController.getUserFeedback);

module.exports = router;