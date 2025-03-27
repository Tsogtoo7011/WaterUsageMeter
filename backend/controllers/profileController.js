// backend/controllers/profileController.js
const pool = require('../config/db');

const handleError = (res, error, context) => {
  console.error(`${context} error:`, error);
  res.status(500).json({ message: 'Серверийн алдаа' });
};

exports.getProfile = async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT UserId, Username, Email, Firstname, Lastname, Phonenumber FROM UserAdmin WHERE UserId = ?', 
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
    if (!Firstname || !Lastname || !Email) return res.status(400).json({ message: 'Овог, нэр, имэйл хаяг шаардлагатай' });

    const [result] = await pool.execute(
      'UPDATE UserAdmin SET Firstname = ?, Lastname = ?, Email = ?, Phonenumber = ? WHERE UserId = ?',
      [Firstname, Lastname, Email, Phonenumber || null, req.user.id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ message: 'Хэрэглэгч олдсонгүй' });

    res.json({ message: 'Профайл амжилттай шинэчлэгдлээ' });
  } catch (error) { 
    console.error(error);
    handleError(res, error, 'Update profile'); 
  }
};

exports.getApartments = async (req, res) => {
  try {
    const [apartments] = await pool.execute(
      'SELECT * FROM Apartment WHERE UserAdminUserId = ?', [req.user.id]
    );
    res.json(apartments);
  } catch (error) { 
    handleError(res, error, 'Байрны мэдээлэл авах'); 
  }
};

exports.createApartment = async (req, res) => {
  try {
    const { ApartmentType, SerialNumber, City, District, SubDistrict, Street, Number } = req.body;
    if (!ApartmentType || !SerialNumber || !City || !District || !SubDistrict || !Street || !Number) 
      return res.status(400).json({ message: 'Бүх шаардлагатай талбарыг бөглөнө үү' });

    const [result] = await pool.execute(
      'INSERT INTO Apartment (UserAdminUserId, ApartmentType, SerialNumber, City, District, SubDistrict, Street, Number) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
      [req.user.id, ApartmentType, SerialNumber, City, District, SubDistrict, Street, Number]
    );
    res.status(201).json({ id: result.insertId, ApartmentType, SerialNumber, City, District, SubDistrict, Street, Number });
  } catch (error) { 
    handleError(res, error, 'Байрны мэдээлэл хадгалах'); 
  }
};