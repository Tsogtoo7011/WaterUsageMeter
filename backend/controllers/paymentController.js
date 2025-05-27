const pool = require('../config/db');
const { handleError } = require('../utils/errorHandler');

async function getUserApartments(userId) {
  const [apartments] = await pool.execute(
    'SELECT aua.ApartmentId FROM ApartmentUserAdmin aua WHERE aua.UserId = ?',
    [userId]
  );
  if (apartments.length === 0) return [];
  return apartments.map(apt => apt.ApartmentId);
}

function determinePaymentStatus(payment) {
  const status = payment.Status;
  if (status === 'Төлөгдсөн') return 'paid';
  if (status === 'Цуцлагдсан') return 'cancelled';
  if (status === 'Хугацаа хэтэрсэн') return 'overdue';
  const payDate = new Date(payment.PayDate);
  const currentDate = new Date();
  const dueDate = new Date(payDate);
  dueDate.setDate(dueDate.getDate() + 30);
  if (status === 'Төлөгдөөгүй') {
    if (currentDate > dueDate) return 'overdue';
    return 'pending';
  }
  return 'pending';
}

exports.getCurrentTariff = async function() {
  const [tariffs] = await pool.execute(
    'SELECT * FROM Tarif ORDER BY TariffId DESC LIMIT 1'
  );
  if (tariffs.length === 0) throw new Error('No tariff information found in the system');
  return tariffs[0];
}

async function getPreviousReadingsForMonth(apartmentId, month, year) {
  let prevMonth = month - 1;
  let prevYear = year;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear = year - 1;
  }

  const [prevReadings] = await pool.execute(
    `SELECT 
      Location,
      Type,
      MAX(Indication) as latest_reading,
      MAX(WaterMeterDate) as last_date
    FROM WaterMeter
    WHERE ApartmentId = ?
      AND (
        (YEAR(WaterMeterDate) < ?)
        OR (YEAR(WaterMeterDate) = ? AND MONTH(WaterMeterDate) < ?)
      )
    GROUP BY Location, Type`,
    [apartmentId, year, year, month]
  );
  return prevReadings;
}

async function calculateWaterUsage(apartmentId, month, year) {
  const [currentReadings] = await pool.execute(
    `SELECT 
      Location,
      Type,
      MAX(Indication) as latest_reading
    FROM WaterMeter
    WHERE ApartmentId = ?
      AND MONTH(WaterMeterDate) = ?
      AND YEAR(WaterMeterDate) = ?
    GROUP BY Location, Type`,
    [apartmentId, month, year]
  );

  const prevReadings = await getPreviousReadingsForMonth(apartmentId, month, year);

  let usage = { cold: 0, hot: 0 };
  currentReadings.forEach(current => {
    const prev = prevReadings.find(
      p => p.Location === current.Location && p.Type === current.Type
    );
    const prevValue = prev ? Number(prev.latest_reading) : 0;
    const currValue = Number(current.latest_reading);
    const diff = currValue - prevValue;
    if (current.Type === 0) usage.cold += diff > 0 ? diff : 0;
    else if (current.Type === 1) usage.hot += diff > 0 ? diff : 0;
  });

  return usage;
}

exports.getUserPayments = async (req, res) => {
  try {
    const userId = req.userData.userId;
    const apartmentId = req.query.apartmentId ? Number(req.query.apartmentId) : null;

    const apartmentIds = await getUserApartments(userId);

    if (apartmentIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No apartments found for this user',
        payments: [],
        summary: {
          total: 0,
          paid: 0,
          pending: 0,
          overdue: 0
        },
        apartments: [],
        hasApartments: false
      });
    }

    const whereClause = apartmentId && apartmentIds.includes(apartmentId)
      ? 'p.ApartmentId = ?'
      : `p.ApartmentId IN (${apartmentIds.map(() => '?').join(',')})`;

    const queryParams = apartmentId && apartmentIds.includes(apartmentId)
      ? [apartmentId, userId]
      : [...apartmentIds, userId];

    const [payments] = await pool.execute(
      `SELECT 
        p.PaymentId,
        p.ApartmentId,
        p.Amount,
        p.PayDate,
        p.PaidDate,
        p.Status,
        p.PaymentType,
        p.TariffId,
        a.ApartmentName,
        a.BlockNumber,
        a.UnitNumber
      FROM Payment p
      JOIN Apartment a ON p.ApartmentId = a.ApartmentId
      WHERE ${whereClause}
      AND p.UserAdminId = ?
      ORDER BY p.PayDate DESC`,
      queryParams
    );

    const formattedPayments = payments.map(payment => {
      const calculatedStatus = determinePaymentStatus(payment);
      let dueDate = payment.PayDate;
      if (dueDate instanceof Date) {
        dueDate = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`;
      }
      return {
        id: payment.PaymentId,
        apartmentId: payment.ApartmentId,
        amount: payment.Amount,
        payDate: payment.PayDate,
        paidDate: payment.PaidDate,
        dueDate: dueDate,
        status: calculatedStatus,
        paymentType: payment.PaymentType,
        tariffId: payment.TariffId,
        apartment: {
          name: payment.ApartmentName,
          block: payment.BlockNumber,
          unit: payment.UnitNumber,
          displayName: `${payment.ApartmentName}, Блок ${payment.BlockNumber}${payment.UnitNumber ? ', Тоот ' + payment.UnitNumber : ''}`
        }
      };
    });

    let totalAmount = 0;
    let paidAmount = 0;
    let pendingAmount = 0;
    let overdueAmount = 0;

    formattedPayments.forEach(payment => {
      totalAmount += Number(payment.amount);

      if (payment.status === 'paid') {
        paidAmount += Number(payment.amount);
      } else if (payment.status === 'overdue') {
        overdueAmount += Number(payment.amount);
      } else if (payment.status === 'pending') {
        pendingAmount += Number(payment.amount);
      }
    });

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
        pending: pendingAmount,
        overdue: overdueAmount
      },
      apartments: apartments,
      hasApartments: true
    });

  } catch (error) {
    handleError(res, error, 'Get user payments');
  }
};

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

    const [payments] = await pool.execute(
      `SELECT 
        p.PaymentId,
        p.ApartmentId,
        p.Amount,
        p.PayDate,
        p.PaidDate,
        p.Status,
        p.PaymentType,
        p.TariffId,
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

    const calculatedStatus = determinePaymentStatus(payment);

    const payDate = new Date(payment.PayDate);
    const dueDate = new Date(payDate);
    dueDate.setDate(dueDate.getDate() + 30);

    const paymentDate = new Date(payment.PayDate);
    const month = paymentDate.getMonth() + 1;
    const year = paymentDate.getFullYear();

    const waterUsage = await calculateWaterUsage(
      payment.ApartmentId,
      month,
      year
    );

    const tariff = await exports.getCurrentTariff();

    const coldWaterCost = (waterUsage.cold + waterUsage.hot) * tariff.ColdWaterTariff;
    const hotWaterCost = waterUsage.hot * tariff.HeatWaterTariff;
    const dirtyWaterCost = (waterUsage.cold + waterUsage.hot) * tariff.DirtyWaterTariff;
    const totalAmount = coldWaterCost + hotWaterCost + dirtyWaterCost;

    return res.status(200).json({
      success: true,
      payment: {
        id: payment.PaymentId,
        apartmentId: payment.ApartmentId,
        amount: payment.Amount,
        payDate: payment.PayDate,
        paidDate: payment.PaidDate,
        dueDate: `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`,
        status: calculatedStatus,
        paymentType: payment.PaymentType,
        tariffId: payment.TariffId,
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

exports.generateMonthlyPayment = async (req, res) => {
  try {
    const userId = req.userData.userId;
    const { apartmentId } = req.body;

    const apartmentIds = await getUserApartments(userId);

    if (apartmentIds.length === 0 || !apartmentIds.includes(Number(apartmentId))) {
      return res.status(403).json({
        success: false,
        message: 'No apartment found for this user or invalid apartment ID',
        hasApartments: false
      });
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    // Always use last day of next month for PayDate
    const payDate = getLastDayOfNextMonth(now);

    const [existingPayments] = await pool.execute(
      `SELECT PaymentId
       FROM Payment
       WHERE ApartmentId = ?
       AND UserAdminId = ?
       AND MONTH(PayDate) = ?
       AND YEAR(PayDate) = ?
       LIMIT 1`,
      [apartmentId, userId, currentMonth, currentYear]
    );

    if (existingPayments.length > 0) {

      const [paymentDetails] = await pool.execute(
        `SELECT 
          p.PaymentId,
          p.ApartmentId,
          p.Amount,
          p.PayDate,
          p.PaidDate,
          p.Status
        FROM Payment p
        WHERE p.PaymentId = ?`,
        [existingPayments[0].PaymentId]
      );

      if (paymentDetails.length > 0) {
        const payment = paymentDetails[0];
        // Always calculate dueDate as last day of next month from PayDate
        const dueDate = getLastDayOfNextMonth(new Date(payment.PayDate));
        return res.status(200).json({
          success: true,
          message: 'Payment for current month already exists',
          payment: {
            id: payment.PaymentId,
            apartmentId: Number(apartmentId),
            amount: payment.Amount,
            status: payment.Status,
            payDate: payment.PayDate,
            dueDate: dueDate
          },
          exists: true
        });
      }
    }

    const waterUsage = await calculateWaterUsage(
      apartmentId,
      currentMonth,
      currentYear
    );

    const tariff = await exports.getCurrentTariff();

    const coldWaterCost = (waterUsage.cold + waterUsage.hot) * tariff.ColdWaterTariff;
    const hotWaterCost = waterUsage.hot * tariff.HeatWaterTariff;
    const dirtyWaterCost = (waterUsage.cold + waterUsage.hot) * tariff.DirtyWaterTariff;
    const totalAmount = coldWaterCost + hotWaterCost + dirtyWaterCost;

    const [result] = await pool.execute(
      `INSERT INTO Payment 
        (ApartmentId, UserAdminId, PaymentType, Amount, PayDate, PaidDate, Status, TariffId)
       VALUES (?, ?, ?, ?, ?, NULL, 'Төлөгдөөгүй', ?)`,
      [apartmentId, userId, 'water', totalAmount, payDate, tariff.TariffId]
    );

    // Always use last day of next month for dueDate
    const dueDate = getLastDayOfNextMonth(new Date(payDate));

    return res.status(201).json({
      success: true,
      message: 'Monthly payment generated successfully',
      payment: {
        id: result.insertId,
        apartmentId: Number(apartmentId),
        amount: totalAmount,
        status: 'Төлөгдөлгүй',
        dueDate: dueDate,
        tariffId: tariff.TariffId
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
      `SELECT p.PaymentId, p.Status, p.Amount, p.ApartmentId, p.PayDate
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
    const calculatedStatus = determinePaymentStatus(payment);

    if (payment.Status === 'Төлөгдсөн') {
      return res.status(400).json({
        success: false,
        message: 'Payment has already been processed'
      });
    }

    if (payment.Status === 'Цуцлагдсан') {
      return res.status(400).json({
        success: false,
        message: 'Cannot process a cancelled payment'
      });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      await connection.execute(
        `UPDATE Payment
         SET Status = 'Төлөгдсөн', PaidDate = CURRENT_TIMESTAMP
         WHERE PaymentId = ?`,
        [paymentId]
      );

      await connection.commit();

      return res.status(200).json({
        success: true,
        message: 'Payment processed successfully',
        paymentId: payment.PaymentId
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    handleError(res, error, 'Process payment');
  }
};

exports.getPaymentServiceByServiceId = async (req, res) => {
  return res.status(410).json({ success: false, message: 'PaymentService is merged into Payment. Use Payment endpoints.' });
};

exports.processPaymentService = async (req, res) => {
  return res.status(410).json({ success: false, message: 'PaymentService is merged into Payment. Use Payment endpoints.' });
};

exports.getPaymentStatistics = async (req, res) => {
  try {
    const userId = req.userData.userId;
    const apartmentId = req.query.apartmentId ? Number(req.query.apartmentId) : null;

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

    if (apartmentId && !apartmentIds.includes(apartmentId)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this apartment'
      });
    }

    const currentYear = new Date().getFullYear();

    const whereClause = apartmentId
      ? 'p.ApartmentId = ?'
      : `p.ApartmentId IN (${apartmentIds.map(() => '?').join(',')})`;

    const queryParams = apartmentId
      ? [apartmentId, userId, currentYear]
      : [...apartmentIds, userId, currentYear];

    const [monthlyData] = await pool.execute(
      `SELECT 
        MONTH(p.PayDate) as month,
        p.PaymentId,
        p.Status,
        p.PayDate,
        p.Amount
      FROM Payment p
      WHERE ${whereClause}
      AND p.UserAdminId = ?
      AND YEAR(p.PayDate) = ?
      ORDER BY MONTH(p.PayDate)`,
      queryParams
    );

    const monthlyPayments = monthlyData.map(payment => {
      return {
        ...payment,
        calculatedStatus: determinePaymentStatus(payment)
      };
    });

    const monthStats = {};
    monthlyPayments.forEach(payment => {
      const month = payment.month;
      if (!monthStats[month]) {
        monthStats[month] = {
          month,
          totalAmount: 0,
          paidCount: 0,
          pendingCount: 0,
          overdueCount: 0
        };
      }

      monthStats[month].totalAmount += Number(payment.Amount);
      if (payment.calculatedStatus === 'paid') {
        monthStats[month].paidCount++;
      } else if (payment.calculatedStatus === 'pending') {
        monthStats[month].pendingCount++;
      } else if (payment.calculatedStatus === 'overdue') {
        monthStats[month].overdueCount++;
      }
    });

    const months = Array(12).fill().map((_, i) => i + 1);
    const formattedStats = months.map(month => {
      const monthData = monthStats[month];

      return {
        month: month,
        monthName: new Date(currentYear, month - 1, 1).toLocaleString('default', { month: 'long' }),
        totalAmount: monthData ? Number(monthData.totalAmount) : 0,
        paidCount: monthData ? monthData.paidCount : 0,
        pendingCount: monthData ? monthData.pendingCount : 0,
        overdueCount: monthData ? monthData.overdueCount : 0
      };
    });

    const yearlyTotal = formattedStats.reduce((acc, stat) => acc + stat.totalAmount, 0);

    let totalPaid = 0;
    let totalPending = 0;
    let totalOverdue = 0;

    formattedStats.forEach(month => {
      totalPaid += month.paidCount || 0;
      totalPending += month.pendingCount || 0;
      totalOverdue += month.overdueCount || 0;
    });

    const yearlyStatusData = [
      { name: 'paid', value: totalPaid, color: '#10B981' },
      { name: 'pending', value: totalPending, color: '#F59E0B' },
      { name: 'overdue', value: totalOverdue, color: '#EF4444' }
    ].filter(item => item.value > 0);

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
      yearlyStatusData: yearlyStatusData,
      apartments: apartments,
      hasApartments: true
    });

  } catch (error) {
    handleError(res, error, 'Get payment statistics');
  }
};

exports.generateMonthlyPaymentForApartment = async function(apartmentId, userId, pool, monthArg, yearArg) {

  const now = new Date();
  const currentMonth = monthArg || (now.getMonth() + 1);
  const currentYear = yearArg || now.getFullYear();
  const payDate = getLastDayOfNextMonth(new Date(currentYear, currentMonth - 1, 1));

  const [existingPayments] = await pool.execute(
    `SELECT PaymentId
     FROM Payment
     WHERE ApartmentId = ?
     AND UserAdminId = ?
     AND MONTH(PayDate) = ?
     AND YEAR(PayDate) = ?
     LIMIT 1`,
    [apartmentId, userId, currentMonth, currentYear]
  );

  if (existingPayments.length > 0) {
    const [paymentDetails] = await pool.execute(
      `SELECT 
        p.PaymentId,
        p.ApartmentId,
        p.Amount,
        p.PayDate,
        p.PaidDate,
        p.Status,
        p.PaymentType,
        p.TariffId
      FROM Payment p
      WHERE p.PaymentId = ?`,
      [existingPayments[0].PaymentId]
    );
    if (paymentDetails.length > 0) {
      const payment = paymentDetails[0];
      const dueDate = getLastDayOfNextMonth(new Date(payment.PayDate));
      return {
        id: payment.PaymentId,
        apartmentId: Number(apartmentId),
        amount: payment.Amount,
        status: payment.Status,
        payDate: payment.PayDate,
        dueDate: dueDate,
        paymentType: payment.PaymentType,
        tariffId: payment.TariffId,
        exists: true
      };
    }
  }

  const usage = await calculateWaterUsage(apartmentId, currentMonth, currentYear);

  const tariff = await exports.getCurrentTariff();

  const coldWaterCost = (usage.cold + usage.hot) * tariff.ColdWaterTariff;
  const hotWaterCost = usage.hot * tariff.HeatWaterTariff;
  const dirtyWaterCost = (usage.cold + usage.hot) * tariff.DirtyWaterTariff;
  const totalAmount = coldWaterCost + hotWaterCost + dirtyWaterCost;

  const [result] = await pool.execute(
    `INSERT INTO Payment 
      (ApartmentId, UserAdminId, PaymentType, Amount, PayDate, PaidDate, Status, TariffId)
     VALUES (?, ?, 'water', ?, ?, NULL, 'Төлөгдөөгүй', ?)`,
    [apartmentId, userId, totalAmount, payDate, tariff.TariffId]
  );

  const dueDate = getLastDayOfNextMonth(new Date(payDate));

  return {
    id: result.insertId,
    apartmentId: Number(apartmentId),
    amount: totalAmount,
    status: 'Төлөгдөлгүй',
    payDate: dueDate,
    dueDate: dueDate,
    paymentType: 'water',
    tariffId: tariff.TariffId,
    exists: false
  };
};

// Helper to get last day of next month as yyyy-mm-dd (local time, not UTC)
function getLastDayOfNextMonth(date = new Date()) {
  let year = date.getFullYear();
  let month = date.getMonth() + 1; // JS: 0=Jan, 11=Dec; +1 to get 1-based
  if (month === 12) {
    year += 1;
    month = 1;
  } else {
    month += 1;
  }
  const lastDay = new Date(year, month, 0);
  return `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
}