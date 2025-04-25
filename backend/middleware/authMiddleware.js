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
      IsVerified: decodedToken.IsVerified === 1 || decodedToken.IsVerified === true,
      AdminRight: decodedToken.AdminRight || 0
    };
    
    next();
  } catch (error) {
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
  if (!req.userData || !req.userData.IsVerified) {
    return res.status(403).json({
      message: 'Та имэйл хаягаа баталгаажуулах шаардлагатай'
    });
  }
  next();
};
