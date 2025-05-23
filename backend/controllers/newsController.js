const db = require('../config/db');
const path = require('path');
const fs = require('fs');

exports.getAllNews = async (req, res) => {
  try {
    const query = `
      SELECT n.NewsId, n.Title, n.NewsDescription, n.CoverImageType, u.Username 
      FROM News n
      JOIN UserAdmin u ON n.UserAdminId = u.UserId
      ORDER BY n.NewsId DESC
    `;
    
    const [results] = await db.query(query);
    

    res.status(200).json(results);
  } catch (err) {
    console.error('Error fetching news:', err);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
};

exports.getNewsById = async (req, res) => {
  try {
    const newsId = req.params.id;
    
    const query = `
      SELECT n.*, u.Username 
      FROM News n
      JOIN UserAdmin u ON n.UserAdminId = u.UserId
      WHERE n.NewsId = ?
    `;
    
    const [results] = await db.query(query, [newsId]);
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'News not found' });
    }
    
    const news = results[0];
    if (news.CoverImageData) {
      news.CoverImageData = news.CoverImageData.toString('base64');
    }
    
    res.status(200).json(news);
  } catch (err) {
    console.error('Error fetching news:', err);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
};

exports.createNews = async (req, res) => {
  try {
    const { title, description } = req.body;
    const userId = req.userData.userId;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Cover image is required' });
    }
    
    const coverImageType = path.extname(req.file.originalname).substring(1);
    const coverImageData = req.file.buffer;
    
    const query = `
      INSERT INTO News (UserAdminId, Title, NewsDescription, CoverImageType, CoverImageData)
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
    res.status(500).json({ message: 'Failed to create news: ' + err.message });
  }
};

exports.updateNews = async (req, res) => {
  try {
    const newsId = req.params.id;
    const { title, description } = req.body;
    
    const checkQuery = 'SELECT * FROM News WHERE NewsId = ?';
    const [checkResults] = await db.query(checkQuery, [newsId]);
    
    if (checkResults.length === 0) {
      return res.status(404).json({ message: 'News not found' });
    }
    
    let query, queryParams;
    
    if (req.file) {

      const coverImageType = path.extname(req.file.originalname).substring(1);
      const coverImageData = req.file.buffer;
      
      query = `
        UPDATE News
        SET Title = ?, NewsDescription = ?, CoverImageType = ?, CoverImageData = ?
        WHERE NewsId = ?
      `;
      
      queryParams = [title, description, coverImageType, coverImageData, newsId];
    } else {

      query = `
        UPDATE News
        SET Title = ?, NewsDescription = ?
        WHERE NewsId = ?
      `;
      
      queryParams = [title, description, newsId];
    }
    
    const [results] = await db.query(query, queryParams);
    
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'News not found or not updated' });
    }
    
    res.status(200).json({ message: 'News updated successfully' });
  } catch (err) {
    console.error('Error updating news:', err);
    res.status(500).json({ message: 'Failed to update news: ' + err.message });
  }
};

exports.deleteNews = async (req, res) => {
  try {
    const newsId = req.params.id;
    
    const query = 'DELETE FROM News WHERE NewsId = ?';
    
    const [results] = await db.query(query, [newsId]);
    
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'News not found' });
    }
    
    res.status(200).json({ message: 'News deleted successfully' });
  } catch (err) {
    console.error('Error deleting news:', err);
    res.status(500).json({ message: 'Failed to delete news: ' + err.message });
  }
};

exports.getNewsImage = async (req, res) => {
  try {
    const newsId = req.params.id;
    
    const query = 'SELECT CoverImageType, CoverImageData FROM News WHERE NewsId = ?';
    
    const [results] = await db.query(query, [newsId]);
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'News not found' });
    }
    
    const { CoverImageType, CoverImageData } = results[0];
    
    if (!CoverImageData) {
      return res.status(404).json({ message: 'Image not found' });
    }
    
    res.set('Content-Type', `image/${CoverImageType}`);
    res.send(CoverImageData);
  } catch (err) {
    console.error('Error fetching news image:', err);
    res.status(500).json({ message: 'Failed to fetch news image' });
  }
};