const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/NotificationController');

router.get('/payments', NotificationController.getPaymentNotifications);

module.exports = router;
