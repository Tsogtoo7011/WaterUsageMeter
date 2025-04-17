const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const { handleError } = require('../utils/errorHandler');
const { generateVerificationToken, sendVerificationEmail } = require('../utils/authUtils');

const TOKEN_EXPIRY_MINUTES = 30; 
const ACCESS_TOKEN_EXPIRY = '15m';

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Баталгаажуулах токен байхгүй байна'
      });
    }
    
    const [users] = await pool.execute(
      'SELECT * FROM UserAdmin WHERE VerificationToken = ?',
      [token]
    );
    
    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Токен хүчингүй эсвэл аль хэдийн ашиглагдсан байна'
      });
    }
    
    const user = users[0];
    
    const tokenExpiry = new Date(user.TokenExpiry);
    const now = new Date();
    
    if (now > tokenExpiry) {
      return res.status(400).json({
        success: false,
        message: 'Баталгаажуулах токены хугацаа дууссан байна. Шинэ токен авна уу.',
        expired: true,
        email: user.Email
      });
    }
    
    await pool.execute(
      'UPDATE UserAdmin SET IsVerified = 1, VerificationToken = NULL, TokenExpiry = NULL WHERE UserId = ?',
      [user.UserId]
    );
    
    const accessToken = jwt.sign(
      {
        id: user.UserId,
        username: user.Username,
        isVerified: true,
        isAdmin: user.AdminRight === 1
      },
      process.env.JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
    
    // Set access token in cookie
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000, // 15 minutes
      sameSite: 'strict'
    });
    
    return res.status(200).json({
      success: true,
      message: 'Таны имэйл хаяг амжилттай баталгаажлаа!',
      accessToken: accessToken
    });
  } catch (error) {
    handleError(res, error, 'Email Verification');
  }
};

exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Имэйл хаяг шаардлагатай' });
    }
    
    const [recentAttempts] = await pool.execute(
      'SELECT COUNT(*) as count FROM UserAdmin WHERE Email = ? AND TokenExpiry > DATE_SUB(NOW(), INTERVAL 5 MINUTE)',
      [email]
    );
    
    if (recentAttempts[0].count > 0) {
      return res.status(429).json({
        message: 'Дахин оролдохоос өмнө 5 минут хүлээнэ үү',
        retryAfter: 300
      });
    }
    
    const [users] = await pool.execute('SELECT * FROM UserAdmin WHERE Email = ?', [email]);
    
    if (users.length === 0) {
      return res.status(200).json({ message: 'Баталгаажуулах холбоос илгээгдлээ, хэрэв энэ имэйл бүртгэлтэй бол' });
    }
    
    const user = users[0];
    
    if (user.IsVerified === 1) {
      return res.status(400).json({ message: 'Энэ хаяг аль хэдийн баталгаажсан байна' });
    }
    
    const verificationToken = generateVerificationToken();
    const tokenExpiry = new Date();
    tokenExpiry.setMinutes(tokenExpiry.getMinutes() + TOKEN_EXPIRY_MINUTES);
    
    await pool.execute(
      'UPDATE UserAdmin SET VerificationToken = ?, TokenExpiry = ? WHERE UserId = ?',
      [verificationToken, tokenExpiry, user.UserId]
    );
    
    await sendVerificationEmail(email, verificationToken, user.Firstname);
    
    res.status(200).json({ message: 'Баталгаажуулах имэйл илгээгдлээ. Имэйл хаягаа шалгана уу.' });
  } catch (error) {
    handleError(res, error, 'Resend Verification');
  }
};