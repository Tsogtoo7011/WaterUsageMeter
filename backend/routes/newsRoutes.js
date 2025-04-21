const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const authMiddleware = require('../middleware/authMiddleware'); // Make sure the path is correct
const uploadMiddleware = require('../middleware/uploadMiddleware'); // Make sure the path is correct

// Public routes
router.get('/', newsController.getAllNews);
router.get('/:id', newsController.getNewsById);
router.get('/:id/image', newsController.getNewsImage);

// Protected routes - using the correct middleware functions from your auth file
router.post('/', 
  authMiddleware.authenticate, 
  authMiddleware.adminOnly, 
  uploadMiddleware.singleImage, 
  uploadMiddleware.handleMulterError, 
  newsController.createNews
);

router.put('/:id', 
  authMiddleware.authenticate, 
  authMiddleware.adminOnly, 
  uploadMiddleware.singleImage, 
  uploadMiddleware.handleMulterError, 
  newsController.updateNews
);

router.delete('/:id', 
  authMiddleware.authenticate, 
  authMiddleware.adminOnly, 
  newsController.deleteNews
);

module.exports = router;