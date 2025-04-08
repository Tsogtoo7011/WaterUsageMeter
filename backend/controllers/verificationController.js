const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { handleError } = require('../utils/errorHandler');
const { generateVerificationToken, sendVerificationEmail } = require('../utils/authUtils');

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    
    console.log('Received verification request with token:', token);
    
    if (!token) {
      console.log('No token provided in request');
      return res.status(400).json({ message: 'Баталгаажуулах токен олдсонгүй' });
    }
    
    // Find user with this token
    console.log('Searching for user with token...');
    const [users] = await pool.execute(
      'SELECT * FROM UserAdmin WHERE VerificationToken = ? AND TokenExpiry > NOW() AND IsVerified = 0',
      [token]
    );

    console.log(`Found ${users.length} matching users`);

    if (users.length === 0) {
      // Check if any token exists but has expired
      const [expiredTokens] = await pool.execute(
        'SELECT * FROM UserAdmin WHERE VerificationToken = ? AND TokenExpiry <= NOW() AND IsVerified = 0',
        [token]
      );
      
      if (expiredTokens.length > 0) {
        console.log('Token found but expired');
        return res.status(400).json({ 
          message: 'Баталгаажуулах токен хугацаа нь дууссан байна. Шинэ токен авна уу.' 
        });
      }
      
      // Check if already verified
      const [verifiedUsers] = await pool.execute(
        'SELECT * FROM UserAdmin WHERE VerificationToken = ? AND IsVerified = 1',
        [token]
      );
      
      if (verifiedUsers.length > 0) {
        console.log('User already verified');
        return res.status(400).json({ 
          message: 'Энэ хаяг аль хэдийн баталгаажсан байна' 
        });
      }
      
      console.log('Token not found in database');
      return res.status(400).json({ 
        message: 'Баталгаажуулах токен хүчингүй байна' 
      });
    }

    const user = users[0];
    console.log(`Verifying user: ${user.Username}`);

    // Update user to verified
    await pool.execute(
      'UPDATE UserAdmin SET IsVerified = 1, VerificationToken = NULL, TokenExpiry = NULL WHERE UserId = ?',
      [user.UserId]
    );

    console.log('User verification successful');

    // Create new token with verified status
    const newToken = jwt.sign(
      { id: user.UserId, username: user.Username, isVerified: true }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );

    res.json({ 
      success: true, 
      message: 'Имэйл хаяг амжилттай баталгаажлаа',
      token: newToken
    });
  } catch (error) {
    console.error('Email verification error:', error);
    handleError(res, error, 'Email verification');
  }
};

exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Имэйл хаяг оруулна уу' });
    }

    // Find user by email
    const [users] = await pool.execute(
      'SELECT * FROM UserAdmin WHERE Email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(200).json({ 
        message: 'Баталгаажуулах имэйл илгээгдлээ. Та и-мэйлээ шалгана уу.' 
      });
    }

    const user = users[0];

    // Skip if already verified
    if (user.IsVerified === 1) {
      return res.status(400).json({ message: 'Энэ хаяг аль хэдийн баталгаажсан байна' });
    }

    // Generate new verification token and set expiry
    const verificationToken = generateVerificationToken();
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24);

    // Update user with new token
    await pool.execute(
      'UPDATE UserAdmin SET VerificationToken = ?, TokenExpiry = ? WHERE UserId = ?',
      [verificationToken, tokenExpiry, user.UserId]
    );

    // Send verification email
    await sendVerificationEmail(email, verificationToken, user.Firstname);

    res.json({ message: 'Баталгаажуулах имэйл дахин илгээгдлээ' });
  } catch (error) {
    handleError(res, error, 'Resend verification');
  }
};