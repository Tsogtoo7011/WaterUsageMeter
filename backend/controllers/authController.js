const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');
const { handleError } = require('../utils/errorHandler');
const { generateVerificationToken, sendVerificationEmail } = require('../utils/authUtils');

const TOKEN_EXPIRY_MINUTES = 30;
const ACCESS_TOKEN_EXPIRY = '15m';  
const REFRESH_TOKEN_EXPIRY = '7d'; 
const PASSWORD_MIN_LENGTH = 8;

exports.signup = async (req, res) => {
  try {
    const { username, email, password, firstname, lastname, phonenumber } = req.body;

    if (!username || !email || !password || !firstname || !lastname || !phonenumber) {
      return res.status(400).json({ message: 'Бүх талбарыг бөглөнө үү' });
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      return res.status(400).json({ message: `Нууц үг ${PASSWORD_MIN_LENGTH} тэмдэгтээс урт байх ёстой` });
    }

    const phoneInt = parseInt(phonenumber);
    if (isNaN(phoneInt) || phonenumber.length !== 8) {
      return res.status(400).json({ message: 'Утасны дугаар 8 оронтой байх ёстой' });
    }

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
    tokenExpiry.setMinutes(tokenExpiry.getMinutes() + TOKEN_EXPIRY_MINUTES);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const refreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);

    const [result] = await pool.execute(
      `INSERT INTO UserAdmin 
      (Username, Email, Password, Firstname, Lastname, Phonenumber, AdminRight, 
      VerificationToken, TokenExpiry, IsVerified, RefreshToken, RefreshTokenExpiry) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [username, email, hashedPassword, firstname, lastname, phoneInt, 0, 
       verificationToken, tokenExpiry, 0, refreshToken, refreshTokenExpiry]
    );

    const accessToken = jwt.sign(
      { id: result.insertId, username, isVerified: false }, 
      process.env.JWT_SECRET, 
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
 
    const [newUser] = await pool.execute(
      'SELECT UserId, Username, Email, Firstname, Lastname, Phonenumber FROM UserAdmin WHERE UserId = ?', 
      [result.insertId]
    );

    try {
      await sendVerificationEmail(email, verificationToken, firstname);
      
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 15 * 60 * 1000, 
        sameSite: 'strict'
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, 
        sameSite: 'strict',
        path: '/api/auth/refresh' 
      });

      res.status(201).json({ 
        accessToken, 
        user: newUser[0],
        emailSent: true,
        message: 'Бүртгэл амжилттай үүсгэгдлээ. Имэйл хаягаа баталгаажуулна уу.'
      });
    } catch (emailError) {
      console.error('Verification email error details:', emailError);

      res.status(201).json({ 
        accessToken, 
        user: newUser[0],
        emailSent: false,
        message: 'Бүртгэл амжилттай үүсгэгдлээ. Баталгаажуулах имэйл илгээхэд алдаа гарлаа. Дараа дахин оролдоно уу.'
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

    const [users] = await pool.execute('SELECT * FROM UserAdmin WHERE Username = ?', [username]);
    if (users.length === 0) {
      return res.status(400).json({ message: 'Хэрэглэгчийн нэр эсвэл нууц үг буруу байна' });
    }

    const user = users[0];

    const isPasswordValid = await bcrypt.compare(password, user.Password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Хэрэглэгчийн нэр эсвэл нууц үг буруу байна' });
    }

    const isVerified = user.IsVerified === 1;
    const isAdmin = user.AdminRight === 1;

    const accessToken = jwt.sign(
      { 
        id: user.UserId, 
        username: user.Username, 
        isVerified,
        isAdmin
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
    
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); 

    await pool.execute(
      'UPDATE UserAdmin SET RefreshToken = ?, RefreshTokenExpiry = ? WHERE UserId = ?',
      [refreshToken, refreshTokenExpiry, user.UserId]
    );

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000, 
      sameSite: 'strict'
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, 
      path: '/api/auth/refresh' 
    });

    const { Password, VerificationToken, TokenExpiry, RefreshToken, RefreshTokenExpiry, ...userData } = user;

    res.json({ 
      user: {
        ...userData,
        isVerified
      }, 
      accessToken: accessToken, 
      message: 'Амжилттай нэвтэрлээ' 
    });
  } catch (error) { 
    handleError(res, error, 'Signin'); 
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ message: 'Шинэчлэх токен байхгүй байна' });
    }

    const [users] = await pool.execute(
      'SELECT * FROM UserAdmin WHERE RefreshToken = ? AND RefreshTokenExpiry > NOW()',
      [refreshToken]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Шинэчлэх токен хүчингүй байна эсвэл хугацаа нь дууссан' });
    }

    const user = users[0];
    const isVerified = user.IsVerified === 1;
    const isAdmin = user.AdminRight === 1;

    const accessToken = jwt.sign(
      { 
        id: user.UserId, 
        username: user.Username, 
        isVerified,
        isAdmin
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000,
      sameSite: 'strict'
    });

    res.json({ 
      accessToken,
      message: 'Токен амжилттай шинэчлэгдлээ'
    });
  } catch (error) {
    handleError(res, error, 'Refresh Token');
  }
};

exports.logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (refreshToken) {

      await pool.execute(
        'UPDATE UserAdmin SET RefreshToken = NULL, RefreshTokenExpiry = NULL WHERE RefreshToken = ?',
        [refreshToken]
      );
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
    
    res.status(200).json({ message: 'Амжилттай гарлаа' });
  } catch (error) {
    handleError(res, error, 'Logout');
  }
};
