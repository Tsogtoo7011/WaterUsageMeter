// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const { handleError } = require('../utils/errorHandler');

exports.authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Нэвтрэх шаардлагатай' });
    
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    handleError(res, error, 'Authentication');
  }
};

// This middleware requires the user to be verified
exports.requireVerified = async (req, res, next) => {
  try {
    if (!req.user.isVerified) {
      return res.status(403).json({ message: 'Энэ үйлдлийг гүйцэтгэхийн тулд имэйл хаягаа баталгаажуулна уу' });
    }
    next();
  } catch (error) {
    handleError(res, error, 'Verification Check');
  }
};