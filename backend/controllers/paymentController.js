const pool = require('../config/db');
const { handleError } = require('../utils/errorHandler');

// Helper function to get user's apartments
async function getUserApartments(userId) {
  const [apartments] = await pool.execute(
    'SELECT aua.ApartmentId FROM ApartmentUserAdmin aua WHERE aua.UserId = ?',
    [userId]
  );
  
  if (apartments.length === 0) {
    return [];
  }
  
  return apartments.map(apt => apt.ApartmentId);
}

async function getCurrentTariff() {
  const [tariffs] = await pool.execute(
    'SELECT * FROM Tarif ORDER BY TariffId DESC LIMIT 1'
  );
  
  if (tariffs.length === 0) {
    throw new Error('No tariff information found in the system');
  }
  
  return tariffs[0];
}

async function calculateWaterUsage(apartmentId, month, year) {
  const [readings] = await pool.execute(
    `SELECT 
      Type,
      SUM(Indication) as total
    FROM WaterMeter
    WHERE ApartmentId = ?
    AND MONTH(WaterMeterDate) = ?
    AND YEAR(WaterMeterDate) = ?
    GROUP BY Type`,
    [apartmentId, month, year]
  );

  const usage = {
    cold: 0,
    hot: 0
  };
  
  readings.forEach(reading => {
    if (reading.Type === 0) {
      usage.cold = Number(reading.total);
    } else if (reading.Type === 1) {
      usage.hot = Number(reading.total);
    }
  });
  
  return usage;
}

exports.getUserPayments = async (req, res) => {
  try {
    const userId = req.userData.userId;

    const apartmentIds = await getUserApartments(userId);
    
    if (apartmentIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No apartments found for this user',
        payments: [],
        summary: {
          total: 0,
          paid: 0,
          pending: 0
        },
        apartments: [],
        hasApartments: false
      });
    }
    
    // Get payments for all user's apartments
    const [payments] = await pool.execute(
      `SELECT 
        p.PaymentId,
        p.ApartmentId,
        p.Amount,
        p.PayDate,
        p.PaidDate,
        p.Status,
        a.ApartmentName,
        a.BlockNumber,
        a.UnitNumber
      FROM Payment p
      JOIN Apartment a ON p.ApartmentId = a.ApartmentId
      WHERE p.ApartmentId IN (${apartmentIds.map(() => '?').join(',')})
      AND p.UserAdminId = ?
      ORDER BY p.PayDate DESC`,
      [...apartmentIds, userId]
    );
    
    // Format payments
    const formattedPayments = payments.map(payment => ({
      id: payment.PaymentId,
      apartmentId: payment.ApartmentId,
      amount: payment.Amount,
      payDate: payment.PayDate,
      paidDate: payment.PaidDate,
      status: payment.Status,
      apartment: {
        name: payment.ApartmentName,
        block: payment.BlockNumber,
        unit: payment.UnitNumber,
        displayName: `${payment.ApartmentName}, Блок ${payment.BlockNumber}${payment.UnitNumber ? ', Тоот ' + payment.UnitNumber : ''}`
      }
    }));
    
    // Calculate summary
    let totalAmount = 0;
    let paidAmount = 0;
    let pendingAmount = 0;
    
    formattedPayments.forEach(payment => {
      totalAmount += Number(payment.amount);
      
      if (payment.status === 'PAID') {
        paidAmount += Number(payment.amount);
      } else {
        pendingAmount += Number(payment.amount);
      }
    });
    
    // Get list of apartment objects for selection
    const [apartmentObjects] = await pool.execute(
      `SELECT a.ApartmentId, a.ApartmentName, a.BlockNumber, a.UnitNumber 
       FROM Apartment a
       WHERE a.ApartmentId IN (${apartmentIds.map(() => '?').join(',')})`,
      apartmentIds
    );
    
    const apartments = apartmentObjects.map(apt => ({
      id: apt.ApartmentId,
      name: apt.ApartmentName,
      block: apt.BlockNumber,
      unit: apt.UnitNumber,
      displayName: `${apt.ApartmentName}, Блок ${apt.BlockNumber}${apt.UnitNumber ? ', Тоот ' + apt.UnitNumber : ''}`
    }));
    
    return res.status(200).json({
      success: true,
      payments: formattedPayments,
      summary: {
        total: totalAmount,
        paid: paidAmount,
        pending: pendingAmount
      },
      apartments: apartments,
      hasApartments: true
    });
    
  } catch (error) {
    handleError(res, error, 'Get user payments');
  }
};

// Get payment details by ID
exports.getPaymentById = async (req, res) => {
  try {
    const userId = req.userData.userId;
    const paymentId = req.params.id;
    
    if (!paymentId || isNaN(Number(paymentId))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment ID'
      });
    }
    
    // Get payment with validation that it belongs to the user
    const [payments] = await pool.execute(
      `SELECT 
        p.PaymentId,
        p.ApartmentId,
        p.Amount,
        p.PayDate,
        p.PaidDate,
        p.Status,
        p.OrderOrderId,
        a.ApartmentName,
        a.BlockNumber,
        a.UnitNumber
      FROM Payment p
      JOIN Apartment a ON p.ApartmentId = a.ApartmentId
      WHERE p.PaymentId = ?
      AND p.UserAdminId = ?`,
      [paymentId, userId]
    );
    
    if (payments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found or you do not have access'
      });
    }
    
    const payment = payments[0];
    
    // Get water usage details for this payment (from the same month)
    const payDate = new Date(payment.PayDate);
    const month = payDate.getMonth() + 1; // JavaScript months are 0-indexed
    const year = payDate.getFullYear();
    
    const waterUsage = await calculateWaterUsage(
      payment.ApartmentId,
      month,
      year
    );
    
    // Get tariff that was used for calculation
    const tariff = await getCurrentTariff();
    
    // Calculate breakdown
    const coldWaterCost = waterUsage.cold * tariff.ColdWaterTariff;
    const hotWaterCost = waterUsage.hot * tariff.HeatWaterTariff;
    const dirtyWaterCost = (waterUsage.cold + waterUsage.hot) * tariff.DirtyWaterTariff;
    
    return res.status(200).json({
      success: true,
      payment: {
        id: payment.PaymentId,
        apartmentId: payment.ApartmentId,
        amount: payment.Amount,
        payDate: payment.PayDate,
        paidDate: payment.PaidDate,
        status: payment.Status,
        orderId: payment.OrderOrderId,
        apartment: {
          name: payment.ApartmentName,
          block: payment.BlockNumber,
          unit: payment.UnitNumber,
          displayName: `${payment.ApartmentName}, Блок ${payment.BlockNumber}${payment.UnitNumber ? ', Тоот ' + payment.UnitNumber : ''}`
        }
      },
      waterUsage: {
        cold: waterUsage.cold,
        hot: waterUsage.hot,
        total: waterUsage.cold + waterUsage.hot
      },
      costs: {
        coldWater: coldWaterCost,
        hotWater: hotWaterCost,
        dirtyWater: dirtyWaterCost,
        total: coldWaterCost + hotWaterCost + dirtyWaterCost
      },
      tariff: {
        coldWater: tariff.ColdWaterTariff,
        hotWater: tariff.HeatWaterTariff,
        dirtyWater: tariff.DirtyWaterTariff
      }
    });
    
  } catch (error) {
    handleError(res, error, 'Get payment by ID');
  }
};

// Generate monthly payment for user's apartments
exports.generateMonthlyPayment = async (req, res) => {
  try {
    const userId = req.userData.userId;
    const { apartmentId } = req.body;
    
    // Validate apartment belongs to user
    const apartmentIds = await getUserApartments(userId);
    
    if (apartmentIds.length === 0 || !apartmentIds.includes(Number(apartmentId))) {
      return res.status(403).json({
        success: false,
        message: 'No apartment found for this user or invalid apartment ID',
        hasApartments: false
      });
    }
    
    // Get current month and year
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    // Check if payment for this month already exists
    const [existingPayments] = await pool.execute(
      `SELECT COUNT(*) as count
       FROM Payment
       WHERE ApartmentId = ?
       AND UserAdminId = ?
       AND MONTH(PayDate) = ?
       AND YEAR(PayDate) = ?`,
      [apartmentId, userId, currentMonth, currentYear]
    );
    
    if (existingPayments[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment for this month already exists'
      });
    }
    
    // Get water usage for the current month
    const waterUsage = await calculateWaterUsage(
      apartmentId,
      currentMonth,
      currentYear
    );
    
    // Get current tariff
    const tariff = await getCurrentTariff();
    
    // Calculate costs
    const coldWaterCost = waterUsage.cold * tariff.ColdWaterTariff;
    const hotWaterCost = waterUsage.hot * tariff.HeatWaterTariff;
    const dirtyWaterCost = (waterUsage.cold + waterUsage.hot) * tariff.DirtyWaterTariff;
    const totalAmount = coldWaterCost + hotWaterCost + dirtyWaterCost;
    
    // Generate a simple order ID (in a real system, this would come from payment gateway)
    const orderId = Math.floor(Math.random() * 1000000) + 1;
    
    // Create payment record
    const [result] = await pool.execute(
      `INSERT INTO Payment 
        (ApartmentId, UserAdminId, Amount, PayDate, PaidDate, Status, OrderOrderId)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP, NULL, 'PENDING', ?)`,
      [apartmentId, userId, totalAmount, orderId]
    );
    
    const paymentId = result.insertId;
    
    return res.status(201).json({
      success: true,
      message: 'Monthly payment generated successfully',
      payment: {
        id: paymentId,
        apartmentId: Number(apartmentId),
        amount: totalAmount,
        status: 'PENDING',
        orderId: orderId
      },
      waterUsage: {
        cold: waterUsage.cold,
        hot: waterUsage.hot,
        total: waterUsage.cold + waterUsage.hot
      },
      costs: {
        coldWater: coldWaterCost,
        hotWater: hotWaterCost,
        dirtyWater: dirtyWaterCost,
        total: totalAmount
      }
    });
    
  } catch (error) {
    handleError(res, error, 'Generate monthly payment');
  }
};

// Process payment
exports.processPayment = async (req, res) => {
  try {
    const userId = req.userData.userId;
    const { paymentId } = req.body;
    
    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required'
      });
    }
    
    const [payments] = await pool.execute(
      `SELECT p.PaymentId, p.Status, p.Amount, p.ApartmentId
       FROM Payment p
       WHERE p.PaymentId = ?
       AND p.UserAdminId = ?`,
      [paymentId, userId]
    );
    
    if (payments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found or access denied'
      });
    }
    
    const payment = payments[0];

    if (payment.Status === 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'Payment has already been processed'
      });
    }
    
    await pool.execute(
      `UPDATE Payment
       SET Status = 'PAID', PaidDate = CURRENT_TIMESTAMP
       WHERE PaymentId = ?`,
      [paymentId]
    );
    
    return res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
      paymentId: payment.PaymentId
    });
    
  } catch (error) {
    handleError(res, error, 'Process payment');
  }
};

exports.getPaymentStatistics = async (req, res) => {
  try {
    const userId = req.userData.userId;
 
    const apartmentIds = await getUserApartments(userId);
    
    if (apartmentIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No apartments found for this user',
        monthlyStats: [],
        yearlyTotal: 0,
        apartments: [],
        hasApartments: false
      });
    }

    const currentYear = new Date().getFullYear();

    const [monthlyStats] = await pool.execute(
      `SELECT 
        MONTH(p.PayDate) as month,
        SUM(p.Amount) as totalAmount,
        COUNT(CASE WHEN p.Status = 'PAID' THEN 1 END) as paidCount,
        COUNT(CASE WHEN p.Status = 'PENDING' THEN 1 END) as pendingCount
      FROM Payment p
      WHERE p.ApartmentApartmentId IN (${apartmentIds.map(() => '?').join(',')})
      AND p.UserAdminId = ?
      AND YEAR(p.PayDate) = ?
      GROUP BY MONTH(p.PayDate)
      ORDER BY MONTH(p.PayDate)`,
      [...apartmentIds, userId, currentYear]
    );

    const months = Array(12).fill().map((_, i) => i + 1);
    const formattedStats = months.map(month => {
      const monthData = monthlyStats.find(stat => stat.month === month);
      
      return {
        month: month,
        monthName: new Date(currentYear, month - 1, 1).toLocaleString('default', { month: 'long' }),
        totalAmount: monthData ? Number(monthData.totalAmount) : 0,
        paidCount: monthData ? monthData.paidCount : 0,
        pendingCount: monthData ? monthData.pendingCount : 0
      };
    });

    const yearlyTotal = formattedStats.reduce((acc, stat) => acc + stat.totalAmount, 0);

    const [apartmentObjects] = await pool.execute(
      `SELECT a.ApartmentId, a.ApartmentName, a.BlockNumber, a.UnitNumber 
       FROM Apartment a
       WHERE a.ApartmentId IN (${apartmentIds.map(() => '?').join(',')})`,
      apartmentIds
    );
    
    const apartments = apartmentObjects.map(apt => ({
      id: apt.ApartmentId,
      name: apt.ApartmentName,
      block: apt.BlockNumber,
      unit: apt.UnitNumber,
      displayName: `${apt.ApartmentName}, Блок ${apt.BlockNumber}${apt.UnitNumber ? ', Тоот ' + apt.UnitNumber : ''}`
    }));
    
    return res.status(200).json({
      success: true,
      monthlyStats: formattedStats,
      yearlyTotal: yearlyTotal,
      apartments: apartments,
      hasApartments: true
    });
    
  } catch (error) {
    handleError(res, error, 'Get payment statistics');
  }
};