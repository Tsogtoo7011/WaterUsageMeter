const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { handleError } = require('../utils/errorHandler');
const { generateVerificationToken, sendVerificationEmail } = require('../utils/authUtils');

exports.signup = async (req, res) => {
  try {
    const { username, email, password, firstname, lastname, phonenumber } = req.body;

    const [existingUser] = await pool.execute('SELECT * FROM UserAdmin WHERE Username = ?', [username]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'Хэрэглэгчийн нэр бүртгэлтэй байна' });
    }
    
    const [existingEmail] = await pool.execute('SELECT * FROM UserAdmin WHERE Email = ?', [email]);
    if (existingEmail.length > 0) {
      return res.status(400).json({ message: 'Имэйл хаяг бүртгэлтэй байна' });
    }

    const verificationToken = generateVerificationToken();
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24);

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Insert user with verification token and isVerified = 0
    const [result] = await pool.execute(
      `INSERT INTO UserAdmin 
      (Username, Email, Password, Firstname, Lastname, Phonenumber, AdminRight, VerificationToken, TokenExpiry, IsVerified) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [username, email, hashedPassword, firstname, lastname, phonenumber || null, 0, verificationToken, tokenExpiry, 0]
    );

    // Create token for immediate login (but with limited permissions)
    const token = jwt.sign(
      { id: result.insertId, username, isVerified: false }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );
    
    // Get the new user data
    const [newUser] = await pool.execute(
      'SELECT UserId, Username, Email, Firstname, Lastname, Phonenumber FROM UserAdmin WHERE UserId = ?', 
      [result.insertId]
    );

    try {
      // Log email configuration before sending
      console.log('About to send verification email');
      console.log('Frontend URL:', process.env.FRONTEND_URL);
      console.log('Token:', verificationToken);
      
      // Send verification email
      await sendVerificationEmail(email, verificationToken, firstname);
      
      res.status(201).json({ 
        token, 
        user: newUser[0],
        emailSent: true,
        message: 'Бүртгэл амжилттай үүсгэгдлээ. Имэйл хаягаа баталгаажуулна уу.'
      });
    } catch (emailError) {
      console.error('Verification email error details:', emailError);
      
      // Still return success but with a note about the email issue
      res.status(201).json({ 
        token, 
        user: newUser[0],
        emailSent: false,
        message: 'Бүртгэл амжилттай үүсгэгдлээ. Баталгаажуулах имэйл илгээхэд алдаа гарлаа. Дараа дахин оролдоно уу.',
        emailError: emailError.message // For debugging, remove in production
      });
    }
  } catch (error) { 
    console.error('Signup error:', error);
    handleError(res, error, 'Signup'); 
  }
};

exports.signin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username
    const [users] = await pool.execute('SELECT * FROM UserAdmin WHERE Username = ?', [username]);
    if (users.length === 0) {
      return res.status(400).json({ message: 'Хэрэглэгчийн нэр эсвэл нууц үг буруу байна' });
    }

    const user = users[0];
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.Password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Хэрэглэгчийн нэр эсвэл нууц үг буруу байна' });
    }

    // Check if email is verified
    const isVerified = user.IsVerified === 1;
    if (!isVerified) {
      return res.status(401).json({ 
        message: 'Таны имэйл хаяг баталгаажаагүй байна. Баталгаажуулах имэйлийг шалгана уу.',
        verified: false,
        email: user.Email
      });
    }

    // Determine admin status from database only
    const isAdmin = user.AdminRight === 1;

    // Create JWT token with user information
    const token = jwt.sign(
      { 
        id: user.UserId, 
        username: user.Username, 
        isVerified,
        isAdmin // Based on database value only
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );
    
    // Set secure HTTP-only cookie
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', 
      maxAge: 24 * 60 * 60 * 1000, 
      sameSite: 'strict'
    });
    
    // Remove sensitive data before sending response
    const { Password, VerificationToken, TokenExpiry, ...userData } = user;
    
    // Send response
    res.json({ 
      user: userData, 
      token: token, 
      message: 'Амжилттай нэвтэрлээ' 
    });
  } catch (error) { 
    handleError(res, error, 'Signin'); 
  }
};