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
      'INSERT INTO Feedback (UserAdminId, Type, Description, Status) VALUES (?, ?, ?, ?)',
      [userId, type, description.trim(), 'Хүлээгдэж байна']
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
        AdminResponse,
        Status,
        CreatedAt,
        UpdatedAt,
        UserAdminId
      FROM Feedback
      WHERE UserAdminId = ?
      ORDER BY CreatedAt DESC`,
      [userId]
    );
    
    return res.status(200).json({
      success: true,
      feedbacks: feedbacks
    });
    
  } catch (error) {
    handleError(res, error, 'Get user feedback');
  }
};

exports.getAllFeedback = async (req, res) => {
  try {
    // No need to check admin rights as it's handled by middleware
    const [feedbacks] = await pool.execute(
      `SELECT 
        f.ApplicationId,
        f.Type,
        f.Description,
        f.AdminResponse,
        f.Status,
        f.CreatedAt,
        f.UpdatedAt,
        u.Username,
        f.UserAdminId,
        f.AdminResponderId,
        IFNULL(a.Username, '') as ResponderUsername
      FROM Feedback f
      LEFT JOIN useradmin u ON f.UserAdminId = u.UserId
      LEFT JOIN useradmin a ON f.AdminResponderId = a.UserId
      ORDER BY f.CreatedAt DESC`
    );
    
    return res.status(200).json({
      success: true,
      feedbacks: feedbacks
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
    
    // The isAdmin check is still needed to determine which query to use
    const isAdmin = req.userData.AdminRight === 1;
    
    let query = '';
    let params = [];
    
    if (isAdmin) {
      query = `
        SELECT 
          f.ApplicationId,
          f.Type,
          f.Description,
          f.AdminResponse,
          f.Status,
          f.CreatedAt,
          f.UpdatedAt,
          u.Username,
          f.UserAdminId,
          f.AdminResponderId,
          IFNULL(a.Username, '') as ResponderUsername
        FROM Feedback f
        LEFT JOIN useradmin u ON f.UserAdminId = u.UserId
        LEFT JOIN useradmin a ON f.AdminResponderId = a.UserId
        WHERE f.ApplicationId = ?
      `;
      params = [feedbackId];
    } else {
      query = `
        SELECT 
          ApplicationId,
          Type,
          Description,
          AdminResponse,
          Status,
          CreatedAt,
          UpdatedAt,
          UserAdminId
        FROM Feedback
        WHERE ApplicationId = ? AND UserAdminId = ?
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

    return res.status(200).json({
      success: true,
      feedback: feedbacks[0]
    });
    
  } catch (error) {
    handleError(res, error, 'Get feedback by ID');
  }
};

exports.getAdminFeedbackById = async (req, res) => {
  try {
    const feedbackId = req.params.id;
    
    if (!feedbackId || isNaN(Number(feedbackId))) {
      return res.status(400).json({
        success: false,
        message: 'Буруу ID форматтай байна.'
      });
    }
    
    // No need to check admin rights as it's handled by middleware
    const [feedbacks] = await pool.execute(
      `SELECT 
        f.ApplicationId,
        f.Type,
        f.Description,
        f.AdminResponse,
        f.Status,
        f.CreatedAt,
        f.UpdatedAt,
        u.Username,
        f.UserAdminId,
        f.AdminResponderId,
        IFNULL(a.Username, '') as ResponderUsername
      FROM Feedback f
      LEFT JOIN useradmin u ON f.UserAdminId = u.UserId
      LEFT JOIN useradmin a ON f.AdminResponderId = a.UserId
      WHERE f.ApplicationId = ?`,
      [feedbackId]
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

    const [checkFeedback] = await pool.execute(
      `SELECT * FROM Feedback WHERE ApplicationId = ?`,
      [feedbackId]
    );
    
    if (checkFeedback.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Санал хүсэлт олдсонгүй.'
      });
    }
    
    const feedback = checkFeedback[0];
    const isAdmin = req.userData.AdminRight === 1;

    if (isAdmin) {
      const { status, adminResponse } = req.body;
      const updates = [];
      const params = [];
      
      if (status !== undefined) {
        if (!['Хүлээгдэж байна', 'Хүлээн авсан', 'Хүлээн авахаас татгалзсан'].includes(status)) {
          return res.status(400).json({
            success: false,
            message: 'Статус буруу байна.'
          });
        }
        updates.push('Status = ?');
        params.push(status);
      }
      
      if (adminResponse !== undefined) {
        updates.push('AdminResponse = ?');
        params.push(adminResponse.trim());
        
        // Add admin responder ID
        updates.push('AdminResponderId = ?');
        params.push(userId);
      }
      
      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Шинэчлэх мэдээлэл оруулна уу.'
        });
      }
      
      params.push(feedbackId);
      
      await pool.execute(
        `UPDATE Feedback SET ${updates.join(', ')} WHERE ApplicationId = ?`,
        params
      );
      
      return res.status(200).json({
        success: true,
        message: 'Санал хүсэлт амжилттай шинэчлэгдлээ.'
      });
    } 
    else {
      if (feedback.UserAdminId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Та зөвхөн өөрийн санал хүсэлтийг засах боломжтой.'
        });
      }
      
      if (feedback.Status !== 'Хүлээгдэж байна') {
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
        'UPDATE Feedback SET Type = ?, Description = ? WHERE ApplicationId = ?',
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

    const [checkFeedback] = await pool.execute(
      `SELECT * FROM Feedback WHERE ApplicationId = ?`,
      [feedbackId]
    );
    
    if (checkFeedback.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Санал хүсэлт олдсонгүй.'
      });
    }
    
    const feedback = checkFeedback[0];
    const isAdmin = req.userData.AdminRight === 1;

    if (isAdmin) {
      await pool.execute(
        'DELETE FROM Feedback WHERE ApplicationId = ?',
        [feedbackId]
      );
      
      return res.status(200).json({
        success: true,
        message: 'Санал хүсэлт амжилттай устгагдлаа.'
      });
    }
    else {
      if (feedback.UserAdminId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Та зөвхөн өөрийн санал хүсэлтийг устгах боломжтой.'
        });
      }
    
      if (feedback.Status !== 'Хүлээгдэж байна') {
        return res.status(400).json({
          success: false,
          message: 'Зөвхөн хүлээгдэж буй санал хүсэлтийг устгах боломжтой.'
        });
      }
      
      await pool.execute(
        'DELETE FROM Feedback WHERE ApplicationId = ?',
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