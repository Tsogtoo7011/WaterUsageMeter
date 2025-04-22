const express = require('express');
const router = express.Router();
const tariffController = require('../controllers/tariffController');
const { authenticateUser } = require('../middleware/auth');

router.use(authenticateUser);
router.get('/', tariffController.getTariff);
router.put('/', tariffController.updateTariff);

module.exports = router;