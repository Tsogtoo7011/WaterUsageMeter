const jwt = require('jsonwebtoken');

exports.authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.accessToken;
    
    if (!token) {
      return res.status(401).json({
        message: 'Нэвтрэх эрх байхгүй байна'
      });
    }
    
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
   
    req.userData = {
      userId: decodedToken.id,
      username: decodedToken.username,
      IsVerified: decodedToken.isVerified === true || decodedToken.isVerified === 1,
      AdminRight: decodedToken.isAdmin ? 1 : 0
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    return res.status(401).json({
      message: 'Нэвтрэх эрх байхгүй байна'
    });
  }
};

exports.adminOnly = (req, res, next) => {
  if (!req.userData || req.userData.AdminRight !== 1) {
    return res.status(403).json({
      message: 'Админ эрх байхгүй байна'
    });
  }
  next();
};

exports.verifiedOnly = (req, res, next) => {
  if (!req.userData || req.userData.IsVerified !== true) {
    return res.status(403).json({
      message: 'Та имэйл хаягаа баталгаажуулах шаардлагатай'
    });
  }
  next();
};