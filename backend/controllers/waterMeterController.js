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

// Helper function to get expected water meter configurations based on MeterCount
function getExpectedMeters(meterCount) {
  const expectedMeters = [];
  
  // Base configuration - Always present
  expectedMeters.push(
    { location: 'Гал тогоо', type: 0 }, // Kitchen Cold
    { location: 'Гал тогоо', type: 1 }  // Kitchen Hot
  );
  
  // MeterCount 3: Add Bathroom Cold
  if (meterCount >= 3) {
    expectedMeters.push({ location: 'Ванн', type: 0 });
  }
  
  // MeterCount 4: Add Bathroom Hot
  if (meterCount >= 4) {
    expectedMeters.push({ location: 'Ванн', type: 1 });
  }
  
  // MeterCount 5: Add Toilet Cold
  if (meterCount >= 5) {
    expectedMeters.push({ location: 'Нойл', type: 0 });
  }
  
  return expectedMeters;
}

// Helper function to check if the date is within the allowed period
function isDateInAllowedPeriod() {
  const currentDate = new Date();
  const currentDay = currentDate.getDate();

  return currentDay >= 1 && currentDay <= 20;
}

// Helper function to get previous meter readings for comparison
async function getPreviousReadings(apartmentId) {
  // Get the current month's readings if they exist
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
  
  // Get the last month's readings as fallback
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

// Helper to check if user already submitted readings for the current month
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

// Get water meter data for the current user
exports.getUserWaterMeters = async (req, res) => {
  try {
    const userId = req.userData.userId;
    const requestedApartmentId = req.query.apartmentId ? Number(req.query.apartmentId) : null;
    
    // Get list of user's apartments
    const apartmentIds = await getUserApartments(userId);
    
    if (apartmentIds.length === 0) {
      // Return 200 with empty data and clear status flag
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
        canSubmitReading: isDateInAllowedPeriod() // Add submission period status
      });
    }
    
    // If apartment ID is specifically requested and valid, use it
    // Otherwise, use the first one as default
    let selectedApartmentId;
    
    if (requestedApartmentId && apartmentIds.includes(requestedApartmentId)) {
      selectedApartmentId = requestedApartmentId;
    } else {
      selectedApartmentId = apartmentIds[0];
    }
    
    // Get apartment details including MeterCount
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
    
    // Get the current month's readings for selected apartment
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
    
    // Format the output
    const formattedMeters = waterMeters.map(meter => ({
      id: Number(meter.WaterMeterId),
      type: Number(meter.Type),
      typeText: meter.Type === 1 ? 'Халуун ус' : 'Хүйтэн ус',
      location: meter.Location,
      indication: Number(meter.Indication),
      date: meter.WaterMeterDate
    }));
    
    // Calculate totals
    let totalHot = 0;
    let totalCold = 0;
    
    formattedMeters.forEach(meter => {
      if (meter.type === 1) {
        totalHot += meter.indication;
      } else {
        totalCold += meter.indication;
      }
    });
    
    // Get location breakdown - with dynamic locations based on MeterCount
    const locationBreakdown = {
      'Гал тогоо': { hot: 0, cold: 0 }
    };
    
    // Add optional locations based on MeterCount
    if (meterCount >= 3) {
      locationBreakdown['Ванн'] = { hot: 0, cold: 0 };
    }
    
    if (meterCount >= 5) {
      locationBreakdown['Нойл'] = { cold: 0 };  // Toilet only has cold water
    }
    
    // Process location data
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
    
    // Fill location breakdown with actual data
    locationData.forEach(item => {
      const locKey = item.Location;
      const typeKey = item.Type === 1 ? 'hot' : 'cold';
      
      if (locationBreakdown[locKey]) {
        if (typeKey === 'cold' || (typeKey === 'hot' && locKey !== 'Нойл')) {
          locationBreakdown[locKey][typeKey] = Number(item.total);
        }
      }
    });
    
    // Get historical data for chart
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
    
    // Process historical data
    const months = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    const chartData = {
      labels: months,
      hot: Array(12).fill(0),
      cold: Array(12).fill(0),
      total: Array(12).fill(0)
    };
    
    historicalData.forEach(record => {
      const monthIndex = record.month - 1; // Convert to 0-based index
      const typeKey = record.Type === 1 ? 'hot' : 'cold';
      const value = Number(record.total);
      
      chartData[typeKey][monthIndex] = value;
      chartData.total[monthIndex] += value;
    });
    
    // Get list of apartment objects for selection
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
    
    // Check if user can submit readings (date restrictions + once per month)
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

// Get detailed water meter readings for a specific apartment
exports.getWaterMeterDetails = async (req, res) => {
  try {
    const userId = req.userData.userId;
    const apartmentId = req.query.apartmentId;
    
    // Get list of user's apartments
    const apartmentIds = await getUserApartments(userId);
    
    if (apartmentIds.length === 0) {
      // Return 200 with empty data and clear status flag
      return res.status(200).json({
        success: true,
        message: 'No apartments found for this user',
        waterMeters: {},
        apartments: [],
        selectedApartmentId: null,
        hasApartments: false,
        expectedMeters: [],
        canSubmitReading: isDateInAllowedPeriod() // Add submission period status
      });
    }
    
    // If apartment ID is not provided or not valid, use the first one
    const validApartmentId = apartmentId && apartmentIds.includes(Number(apartmentId)) 
      ? Number(apartmentId) 
      : apartmentIds[0];
    
    // Get apartment details including MeterCount
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
    
    // Get water meters for this apartment
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
    
    // Group by month for better organization
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
    
    // Get list of apartment objects for selection
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
    
    // Check if user already submitted readings for the current month
    const hasCurrentMonthReadings = await hasSubmittedCurrentMonthReadings(validApartmentId);
    const canSubmit = isDateInAllowedPeriod() && !hasCurrentMonthReadings;
    
    return res.status(200).json({
      success: true,
      waterMeters: groupedByMonth,
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

// Add new water meter reading for a specific apartment
exports.addMeterReading = async (req, res) => {
  try {
    const userId = req.userData.userId;
    const { apartmentId, readings } = req.body;
    
    // Validate input format
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
    
    // Get list of user's apartments
    const apartmentIds = await getUserApartments(userId);
    
    if (apartmentIds.length === 0 || !apartmentIds.includes(Number(apartmentId))) {
      return res.status(403).json({
        success: false,
        message: 'Хэрэглэгчтэй холбоотой орон сууц олдсонгүй.',
        hasApartments: false
      });
    }
    
    // Check if submission period is valid (1st day or after 20th day of month)
    if (!isDateInAllowedPeriod()) {
      return res.status(403).json({
        success: false,
        message: 'Тоолуурын заалт оруулах боломжтой хугацаа биш байна. Та сарын 1-нд эсвэл 20-ноос хойш оруулна уу.'
      });
    }
    
    // Check if user already submitted readings for this month
    const hasCurrentMonthReadings = await hasSubmittedCurrentMonthReadings(apartmentId);
    if (hasCurrentMonthReadings) {
      return res.status(403).json({
        success: false,
        message: 'Та энэ сард аль хэдийн тоолуурын заалт оруулсан байна. Сард зөвхөн нэг удаа оруулах боломжтой.'
      });
    }
    
    // Get apartment details to check MeterCount
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
    
    // Create a map of expected meters for validation
    const expectedMeterMap = {};
    expectedMeters.forEach(meter => {
      const key = `${meter.location}-${meter.type}`;
      expectedMeterMap[key] = true;
    });
    
    // Validate all readings
    const validLocations = ['Гал тогоо', 'Нойл', 'Ванн'];
    const validTypes = [0, 1]; // 0 = Cold, 1 = Hot
    
    // Check for invalid readings based on MeterCount
    const invalidReadings = readings.filter(r => {
      // Basic validation
      if (!validLocations.includes(r.location) || 
          !validTypes.includes(r.type) || 
          typeof r.indication !== 'number') {
        return true;
      }
      
      // Check if this meter configuration is expected based on MeterCount
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
    
    // Check if all expected meters are included in the readings
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
    
    // Get previous readings for comparison
    const previousReadings = await getPreviousReadings(apartmentId);
    
    // Compare with previous readings to warn about significant differences
    const comparisonResults = [];
    
    readings.forEach(reading => {
      const matchingPrevious = previousReadings.find(
        prev => prev.location === reading.location && prev.type === reading.type
      );
      
      if (matchingPrevious) {
        const difference = reading.indication - matchingPrevious.indication;
        
        // Add to comparison results if there's a change worth noting
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
    
    // Insert all new readings
    const insertPromises = readings.map(reading => 
      pool.execute(
        'INSERT INTO WaterMeter (ApartmentId, Type, Location, Indication, CreatedBy) VALUES (?, ?, ?, ?, ?)',
        [apartmentId, reading.type, reading.location, reading.indication, userId]
      )
    );
    
    await Promise.all(insertPromises);
    
    // Include the comparison in the response
    const response = {
      success: true,
      message: 'Энэ сарын усны тоолуурын бүх заалт амжилттай хадгалагдлаа.'
    };
    
    // If we have comparison data, include it
    if (comparisonResults.length > 0) {
      response.comparisons = comparisonResults;
      response.warningMessage = 'Тоолуурын заалтын өөрчлөлтийг доор харуулав:';
    }
    
    return res.status(201).json(response);
    
  } catch (error) {
    handleError(res, error, 'Add meter reading');
  }
};

// Get specific water meter by ID
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
    
    // Get user's apartments
    const apartmentIds = await getUserApartments(userId);
    
    if (apartmentIds.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Хэрэглэгчтэй холбоотой орон сууц олдсонгүй.',
        hasApartments: false
      });
    }
    
    // Get the water meter with validation that it belongs to one of user's apartments
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
      canEdit: false // Users can't edit water meter readings once submitted
    });
    
  } catch (error) {
    handleError(res, error, 'Get water meter by ID');
  }
};

// Get expected water meter configuration for an apartment
exports.getExpectedWaterMeters = async (req, res) => {
  try {
    const userId = req.userData.userId;
    const apartmentId = req.query.apartmentId;
    
    // Get list of user's apartments
    const apartmentIds = await getUserApartments(userId);
    
    if (apartmentIds.length === 0 || !apartmentIds.includes(Number(apartmentId))) {
      return res.status(403).json({
        success: false,
        message: 'Хэрэглэгчтэй холбоотой орон сууц олдсонгүй.',
        hasApartments: false
      });
    }
    
    // Get apartment details to check MeterCount
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
    
    // Format meters with readable text
    const formattedMeters = expectedMeters.map(meter => ({
      location: meter.location,
      type: meter.type,
      typeText: meter.type === 1 ? 'Халуун ус' : 'Хүйтэн ус'
    }));
    
    // Check if user already submitted readings for the current month
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