const db = require('../config/db');
const bcrypt = require('bcryptjs');

exports.getAllUsers = async (req, res) => {
  try {
    const query = `
      SELECT 
        UserId, 
        AdminRight, 
        Username, 
        Firstname, 
        Lastname, 
        Phonenumber, 
        Email, 
        IsVerified, 
        CreatedAt, 
        UpdatedAt
      FROM UserAdmin
      ORDER BY UserId DESC
    `;
    
    const [users] = await db.query(query);
    
    res.status(200).json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    
    const query = `
      SELECT 
        UserId, 
        AdminRight, 
        Username, 
        Firstname, 
        Lastname, 
        Phonenumber, 
        Email, 
        IsVerified, 
        CreatedAt, 
        UpdatedAt
      FROM UserAdmin
      WHERE UserId = ?
    `;
    
    const [results] = await db.query(query, [userId]);
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(200).json(results[0]);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { username, firstname, lastname, phonenumber, email, adminRight } = req.body;

    if (!username || !firstname || !lastname || !email) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const duplicateQuery = 'SELECT UserId FROM UserAdmin WHERE Username = ? OR Email = ?';
    const [duplicateResults] = await db.query(duplicateQuery, [username, email]);
    if (duplicateResults.length > 0) {
      return res.status(400).json({ message: 'Username or email already in use' });
    }

    const defaultPassword = 'changeme123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    const insertQuery = `
      INSERT INTO UserAdmin (Username, Firstname, Lastname, Phonenumber, Email, AdminRight, Password, IsVerified, CreatedAt, UpdatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
    `;
    const [result] = await db.query(insertQuery, [
      username,
      firstname,
      lastname,
      phonenumber || null,
      email,
      adminRight === 1 ? 1 : 0,
      hashedPassword
    ]);

    res.status(201).json({ message: 'User created successfully', userId: result.insertId });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ message: 'Failed to create user: ' + err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { username, firstname, lastname, phonenumber, email, adminRight } = req.body;

    const checkQuery = 'SELECT * FROM UserAdmin WHERE UserId = ?';
    const [checkResults] = await db.query(checkQuery, [userId]);

    if (checkResults.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const duplicateQuery = 'SELECT UserId FROM UserAdmin WHERE (Username = ? OR Email = ?) AND UserId != ?';
    const [duplicateResults] = await db.query(duplicateQuery, [username, email, userId]);

    if (duplicateResults.length > 0) {
      return res.status(400).json({ message: 'Username or email already in use' });
    }

    let updateQuery, params;
    if (typeof adminRight !== 'undefined') {
      updateQuery = `
        UPDATE UserAdmin
        SET 
          Username = ?, 
          Firstname = ?, 
          Lastname = ?, 
          Phonenumber = ?, 
          Email = ?,
          AdminRight = ?
        WHERE UserId = ?
      `;
      params = [
        username,
        firstname,
        lastname,
        phonenumber,
        email,
        adminRight === 1 ? 1 : 0,
        userId
      ];
    } else {
      updateQuery = `
        UPDATE UserAdmin
        SET 
          Username = ?, 
          Firstname = ?, 
          Lastname = ?, 
          Phonenumber = ?, 
          Email = ?
        WHERE UserId = ?
      `;
      params = [
        username,
        firstname,
        lastname,
        phonenumber,
        email,
        userId
      ];
    }

    const [results] = await db.query(updateQuery, params);

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found or not updated' });
    }

    res.status(200).json({ message: 'User updated successfully' });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ message: 'Failed to update user: ' + err.message });
  }
};

exports.updateAdminRight = async (req, res) => {
  try {
    const userId = req.params.id;
    const { adminRight } = req.body;
    
    if (adminRight !== 0 && adminRight !== 1) {
      return res.status(400).json({ message: 'Admin right must be 0 or 1' });
    }
    
    const checkQuery = 'SELECT * FROM UserAdmin WHERE UserId = ?';
    const [checkResults] = await db.query(checkQuery, [userId]);
    
    if (checkResults.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const query = `
      UPDATE UserAdmin
      SET AdminRight = ?
      WHERE UserId = ?
    `;
    
    const [results] = await db.query(query, [adminRight, userId]);
    
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found or not updated' });
    }
    
    res.status(200).json({ message: 'User admin rights updated successfully' });
  } catch (err) {
    console.error('Error updating admin rights:', err);
    res.status(500).json({ message: 'Failed to update admin rights: ' + err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { password } = req.body;
    
    const checkQuery = 'SELECT * FROM UserAdmin WHERE UserId = ?';
    const [user] = await db.query(checkQuery, [userId]);
    
    if (user.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (parseInt(userId) === req.userData.userId) {
      const passwordQuery = 'SELECT Password FROM UserAdmin WHERE UserId = ?';
      const [passwordResult] = await db.query(passwordQuery, [userId]);
      
      if (!password) {
        return res.status(400).json({ message: 'Password is required to delete your account' });
      }
      
      const isMatch = await bcrypt.compare(password, passwordResult[0].Password);
      
      if (!isMatch) {
        return res.status(401).json({ message: 'Incorrect password' });
      }
    } 
    else if (req.userData.adminRight === 1) {
    } 
    else {
      return res.status(403).json({ message: 'You are not authorized to delete this account' });
    }
    
    const deleteQuery = 'DELETE FROM UserAdmin WHERE UserId = ?';
    const [deleteResult] = await db.query(deleteQuery, [userId]);
    
    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found or not deleted' });
    }
    
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ message: 'Failed to delete user: ' + err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const userId = req.params.id;
    const { currentPassword, newPassword } = req.body;
    
    const checkQuery = 'SELECT * FROM UserAdmin WHERE UserId = ?';
    const [user] = await db.query(checkQuery, [userId]);
    
    if (user.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (parseInt(userId) !== req.userData.userId && req.userData.adminRight !== 1) {
      return res.status(403).json({ message: 'You are not authorized to change this password' });
    }

    const passwordQuery = 'SELECT Password FROM UserAdmin WHERE UserId = ?';
    const [passwordResult] = await db.query(passwordQuery, [userId]);
    
    const isMatch = await bcrypt.compare(currentPassword, passwordResult[0].Password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    const updateQuery = 'UPDATE UserAdmin SET Password = ? WHERE UserId = ?';
    const [updateResult] = await db.query(updateQuery, [hashedPassword, userId]);
    
    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found or password not updated' });
    }
    
    res.status(200).json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ message: 'Failed to change password: ' + err.message });
  }
};