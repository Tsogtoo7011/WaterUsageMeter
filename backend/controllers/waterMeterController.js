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
        hasApartments: false // Added flag to explicitly indicate no apartments
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
    
    // Get the current month's readings for selected apartment
    const [waterMeters] = await pool.execute(
      `SELECT 
        WaterMeterId,
        Type,
        Location,
        Indication,
        WaterMeterDate
      FROM WaterMeter
      WHERE ApartmentApartmentId = ?
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
    
    // Get location breakdown
    const [locationData] = await pool.execute(
      `SELECT 
        Location,
        Type,
        SUM(Indication) as total
      FROM WaterMeter
      WHERE ApartmentApartmentId = ?
      AND MONTH(WaterMeterDate) = MONTH(CURRENT_DATE()) 
      AND YEAR(WaterMeterDate) = YEAR(CURRENT_DATE())
      GROUP BY Location, Type
      ORDER BY Location, Type`,
      [selectedApartmentId]
    );
    
    // Create data structure for location breakdown
    const locationBreakdown = {
      'Ванн': { hot: 0, cold: 0 },
      'Гал тогоо': { hot: 0, cold: 0 },
      'Нойл': { cold: 0 }
    };
    
    // Process location data
    locationData.forEach(item => {
      const locKey = item.Location;
      const typeKey = item.Type === 1 ? 'hot' : 'cold';
      
      if (locationBreakdown[locKey] && (typeKey === 'cold' || (typeKey === 'hot' && locKey !== 'Нойл'))) {
        locationBreakdown[locKey][typeKey] = Number(item.total);
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
      WHERE ApartmentApartmentId = ?
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
      hasApartments: true // Explicitly indicate user has apartments
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
        hasApartments: false // Added flag
      });
    }
    
    // If apartment ID is not provided or not valid, use the first one
    const validApartmentId = apartmentId && apartmentIds.includes(Number(apartmentId)) 
      ? Number(apartmentId) 
      : apartmentIds[0];
    
    // Get water meters for this apartment
    const [waterMeters] = await pool.execute(
      `SELECT 
        WaterMeterId,
        Type,
        Location,
        Indication,
        WaterMeterDate
      FROM WaterMeter
      WHERE ApartmentApartmentId = ?
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
      waterMeters: groupedByMonth,
      apartments: apartments,
      selectedApartmentId: validApartmentId,
      hasApartments: true // Added flag
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
        hasApartments: false // Added flag
      });
    }
    
    // Validate all readings
    const validLocations = ['Гал тогоо', 'Нойл', 'Ванн'];
    const validTypes = [0, 1]; // 0 = Cold, 1 = Hot
    
    // Check for invalid combinations (Нойл cannot have hot water)
    const invalidReadings = readings.filter(r => 
      !validLocations.includes(r.location) || 
      !validTypes.includes(r.type) ||
      (r.location === 'Нойл' && r.type === 1) ||
      typeof r.indication !== 'number'
    );
    
    if (invalidReadings.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Буруу тоолуурын мэдээлэл. Нойл дээр зөвхөн хүйтэн ус байх ёстой.',
        invalidReadings
      });
    }
    
    // Check if readings for current month already exist
    const [existingReadings] = await pool.execute(
      `SELECT COUNT(*) as count
       FROM WaterMeter
       WHERE ApartmentApartmentId = ?
       AND MONTH(WaterMeterDate) = MONTH(CURRENT_DATE())
       AND YEAR(WaterMeterDate) = YEAR(CURRENT_DATE())`,
      [apartmentId]
    );
    
    // If readings exist, update them instead of adding new ones
    if (existingReadings[0].count > 0) {
      // Get existing meter IDs
      const [existingMeters] = await pool.execute(
        `SELECT 
          WaterMeterId, 
          Type, 
          Location
         FROM WaterMeter
         WHERE ApartmentApartmentId = ?
         AND MONTH(WaterMeterDate) = MONTH(CURRENT_DATE())
         AND YEAR(WaterMeterDate) = YEAR(CURRENT_DATE())`,
        [apartmentId]
      );
      
      // Create a lookup map for existing readings
      const existingReadingsMap = {};
      existingMeters.forEach(item => {
        const key = `${item.Location}-${item.Type}`;
        existingReadingsMap[key] = item.WaterMeterId;
      });
      
      // Update each reading
      const updatePromises = readings.map(reading => {
        const key = `${reading.location}-${reading.type}`;
        const waterMeterId = existingReadingsMap[key];
        
        if (!waterMeterId) {
          return Promise.resolve(); // Skip if this reading doesn't exist
        }
        
        return pool.execute(
          'UPDATE WaterMeter SET Indication = ? WHERE WaterMeterId = ?',
          [reading.indication, waterMeterId]
        );
      });
      
      await Promise.all(updatePromises);
      
      return res.status(200).json({
        success: true,
        message: 'Энэ сарын усны тоолуурын заалтууд амжилттай шинэчлэгдлээ.'
      });
    } else {
      // Insert all new readings
      const insertPromises = readings.map(reading => 
        pool.execute(
          'INSERT INTO WaterMeter (ApartmentApartmentId, Type, Location, Indication) VALUES (?, ?, ?, ?)',
          [apartmentId, reading.type, reading.location, reading.indication]
        )
      );
      
      await Promise.all(insertPromises);
      
      return res.status(201).json({
        success: true,
        message: 'Энэ сарын усны тоолуурын бүх заалт амжилттай хадгалагдлаа.'
      });
    }
    
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
        hasApartments: false // Added flag
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
        a.UnitNumber
      FROM WaterMeter wm
      JOIN Apartment a ON wm.ApartmentApartmentId = a.ApartmentId
      WHERE wm.WaterMeterId = ?
      AND wm.ApartmentApartmentId IN (${apartmentIds.map(() => '?').join(',')})`,
      [waterMeterId, ...apartmentIds]
    );
    
    if (waterMeters.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Тоолуур олдсонгүй эсвэл таны эрх хүрэхгүй байна.'
      });
    }
    
    const meter = waterMeters[0];
    
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
      }
    });
    
  } catch (error) {
    handleError(res, error, 'Get water meter by ID');
  }
};