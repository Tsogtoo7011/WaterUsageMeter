const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { handleError } = require('../utils/errorHandler');
const { generateVerificationToken, sendVerificationEmail } = require('../utils/authUtils');

exports.signup = async (req, res) => {
  try {
    const { username, email, password, firstname, lastname, phonenumber } = req.body;

    if (!username || !email || !password || !firstname || !lastname || !phonenumber) {
      return res.status(400).json({ message: 'Бүх талбарыг бөглөнө үү' });
    }

    const phoneInt = parseInt(phonenumber);
    if (isNaN(phoneInt) || phoneInt.toString().length !== 8) {
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
    tokenExpiry.setMinutes(tokenExpiry.getMinutes() + 3);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await pool.execute(
      `INSERT INTO UserAdmin 
      (Username, Email, Password, Firstname, Lastname, Phonenumber, AdminRight, VerificationToken, TokenExpiry, IsVerified) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [username, email, hashedPassword, firstname, lastname, phoneInt, 0, verificationToken, tokenExpiry, 0]
    );

    const token = jwt.sign(
      { id: result.insertId, username, isVerified: false }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );
 
    const [newUser] = await pool.execute(
      'SELECT UserId, Username, Email, Firstname, Lastname, Phonenumber FROM UserAdmin WHERE UserId = ?', 
      [result.insertId]
    );

    try {

      await sendVerificationEmail(email, verificationToken, firstname);
      
      res.status(201).json({ 
        token, 
        user: newUser[0],
        emailSent: true,
        message: 'Бүртгэл амжилттай үүсгэгдлээ. Имэйл хаягаа 3 минутын дотор баталгаажуулна уу.'
      });
    } catch (emailError) {
      console.error('Verification email error details:', emailError);

      res.status(201).json({ 
        token, 
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
    if (!isVerified) {
      return res.status(401).json({ 
        message: 'Таны имэйл хаяг баталгаажаагүй байна. Баталгаажуулах имэйлийг шалгана уу.',
        verified: false,
        email: user.Email
      });
    }

    const isAdmin = user.AdminRight === 1;

    const token = jwt.sign(
      { 
        id: user.UserId, 
        username: user.Username, 
        isVerified,
        isAdmin
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );

    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', 
      maxAge: 24 * 60 * 60 * 1000, 
      sameSite: 'strict'
    });

    const { Password, VerificationToken, TokenExpiry, ...userData } = user;

    res.json({ 
      user: userData, 
      token: token, 
      message: 'Амжилттай нэвтэрлээ' 
    });
  } catch (error) { 
    handleError(res, error, 'Signin'); 
  }
};