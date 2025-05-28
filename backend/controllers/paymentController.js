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
  if (status === 'Хоцорсон') return 'overdue';
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
        summary: { total: 0, paid: 0, pending: 0, overdue: 0 },
        apartments: [],
        hasApartments: false
      });
    }

    // Water payments
    const waterWhereClause = apartmentId && apartmentIds.includes(apartmentId)
      ? 'wp.ApartmentId = ?'
      : `wp.ApartmentId IN (${apartmentIds.map(() => '?').join(',')})`;
    const waterQueryParams = apartmentId && apartmentIds.includes(apartmentId)
      ? [apartmentId, userId]
      : [...apartmentIds, userId];

    const [waterPayments] = await pool.execute(
      `SELECT 
        wp.WaterPaymentId as id,
        wp.ApartmentId,
        wp.TotalAmount as amount,
        wp.PayDate,
        wp.PaidDate,
        wp.Status,
        wp.TariffId,
        wp.ColdWaterUsage,
        wp.HotWaterUsage,
        wp.ColdWaterCost,
        wp.HotWaterCost,
        wp.DirtyWaterCost,
        a.ApartmentName,
        a.BlockNumber,
        a.UnitNumber
      FROM WaterPayment wp
      JOIN Apartment a ON wp.ApartmentId = a.ApartmentId
      WHERE ${waterWhereClause}
      AND wp.UserAdminId = ?
      ORDER BY wp.PayDate DESC`,
      waterQueryParams
    );

    // Service payments
    const serviceWhereClause = apartmentId && apartmentIds.includes(apartmentId)
      ? 'sp.ApartmentId = ?'
      : `sp.ApartmentId IN (${apartmentIds.map(() => '?').join(',')})`;
    const serviceQueryParams = apartmentId && apartmentIds.includes(apartmentId)
      ? [apartmentId, userId]
      : [...apartmentIds, userId];

    const [servicePayments] = await pool.execute(
      `SELECT 
        sp.ServicePaymentId as id,
        sp.ApartmentId,
        sp.Amount as amount,
        sp.PayDate,
        sp.PaidDate,
        sp.Status,
        sp.ServiceId,
        sp.Description,
        a.ApartmentName,
        a.BlockNumber,
        a.UnitNumber
      FROM ServicePayment sp
      JOIN Apartment a ON sp.ApartmentId = a.ApartmentId
      JOIN Service s ON sp.ServiceId = s.ServiceId
      WHERE ${serviceWhereClause}
      AND sp.UserAdminId = ?
      ORDER BY sp.PayDate DESC`,
      serviceQueryParams
    );

    // Format water payments
    const formattedWaterPayments = waterPayments.map(payment => {
      const calculatedStatus = determinePaymentStatus(payment);
      const payDate = new Date(payment.PayDate);
      const dueDate = new Date(payDate);
      dueDate.setDate(dueDate.getDate() + 30);

      return {
        ...payment,
        payDate: payment.PayDate, 
        paidDate: payment.PaidDate, 
        paymentType: 'water',
        dueDate: dueDate.toISOString(),
        status: calculatedStatus,
        waterUsage: {
          cold: payment.ColdWaterUsage,
          hot: payment.HotWaterUsage,
          total: Number(payment.ColdWaterUsage) + Number(payment.HotWaterUsage)
        },
        costs: {
          coldWater: payment.ColdWaterCost,
          hotWater: payment.HotWaterCost,
          dirtyWater: payment.DirtyWaterCost,
          total: payment.amount
        },
        apartment: {
          name: payment.ApartmentName,
          block: payment.BlockNumber,
          unit: payment.UnitNumber,
          displayName: `${payment.ApartmentName}, Блок ${payment.BlockNumber}${payment.UnitNumber ? ', Тоот ' + payment.UnitNumber : ''}`
        }
      };
    });

    // Format service payments
    const formattedServicePayments = servicePayments.map(payment => {
      const calculatedStatus = determinePaymentStatus(payment);
      const payDate = new Date(payment.PayDate);
      const dueDate = new Date(payDate);
      dueDate.setDate(dueDate.getDate() + 30);

      return {
        ...payment,
        payDate: payment.PayDate, // ensure camelCase
        paidDate: payment.PaidDate, // ensure camelCase
        paymentType: 'service',
        dueDate: dueDate.toISOString(),
        status: calculatedStatus,
        service: {
          id: payment.ServiceId,
        },
        apartment: {
          name: payment.ApartmentName,
          block: payment.BlockNumber,
          unit: payment.UnitNumber,
          displayName: `${payment.ApartmentName}, Блок ${payment.BlockNumber}${payment.UnitNumber ? ', Тоот ' + payment.UnitNumber : ''}`
        }
      };
    });

    const allPayments = [...formattedWaterPayments, ...formattedServicePayments].sort(
      (a, b) => new Date(b.payDate) - new Date(a.payDate)
    );

    // Summary
    let totalAmount = 0, paidAmount = 0, pendingAmount = 0, overdueAmount = 0;
    allPayments.forEach(payment => {
      totalAmount += Number(payment.amount);
      if (payment.status === 'paid') paidAmount += Number(payment.amount);
      else if (payment.status === 'overdue') overdueAmount += Number(payment.amount);
      else if (payment.status === 'pending') pendingAmount += Number(payment.amount);
    });

    // Apartments
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
      payments: allPayments,
      summary: { total: totalAmount, paid: paidAmount, pending: pendingAmount, overdue: overdueAmount },
      apartments,
      hasApartments: true
    });

  } catch (error) {
    handleError(res, error, 'Get user payments');
  }
};

// Get a single payment by ID (water or service)
exports.getPaymentById = async (req, res) => {
  try {
    const userId = req.userData.userId;
    const paymentId = req.params.id;

    if (!paymentId || isNaN(Number(paymentId))) {
      return res.status(400).json({ success: false, message: 'Invalid payment ID' });
    }

    // Try water payment first
    const [waterPayments] = await pool.execute(
      `SELECT 
        wp.WaterPaymentId as id,
        wp.ApartmentId,
        wp.TotalAmount as amount,
        wp.PayDate,
        wp.PaidDate,
        wp.Status,
        wp.TariffId,
        wp.ColdWaterUsage,
        wp.HotWaterUsage,
        wp.ColdWaterCost,
        wp.HotWaterCost,
        wp.DirtyWaterCost,
        a.ApartmentName,
        a.BlockNumber,
        a.UnitNumber
      FROM WaterPayment wp
      JOIN Apartment a ON wp.ApartmentId = a.ApartmentId
      WHERE wp.WaterPaymentId = ?
      AND wp.UserAdminId = ?`,
      [paymentId, userId]
    );

    if (waterPayments.length > 0) {
      const payment = waterPayments[0];
      const calculatedStatus = determinePaymentStatus(payment);
      const payDate = new Date(payment.PayDate);
      const dueDate = new Date(payDate);
      dueDate.setDate(dueDate.getDate() + 30);
      const tariff = await exports.getCurrentTariff();

      return res.status(200).json({
        success: true,
        payment: {
          ...payment,
          payDate: payment.PayDate, 
          paidDate: payment.PaidDate, 
          paymentType: 'water',
          dueDate: dueDate.toISOString(),
          status: calculatedStatus,
          waterUsage: {
            cold: payment.ColdWaterUsage,
            hot: payment.HotWaterUsage,
            total: Number(payment.ColdWaterUsage) + Number(payment.HotWaterUsage)
          },
          costs: {
            coldWater: payment.ColdWaterCost,
            hotWater: payment.HotWaterCost,
            dirtyWater: payment.DirtyWaterCost,
            total: payment.amount
          },
          apartment: {
            name: payment.ApartmentName,
            block: payment.BlockNumber,
            unit: payment.UnitNumber,
            displayName: `${payment.ApartmentName}, Блок ${payment.BlockNumber}${payment.UnitNumber ? ', Тоот ' + payment.UnitNumber : ''}`
          }
        },
        tariff: {
          coldWater: tariff.ColdWaterTariff,
          hotWater: tariff.HeatWaterTariff,
          dirtyWater: tariff.DirtyWaterTariff
        }
      });
    }

    // Try service payment
    const [servicePayments] = await pool.execute(
      `SELECT 
        sp.ServicePaymentId as id,
        sp.ApartmentId,
        sp.Amount as amount,
        sp.PayDate,
        sp.PaidDate,
        sp.Status,
        sp.ServiceId,
        sp.Description,
        a.ApartmentName,
        a.BlockNumber,
        a.UnitNumber
      FROM ServicePayment sp
      JOIN Apartment a ON sp.ApartmentId = a.ApartmentId
      JOIN Service s ON sp.ServiceId = s.ServiceId
      WHERE sp.ServicePaymentId = ?
      AND sp.UserAdminId = ?`,
      [paymentId, userId]
    );

    if (servicePayments.length > 0) {
      const payment = servicePayments[0];
      const calculatedStatus = determinePaymentStatus(payment);
      const payDate = new Date(payment.PayDate);
      const dueDate = new Date(payDate);
      dueDate.setDate(dueDate.getDate() + 30);

      return res.status(200).json({
        success: true,
        payment: {
          ...payment,
          payDate: payment.PayDate, // <-- add this
          paidDate: payment.PaidDate, // <-- add this
          paymentType: 'service',
          dueDate: dueDate.toISOString(),
          status: calculatedStatus,
          service: {
            id: payment.ServiceId,
          },
          apartment: {
            name: payment.ApartmentName,
            block: payment.BlockNumber,
            unit: payment.UnitNumber,
            displayName: `${payment.ApartmentName}, Блок ${payment.BlockNumber}${payment.UnitNumber ? ', Тоот ' + payment.UnitNumber : ''}`
          }
        }
      });
    }

    return res.status(404).json({ success: false, message: 'Payment not found or you do not have access' });

  } catch (error) {
    handleError(res, error, 'Get payment by ID');
  }
};

// Generate monthly water payment for an apartment
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
    const payDate = getLastDayOfNextMonth(now);

    const [existingPayments] = await pool.execute(
      `SELECT WaterPaymentId
       FROM WaterPayment
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
          wp.WaterPaymentId,
          wp.ApartmentId,
          wp.TotalAmount,
          wp.PayDate,
          wp.PaidDate,
          wp.Status
        FROM WaterPayment wp
        WHERE wp.WaterPaymentId = ?`,
        [existingPayments[0].WaterPaymentId]
      );
      if (paymentDetails.length > 0) {
        const payment = paymentDetails[0];
        const payDateObj = new Date(payment.PayDate);
        const dueDate = new Date(payDateObj);
        dueDate.setDate(dueDate.getDate() + 30);
        return res.status(200).json({
          success: true,
          message: 'Payment for current month already exists',
          payment: {
            id: payment.WaterPaymentId,
            apartmentId: Number(apartmentId),
            amount: payment.TotalAmount,
            status: payment.Status,
            payDate: payment.PayDate,
            paidDate: payment.PaidDate, // will be null/blank until paid
            dueDate: dueDate.toISOString()
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
      `INSERT INTO WaterPayment 
        (ApartmentId, UserAdminId, TariffId, ColdWaterUsage, HotWaterUsage, ColdWaterCost, HotWaterCost, DirtyWaterCost, TotalAmount, PayDate, Status, PaidDate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Төлөгдөөгүй', NULL)`,
      [
        apartmentId,
        userId,
        tariff.TariffId,
        waterUsage.cold,
        waterUsage.hot,
        coldWaterCost,
        hotWaterCost,
        dirtyWaterCost,
        totalAmount,
        payDate
      ]
    );

    const paymentId = result.insertId;
    const dueDate = new Date(payDate);
    dueDate.setDate(dueDate.getDate() + 30);

    return res.status(201).json({
      success: true,
      message: 'Monthly payment generated successfully',
      payment: {
        id: paymentId,
        apartmentId: Number(apartmentId),
        amount: totalAmount,
        status: 'Төлөгдөлгүй',
        payDate: payDate,
        paidDate: null, 
        dueDate: dueDate.toISOString(),
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

// Process a payment (water or service)
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

    // Try water payment
    const [waterPayments] = await pool.execute(
      `SELECT wp.WaterPaymentId as id, wp.Status
       FROM WaterPayment wp
       WHERE wp.WaterPaymentId = ?
       AND wp.UserAdminId = ?`,
      [paymentId, userId]
    );
    if (waterPayments.length > 0) {
      const payment = waterPayments[0];
      if (payment.Status === 'Төлөгдсөн') {
        return res.status(400).json({ success: false, message: 'Payment has already been processed' });
      }
      if (payment.Status === 'Цуцлагдсан') {
        return res.status(400).json({ success: false, message: 'Cannot process a cancelled payment' });
      }
      const connection = await pool.getConnection();
      await connection.beginTransaction();
      try {
        await connection.execute(
          `UPDATE WaterPayment
           SET Status = 'Төлөгдсөн', PaidDate = CURRENT_TIMESTAMP
           WHERE WaterPaymentId = ?`,
          [paymentId]
        );
        await connection.commit();
        return res.status(200).json({
          success: true,
          message: 'Payment processed successfully',
          paymentId: payment.id
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    }

    // Try service payment
    const [servicePayments] = await pool.execute(
      `SELECT sp.ServicePaymentId as id, sp.Status
       FROM ServicePayment sp
       WHERE sp.ServicePaymentId = ?
       AND sp.UserAdminId = ?`,
      [paymentId, userId]
    );
    if (servicePayments.length > 0) {
      const payment = servicePayments[0];
      if (payment.Status === 'Төлөгдсөн') {
        return res.status(400).json({ success: false, message: 'Payment has already been processed' });
      }
      if (payment.Status === 'Цуцлагдсан') {
        return res.status(400).json({ success: false, message: 'Cannot process a cancelled payment' });
      }
      const connection = await pool.getConnection();
      await connection.beginTransaction();
      try {
        await connection.execute(
          `UPDATE ServicePayment
           SET Status = 'Төлөгдсөн', PaidDate = CURRENT_TIMESTAMP
           WHERE ServicePaymentId = ?`,
          [paymentId]
        );
        await connection.commit();
        return res.status(200).json({
          success: true,
          message: 'Payment processed successfully',
          paymentId: payment.id
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    }

    return res.status(404).json({
      success: false,
      message: 'Payment not found or access denied'
    });

  } catch (error) {
    handleError(res, error, 'Process payment');
  }
};

// Payment statistics for water payments
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
      ? 'wp.ApartmentId = ?'
      : `wp.ApartmentId IN (${apartmentIds.map(() => '?').join(',')})`;

    const queryParams = apartmentId
      ? [apartmentId, userId, currentYear]
      : [...apartmentIds, userId, currentYear];

    const [monthlyData] = await pool.execute(
      `SELECT 
        MONTH(wp.PayDate) as month,
        wp.WaterPaymentId,
        wp.Status,
        wp.PayDate,
        wp.TotalAmount
      FROM WaterPayment wp
      WHERE ${whereClause}
      AND wp.UserAdminId = ?
      AND YEAR(wp.PayDate) = ?
      ORDER BY MONTH(wp.PayDate)`,
      queryParams
    );

    const monthlyPayments = monthlyData.map(payment => ({
      ...payment,
      calculatedStatus: determinePaymentStatus(payment)
    }));

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
      monthStats[month].totalAmount += Number(payment.TotalAmount);
      if (payment.calculatedStatus === 'paid') monthStats[month].paidCount++;
      else if (payment.calculatedStatus === 'pending') monthStats[month].pendingCount++;
      else if (payment.calculatedStatus === 'overdue') monthStats[month].overdueCount++;
    });

    const months = Array(12).fill().map((_, i) => i + 1);
    const formattedStats = months.map(month => {
      const monthData = monthStats[month];
      return {
        month,
        monthName: new Date(currentYear, month - 1, 1).toLocaleString('default', { month: 'long' }),
        totalAmount: monthData ? Number(monthData.totalAmount) : 0,
        paidCount: monthData ? monthData.paidCount : 0,
        pendingCount: monthData ? monthData.pendingCount : 0,
        overdueCount: monthData ? monthData.overdueCount : 0
      };
    });

    const yearlyTotal = formattedStats.reduce((acc, stat) => acc + stat.totalAmount, 0);

    let totalPaid = 0, totalPending = 0, totalOverdue = 0;
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
      yearlyTotal,
      yearlyStatusData,
      apartments,
      hasApartments: true
    });

  } catch (error) {
    handleError(res, error, 'Get payment statistics');
  }
};

// Helper for monthly payment generation (for batch/cron)
exports.generateMonthlyPaymentForApartment = async function(apartmentId, userId, pool, monthArg, yearArg) {
  const now = new Date();
  const currentMonth = monthArg || (now.getMonth() + 1);
  const currentYear = yearArg || now.getFullYear();
  const payDate = getLastDayOfNextMonth(new Date(currentYear, currentMonth - 1, 1));

  const [existingPayments] = await pool.execute(
    `SELECT WaterPaymentId
     FROM WaterPayment
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
        wp.WaterPaymentId,
        wp.ApartmentId,
        wp.TotalAmount,
        wp.PayDate,
        wp.PaidDate,
        wp.Status,
        wp.TariffId
      FROM WaterPayment wp
      WHERE wp.WaterPaymentId = ?`,
      [existingPayments[0].WaterPaymentId]
    );
    if (paymentDetails.length > 0) {
      const payment = paymentDetails[0];
      const payDateObj = new Date(payment.PayDate);
      const dueDate = new Date(payDateObj);
      dueDate.setDate(dueDate.getDate() + 30);
      return {
        id: payment.WaterPaymentId,
        apartmentId: Number(apartmentId),
        amount: payment.TotalAmount,
        status: payment.Status,
        payDate: payment.PayDate,
        paidDate: payment.PaidDate, // will be null/blank until paid
        dueDate: dueDate.toISOString(),
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
    `INSERT INTO WaterPayment 
      (ApartmentId, UserAdminId, TariffId, ColdWaterUsage, HotWaterUsage, ColdWaterCost, HotWaterCost, DirtyWaterCost, TotalAmount, PayDate, Status, PaidDate)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Төлөгдөөгүй', NULL)`,
    [
      apartmentId,
      userId,
      tariff.TariffId,
      usage.cold,
      usage.hot,
      coldWaterCost,
      hotWaterCost,
      dirtyWaterCost,
      totalAmount,
      payDate
    ]
  );
  const dueDate = new Date(payDate);
  dueDate.setDate(dueDate.getDate() + 30);

  return {
    id: result.insertId,
    apartmentId: Number(apartmentId),
    amount: totalAmount,
    status: 'Төлөгдөөгүй',
    payDate: payDate,
    paidDate: null, // explicitly blank until paid
    dueDate: dueDate.toISOString(),
    tariffId: tariff.TariffId,
    exists: false
  };
};

function getLastDayOfNextMonth(date = new Date()) {
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  if (month === 12) {
    year += 1;
    month = 1;
  } else {
    month += 1;
  }
  const lastDay = new Date(year, month, 0);
  return lastDay.toISOString().slice(0, 10);
}