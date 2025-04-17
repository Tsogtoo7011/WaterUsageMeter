const pool = require('../config/db'); 
const { handleError } = require('../utils/errorHandler');  

exports.getProfile = async (req, res) => {
  try {

    const userId = req.userData.userId;
    
    const [users] = await pool.execute(
      'SELECT UserId, Username, Email, Firstname, Lastname, Phonenumber, IsVerified, AdminRight FROM UserAdmin WHERE UserId = ?',
      [userId]
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

    const userId = req.userData.userId;
    
    await pool.execute(
      'UPDATE UserAdmin SET Firstname = ?, Lastname = ?, Email = ?, Phonenumber = ? WHERE UserId = ?',
      [Firstname, Lastname, Email, Phonenumber || null, userId]
    );
    
    const [users] = await pool.execute(
      'SELECT UserId, Username, Email, Firstname, Lastname, Phonenumber FROM UserAdmin WHERE UserId = ?',
      [userId]
    );
        
    res.json(users[0]);
  } catch (error) {
    handleError(res, error, 'Update profile');
  }
};