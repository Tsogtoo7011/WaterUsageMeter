const jwt = require('jsonwebtoken');

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Нэвтрэх шаардлагатай' });
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    if (error.name === 'JsonWebTokenError') return res.status(401).json({ message: 'Хүчингүй токен' });
    res.status(500).json({ message: 'Серверийн алдаа' });
  }
};

module.exports = authenticate;