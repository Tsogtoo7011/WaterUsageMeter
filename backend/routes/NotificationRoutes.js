const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/NotificationController');

router.get('/payments', NotificationController.getPaymentNotifications);
router.get('/news', NotificationController.getNewsNotifications);
router.get('/all', NotificationController.getAllNotifications);
router.delete('/old', NotificationController.deleteOldNotifications);

// Debug route to test notification fetching
router.get('/test', (req, res, next) => {
  req.query.userId = 1; // Replace 1 with a valid UserId from your Notification table
  next();
}, NotificationController.getAllNotifications);

module.exports = router;
