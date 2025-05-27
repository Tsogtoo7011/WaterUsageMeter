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
