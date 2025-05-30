const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/NotificationController');

router.get('/payments', NotificationController.getPaymentNotifications);
router.get('/news', NotificationController.getNewsNotifications);
router.get('/all', NotificationController.getAllNotifications);
router.delete('/old', NotificationController.deleteOldNotifications);
router.post('/mark-as-read', NotificationController.markAsRead);
router.post('/mark-all-as-read', NotificationController.markAllAsRead); 
router.post('/remove', NotificationController.markAsRemoved);

router.get('/test', (req, res, next) => {
  req.query.userId = 1;
  next();
}, NotificationController.getAllNotifications);

module.exports = router;
