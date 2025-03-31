const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Common error handler
const handleError = (res, error, context) => {
  console.error(`${context} error:`, error);
  if (error.name === 'JsonWebTokenError') return res.status(401).json({ message: 'Хүчингүй токен' });
  res.status(500).json({ message: 'Серверийн алдаа' });
};

// Auth middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Нэвтрэх шаардлагатай' });
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    handleError(res, error, 'Authentication');
  }
};

// User routes
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password, firstname, lastname, phonenumber } = req.body;
    if (!username || !email || !password || !firstname || !lastname) return res.status(400).json({ message: 'Бүх шаардлагатай талбарыг бөглөнө үү' });

    const [[existingUser], [existingEmail]] = await Promise.all([
      pool.execute('SELECT * FROM UserAdmin WHERE Username = ?', [username]),
      pool.execute('SELECT * FROM UserAdmin WHERE Email = ?', [email])
    ]);

    if (existingUser.length) return res.status(400).json({ message: 'Хэрэглэгчийн нэр бүртгэлтэй байна' });
    if (existingEmail.length) return res.status(400).json({ message: 'Имэйл хаяг бүртгэлтэй байна' });

    const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));
    const [result] = await pool.execute(
      'INSERT INTO UserAdmin (Username, Email, Password, Firstname, Lastname, Phonenumber, AdminRight) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [username, email, hashedPassword, firstname, lastname, phonenumber || null, 0]
    );

    const token = jwt.sign({ id: result.insertId, username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const [[newUser]] = await pool.execute(
      'SELECT UserId, Username, Email, Firstname, Lastname, Phonenumber FROM UserAdmin WHERE UserId = ?', 
      [result.insertId]
    );

    res.status(201).json({ token, user: newUser[0] });
  } catch (error) { handleError(res, error, 'Signup'); }
});

router.post('/signin', async (req, res) => {
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
  } catch (error) { handleError(res, error, 'Signin'); }
});

router.get('/profile', authenticate, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT UserId, Username, Email, Firstname, Lastname, Phonenumber FROM UserAdmin WHERE UserId = ?', 
      [req.user.id]
    );
    if (!users.length) return res.status(404).json({ message: 'Хэрэглэгч олдсонгүй' });
    res.json(users[0]);
  } catch (error) { handleError(res, error, 'Profile'); }
});

router.put('/profile', authenticate, async (req, res) => {
  try {
    const { Firstname, Lastname, Email, Phonenumber } = req.body;
    if (!Firstname || !Lastname || !Email) return res.status(400).json({ message: 'Овог, нэр, имэйл хаяг шаардлагатай' });

    await pool.execute(
      'UPDATE UserAdmin SET Firstname = ?, Lastname = ?, Email = ?, Phonenumber = ? WHERE UserId = ?',
      [Firstname, Lastname, Email, Phonenumber || null, req.user.id]
    );

    const [users] = await pool.execute(
      'SELECT UserId, Username, Email, Firstname, Lastname, Phonenumber FROM UserAdmin WHERE UserId = ?', 
      [req.user.id]
    );
    res.json(users[0]);
  } catch (error) { handleError(res, error, 'Update profile'); }
});

// Apartment routes
router.get('/Profile/Apartment', authenticate, async (req, res) => {
  try {
    const [apartments] = await pool.execute(
      `SELECT ApartmentId, ApartmentType, SerialNumber, City, District, SubDistrict, Street, Number
       FROM Apartment WHERE UserAdminUserId = ?`, 
      [req.user.id]
    );
    res.json(apartments);
  } catch (error) { handleError(res, error, 'Байрны мэдээлэл авах'); }
});

router.post('/Profile/Apartment', authenticate, async (req, res) => {
  try {
    const requiredFields = ['ApartmentType', 'SerialNumber', 'City', 'District', 'SubDistrict', 'Street', 'Number'];
    if (requiredFields.some(field => !req.body[field])) return res.status(400).json({ message: 'Бүх шаардлагатай талбарыг бөглөнө үү' });

    const [result] = await pool.execute(
      `INSERT INTO Apartment (UserAdminUserId, ApartmentType, SerialNumber, City, District, SubDistrict, Street, Number)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
      [req.user.id, ...requiredFields.map(field => req.body[field])]
    );

    const [newApartment] = await pool.execute(
      `SELECT ApartmentId, ApartmentType, SerialNumber, City, District, SubDistrict, Street, Number
       FROM Apartment WHERE ApartmentId = ?`, 
      [result.insertId]
    );
    res.status(201).json(newApartment[0]);
  } catch (error) { handleError(res, error, 'Байрны мэдээлэл хадгалах'); }
});

module.exports = router;