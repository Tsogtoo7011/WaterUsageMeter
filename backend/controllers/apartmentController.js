const pool = require('../config/db');
const { handleError } = require('../utils/errorHandler');

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