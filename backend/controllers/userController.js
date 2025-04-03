  const bcrypt = require('bcryptjs');
  const jwt = require('jsonwebtoken');
  const crypto = require('crypto');
  const pool = require('../config/db');
  const { handleError } = require('../utils/errorHandler');
  const sendEmail = require('../utils/emailService');

  const generateVerificationToken = () => {
    return crypto.randomBytes(32).toString('hex');
  };

  const sendVerificationEmail = async (email, token, firstname) => {

    const encodedToken = encodeURIComponent(token);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const verificationUrl = `${frontendUrl}/user/verify-email?token=${encodedToken}`;
    
    console.log(`Sending verification email to ${email} with URL: ${verificationUrl}`);
    
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
  
      // Create token with admin rights information
      const token = jwt.sign(
        { 
          id: user.UserId, 
          username: user.Username, 
          isVerified,
          isAdmin: user.AdminRight === 1 
        }, 
        process.env.JWT_SECRET, 
        { expiresIn: '24h' }
      );
      
      // Set cookie
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