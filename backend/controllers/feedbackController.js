const pool = require('../config/db');
const { handleError } = require('../utils/errorHandler');

exports.createFeedback = async (req, res) => {
  try {
    const { feedbackType, description } = req.body;
    const userId = req.userData.userId;
    
    if (!feedbackType || !description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Санал хүсэлтийн төрөл болон тайлбар оруулна уу.'
      });
    }
    
    const type = parseInt(feedbackType, 10);
    
    if (![1, 2, 3].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Санал хүсэлтийн төрөл буруу байна.'
      });
    }
    
    const [result] = await pool.execute(
      'INSERT INTO feedback (UserAdminUserId, Type, Description, Status) VALUES (?, ?, ?, 0)',
      [userId, type, description.trim()]
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
        updated_at,
        UserAdminUserId
      FROM feedback
      WHERE UserAdminUserId = ?
      ORDER BY created_at DESC`,
      [userId]
    );
    
    // Ensure all numeric fields are returned as numbers
    const formattedFeedbacks = feedbacks.map(feedback => ({
      ...feedback,
      Type: Number(feedback.Type),
      Status: Number(feedback.Status),
      ApplicationId: Number(feedback.ApplicationId),
      UserAdminUserId: Number(feedback.UserAdminUserId)
    }));
    
    return res.status(200).json({
      success: true,
      feedbacks: formattedFeedbacks
    });
    
  } catch (error) {
    handleError(res, error, 'Get user feedback');
  }
};

exports.getAllFeedback = async (req, res) => {
  try {
    const userId = req.userData.userId;

    const [adminCheck] = await pool.execute(
      'SELECT AdminRight FROM useradmin WHERE UserId = ?',
      [userId]
    );
    
    if (adminCheck.length === 0 || adminCheck[0].AdminRight !== 1) {
      return res.status(403).json({
        success: false,
        message: 'Энэ үйлдлийг хийх эрх хүрэлцэхгүй байна.'
      });
    }
    
    const [feedbacks] = await pool.execute(
      `SELECT 
        f.ApplicationId,
        f.Type,
        f.Description,
        f.admin_response,
        f.Status,
        f.created_at,
        f.updated_at,
        u.Username,
        f.UserAdminUserId
      FROM feedback f
      LEFT JOIN useradmin u ON f.UserAdminUserId = u.UserId
      ORDER BY f.created_at DESC`
    );
    
    // Ensure all numeric fields are returned as numbers
    const formattedFeedbacks = feedbacks.map(feedback => ({
      ...feedback,
      Type: Number(feedback.Type),
      Status: Number(feedback.Status),
      ApplicationId: Number(feedback.ApplicationId),
      UserAdminUserId: Number(feedback.UserAdminUserId)
    }));
    
    return res.status(200).json({
      success: true,
      feedbacks: formattedFeedbacks
    });
    
  } catch (error) {
    handleError(res, error, 'Get all feedback');
  }
};

exports.getFeedbackById = async (req, res) => {
  try {
    const feedbackId = req.params.id;
    const userId = req.userData.userId;
    
    if (!feedbackId || isNaN(Number(feedbackId))) {
      return res.status(400).json({
        success: false,
        message: 'Буруу ID форматтай байна.'
      });
    }
    
    // Check if user is admin
    const [adminCheck] = await pool.execute(
      'SELECT AdminRight FROM useradmin WHERE UserId = ?',
      [userId]
    );
    
    const isAdmin = adminCheck.length > 0 && Number(adminCheck[0].AdminRight) === 1;
    
    let query = '';
    let params = [];
    
    if (isAdmin) {
      // Admin can see all feedback details with username
      query = `
        SELECT 
          f.ApplicationId,
          f.Type,
          f.Description,
          f.admin_response,
          f.Status,
          f.created_at,
          f.updated_at,
          u.Username,
          f.UserAdminUserId
        FROM feedback f
        LEFT JOIN useradmin u ON f.UserAdminUserId = u.UserId
        WHERE f.ApplicationId = ?
      `;
      params = [feedbackId];
    } else {
      // Regular users can only see their own feedback
      query = `
        SELECT 
          ApplicationId,
          Type,
          Description,
          admin_response,
          Status,
          created_at,
          updated_at,
          UserAdminUserId
        FROM feedback
        WHERE ApplicationId = ? AND UserAdminUserId = ?
      `;
      params = [feedbackId, userId];
    }
    
    const [feedbacks] = await pool.execute(query, params);
    
    if (feedbacks.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Санал хүсэлт олдсонгүй.'
      });
    }
    
    // Ensure all numeric fields are returned as numbers
    const formattedFeedback = {
      ...feedbacks[0],
      Type: Number(feedbacks[0].Type),
      Status: Number(feedbacks[0].Status),
      ApplicationId: Number(feedbacks[0].ApplicationId),
      UserAdminUserId: Number(feedbacks[0].UserAdminUserId)
    };
    
    return res.status(200).json({
      success: true,
      feedback: formattedFeedback
    });
    
  } catch (error) {
    handleError(res, error, 'Get feedback by ID');
  }
};

exports.getAdminFeedbackById = async (req, res) => {
  try {
    const feedbackId = req.params.id;
    const userId = req.userData.userId;
    
    if (!feedbackId || isNaN(Number(feedbackId))) {
      return res.status(400).json({
        success: false,
        message: 'Буруу ID форматтай байна.'
      });
    }
    
    // Check admin rights
    const [adminCheck] = await pool.execute(
      'SELECT AdminRight FROM useradmin WHERE UserId = ?',
      [userId]
    );
    
    if (adminCheck.length === 0 || Number(adminCheck[0].AdminRight) !== 1) {
      return res.status(403).json({
        success: false,
        message: 'Энэ үйлдлийг хийх эрх хүрэлцэхгүй байна.'
      });
    }
    
    const [feedbacks] = await pool.execute(
      `SELECT 
        f.ApplicationId,
        f.Type,
        f.Description,
        f.admin_response,
        f.Status,
        f.created_at,
        f.updated_at,
        u.Username,
        f.UserAdminUserId
      FROM feedback f
      LEFT JOIN useradmin u ON f.UserAdminUserId = u.UserId
      WHERE f.ApplicationId = ?`,
      [feedbackId]
    );
    
    if (feedbacks.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Санал хүсэлт олдсонгүй.'
      });
    }
    
    // Ensure all numeric fields are returned as numbers
    const formattedFeedback = {
      ...feedbacks[0],
      Type: Number(feedbacks[0].Type),
      Status: Number(feedbacks[0].Status),
      ApplicationId: Number(feedbacks[0].ApplicationId),
      UserAdminUserId: Number(feedbacks[0].UserAdminUserId)
    };
    
    return res.status(200).json({
      success: true,
      feedback: formattedFeedback
    });
    
  } catch (error) {
    handleError(res, error, 'Get admin feedback by ID');
  }
};

exports.updateFeedback = async (req, res) => {
  try {
    const feedbackId = req.params.id;
    const userId = req.userData.userId;
    
    if (!feedbackId || isNaN(Number(feedbackId))) {
      return res.status(400).json({
        success: false,
        message: 'Буруу ID форматтай байна.'
      });
    }
    
    // First check if the feedback exists
    const [checkFeedback] = await pool.execute(
      `SELECT * FROM feedback WHERE ApplicationId = ?`,
      [feedbackId]
    );
    
    if (checkFeedback.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Санал хүсэлт олдсонгүй.'
      });
    }
    
    const feedback = {
      ...checkFeedback[0],
      Status: Number(checkFeedback[0].Status),
      UserAdminUserId: Number(checkFeedback[0].UserAdminUserId)
    };
    
    // Check if user is admin
    const [adminCheck] = await pool.execute(
      'SELECT AdminRight FROM useradmin WHERE UserId = ?',
      [userId]
    );
    
    const isAdmin = adminCheck.length > 0 && Number(adminCheck[0].AdminRight) === 1;
    
    // Admin can update status and admin_response
    if (isAdmin) {
      const { status, adminResponse } = req.body;
      const updates = [];
      const params = [];
      
      if (status !== undefined) {
        const statusNum = parseInt(status, 10);
        if (isNaN(statusNum) || ![0, 1, 2].includes(statusNum)) {
          return res.status(400).json({
            success: false,
            message: 'Статус буруу байна.'
          });
        }
        updates.push('Status = ?');
        params.push(statusNum);
      }
      
      if (adminResponse !== undefined) {
        updates.push('admin_response = ?');
        params.push(adminResponse.trim());
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
    } 
    else {
      // Regular user updates
      if (feedback.UserAdminUserId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Та зөвхөн өөрийн санал хүсэлтийг засах боломжтой.'
        });
      }
      
      // Verify status is pending (0)
      if (feedback.Status !== 0) {
        return res.status(400).json({
          success: false,
          message: 'Зөвхөн хүлээгдэж буй санал хүсэлтийг засах боломжтой.'
        });
      }
      
      const { feedbackType, description } = req.body;
      
      if (!feedbackType || !description || !description.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Санал хүсэлтийн төрөл болон тайлбар оруулна уу.'
        });
      }
      
      const type = parseInt(feedbackType, 10);
      
      if (isNaN(type) || ![1, 2, 3].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Санал хүсэлтийн төрөл буруу байна.'
        });
      }
      
      await pool.execute(
        'UPDATE feedback SET Type = ?, Description = ?, updated_at = NOW() WHERE ApplicationId = ?',
        [type, description.trim(), feedbackId]
      );
      
      return res.status(200).json({
        success: true,
        message: 'Санал хүсэлт амжилттай шинэчлэгдлээ.'
      });
    }
    
  } catch (error) {
    handleError(res, error, 'Update feedback');
  }
};

exports.deleteFeedback = async (req, res) => {
  try {
    const feedbackId = req.params.id;
    const userId = req.userData.userId;
    
    if (!feedbackId || isNaN(Number(feedbackId))) {
      return res.status(400).json({
        success: false,
        message: 'Буруу ID форматтай байна.'
      });
    }
    
    // First check if the feedback exists
    const [checkFeedback] = await pool.execute(
      `SELECT * FROM feedback WHERE ApplicationId = ?`,
      [feedbackId]
    );
    
    if (checkFeedback.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Санал хүсэлт олдсонгүй.'
      });
    }
    
    const feedback = {
      ...checkFeedback[0],
      Status: Number(checkFeedback[0].Status),
      UserAdminUserId: Number(checkFeedback[0].UserAdminUserId)
    };
    
    // Check if user is admin
    const [adminCheck] = await pool.execute(
      'SELECT AdminRight FROM useradmin WHERE UserId = ?',
      [userId]
    );
    
    const isAdmin = adminCheck.length > 0 && Number(adminCheck[0].AdminRight) === 1;
    
    // Admin can delete any feedback
    if (isAdmin) {
      await pool.execute(
        'DELETE FROM feedback WHERE ApplicationId = ?',
        [feedbackId]
      );
      
      return res.status(200).json({
        success: true,
        message: 'Санал хүсэлт амжилттай устгагдлаа.'
      });
    }
    // Regular user can only delete their own pending feedback
    else {
      if (feedback.UserAdminUserId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Та зөвхөн өөрийн санал хүсэлтийг устгах боломжтой.'
        });
      }
    
      if (feedback.Status !== 0) {
        return res.status(400).json({
          success: false,
          message: 'Зөвхөн хүлээгдэж буй санал хүсэлтийг устгах боломжтой.'
        });
      }
      
      await pool.execute(
        'DELETE FROM feedback WHERE ApplicationId = ?',
        [feedbackId]
      );
      
      return res.status(200).json({
        success: true,
        message: 'Санал хүсэлт амжилттай устгагдлаа.'
      });
    }
    
  } catch (error) {
    handleError(res, error, 'Delete feedback');
  }
};