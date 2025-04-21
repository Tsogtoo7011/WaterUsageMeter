const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const authMiddleware = require('../middleware/authMiddleware');
const uploadMiddleware = require('../middleware/uploadMiddleware');
const { csrfProtection } = require('../middleware/csrfMiddleware');

// Public routes
router.get('/', newsController.getAllNews);
router.get('/:id', newsController.getNewsById);
router.get('/:id/image', newsController.getNewsImage);

// Protected routes with CSRF protection
router.post('/',
  authMiddleware.authenticate,
  authMiddleware.verifiedOnly,
  authMiddleware.adminOnly,
  csrfProtection,
  uploadMiddleware.singleImage,
  uploadMiddleware.handleMulterError,
  newsController.createNews
);

router.put('/:id', authMiddleware.authenticate,
  authMiddleware.verifiedOnly,
  authMiddleware.adminOnly,
  csrfProtection,
  uploadMiddleware.singleImage,
  uploadMiddleware.handleMulterError,
  newsController.updateNews
);

router.delete('/:id',
  authMiddleware.authenticate,
  authMiddleware.verifiedOnly,
  authMiddleware.adminOnly,
  csrfProtection,
  newsController.deleteNews
);

module.exports = router;