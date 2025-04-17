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
      'INSERT INTO feedback (UserAdminUserId, Type, Description) VALUES (?, ?, ?)', 
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