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

// Get user by ID (without sensitive data)
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

    // Validate required fields
    if (!username || !firstname || !lastname || !email) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check for duplicate username or email
    const duplicateQuery = 'SELECT UserId FROM UserAdmin WHERE Username = ? OR Email = ?';
    const [duplicateResults] = await db.query(duplicateQuery, [username, email]);
    if (duplicateResults.length > 0) {
      return res.status(400).json({ message: 'Username or email already in use' });
    }

    // Set a default password for new users (should be changed on first login)
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

// Update user details (including adminRight if provided)
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { username, firstname, lastname, phonenumber, email, adminRight } = req.body;

    // Check if user exists
    const checkQuery = 'SELECT * FROM UserAdmin WHERE UserId = ?';
    const [checkResults] = await db.query(checkQuery, [userId]);

    if (checkResults.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the username or email is already taken by another user
    const duplicateQuery = 'SELECT UserId FROM UserAdmin WHERE (Username = ? OR Email = ?) AND UserId != ?';
    const [duplicateResults] = await db.query(duplicateQuery, [username, email, userId]);

    if (duplicateResults.length > 0) {
      return res.status(400).json({ message: 'Username or email already in use' });
    }

    // If adminRight is provided and the requester is admin, update it
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

// Update user admin rights
exports.updateAdminRight = async (req, res) => {
  try {
    const userId = req.params.id;
    const { adminRight } = req.body;
    
    // Validate adminRight value
    if (adminRight !== 0 && adminRight !== 1) {
      return res.status(400).json({ message: 'Admin right must be 0 or 1' });
    }
    
    // The adminOnly middleware has already verified the user is an admin,
    // so we don't need to check req.userData.adminRight here
    
    // Check if user exists
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

// Delete user account
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { password } = req.body;
    
    // Check if the user to be deleted exists
    const checkQuery = 'SELECT * FROM UserAdmin WHERE UserId = ?';
    const [user] = await db.query(checkQuery, [userId]);
    
    if (user.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // If deleting own account, verify password
    if (parseInt(userId) === req.userData.userId) {
      // Get the user's stored password for verification
      const passwordQuery = 'SELECT Password FROM UserAdmin WHERE UserId = ?';
      const [passwordResult] = await db.query(passwordQuery, [userId]);
      
      if (!password) {
        return res.status(400).json({ message: 'Password is required to delete your account' });
      }
      
      // Compare the provided password with the stored hash
      const isMatch = await bcrypt.compare(password, passwordResult[0].Password);
      
      if (!isMatch) {
        return res.status(401).json({ message: 'Incorrect password' });
      }
    } 
    // If admin is deleting another user's account
    else if (req.userData.adminRight === 1) {
      // Admins can delete other accounts without password verification
    } 
    // Non-admin trying to delete someone else's account
    else {
      return res.status(403).json({ message: 'You are not authorized to delete this account' });
    }
    
    // Delete the user
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

// Change user password (requires current password verification)
exports.changePassword = async (req, res) => {
  try {
    const userId = req.params.id;
    const { currentPassword, newPassword } = req.body;
    
    // Check if user exists
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