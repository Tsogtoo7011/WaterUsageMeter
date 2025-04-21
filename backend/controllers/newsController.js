const db = require('../config/db');
const path = require('path');
const fs = require('fs');

// Get all news
exports.getAllNews = async (req, res) => {
  try {
    const query = `
      SELECT n.NewsId, n.Title, n.NewsDescription, n.CoverImageType, u.Username 
      FROM News n
      JOIN UserAdmin u ON n.UserAdminUserId = u.UserId
      ORDER BY n.NewsId DESC
    `;
    
    const [results] = await db.query(query);
    
    // Don't send image data in the list to reduce payload size
    res.status(200).json(results);
  } catch (err) {
    console.error('Error fetching news:', err);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
};

// Get single news by ID
exports.getNewsById = async (req, res) => {
  try {
    const newsId = req.params.id;
    
    const query = `
      SELECT n.*, u.Username 
      FROM News n
      JOIN UserAdmin u ON n.UserAdminUserId = u.UserId
      WHERE n.NewsId = ?
    `;
    
    const [results] = await db.query(query, [newsId]);
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'News not found' });
    }
    
    // Convert BLOB to base64 for frontend display
    const news = results[0];
    news.CoverImageData = news.CoverImageData.toString('base64');
    
    res.status(200).json(news);
  } catch (err) {
    console.error('Error fetching news:', err);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
};

// Create news
exports.createNews = async (req, res) => {
  try {
    const { title, description } = req.body;
    const userId = req.user.id; // Get from auth middleware
    
    if (!req.file) {
      return res.status(400).json({ error: 'Cover image is required' });
    }
    
    const coverImageType = path.extname(req.file.originalname).substring(1);
    const coverImageData = req.file.buffer;
    
    const query = `
      INSERT INTO News (UserAdminUserId, Title, NewsDescription, CoverImageType, CoverImageData)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const [results] = await db.query(
      query,
      [userId, title, description, coverImageType, coverImageData]
    );
    
    res.status(201).json({
      message: 'News created successfully',
      newsId: results.insertId
    });
  } catch (err) {
    console.error('Error creating news:', err);
    res.status(500).json({ error: 'Failed to create news' });
  }
};

// Update news
exports.updateNews = async (req, res) => {
  try {
    const newsId = req.params.id;
    const { title, description } = req.body;
    
    let query, queryParams;
    
    if (req.file) {
      // Update with new image
      const coverImageType = path.extname(req.file.originalname).substring(1);
      const coverImageData = req.file.buffer;
      
      query = `
        UPDATE News
        SET Title = ?, NewsDescription = ?, CoverImageType = ?, CoverImageData = ?
        WHERE NewsId = ?
      `;
      
      queryParams = [title, description, coverImageType, coverImageData, newsId];
    } else {
      // Update without changing image
      query = `
        UPDATE News
        SET Title = ?, NewsDescription = ?
        WHERE NewsId = ?
      `;
      
      queryParams = [title, description, newsId];
    }
    
    const [results] = await db.query(query, queryParams);
    
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'News not found' });
    }
    
    res.status(200).json({ message: 'News updated successfully' });
  } catch (err) {
    console.error('Error updating news:', err);
    res.status(500).json({ error: 'Failed to update news' });
  }
};

// Delete news
exports.deleteNews = async (req, res) => {
  try {
    const newsId = req.params.id;
    
    const query = 'DELETE FROM News WHERE NewsId = ?';
    
    const [results] = await db.query(query, [newsId]);
    
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'News not found' });
    }
    
    res.status(200).json({ message: 'News deleted successfully' });
  } catch (err) {
    console.error('Error deleting news:', err);
    res.status(500).json({ error: 'Failed to delete news' });
  }
};

// Get news image by ID
exports.getNewsImage = async (req, res) => {
  try {
    const newsId = req.params.id;
    
    const query = 'SELECT CoverImageType, CoverImageData FROM News WHERE NewsId = ?';
    
    const [results] = await db.query(query, [newsId]);
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'News not found' });
    }
    
    const { CoverImageType, CoverImageData } = results[0];
    
    res.set('Content-Type', `image/${CoverImageType}`);
    res.send(CoverImageData);
  } catch (err) {
    console.error('Error fetching news image:', err);
    res.status(500).json({ error: 'Failed to fetch news image' });
  }
};