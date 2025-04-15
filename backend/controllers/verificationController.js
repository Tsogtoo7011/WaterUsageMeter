const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const { handleError } = require('../utils/errorHandler');
const { generateVerificationToken, sendVerificationEmail } = require('../utils/authUtils');

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ message: 'Баталгаажуулах токен байхгүй байна' });
    }

    const [users] = await pool.execute(
      'SELECT * FROM UserAdmin WHERE VerificationToken = ?',
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'Токен хүчингүй эсвэл аль хэдийн ашиглагдсан байна' });
    }

    const user = users[0];

    const tokenExpiry = new Date(user.TokenExpiry);
    const now = new Date();
    
    if (now > tokenExpiry) {
      return res.status(400).json({ 
        message: 'Баталгаажуулах токены хугацаа дууссан байна. Шинэ токен авна уу.',
        expired: true,
        email: user.Email
      });
    }

    await pool.execute(
      'UPDATE UserAdmin SET IsVerified = 1, VerificationToken = NULL, TokenExpiry = NULL WHERE UserId = ?',
      [user.UserId]
    );

    const authToken = jwt.sign(
      { 
        id: user.UserId, 
        username: user.Username, 
        isVerified: true,
        isAdmin: user.AdminRight === 1
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.redirect(`${process.env.FRONTEND_URL}/verification-success?token=${authToken}`);
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
    tokenExpiry.setMinutes(tokenExpiry.getMinutes() + 3);

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