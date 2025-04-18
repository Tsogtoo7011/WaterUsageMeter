const pool = require('../config/db');
const { handleError } = require('../utils/errorHandler');

exports.createFeedback = async (req, res) => {
  try {
    const { feedbackType, description } = req.body;
    const userId = req.userData.userId;
    
    if (!feedbackType || !description) {
      return res.status(400).json({
        success: false,
        message: 'Санал хүсэлтийн төрөл болон тайлбар оруулна уу.'
      });
    }
    
    const type = parseInt(feedbackType);
    
    if (![1, 2, 3].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Санал хүсэлтийн төрөл буруу байна.'
      });
    }
    
    const [result] = await pool.execute(
      'INSERT INTO feedback (UserAdminUserId, Type, Description, Status) VALUES (?, ?, ?, 0)',
      [userId, type, description]
    );
    
    return res.status(201).json({
      success: true,
      message: 'Таны санал хүсэлт амжилттай илгээгдлээ.',
      feedbackId: result.insertId
    });
    
  } catch (error) {
    handleError(res, error, 'Create feedback');
  }
};
exports.getUserFeedback = async (req, res) => {
  try {
    const userId = req.userData.userId;
    
    const [feedbacks] = await pool.execute(
      `SELECT 
        ApplicationId,
        Type,
        Description,
        admin_response,
        Status,
        created_at,
        updated_at
      FROM feedback
      WHERE UserAdminUserId = ?
      ORDER BY created_at DESC`,
      [userId]
    );
    
    return res.status(200).json({
      success: true,
      feedbacks
    });
    
  } catch (error) {
    handleError(res, error, 'Get user feedback');
  }
};
exports.getFeedbackById = async (req, res) => {
  try {
    const feedbackId = req.params.id;
    const userId = req.userData.userId;
    
    const [feedbacks] = await pool.execute(
      `SELECT 
        ApplicationId,
        Type,
        Description,
        admin_response,
        Status,
        created_at,
        updated_at
      FROM feedback
      WHERE ApplicationId = ? AND UserAdminUserId = ?`,
      [feedbackId, userId]
    );
    
    if (feedbacks.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Санал хүсэлт олдсонгүй.'
      });
    }
    
    return res.status(200).json({
      success: true,
      feedback: feedbacks[0]
    });
    
  } catch (error) {
    handleError(res, error, 'Get feedback by ID');
  }
};

exports.updateFeedback = async (req, res) => {
  try {
    const { status, adminResponse } = req.body;
    const feedbackId = req.params.id;
    const userId = req.userData.userId;
    const [userFeedbacks] = await pool.execute(
      `SELECT * FROM feedback WHERE ApplicationId = ?`,
      [feedbackId]
    );
    
    if (userFeedbacks.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Санал хүсэлт олдсонгүй.'
      });
    }
    const updates = [];
    const params = [];
    
    if (status !== undefined) {
      updates.push('Status = ?');
      params.push(parseInt(status));
    }
    
    if (adminResponse !== undefined) {
      updates.push('admin_response = ?');
      params.push(adminResponse);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Шинэчлэх мэдээлэл оруулна уу.'
      });
    }
    params.push(feedbackId);
    
    await pool.execute(
      `UPDATE feedback SET ${updates.join(', ')}, updated_at = NOW() WHERE ApplicationId = ?`,
      params
    );
    
    return res.status(200).json({
      success: true,
      message: 'Санал хүсэлт амжилттай шинэчлэгдлээ.'
    });
    
  } catch (error) {
    handleError(res, error, 'Update feedback');
  }
};