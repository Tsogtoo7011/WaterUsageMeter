// utils/errorHandler.js
exports.handleError = (res, error, context) => {
  console.error(`${context} error:`, error);
  
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Хүчингүй токен' });
  }
  
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Токены хугацаа дууссан. Дахин нэвтэрнэ үү' });
  }
  
  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(400).json({ message: 'Бүртгэлтэй мэдээлэл байна' });
  }
  
  res.status(500).json({ message: 'Серверийн алдаа' });
};