console.log('NotificationController loaded'); // Add this at the very top

const db = require('../config/db');

exports.getPaymentNotifications = async (req, res) => {
  try {
    const userId = req.user?.UserId || req.query.userId; 
    if (!userId) return res.status(400).json({ message: 'User required' });

    const [rows] = await db.query(
      `SELECT PaymentId, Amount, PayDate, Status, CreatedAt
       FROM Payment
       WHERE UserAdminId = ? AND Status IN ('Төлөгдөөгүй', 'Хоцорсон')
       ORDER BY PayDate DESC
       LIMIT 20`,
      [userId]
    );

    const notifications = rows.map(row => ({
      id: `payment-${row.PaymentId}`,
      type: row.Status === 'Хоцорсон' ? 'warning' : 'payment',
      title: row.Status === 'Хоцорсон' ? 'Төлбөр хоцорсон' : 'Төлбөр төлөгдөөгүй',
      message: `Төлөх дүн: ${row.Amount}₮, Огноо: ${row.PayDate}`,
      time: row.CreatedAt,
      read: false,
    }));

    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch payment notifications' });
  }
};

exports.getNewsNotifications = async (req, res) => {
  try {
    const userId = req.user?.UserId || req.query.userId;
    if (!userId) return res.status(400).json({ message: 'User required' });

    const [rows] = await db.query(
      `SELECT NotificationId, NewsId, Title, CreatedAt, ReadStatus
       FROM Notification
       WHERE UserId = ? AND Type = 'news'
       ORDER BY CreatedAt DESC
       LIMIT 20`,
      [userId]
    );

    const notifications = rows.map(row => ({
      id: `news-${row.NotificationId}`,
      type: 'news',
      title: 'Шинэ мэдээ',
      message: row.Title,
      newsId: row.NewsId,
      time: row.CreatedAt,
      read: !!row.ReadStatus,
    }));

    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch news notifications' });
  }
};

exports.deleteOldNotifications = async (req, res) => {
  try {
    const [result] = await db.query(
      `DELETE FROM Notification WHERE CreatedAt < (NOW() - INTERVAL 3 MONTH)`
    );
    res.json({ message: 'Old notifications deleted', affectedRows: result.affectedRows });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete old notifications' });
  }
};

exports.getAllNotifications = async (req, res) => {
  console.log('getAllNotifications called'); // Add this at the start of the function
  try {
    const userId = req.user?.UserId || req.query.userId;
    console.log('getAllNotifications userId:', userId); 
    if (!userId) {
      console.log('No userId provided');
      return res.status(400).json({ message: 'User required' });
    }

    const [rows] = await db.query(
      `SELECT NotificationId, Type, Title, Message, CreatedAt, IsRead
       FROM Notification
       WHERE UserId = ?
       ORDER BY CreatedAt DESC
       LIMIT 50`,
      [userId]
    );
    console.log('Notifications rows:', rows); // Debug log

    const notifications = rows.map(row => ({
      id: `notif-${row.NotificationId}`,
      type: row.Type, // e.g., 'News', 'WaterPayment', etc.
      title: row.Title,
      message: row.Message,
      time: row.CreatedAt,
      read: !!row.IsRead,
    }));

    res.json({ notifications });
  } catch (err) {
    console.log('Error in getAllNotifications:', err); // Log errors
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};
