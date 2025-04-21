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
      isVerified: decodedToken.isVerified,
      isAdmin: decodedToken.isAdmin
    };
    
    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Нэвтрэх эрх байхгүй байна'
    });
  }
};

exports.adminOnly = (req, res, next) => {
  if (!req.userData.isAdmin) {
    return res.status(403).json({
      message: 'Админ эрх байхгүй байна'
    });
  }
  next();
};
exports.verifiedOnly = (req, res, next) => {
  console.log("Verification check:", {
    userData: req.userData,
    isVerified: req.userData?.verified, 
    email: req.userData?.email
  });
  
  if (!req.userData || req.userData.verified !== 1) { 
    return res.status(403).json({ 
      message: 'Та имэйл хаягаа баталгаажуулсны дараа санал хүсэлт илгээх боломжтой.' 
    });
  }
  next();
};