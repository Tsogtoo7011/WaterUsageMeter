const express = require('express');
const router = express.Router();
const tariffController = require('../controllers/tariffController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware.authenticate);

router.get('/', tariffController.getTariff);
router.put('/', authMiddleware.adminOnly, tariffController.updateTariff);

module.exports = router;