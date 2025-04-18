const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const pool = require('../config/db');
const { handleError } = require('../utils/errorHandler');
const sendEmail = require('../utils/emailService');

// Request password reset
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Имэйл хаяг оруулна уу' });
    }
    
    // Find user by email
    const [users] = await pool.execute('SELECT * FROM UserAdmin WHERE Email = ?', [email]);
    
    // Don't reveal if email exists or not
    if (!users.length) {
      return res.status(200).json({ 
        message: 'Нууц үг шинэчлэх зааврыг имэйлээр илгээлээ. Имэйлээ шалгана уу.' 
      });
    }
    
    const user = users[0];
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
    
    // Hash the token before storing it
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    // Store token in database
    await pool.execute(
      'UPDATE UserAdmin SET ResetPasswordToken = ?, ResetPasswordExpiry = ? WHERE UserId = ?',
      [hashedToken, resetTokenExpiry, user.UserId]
    );
    
    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    // Send email
    await sendEmail({
      to: user.Email,
      subject: 'Нууц үг шинэчлэх хүсэлт',
      html: `
        <h1>Нууц үг шинэчлэх</h1>
        <p>Сайн байна уу, ${user.Firstname}!</p>
        <p>Та нууц үгээ шинэчлэх хүсэлт илгээсэн байна. Доорх холбоос дээр дарж нууц үгээ шинэчилнэ үү:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Нууц үг шинэчлэх</a>
        <p>Энэхүү холбоос нь 1 цагийн дараа хүчингүй болно.</p>
        <p>Хэрэв та энэ хүсэлтийг илгээгээгүй бол энэ имэйлийг орхигдуулна уу.</p>
      `
    });
    
    res.json({ message: 'Нууц үг шинэчлэх зааврыг имэйлээр илгээлээ' });
  } catch (error) {
    handleError(res, error, 'Forgot password');
  }
};

// Reset password with token
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ message: 'Токен болон шинэ нууц үг оруулна уу' });
    }
    
    // Hash the token to compare with stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // Find user with this token and valid expiry
    const [users] = await pool.execute(
      'SELECT * FROM UserAdmin WHERE ResetPasswordToken = ? AND ResetPasswordExpiry > NOW()',
      [hashedToken]
    );
    
    if (!users.length) {
      return res.status(400).json({ 
        message: 'Токен хүчингүй эсвэл хугацаа нь дууссан байна' 
      });
    }
    
    // Validate password strength
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: 'Нууц үг доод тал нь 6 тэмдэгт байх ба 1 онцгой тэмдэг, 1 тоо агуулсан байх ёстой'
      });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));
    
    // Update user password and clear reset token
    await pool.execute(
      'UPDATE UserAdmin SET Password = ?, ResetPasswordToken = NULL, ResetPasswordExpiry = NULL WHERE UserId = ?',
      [hashedPassword, users[0].UserId]
    );
    
    res.json({ message: 'Нууц үг амжилттай шинэчлэгдлээ' });
  } catch (error) {
    handleError(res, error, 'Reset password');
  }
};