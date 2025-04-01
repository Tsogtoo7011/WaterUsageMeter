const jwt = require('jsonwebtoken');
const { handleError } = require('../utils/errorHandler');

exports.authenticate = async (req, res, next) => {
  try {
    // Get token from different possible sources
    const token = 
      req.cookies.authToken || 
      (req.headers.authorization && req.headers.authorization.startsWith('Bearer') 
        ? req.headers.authorization.split(' ')[1] 
        : null) ||
      req.query.token; // Also check query parameters
    
    if (!token) {
      return res.status(401).json({ message: 'Нэвтрэх шаардлагатай' });
    }
    
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    // If token verification fails
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Хүчингүй эсвэл хугацаа дууссан токен' });
    }
    handleError(res, error, 'Authentication');
  }
};