// utils/errorHandler.js
exports.handleError = (res, error, context) => {
  console.error(`${context} error:`, error);
  
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Хүчингүй токен' });
  }
  
  res.status(500).json({ message: 'Серверийн алдаа' });
};