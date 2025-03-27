// backend/controllers/authController.js
const User = require('../models/User');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Error handling utility
const handleError = (res, error, context) => {
    console.error(`${context} error:`, error);
    if (error.name === 'JsonWebTokenError') return res.status(401).json({ message: 'Хүчингүй токен' });
    res.status(500).json({ message: 'Серверийн алдаа' });
  };

// Email sending function
const sendVerificationEmail = async (user) => {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  user.verificationToken = verificationToken;
  user.verificationTokenExpires = Date.now() + 3600000; // 1 hour
  await user.save();

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: 'tsogtoo7011@gmail.com',
    to: user.email,
    subject: 'Verify Your Email',
    html: `
      <h1>Email Verification</h1>
      <p>Click the link below to verify your email:</p>
      <a href="http://yourdomain.com/verify/${verificationToken}">Verify Email</a>
      <p>This link will expire in 1 hour.</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

// Signup controller
exports.signup = async (req, res) => {
  try {
    const { username, password, firstname, lastname, phonenumber, email } = req.body;

    // Check if user already exists
    let existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new User({
      username,
      password: hashedPassword,
      firstname,
      lastname,
      phonenumber,
      email,
      isVerified: false
    });
    
    await user.save();
    
    // Send verification email
    await sendVerificationEmail(user);

    res.status(201).json({ 
      message: 'User registered. Please check your email to verify.',
      requiresVerification: true 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Email verification controller
exports.verifyEmail = async (req, res) => {
  const { token } = req.params;

  try {
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Mark user as verified
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Verification failed' });
  }
};

// Resend verification email
exports.resendVerificationEmail = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    await sendVerificationEmail(user);

    res.status(200).json({ message: 'Verification email resent' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error resending verification email' });
  }
};
// Authentication controllers
exports.signup = async (req, res) => {
    try {
      const { username, email, password, firstname, lastname, phonenumber } = req.body;
      if (!username || !email || !password || !firstname || !lastname) 
        return res.status(400).json({ message: 'Бүх шаардлагатай талбарыг бөглөнө үү' });
  
      const [existingUser] = await pool.execute('SELECT * FROM UserAdmin WHERE Username = ?', [username]);
      const [existingEmail] = await pool.execute('SELECT * FROM UserAdmin WHERE Email = ?', [email]);
  
      if (existingUser.length) return res.status(400).json({ message: 'Хэрэглэгчийн нэр бүртгэлтэй байна' });
      if (existingEmail.length) return res.status(400).json({ message: 'Имэйл хаяг бүртгэлтэй байна' });
  
      const hashedPassword = await bcrypt.hash(password, 10);
      const [result] = await pool.execute(
        'INSERT INTO UserAdmin (Username, Email, Password, Firstname, Lastname, Phonenumber, AdminRight) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [username, email, hashedPassword, firstname, lastname, phonenumber || null, 0]
      );
  
      const token = jwt.sign({ id: result.insertId, username }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.status(201).json({ token, user: { id: result.insertId, username, email, firstname, lastname, phonenumber } });
    } catch (error) { 
      handleError(res, error, 'Signup'); 
    }
  };
  
  exports.signin = async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) return res.status(400).json({ message: 'Хэрэглэгчийн нэр болон нууц үгээ оруулна уу' });
  
      const [users] = await pool.execute('SELECT * FROM UserAdmin WHERE Username = ?', [username]);
      if (!users.length) return res.status(400).json({ message: 'Хэрэглэгчийн нэр эсвэл нууц үг буруу байна' });
  
      const user = users[0];
      if (!await bcrypt.compare(password, user.Password)) return res.status(400).json({ message: 'Хэрэглэгчийн нэр эсвэл нууц үг буруу байна' });
  
      const token = jwt.sign({ id: user.UserId, username: user.Username }, process.env.JWT_SECRET, { expiresIn: '1h' });
      const { Password, ...userData } = user;
      res.json({ token, user: userData });
    } catch (error) { 
      handleError(res, error, 'Signin'); 
    }
  };