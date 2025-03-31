const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');
const { handleError } = require('../utils/errorHandler');
const sendEmail = require('../utils/emailService');

// Helper function to generate verification token
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Helper function to send verification email
const sendVerificationEmail = async (email, token, firstname) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  
  await sendEmail({
    to: email,
    subject: 'Имэйл хаягаа баталгаажуулна уу',
    html: `
      <h1>Имэйл хаягаа баталгаажуулна уу</h1>
      <p>Сайн байна уу, ${firstname}!</p>
      <p>Бүртгэлээ дуусгахын тулд доорх холбоос дээр дарна уу:</p>
      <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Имэйл хаягаа баталгаажуулах</a>
      <p>Энэхүү холбоос нь 24 цагийн дараа хүчингүй болно.</p>
      <p>Хэрэв та бүртгүүлээгүй бол энэ имэйлийг орхигдуулна уу.</p>
    `
  });
};

// User authentication
exports.signup = async (req, res) => {
  try {
    const { username, email, password, firstname, lastname, phonenumber } = req.body;

    // Check if username or email already exists
    const [[existingUser], [existingEmail]] = await Promise.all([
      pool.execute('SELECT * FROM UserAdmin WHERE Username = ?', [username]),
      pool.execute('SELECT * FROM UserAdmin WHERE Email = ?', [email])
    ]);

    if (existingUser.length) return res.status(400).json({ message: 'Хэрэглэгчийн нэр бүртгэлтэй байна' });
    if (existingEmail.length) return res.status(400).json({ message: 'Имэйл хаяг бүртгэлтэй байна' });

    // Generate verification token and set expiry
    const verificationToken = generateVerificationToken();
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24); // Token valid for 24 hours

    // Hash password
    const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));
    
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
    const [[newUser]] = await pool.execute(
      'SELECT UserId, Username, Email, Firstname, Lastname, Phonenumber FROM UserAdmin WHERE UserId = ?', 
      [result.insertId]
    );

    try {
      // Send verification email - now in a try/catch block to prevent failure
      await sendVerificationEmail(email, verificationToken, firstname);
    } catch (emailError) {
      console.error('Verification email error:', emailError);
      
      // Still return success but with a note about the email issue
      return res.status(201).json({ 
        token, 
        user: newUser[0],
        emailSent: false,
        message: 'Бүртгэл амжилттай үүсгэгдлээ. Баталгаажуулах имэйл илгээхэд алдаа гарлаа. Дараа дахин оролдоно уу.'
      });
    }

    res.status(201).json({ 
      token, 
      user: newUser[0],
      emailSent: true,
      message: 'Бүртгэл амжилттай үүсгэгдлээ. Имэйл хаягаа баталгаажуулна уу.'
    });
  } catch (error) { 
    handleError(res, error, 'Signup'); 
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ message: 'Баталгаажуулах токен олдсонгүй' });
    }

    // Find user with this token
    const [users] = await pool.execute(
      'SELECT * FROM UserAdmin WHERE VerificationToken = ? AND TokenExpiry > NOW() AND IsVerified = 0',
      [token]
    );

    if (!users.length) {
      return res.status(400).json({ 
        message: 'Баталгаажуулах токен хүчингүй эсвэл хугацаа нь дууссан байна' 
      });
    }

    // Update user to verified
    await pool.execute(
      'UPDATE UserAdmin SET IsVerified = 1, VerificationToken = NULL, TokenExpiry = NULL WHERE UserId = ?',
      [users[0].UserId]
    );

    // Create new token with verified status
    const newToken = jwt.sign(
      { id: users[0].UserId, username: users[0].Username, isVerified: true }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );

    res.json({ 
      success: true, 
      message: 'Имэйл хаяг амжилттай баталгаажлаа',
      token: newToken
    });
  } catch (error) {
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

    if (!users.length) {
      // Don't reveal if email exists or not (security best practice)
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

exports.signin = async (req, res) => {
  try {
    const { username, password } = req.body;

    const [users] = await pool.execute('SELECT * FROM UserAdmin WHERE Username = ?', [username]);
    if (!users.length) return res.status(400).json({ message: 'Хэрэглэгчийн нэр эсвэл нууц үг буруу байна' });

    const user = users[0];
    if (!await bcrypt.compare(password, user.Password)) {
      return res.status(400).json({ message: 'Хэрэглэгчийн нэр эсвэл нууц үг буруу байна' });
    }

    // Check if user is verified
    const isVerified = user.IsVerified === 1;
    
    if (!isVerified) {
      return res.status(401).json({ 
        message: 'Таны имэйл хаяг баталгаажаагүй байна. Баталгаажуулах имэйлийг шалгана уу.',
        verified: false,
        email: user.Email
      });
    }

    const token = jwt.sign(
      { id: user.UserId, username: user.Username, isVerified }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );
    
    const { Password, VerificationToken, TokenExpiry, ...userData } = user;
    res.json({ token, user: userData });
  } catch (error) { 
    handleError(res, error, 'Signin'); 
  }
};

// User profile
exports.getProfile = async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT UserId, Username, Email, Firstname, Lastname, Phonenumber, IsVerified FROM UserAdmin WHERE UserId = ?', 
      [req.user.id]
    );
    
    if (!users.length) return res.status(404).json({ message: 'Хэрэглэгч олдсонгүй' });
    res.json(users[0]);
  } catch (error) { 
    handleError(res, error, 'Profile'); 
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { Firstname, Lastname, Email, Phonenumber } = req.body;

    await pool.execute(
      'UPDATE UserAdmin SET Firstname = ?, Lastname = ?, Email = ?, Phonenumber = ? WHERE UserId = ?',
      [Firstname, Lastname, Email, Phonenumber || null, req.user.id]
    );

    const [users] = await pool.execute(
      'SELECT UserId, Username, Email, Firstname, Lastname, Phonenumber, IsVerified FROM UserAdmin WHERE UserId = ?', 
      [req.user.id]
    );
    
    res.json(users[0]);
  } catch (error) { 
    handleError(res, error, 'Update profile'); 
  }
};

// Apartment management
exports.getApartments = async (req, res) => {
  try {
    // Check if user is verified
    const [users] = await pool.execute(
      'SELECT IsVerified FROM UserAdmin WHERE UserId = ?',
      [req.user.id]
    );
    
    if (!users.length || users[0].IsVerified !== 1) {
      return res.status(403).json({ message: 'Имэйл хаягаа баталгаажуулна уу' });
    }
    
    const [apartments] = await pool.execute(
      `SELECT ApartmentId, ApartmentType, SerialNumber, City, District, SubDistrict, Street, Number
       FROM Apartment WHERE UserAdminUserId = ?`, 
      [req.user.id]
    );
    
    res.json(apartments);
  } catch (error) { 
    handleError(res, error, 'Байрны мэдээлэл авах'); 
  }
};

exports.createApartment = async (req, res) => {
  try {
    // Check if user is verified
    const [users] = await pool.execute(
      'SELECT IsVerified FROM UserAdmin WHERE UserId = ?',
      [req.user.id]
    );
    
    if (!users.length || users[0].IsVerified !== 1) {
      return res.status(403).json({ message: 'Имэйл хаягаа баталгаажуулна уу' });
    }
    
    const requiredFields = ['ApartmentType', 'SerialNumber', 'City', 'District', 'SubDistrict', 'Street', 'Number'];
    const values = [req.user.id, ...requiredFields.map(field => req.body[field])];
    
    const [result] = await pool.execute(
      `INSERT INTO Apartment (UserAdminUserId, ApartmentType, SerialNumber, City, District, SubDistrict, Street, Number)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
      values
    );

    const [newApartment] = await pool.execute(
      `SELECT ApartmentId, ApartmentType, SerialNumber, City, District, SubDistrict, Street, Number
       FROM Apartment WHERE ApartmentId = ?`, 
      [result.insertId]
    );
    
    res.status(201).json(newApartment[0]);
  } catch (error) { 
    handleError(res, error, 'Байрны мэдээлэл хадгалах'); 
  }
};