const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const authMiddleware = require('../middleware/authMiddleware');
const uploadMiddleware = require('../middleware/uploadMiddleware');
const { csrfProtection } = require('../middleware/csrfMiddleware');

router.use(authMiddleware.authenticate);

// User routes
router.get('/', newsController.getAllNews);
router.get('/:id', authMiddleware.verifiedOnly, newsController.getNewsById);
router.get('/:id/image', authMiddleware.verifiedOnly, newsController.getNewsImage);

// Admin routes
router.post('/', authMiddleware.adminOnly, csrfProtection, 
  uploadMiddleware.singleImage, uploadMiddleware.handleMulterError, 
  newsController.createNews);
router.put('/:id', authMiddleware.verifiedOnly, authMiddleware.adminOnly, csrfProtection, 
  uploadMiddleware.singleImage, uploadMiddleware.handleMulterError, 
  newsController.updateNews);
router.delete('/:id', authMiddleware.verifiedOnly, authMiddleware.adminOnly, csrfProtection, 
  newsController.deleteNews);

module.exports = router;