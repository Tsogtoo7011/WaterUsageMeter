const pool = require('../config/db');
const { handleError } = require('../utils/errorHandler');

exports.getTariff = async (req, res) => {
  try {
    const [tariff] = await pool.execute(
      'SELECT TariffId, ColdWaterTariff, HeatWaterTariff, DirtyWaterTariff, ' +
      'EffectiveFrom, EffectiveTo, IsActive FROM Tarif WHERE IsActive = 1 ' +
      'ORDER BY EffectiveFrom DESC LIMIT 1'
    );
    
    if (tariff.length === 0) {
      return res.json({
        TariffId: null,
        ColdWaterTariff: 0,
        HeatWaterTariff: 0,
        DirtyWaterTariff: 0,
        EffectiveFrom: '',
        EffectiveTo: null,
        IsActive: 0
      });
    }
    
    res.json(tariff[0]);
  } catch (error) {
    handleError(res, error, 'Тарифын мэдээлэл авах');
  }
};

// Get tariff history
exports.getTariffHistory = async (req, res) => {
  try {
    // Get all tariffs ordered by TariffId DESC (latest first)
    const [tariffs] = await pool.execute(
      'SELECT TariffId, ColdWaterTariff, HeatWaterTariff, DirtyWaterTariff, ' +
      'EffectiveFrom, EffectiveTo, IsActive, CreatedAt, UpdatedAt FROM Tarif ' +
      'ORDER BY TariffId DESC'
    );
    
    res.json(tariffs);
  } catch (error) {
    handleError(res, error, 'Тарифын түүх авах');
  }
};

exports.updateTariff = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    const { 
      ColdWaterTariff, 
      HeatWaterTariff, 
      DirtyWaterTariff,
      EffectiveFrom
    } = req.body;
    
    // Validate input
    if (!ColdWaterTariff || !HeatWaterTariff || !DirtyWaterTariff || !EffectiveFrom) {
      await connection.rollback();
      return res.status(400).json({ 
        message: 'Бүх тарифын утгуудыг болон хэрэгжих огноог оруулах шаардлагатай' 
      });
    }
    
    // Validate effective date format
    const effectiveDate = new Date(EffectiveFrom);
    if (isNaN(effectiveDate.getTime())) {
      await connection.rollback();
      return res.status(400).json({ message: 'Хэрэгжих огноо буруу форматтай байна' });
    }
    
    // First, deactivate any currently active tariff
    await connection.execute(
      'UPDATE Tarif SET IsActive = 0, EffectiveTo = ? WHERE IsActive = 1',
      [EffectiveFrom]
    );
    
    // Insert new tariff record
    const [result] = await connection.execute(
      'INSERT INTO Tarif (ColdWaterTariff, HeatWaterTariff, DirtyWaterTariff, EffectiveFrom, IsActive) ' +
      'VALUES (?, ?, ?, ?, 1)',
      [ColdWaterTariff, HeatWaterTariff, DirtyWaterTariff, EffectiveFrom]
    );

    const [updatedTariff] = await connection.execute(
      'SELECT TariffId, ColdWaterTariff, HeatWaterTariff, DirtyWaterTariff, ' +
      'EffectiveFrom, EffectiveTo, IsActive FROM Tarif WHERE TariffId = ?',
      [result.insertId]
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

// Activate/deactivate a tariff
exports.toggleTariffStatus = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    const { tariffId, isActive } = req.body;
    
    if (tariffId === undefined || isActive === undefined) {
      await connection.rollback();
      return res.status(400).json({ message: 'Тарифын ID болон төлөв шаардлагатай' });
    }

    if (isActive === 1) {
      await connection.execute(
        'UPDATE Tarif SET IsActive = 0, EffectiveTo = CURRENT_DATE() WHERE IsActive = 1'
      );
    }
    
    // Update the target tariff status
    await connection.execute(
      'UPDATE Tarif SET IsActive = ? WHERE TariffId = ?',
      [isActive, tariffId]
    );
    
    // Get the updated tariff
    const [updatedTariff] = await connection.execute(
      'SELECT TariffId, ColdWaterTariff, HeatWaterTariff, DirtyWaterTariff, ' +
      'EffectiveFrom, EffectiveTo, IsActive FROM Tarif WHERE TariffId = ?',
      [tariffId]
    );
    
    await connection.commit();
    
    if (updatedTariff.length === 0) {
      return res.json({});
    }
    
    res.json({
      message: isActive === 1 ? 'Тариф идэвхжүүлэгдлээ' : 'Тариф идэвхгүй болголоо',
      data: updatedTariff[0]
    });
  } catch (error) {
    await connection.rollback();
    handleError(res, error, 'Тарифын төлөв шинэчлэх');
  } finally {
    connection.release();
  }
};