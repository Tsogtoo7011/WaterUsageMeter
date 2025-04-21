const multer = require('multer');
const path = require('path');

// Configure multer for memory storage
const storage = multer.memoryStorage();

// Create middleware function
const uploadMiddleware = {
  // Single file upload for news cover images
  singleImage: multer({
    storage: storage,
    limits: { 
      fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      // Check file type
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed!'), false);
      }
    }
  }).single('coverImage'),

  // Error handling middleware for multer errors
  handleMulterError: (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          error: 'File is too large. Maximum size is 5MB.' 
        });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      // An unknown error occurred
      return res.status(400).json({ error: err.message });
    }
    // If no error, continue
    next();
  }
};

module.exports = uploadMiddleware;