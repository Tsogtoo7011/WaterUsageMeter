const db = require('../config/db');
const sendEmail = require('../utils/emailService');

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
};

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
  try {
    const userId = req.user?.UserId || req.query.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User required' });
    }

    const [rows] = await db.query(
      `SELECT NotificationId, Type, Title, Message, CreatedAt, IsRead, NewsId
       FROM Notification
       WHERE UserId = ? AND IsRead IN (0,1)
       ORDER BY CreatedAt DESC
       LIMIT 50`,
      [userId]
    );

    const notifications = rows.map(row => ({
      id: `notif-${row.NotificationId}`,
      type: row.Type ? row.Type.toLowerCase() : 'general', 
      title: row.Title,
      message: row.Message,
      time: formatDate(row.CreatedAt), 
      read: !!row.IsRead,
      ...(row.Type && row.Type.toLowerCase() === 'news' && row.NewsId ? { newsId: row.NewsId } : {}),
    }));

    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.body;
    if (!notificationId) return res.status(400).json({ message: 'NotificationId required' });

    await db.query(
      `UPDATE Notification SET IsRead = 1 WHERE NotificationId = ?`,
      [notificationId.replace(/^notif-/, '')] 
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user?.UserId || req.body.userId || req.query.userId;
    if (!userId) return res.status(400).json({ message: 'UserId required' });

    await db.query(
      `UPDATE Notification SET IsRead = 1 WHERE UserId = ?`,
      [userId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark all notifications as read' });
  }
};

exports.markAsRemoved = async (req, res) => {
  try {
    const { notificationId } = req.body;
    if (!notificationId) return res.status(400).json({ message: 'NotificationId required' });

    const dbId = notificationId.replace(/^notif-/, '');
    const [rows] = await db.query(
      `SELECT NotificationId FROM Notification WHERE NotificationId = ?`,
      [dbId]
    );
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    await db.query(
      `UPDATE Notification SET IsRead = 2 WHERE NotificationId = ?`,
      [dbId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove notification' });
  }
};

async function sendNotificationEmail(userId, title, message) {
  const [[user]] = await db.query('SELECT Email, Firstname FROM UserAdmin WHERE UserId = ?', [userId]);
  if (!user || !user.Email) {
    return;
  }
  try {
    await sendEmail({
      to: user.Email,
      subject: title,
      html: `<p>Сайн байна уу, ${user.Firstname || ''}?</p><p>${message}</p>`
    });
  } catch (err) {
  }
}

exports.createNotification = async (userId, type, title, message, extra = {}) => {
  const [result] = await db.query(
    `INSERT INTO Notification (UserId, Type, Title, Message, NewsId, WaterPaymentId, ServicePaymentId, ServiceId)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      type,
      title,
      message,
      extra.NewsId || null,
      extra.WaterPaymentId || null,
      extra.ServicePaymentId || null,
      extra.ServiceId || null
    ]
  );
  if (type && type.toLowerCase() === 'news' && extra.NewsDescription) {
    await sendNotificationEmail(userId, title, extra.NewsDescription);
  } else {
    await sendNotificationEmail(userId, title, message);
  }
  return result;
};
