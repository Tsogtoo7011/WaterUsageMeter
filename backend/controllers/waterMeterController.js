const pool = require('../config/db');
const { handleError } = require('../utils/errorHandler');

// Helper function to get user's apartment ID and validate ownership
async function getUserApartmentId(userId) {
  const [apartments] = await pool.execute(
    'SELECT ApartmentId FROM Apartment WHERE UserAdminUserId = ?',
    [userId]
  );
  
  if (apartments.length === 0) {
    return null;
  }
  
  return apartments[0].ApartmentId;
}

// Get all water meters for a user's apartment
exports.getUserWaterMeters = async (req, res) => {
  try {
    const userId = req.userData.userId;
    
    // Get the user's apartment
    const apartmentId = await getUserApartmentId(userId);
    
    if (!apartmentId) {
      return res.status(404).json({
        success: false,
        message: 'Хэрэглэгчтэй холбоотой орон сууц олдсонгүй.'
      });
    }
    
    // Get all water meters for this apartment
    const [waterMeters] = await pool.execute(
      `SELECT 
        WaterMeterId,
        Type,
        Location,
        Indication,
        WaterMeterDate
      FROM WaterMeter
      WHERE ApartmentApartmentId = ?
      ORDER BY WaterMeterDate DESC`,
      [apartmentId]
    );
    
    // Format the data
    const formattedMeters = waterMeters.map(meter => ({
      ...meter,
      Type: Number(meter.Type),
      Indication: Number(meter.Indication),
      WaterMeterId: Number(meter.WaterMeterId)
    }));
    
    // Get aggregated data by location and type
    const [hotWaterTotal] = await pool.execute(
      `SELECT SUM(Indication) as total
       FROM WaterMeter
       WHERE ApartmentApartmentId = ? AND Type = 1
       AND MONTH(WaterMeterDate) = MONTH(CURRENT_DATE())
       AND YEAR(WaterMeterDate) = YEAR(CURRENT_DATE())`,
      [apartmentId]
    );
    
    const [coldWaterTotal] = await pool.execute(
      `SELECT SUM(Indication) as total
       FROM WaterMeter
       WHERE ApartmentApartmentId = ? AND Type = 0
       AND MONTH(WaterMeterDate) = MONTH(CURRENT_DATE())
       AND YEAR(WaterMeterDate) = YEAR(CURRENT_DATE())`,
      [apartmentId]
    );
    
    // Get location data
    const [locationData] = await pool.execute(
      `SELECT 
        Location,
        Type,
        Indication
       FROM WaterMeter
       WHERE ApartmentApartmentId = ?
       AND MONTH(WaterMeterDate) = MONTH(CURRENT_DATE())
       AND YEAR(WaterMeterDate) = YEAR(CURRENT_DATE())
       ORDER BY Location, Type`,
      [apartmentId]
    );
    
    // Create data structure similar to what frontend expects
    const locationBreakdown = {
      'Ванн': { hot: 0, cold: 0 },
      'Гал тогоо': { hot: 0, cold: 0 },
      'Нойл': { cold: 0 }
    };
    
    // Process location data
    locationData.forEach(item => {
      const locKey = item.Location;
      const typeKey = item.Type === 1 ? 'hot' : 'cold';
      
      if (locationBreakdown[locKey] && (typeKey === 'cold' || typeKey === 'hot' && locKey !== 'Нойл')) {
        locationBreakdown[locKey][typeKey] = Number(item.Indication);
      }
    });
    
    // Get historical data for charts
    const [historicalData] = await pool.execute(
      `SELECT 
        MONTH(WaterMeterDate) as month,
        Type,
        SUM(Indication) as total
       FROM WaterMeter
       WHERE ApartmentApartmentId = ?
       AND YEAR(WaterMeterDate) = YEAR(CURRENT_DATE())
       GROUP BY MONTH(WaterMeterDate), Type
       ORDER BY MONTH(WaterMeterDate)`,
      [apartmentId]
    );
    
    // Process historical data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const chartData = {
      hot: Array(12).fill(0),
      cold: Array(12).fill(0)
    };
    
    historicalData.forEach(record => {
      const monthIndex = record.month - 1; // Convert to 0-based index
      const typeKey = record.Type === 1 ? 'hot' : 'cold';
      chartData[typeKey][monthIndex] = Number(record.total);
    });
    
    return res.status(200).json({
      success: true,
      waterMeters: formattedMeters,
      summary: {
        hot: hotWaterTotal[0].total || 0,
        cold: coldWaterTotal[0].total || 0,
        locationBreakdown
      },
      chartData: {
        labels: months,
        hot: chartData.hot,
        cold: chartData.cold
      }
    });
    
  } catch (error) {
    handleError(res, error, 'Get user water meters');
  }
};

// Get water meter details
exports.getWaterMeterDetails = async (req, res) => {
  try {
    const userId = req.userData.userId;
    
    // Get the user's apartment
    const apartmentId = await getUserApartmentId(userId);
    
    if (!apartmentId) {
      return res.status(404).json({
        success: false,
        message: 'Хэрэглэгчтэй холбоотой орон сууц олдсонгүй.'
      });
    }
    
    // Get water meter history with more details
    const [waterMeters] = await pool.execute(
      `SELECT 
        WaterMeterId,
        Type,
        Location,
        Indication,
        WaterMeterDate
      FROM WaterMeter
      WHERE ApartmentApartmentId = ?
      ORDER BY WaterMeterDate DESC
      LIMIT 50`,
      [apartmentId]
    );
    
    // Format the output to match expected format
    const formattedMeters = waterMeters.map(meter => {
      const typeText = meter.Type === 1 ? 'Халуун ус' : 'Хүйтэн ус';
      const date = new Date(meter.WaterMeterDate);
      const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      
      return {
        id: Number(meter.WaterMeterId),
        number: `WM-${meter.Type === 1 ? 'HOT' : 'COLD'}-${meter.WaterMeterId}`,
        lastReading: `${meter.Indication} м³`,
        date: formattedDate,
        location: meter.Location,
        type: typeText
      };
    });
    
    return res.status(200).json({
      success: true,
      waterMeters: formattedMeters
    });
    
  } catch (error) {
    handleError(res, error, 'Get water meter details');
  }
};

// Add new water meter readings
exports.addMeterReading = async (req, res) => {
  try {
    const { hotWater, coldWater, locations } = req.body;
    const userId = req.userData.userId;
    
    // Validate inputs
    if ((hotWater === undefined && coldWater === undefined) || !locations || !locations.length) {
      return res.status(400).json({
        success: false,
        message: 'Тоолуурын заалт болон байршил оруулна уу.'
      });
    }
    
    // Get the user's apartment
    const apartmentId = await getUserApartmentId(userId);
    
    if (!apartmentId) {
      return res.status(404).json({
        success: false,
        message: 'Хэрэглэгчтэй холбоотой орон сууц олдсонгүй.'
      });
    }
    
    // Check if readings for this month already exist
    const [existingReadings] = await pool.execute(
      `SELECT COUNT(*) as count
       FROM WaterMeter
       WHERE ApartmentApartmentId = ?
       AND MONTH(WaterMeterDate) = MONTH(CURRENT_DATE())
       AND YEAR(WaterMeterDate) = YEAR(CURRENT_DATE())`,
      [apartmentId]
    );
    
    if (existingReadings[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Энэ сарын заалт аль хэдийн оруулсан байна.'
      });
    }
    
    // Insert readings for each location
    const promises = [];
    
    // Process hot water if provided
    if (hotWater !== undefined) {
      for (const location of locations) {
        // Skip toilet for hot water
        if (location === 'Нойл') continue;
        
        // Calculate distribution based on location
        let indication;
        if (location === 'Ванн') {
          indication = Math.floor(hotWater * 0.6); // 60% of hot water is for bathroom
        } else {
          indication = Math.floor(hotWater * 0.4); // 40% of hot water is for kitchen
        }
        
        promises.push(
          pool.execute(
            'INSERT INTO WaterMeter (ApartmentApartmentId, Type, Location, Indication) VALUES (?, 1, ?, ?)',
            [apartmentId, location, indication]
          )
        );
      }
    }
    
    // Process cold water if provided
    if (coldWater !== undefined) {
      for (const location of locations) {
        // Calculate distribution based on location
        let indication;
        if (location === 'Ванн') {
          indication = Math.floor(coldWater * 0.4); // 40% of cold water is for bathroom
        } else if (location === 'Гал тогоо') {
          indication = Math.floor(coldWater * 0.4); // 40% of cold water is for kitchen
        } else {
          indication = Math.floor(coldWater * 0.2); // 20% of cold water is for toilet
        }
        
        promises.push(
          pool.execute(
            'INSERT INTO WaterMeter (ApartmentApartmentId, Type, Location, Indication) VALUES (?, 0, ?, ?)',
            [apartmentId, location, indication]
          )
        );
      }
    }
    
    await Promise.all(promises);
    
    return res.status(201).json({
      success: true,
      message: 'Тоолуурын заалт амжилттай хадгалагдлаа.'
    });
    
  } catch (error) {
    handleError(res, error, 'Add meter reading');
  }
};

exports.getWaterMeterById = async (req, res) => {
  try {
    const waterMeterId = req.params.id;
    const userId = req.userData.userId;
    
    if (!waterMeterId || isNaN(Number(waterMeterId))) {
      return res.status(400).json({
        success: false,
        message: 'Буруу ID форматтай байна.'
      });
    }

    const apartmentId = await getUserApartmentId(userId);
    
    if (!apartmentId) {
      return res.status(404).json({
        success: false,
        message: 'Хэрэглэгчтэй холбоотой орон сууц олдсонгүй.'
      });
    }
    
    const [waterMeters] = await pool.execute(
      `SELECT 
        WaterMeterId,
        Type,
        Location,
        Indication,
        WaterMeterDate
      FROM WaterMeter
      WHERE WaterMeterId = ? AND ApartmentApartmentId = ?`,
      [waterMeterId, apartmentId]
    );
    
    if (waterMeters.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Усны тоолуур олдсонгүй.'
      });
    }
    
    const meter = waterMeters[0];
    
    return res.status(200).json({
      success: true,
      waterMeter: {
        id: Number(meter.WaterMeterId),
        type: Number(meter.Type),
        location: meter.Location,
        indication: Number(meter.Indication),
        date: meter.WaterMeterDate
      }
    });
    
  } catch (error) {
    handleError(res, error, 'Get water meter by ID');
  }
};