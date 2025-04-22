const pool = require('../config/db');
const { handleError } = require('../utils/errorHandler');

// Get the tariff
exports.getTariff = async (req, res) => {
  try {
    // Check if user is verified
    const [users] = await pool.execute(
      'SELECT IsVerified FROM UserAdmin WHERE UserId = ?',
      [req.userData.userId]
    );
    
    if (!users.length) {
      return res.status(404).json({ message: 'Хэрэглэгч олдсонгүй' });
    }
    
    if (users[0].IsVerified !== 1) {
      return res.status(403).json({ message: 'Имэйл хаягаа баталгаажуулна уу' });
    }
    
    // Get the tariff - using prepared statement and limit for efficiency
    const [tariff] = await pool.execute(
      'SELECT TariffId, ColdWaterTariff, HeatWaterTariff, DirtyWaterTariff FROM Tarif LIMIT 1'
    );
    
    if (tariff.length === 0) {
      return res.status(404).json({ message: 'Тариф олдсонгүй' });
    }
    
    res.json(tariff[0]);
  } catch (error) {
    handleError(res, error, 'Тарифын мэдээлэл авах');
  }
};

// Update tariff
exports.updateTariff = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Check if user is verified and is admin
    const [users] = await connection.execute(
      'SELECT IsVerified, Role FROM UserAdmin WHERE UserId = ?',
      [req.userData.userId]
    );
    
    if (!users.length) {
      await connection.rollback();
      return res.status(404).json({ message: 'Хэрэглэгч олдсонгүй' });
    }
    
    if (users[0].IsVerified !== 1) {
      await connection.rollback();
      return res.status(403).json({ message: 'Имэйл хаягаа баталгаажуулна уу' });
    }
    
    // Optional: Check if user is admin
    if (users[0].Role !== 'admin') {
      await connection.rollback();
      return res.status(403).json({ message: 'Энэ үйлдлийг гүйцэтгэх эрх хүрэлцэхгүй байна' });
    }
    
    const { ColdWaterTariff, HeatWaterTariff, DirtyWaterTariff } = req.body;
    
    // Validate input
    if (!ColdWaterTariff || !HeatWaterTariff || !DirtyWaterTariff) {
      await connection.rollback();
      return res.status(400).json({ message: 'Бүх тарифын утгуудыг оруулах шаардлагатай' });
    }
    
    // Check if tariff exists first
    const [existingTariff] = await connection.execute('SELECT TariffId FROM Tarif LIMIT 1');
    
    if (existingTariff.length === 0) {
      // If no tariff exists, create one
      await connection.execute(
        'INSERT INTO Tarif (ColdWaterTariff, HeatWaterTariff, DirtyWaterTariff) VALUES (?, ?, ?)',
        [ColdWaterTariff, HeatWaterTariff, DirtyWaterTariff]
      );
    } else {
      // Update existing tariff
      await connection.execute(
        'UPDATE Tarif SET ColdWaterTariff = ?, HeatWaterTariff = ?, DirtyWaterTariff = ? WHERE TariffId = ?',
        [ColdWaterTariff, HeatWaterTariff, DirtyWaterTariff, existingTariff[0].TariffId]
      );
    }
    
    // Get the updated tariff with optimized query
    const [updatedTariff] = await connection.execute(
      'SELECT TariffId, ColdWaterTariff, HeatWaterTariff, DirtyWaterTariff FROM Tarif LIMIT 1'
    );
    
    await connection.commit();
    
    res.json({
      message: 'Тариф амжилттай шинэчлэгдлээ',
      data: updatedTariff[0]
    });
  } catch (error) {
    await connection.rollback();
    handleError(res, error, 'Тарифын мэдээлэл шинэчлэх');
  } finally {
    connection.release();
  }
};