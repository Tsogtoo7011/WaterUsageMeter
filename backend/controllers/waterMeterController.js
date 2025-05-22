const pool = require('../config/db');
const { handleError } = require('../utils/errorHandler');

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

function getExpectedMeters(meterCount) {
  const expectedMeters = [];
  
  expectedMeters.push(
    { location: 'Гал тогоо', type: 0 }, 
    { location: 'Гал тогоо', type: 1 }  
  );

  if (meterCount >= 3) {
    expectedMeters.push({ location: 'Ванн', type: 0 });
  }

  if (meterCount >= 4) {
    expectedMeters.push({ location: 'Ванн', type: 1 });
  }

  if (meterCount >= 5) {
    expectedMeters.push({ location: 'Нойл', type: 0 });
  }
  
  return expectedMeters;
}

function isDateInAllowedPeriod() {
  const currentDate = new Date();
  const currentDay = currentDate.getDate();

  return currentDay >= 1 && currentDay <= 31;
}

async function getPreviousReadings(apartmentId) {

  const [currentReadings] = await pool.execute(
    `SELECT 
      WaterMeterId,
      Type,
      Location,
      Indication,
      WaterMeterDate
    FROM WaterMeter
    WHERE ApartmentId = ?
    AND MONTH(WaterMeterDate) = MONTH(CURRENT_DATE())
    AND YEAR(WaterMeterDate) = YEAR(CURRENT_DATE())
    ORDER BY Location, Type`,
    [apartmentId]
  );
  
  if (currentReadings.length > 0) {
    return currentReadings.map(meter => ({
      location: meter.Location,
      type: Number(meter.Type),
      indication: Number(meter.Indication)
    }));
  }

  const [lastMonthReadings] = await pool.execute(
    `SELECT 
      WaterMeterId,
      Type,
      Location,
      Indication,
      WaterMeterDate
    FROM WaterMeter
    WHERE ApartmentId = ?
    AND (
      (MONTH(WaterMeterDate) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
      AND YEAR(WaterMeterDate) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)))
      OR
      (MONTH(WaterMeterDate) = MONTH(CURRENT_DATE())
      AND YEAR(WaterMeterDate) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 YEAR)))
    )
    ORDER BY WaterMeterDate DESC, Location, Type`,
    [apartmentId]
  );
  
  if (lastMonthReadings.length > 0) {
    return lastMonthReadings.map(meter => ({
      location: meter.Location,
      type: Number(meter.Type),
      indication: Number(meter.Indication)
    }));
  }
  
  return [];
}

async function hasSubmittedCurrentMonthReadings(apartmentId) {
  const [result] = await pool.execute(
    `SELECT COUNT(*) as count
     FROM WaterMeter
     WHERE ApartmentId = ?
     AND MONTH(WaterMeterDate) = MONTH(CURRENT_DATE())
     AND YEAR(WaterMeterDate) = YEAR(CURRENT_DATE())`,
    [apartmentId]
  );
  
  return result[0].count > 0;
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

async function generateMonthlyPaymentForApartment(apartmentId, userId, pool) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

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
        p.OrderOrderId
      FROM Payment p
      WHERE p.PaymentId = ?`,
      [existingPayments[0].PaymentId]
    );
    if (paymentDetails.length > 0) {
      const payment = paymentDetails[0];
      const payDate = new Date(payment.PayDate);
      const dueDate = new Date(payDate);
      dueDate.setDate(dueDate.getDate() + 30);
      return {
        id: payment.PaymentId,
        apartmentId: Number(apartmentId),
        amount: payment.Amount,
        status: payment.Status,
        payDate: payment.PayDate,
        dueDate: dueDate.toISOString(),
        orderId: payment.OrderOrderId,
        exists: true
      };
    }
  }

  let prevMonth = currentMonth - 1;
  let prevYear = currentYear;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear = currentYear - 1;
  }
  const [currentReadings] = await pool.execute(
    `SELECT 
      Type,
      MAX(Indication) as latest_reading
    FROM WaterMeter
    WHERE ApartmentId = ?
    AND MONTH(WaterMeterDate) = ?
    AND YEAR(WaterMeterDate) = ?
    GROUP BY Type`,
    [apartmentId, currentMonth, currentYear]
  );
  const [prevReadings] = await pool.execute(
    `SELECT 
      Type,
      MAX(Indication) as latest_reading
    FROM WaterMeter
    WHERE ApartmentId = ?
    AND MONTH(WaterMeterDate) = ?
    AND YEAR(WaterMeterDate) = ?
    GROUP BY Type`,
    [apartmentId, prevMonth, prevYear]
  );
  const usage = { cold: 0, hot: 0 };
  currentReadings.forEach(current => {
    const prevReading = prevReadings.find(prev => prev.Type === current.Type);
    const previousValue = prevReading ? Number(prevReading.latest_reading) : 0;
    const currentValue = Number(current.latest_reading);
    const usageValue = currentValue >= previousValue ? currentValue - previousValue : currentValue;
    if (current.Type === 0) usage.cold = usageValue;
    else if (current.Type === 1) usage.hot = usageValue;
  });

  const tariff = await getCurrentTariff();

  const coldWaterCost = (usage.cold + usage.hot) * tariff.ColdWaterTariff;
  const hotWaterCost = usage.hot * tariff.HeatWaterTariff;
  const dirtyWaterCost = (usage.cold + usage.hot) * tariff.DirtyWaterTariff;
  const totalAmount = coldWaterCost + hotWaterCost + dirtyWaterCost;

  const orderId = Math.floor(Math.random() * 1000000) + 1;

  const [result] = await pool.execute(
    `INSERT INTO Payment 
      (ApartmentId, UserAdminId, Amount, PayDate, PaidDate, Status, OrderOrderId)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP, NULL, 'PENDING', ?)`,
    [apartmentId, userId, totalAmount, orderId]
  );
  const paymentId = result.insertId;
  const payDate = new Date();
  const dueDate = new Date(payDate);
  dueDate.setDate(dueDate.getDate() + 30);

  return {
    id: paymentId,
    apartmentId: Number(apartmentId),
    amount: totalAmount,
    status: 'PENDING',
    payDate: payDate.toISOString(),
    dueDate: dueDate.toISOString(),
    orderId: orderId,
    exists: false
  };
}

exports.getUserWaterMeters = async (req, res) => {
  try {
    const userId = req.userData.userId;
    const requestedApartmentId = req.query.apartmentId ? Number(req.query.apartmentId) : null;

    const apartmentIds = await getUserApartments(userId);
    
    if (apartmentIds.length === 0) {

      return res.status(200).json({
        success: true,
        message: 'No apartments found for this user',
        waterMeters: [],
        summary: {
          hot: 0,
          cold: 0,
          total: 0,
          locationBreakdown: {}
        },
        chartData: {
          labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
          hot: Array(12).fill(0),
          cold: Array(12).fill(0),
          total: Array(12).fill(0)
        },
        hasReadings: false,
        apartments: [],
        selectedApartmentId: null,
        hasApartments: false,
        expectedMeters: [],
        canSubmitReading: isDateInAllowedPeriod() 
      });
    }

    let selectedApartmentId;
    
    if (requestedApartmentId && apartmentIds.includes(requestedApartmentId)) {
      selectedApartmentId = requestedApartmentId;
    } else {
      selectedApartmentId = apartmentIds[0];
    }

    const [apartmentDetails] = await pool.execute(
      `SELECT a.ApartmentId, a.ApartmentName, a.BlockNumber, a.UnitNumber, a.MeterCount
       FROM Apartment a
       WHERE a.ApartmentId = ?`,
      [selectedApartmentId]
    );
    
    if (apartmentDetails.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Apartment not found'
      });
    }
    
    const meterCount = apartmentDetails[0].MeterCount;
    const expectedMeters = getExpectedMeters(meterCount);

    const [waterMeters] = await pool.execute(
      `SELECT 
        WaterMeterId,
        Type,
        Location,
        Indication,
        WaterMeterDate
      FROM WaterMeter
      WHERE ApartmentId = ?
      AND MONTH(WaterMeterDate) = MONTH(CURRENT_DATE())
      AND YEAR(WaterMeterDate) = YEAR(CURRENT_DATE())
      ORDER BY Location, Type`,
      [selectedApartmentId]
    );
    
    const formattedMeters = waterMeters.map(meter => ({
      id: Number(meter.WaterMeterId),
      type: Number(meter.Type),
      typeText: meter.Type === 1 ? 'Халуун ус' : 'Хүйтэн ус',
      location: meter.Location,
      indication: Number(meter.Indication),
      date: meter.WaterMeterDate
    }));
    
    let totalHot = 0;
    let totalCold = 0;
    
    formattedMeters.forEach(meter => {
      if (meter.type === 1) {
        totalHot += meter.indication;
      } else {
        totalCold += meter.indication;
      }
    });
    
    const locationBreakdown = {
      'Гал тогоо': { hot: 0, cold: 0 }
    };
    
    if (meterCount >= 3) {
      locationBreakdown['Ванн'] = { hot: 0, cold: 0 };
    }
    
    if (meterCount >= 5) {
      locationBreakdown['Нойл'] = { cold: 0 };  
    }
        const [locationData] = await pool.execute(
      `SELECT 
        Location,
        Type,
        SUM(Indication) as total
      FROM WaterMeter
      WHERE ApartmentId = ?
      AND MONTH(WaterMeterDate) = MONTH(CURRENT_DATE()) 
      AND YEAR(WaterMeterDate) = YEAR(CURRENT_DATE())
      GROUP BY Location, Type
      ORDER BY Location, Type`,
      [selectedApartmentId]
    );

    locationData.forEach(item => {
      const locKey = item.Location;
      const typeKey = item.Type === 1 ? 'hot' : 'cold';
      
      if (locationBreakdown[locKey]) {
        if (typeKey === 'cold' || (typeKey === 'hot' && locKey !== 'Нойл')) {
          locationBreakdown[locKey][typeKey] = Number(item.total);
        }
      }
    });

    const year = new Date().getFullYear();
    const [historicalData] = await pool.execute(
      `SELECT 
        MONTH(WaterMeterDate) as month,
        Type,
        SUM(Indication) as total
      FROM WaterMeter
      WHERE ApartmentId = ?
      AND YEAR(WaterMeterDate) = ?
      GROUP BY MONTH(WaterMeterDate), Type
      ORDER BY MONTH(WaterMeterDate), Type`,
      [selectedApartmentId, year]
    );
    
    const months = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    const chartData = {
      labels: months,
      hot: Array(12).fill(0),
      cold: Array(12).fill(0),
      total: Array(12).fill(0)
    };
    
    historicalData.forEach(record => {
      const monthIndex = record.month - 1; 
      const typeKey = record.Type === 1 ? 'hot' : 'cold';
      const value = Number(record.total);
      
      chartData[typeKey][monthIndex] = value;
      chartData.total[monthIndex] += value;
    });
    
    const [apartmentObjects] = await pool.execute(
      `SELECT a.ApartmentId, a.ApartmentName, a.BlockNumber, a.UnitNumber, a.MeterCount
       FROM Apartment a
       WHERE a.ApartmentId IN (${apartmentIds.map(() => '?').join(',')})`,
      apartmentIds
    );
    
    const apartments = apartmentObjects.map(apt => ({
      id: apt.ApartmentId,
      name: apt.ApartmentName,
      block: apt.BlockNumber,
      unit: apt.UnitNumber,
      meterCount: apt.MeterCount,
      displayName: `${apt.ApartmentName}, Блок ${apt.BlockNumber}${apt.UnitNumber ? ', Тоот ' + apt.UnitNumber : ''}`
    }));

    const hasCurrentMonthReadings = formattedMeters.length > 0;
    const canSubmit = isDateInAllowedPeriod() && !hasCurrentMonthReadings;
    
    return res.status(200).json({
      success: true,
      waterMeters: formattedMeters,
      summary: {
        hot: totalHot,
        cold: totalCold,
        total: totalHot + totalCold,
        locationBreakdown
      },
      chartData: chartData,
      hasReadings: formattedMeters.length > 0,
      apartments: apartments,
      selectedApartmentId: selectedApartmentId,
      hasApartments: true,
      expectedMeters: expectedMeters,
      meterCount: meterCount,
      canSubmitReading: canSubmit,
      submissionPeriod: isDateInAllowedPeriod()
    });
    
  } catch (error) {
    handleError(res, error, 'Get user water meters');
  }
};

exports.getWaterMeterDetails = async (req, res) => {
  try {
    const userId = req.userData.userId;
    const apartmentId = req.query.apartmentId;

    const apartmentIds = await getUserApartments(userId);
    
    if (apartmentIds.length === 0) {

      return res.status(200).json({
        success: true,
        message: 'No apartments found for this user',
        waterMeters: {},
        months: [],
        apartments: [],
        selectedApartmentId: null,
        hasApartments: false,
        expectedMeters: [],
        canSubmitReading: isDateInAllowedPeriod() 
      });
    }

    const validApartmentId = apartmentId && apartmentIds.includes(Number(apartmentId)) 
      ? Number(apartmentId) 
      : apartmentIds[0];

    const [apartmentDetails] = await pool.execute(
      `SELECT a.ApartmentId, a.ApartmentName, a.BlockNumber, a.UnitNumber, a.MeterCount
       FROM Apartment a
       WHERE a.ApartmentId = ?`,
      [validApartmentId]
    );
    
    if (apartmentDetails.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Apartment not found'
      });
    }
    
    const meterCount = apartmentDetails[0].MeterCount;
    const expectedMeters = getExpectedMeters(meterCount);
    
    const [waterMeters] = await pool.execute(
      `SELECT 
        WaterMeterId,
        Type,
        Location,
        Indication,
        WaterMeterDate
      FROM WaterMeter
      WHERE ApartmentId = ?
      ORDER BY WaterMeterDate DESC, Location, Type`,
      [validApartmentId]
    );

    const groupedByMonth = {};
    waterMeters.forEach(meter => {
      const date = new Date(meter.WaterMeterDate);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      if (!groupedByMonth[monthKey]) {
        groupedByMonth[monthKey] = [];
      }
      groupedByMonth[monthKey].push({
        id: Number(meter.WaterMeterId),
        type: Number(meter.Type),
        typeText: meter.Type === 1 ? 'Халуун ус' : 'Хүйтэн ус',
        location: meter.Location,
        indication: Number(meter.Indication),
        date: meter.WaterMeterDate
      });
    });

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const months = [];
    let y = currentYear, m = 1;
    while (y < currentYear || (y === currentYear && m <= currentMonth)) {
      const key = `${y}-${String(m).padStart(2, '0')}`;
      months.push(key);
      m++;
      if (m > 12) { m = 1; y++; }
    }

    const monthsWithStatus = months.map(monthKey => {
      const readings = groupedByMonth[monthKey] || [];
      let status = "done";
      const [year, month] = monthKey.split('-').map(Number);
      const isCurrentMonth = year === currentYear && month === currentMonth;
      if (readings.length === 0) {
        if (isCurrentMonth) status = "not_done";
        else status = "missing";
      }
      return {
        monthKey,
        year,
        month,
        status,
        readings
      };
    }).reverse(); 

    const [apartmentObjects] = await pool.execute(
      `SELECT a.ApartmentId, a.ApartmentName, a.BlockNumber, a.UnitNumber, a.MeterCount
       FROM Apartment a
       WHERE a.ApartmentId IN (${apartmentIds.map(() => '?').join(',')})`,
      apartmentIds
    );
    
    const apartments = apartmentObjects.map(apt => ({
      id: apt.ApartmentId,
      name: apt.ApartmentName,
      block: apt.BlockNumber,
      unit: apt.UnitNumber,
      meterCount: apt.MeterCount,
      displayName: `${apt.ApartmentName}, Блок ${apt.BlockNumber}${apt.UnitNumber ? ', Тоот ' + apt.UnitNumber : ''}`
    }));
    
    const hasCurrentMonthReadings = await hasSubmittedCurrentMonthReadings(validApartmentId);
    const canSubmit = isDateInAllowedPeriod() && !hasCurrentMonthReadings;
    
    return res.status(200).json({
      success: true,
      waterMeters: groupedByMonth,
      months: monthsWithStatus,
      apartments: apartments,
      selectedApartmentId: validApartmentId,
      hasApartments: true,
      expectedMeters: expectedMeters,
      meterCount: meterCount,
      canSubmitReading: canSubmit,
      submissionPeriod: isDateInAllowedPeriod()
    });
    
  } catch (error) {
    handleError(res, error, 'Get water meter details');
  }
};

exports.addMeterReading = async (req, res) => {
  try {
    const userId = req.userData.userId;
    const { apartmentId, readings } = req.body;
    
    if (!readings || !Array.isArray(readings) || readings.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Буруу өгөгдлийн формат. Усны тоолуурын заалтууд оруулна уу.'
      });
    }
    
    if (!apartmentId) {
      return res.status(400).json({
        success: false,
        message: 'Буруу өгөгдлийн формат. Орон сууцны ID оруулна уу.'
      });
    }
    
    const apartmentIds = await getUserApartments(userId);
    
    if (apartmentIds.length === 0 || !apartmentIds.includes(Number(apartmentId))) {
      return res.status(403).json({
        success: false,
        message: 'Хэрэглэгчтэй холбоотой орон сууц олдсонгүй.',
        hasApartments: false
      });
    }
  
    if (!isDateInAllowedPeriod()) {
      return res.status(403).json({
        success: false,
        message: 'Тоолуурын заалт оруулах боломжтой хугацаа биш байна. Та сарын 1-нд эсвэл 21-ээс хойш оруулна уу.'
      });
    }
    
    const hasCurrentMonthReadings = await hasSubmittedCurrentMonthReadings(apartmentId);
    if (hasCurrentMonthReadings) {
      return res.status(403).json({
        success: false,
        message: 'Та энэ сард аль хэдийн тоолуурын заалт оруулсан байна. Сард зөвхөн нэг удаа оруулах боломжтой.'
      });
    }

    const [apartmentDetails] = await pool.execute(
      `SELECT MeterCount FROM Apartment WHERE ApartmentId = ?`,
      [apartmentId]
    );
    
    if (apartmentDetails.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Орон сууц олдсонгүй.'
      });
    }
    
    const meterCount = apartmentDetails[0].MeterCount;
    const expectedMeters = getExpectedMeters(meterCount);

    const expectedMeterMap = {};
    expectedMeters.forEach(meter => {
      const key = `${meter.location}-${meter.type}`;
      expectedMeterMap[key] = true;
    });

    const validLocations = ['Гал тогоо', 'Нойл', 'Ванн'];
    const validTypes = [0, 1];
  
    const invalidReadings = readings.filter(r => {

      if (!validLocations.includes(r.location) || 
          !validTypes.includes(r.type) || 
          typeof r.indication !== 'number') {
        return true;
      }

      const key = `${r.location}-${r.type}`;
      return !expectedMeterMap[key];
    });
    
    if (invalidReadings.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Буруу тоолуурын мэдээлэл. Тоолуурын тохиргоо орон сууцны төрөлтэй тохирохгүй байна.',
        invalidReadings,
        expectedMeters
      });
    }

    const includedMeterKeys = readings.map(r => `${r.location}-${r.type}`);
    const missingMeters = expectedMeters.filter(meter => {
      const key = `${meter.location}-${meter.type}`;
      return !includedMeterKeys.includes(key);
    });
    
    if (missingMeters.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Бүх тоолуурын заалт оруулна уу.',
        missingMeters,
        expectedMeters
      });
    }

    const previousReadings = await getPreviousReadings(apartmentId);

    const comparisonResults = [];
    
    readings.forEach(reading => {
      const matchingPrevious = previousReadings.find(
        prev => prev.location === reading.location && prev.type === reading.type
      );
      
      if (matchingPrevious) {
        const difference = reading.indication - matchingPrevious.indication;

        if (Math.abs(difference) > 0) {
          comparisonResults.push({
            location: reading.location,
            type: reading.type,
            typeText: reading.type === 1 ? 'Халуун ус' : 'Хүйтэн ус',
            oldValue: matchingPrevious.indication,
            newValue: reading.indication,
            difference: difference
          });
        }
      }
    });
    
    const insertPromises = readings.map(reading => 
      pool.execute(
        'INSERT INTO WaterMeter (ApartmentId, Type, Location, Indication, CreatedBy) VALUES (?, ?, ?, ?, ?)',
        [apartmentId, reading.type, reading.location, reading.indication, userId]
      )
    );
    
    await Promise.all(insertPromises);

    let paymentInfo = null;
    try {
      paymentInfo = await generateMonthlyPaymentForApartment(apartmentId, userId, pool);
    } catch (err) {
      console.error('Payment generation failed:', err.message);
    }

    const response = {
      success: true,
      message: 'Энэ сарын усны тоолуурын бүх заалт амжилттай хадгалагдлаа.'
    };

    if (comparisonResults.length > 0) {
      response.comparisons = comparisonResults;
      response.warningMessage = 'Тоолуурын заалтын өөрчлөлтийг доор харуулав:';
    }

    if (paymentInfo) {
      response.payment = paymentInfo;
    }

    return res.status(201).json(response);
    
  } catch (error) {
    handleError(res, error, 'Add meter reading');
  }
};

exports.getWaterMeterById = async (req, res) => {
  try {
    const userId = req.userData.userId;
    const waterMeterId = req.params.id;
    
    if (!waterMeterId || isNaN(Number(waterMeterId))) {
      return res.status(400).json({
        success: false,
        message: 'Буруу тоолуурын ID.'
      });
    }

    const apartmentIds = await getUserApartments(userId);
    
    if (apartmentIds.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Хэрэглэгчтэй холбоотой орон сууц олдсонгүй.',
        hasApartments: false
      });
    }

    const [waterMeters] = await pool.execute(
      `SELECT 
        wm.WaterMeterId,
        wm.Type,
        wm.Location,
        wm.Indication,
        wm.WaterMeterDate,
        a.ApartmentName,
        a.BlockNumber,
        a.UnitNumber,
        a.MeterCount
      FROM WaterMeter wm
      JOIN Apartment a ON wm.ApartmentId = a.ApartmentId
      WHERE wm.WaterMeterId = ?
      AND wm.ApartmentId IN (${apartmentIds.map(() => '?').join(',')})`,
      [waterMeterId, ...apartmentIds]
    );
    
    if (waterMeters.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Тоолуур олдсонгүй эсвэл таны эрх хүрэхгүй байна.'
      });
    }
    
    const meter = waterMeters[0];
    const meterCount = meter.MeterCount;
    const expectedMeters = getExpectedMeters(meterCount);
    
    return res.status(200).json({
      success: true,
      waterMeter: {
        id: Number(meter.WaterMeterId),
        type: Number(meter.Type),
        typeText: meter.Type === 1 ? 'Халуун ус' : 'Хүйтэн ус',
        location: meter.Location,
        indication: Number(meter.Indication),
        date: meter.WaterMeterDate,
        apartment: {
          name: meter.ApartmentName,
          block: meter.BlockNumber,
          unit: meter.UnitNumber,
          displayName: `${meter.ApartmentName}, Блок ${meter.BlockNumber}${meter.UnitNumber ? ', Тоот ' + meter.UnitNumber : ''}`
        }
      },
      expectedMeters: expectedMeters,
      meterCount: meterCount,
      canEdit: false 
    });
    
  } catch (error) {
    handleError(res, error, 'Get water meter by ID');
  }
};

exports.getExpectedWaterMeters = async (req, res) => {
  try {
    const userId = req.userData.userId;
    const apartmentId = req.query.apartmentId;

    const apartmentIds = await getUserApartments(userId);
    
    if (apartmentIds.length === 0 || !apartmentIds.includes(Number(apartmentId))) {
      return res.status(403).json({
        success: false,
        message: 'Хэрэглэгчтэй холбоотой орон сууц олдсонгүй.',
        hasApartments: false
      });
    }

    const [apartmentDetails] = await pool.execute(
      `SELECT ApartmentId, ApartmentName, BlockNumber, UnitNumber, MeterCount 
       FROM Apartment 
       WHERE ApartmentId = ?`,
      [apartmentId]
    );
    
    if (apartmentDetails.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Орон сууц олдсонгүй.'
      });
    }
    
    const apartment = apartmentDetails[0];
    const expectedMeters = getExpectedMeters(apartment.MeterCount);

    const formattedMeters = expectedMeters.map(meter => ({
      location: meter.location,
      type: meter.type,
      typeText: meter.type === 1 ? 'Халуун ус' : 'Хүйтэн ус'
    }));

    const hasCurrentMonthReadings = await hasSubmittedCurrentMonthReadings(apartmentId);
    const canSubmit = isDateInAllowedPeriod() && !hasCurrentMonthReadings;
    
    return res.status(200).json({
      success: true,
      apartment: {
        id: apartment.ApartmentId,
        name: apartment.ApartmentName,
        block: apartment.BlockNumber,
        unit: apartment.UnitNumber,
        meterCount: apartment.MeterCount,
        displayName: `${apartment.ApartmentName}, Блок ${apartment.BlockNumber}${apartment.UnitNumber ? ', Тоот ' + apartment.UnitNumber : ''}`
      },
      expectedMeters: formattedMeters,
      canSubmitReading: canSubmit,
      submissionPeriod: isDateInAllowedPeriod()
    });
    
  } catch (error) {
    handleError(res, error, 'Get expected water meters');
  }
};