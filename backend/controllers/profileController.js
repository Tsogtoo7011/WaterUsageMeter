const pool = require('../config/db');
const { handleError } = require('../utils/errorHandler');

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