const db = require('../config/db');
const excel = require('exceljs');
const path = require('path');
const fs = require('fs');

// Helper function to format date for reports
const formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    // Get total users count
    const [userCount] = await db.query('SELECT COUNT(*) as total FROM UserAdmin');
    
    // Get total apartments count
    const [apartmentCount] = await db.query('SELECT COUNT(*) as total FROM Apartment');
    
    // Get pending service requests count
    const [pendingServiceCount] = await db.query(
      "SELECT COUNT(*) as total FROM Service WHERE Status = 'pending'"
    );
    
    // Get pending feedback count
    const [pendingFeedbackCount] = await db.query(
      "SELECT COUNT(*) as total FROM Feedback WHERE Status = 'Хүлээгдэж байна'"
    );
    
    // Get total pending payments
    const [pendingPaymentsCount] = await db.query(
      "SELECT COUNT(*) as total FROM Payment WHERE Status = 'pending'"
    );
    
    // Get total pending payments amount
    const [pendingPaymentsAmount] = await db.query(
      "SELECT SUM(Amount) as total FROM Payment WHERE Status = 'pending'"
    );

    res.status(200).json({
      userCount: userCount[0].total,
      apartmentCount: apartmentCount[0].total,
      pendingServiceCount: pendingServiceCount[0].total,
      pendingFeedbackCount: pendingFeedbackCount[0].total,
      pendingPaymentsCount: pendingPaymentsCount[0].total,
      pendingPaymentsAmount: pendingPaymentsAmount[0].total || 0
    });
  } catch (err) {
    console.error('Error fetching dashboard statistics:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
};

// Generate payment report
exports.getPaymentReport = async (req, res) => {
  try {
    const { startDate, endDate, status, apartmentId } = req.query;

    let query = `
      SELECT 
        p.PaymentId,
        p.PaymentType,
        p.Amount,
        p.PayDate,
        p.PaidDate,
        p.Status,
        a.ApartmentCode,
        a.CityName,
        a.DistrictName,
        a.SubDistrictName,
        a.ApartmentName,
        a.BlockNumber,
        a.UnitNumber,
        CONCAT(u.Firstname, ' ', u.Lastname) AS UserName
      FROM Payment p
      JOIN Apartment a ON p.ApartmentId = a.ApartmentId
      JOIN UserAdmin u ON p.UserAdminId = u.UserId
      WHERE 1=1
    `;
    
    const queryParams = [];
    
    // Add filters if provided
    if (startDate && endDate) {
      query += ' AND p.PayDate BETWEEN ? AND ?';
      queryParams.push(startDate, endDate);
    }
    
    if (status) {
      query += ' AND p.Status = ?';
      queryParams.push(status);
    }
    
    if (apartmentId) {
      query += ' AND p.ApartmentId = ?';
      queryParams.push(apartmentId);
    }
    
    query += ' ORDER BY p.PayDate DESC';
    
    const [results] = await db.query(query, queryParams);
    
    if (req.query.format === 'excel') {
      // Create Excel file
      const workbook = new excel.Workbook();
      const worksheet = workbook.addWorksheet('Payment Report');
      
      // Add columns
      worksheet.columns = [
        { header: 'Payment ID', key: 'PaymentId', width: 10 },
        { header: 'Payment Type', key: 'PaymentType', width: 15 },
        { header: 'Amount', key: 'Amount', width: 12 },
        { header: 'Pay Date', key: 'PayDate', width: 15 },
        { header: 'Paid Date', key: 'PaidDate', width: 15 },
        { header: 'Status', key: 'Status', width: 12 },
        { header: 'Apartment Code', key: 'ApartmentCode', width: 15 },
        { header: 'Apartment Name', key: 'ApartmentName', width: 20 },
        { header: 'City', key: 'CityName', width: 15 },
        { header: 'District', key: 'DistrictName', width: 15 },
        { header: 'Block Number', key: 'BlockNumber', width: 12 },
        { header: 'Unit Number', key: 'UnitNumber', width: 12 },
        { header: 'User Name', key: 'UserName', width: 20 }
      ];
      
      // Format dates and add rows
      results.forEach(payment => {
        payment.PayDate = payment.PayDate ? formatDate(payment.PayDate) : null;
        payment.PaidDate = payment.PaidDate ? formatDate(payment.PaidDate) : null;
        worksheet.addRow(payment);
      });
      
      // Style the header row
      worksheet.getRow(1).font = { bold: true };
      
      // Set response headers for file download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=payment_report.xlsx');
      
      // Write to response
      await workbook.xlsx.write(res);
      res.end();
    } else {
      // Return JSON if not requesting Excel
      res.status(200).json(results);
    }
  } catch (err) {
    console.error('Error generating payment report:', err);
    res.status(500).json({ error: 'Failed to generate payment report' });
  }
};

// Generate water meter report
exports.getWaterMeterReport = async (req, res) => {
  try {
    const { startDate, endDate, apartmentId, type } = req.query;

    let query = `
      SELECT 
        w.WaterMeterId,
        w.Type,
        CASE 
          WHEN w.Type = 0 THEN 'Cold Water'
          WHEN w.Type = 1 THEN 'Hot Water'
          ELSE 'Unknown'
        END AS WaterType,
        w.Location,
        w.Indication,
        w.WaterMeterDate,
        a.ApartmentCode,
        a.CityName,
        a.DistrictName,
        a.ApartmentName,
        a.BlockNumber,
        a.UnitNumber,
        CONCAT(u.Firstname, ' ', u.Lastname) AS CreatedByUser
      FROM WaterMeter w
      JOIN Apartment a ON w.ApartmentId = a.ApartmentId
      LEFT JOIN UserAdmin u ON w.CreatedBy = u.UserId
      WHERE 1=1
    `;
    
    const queryParams = [];
    
    // Add filters if provided
    if (startDate && endDate) {
      query += ' AND w.WaterMeterDate BETWEEN ? AND ?';
      queryParams.push(startDate, endDate);
    }
    
    if (apartmentId) {
      query += ' AND w.ApartmentId = ?';
      queryParams.push(apartmentId);
    }
    
    if (type !== undefined && type !== null) {
      query += ' AND w.Type = ?';
      queryParams.push(parseInt(type));
    }
    
    query += ' ORDER BY w.WaterMeterDate DESC';
    
    const [results] = await db.query(query, queryParams);
    
    if (req.query.format === 'excel') {
      // Create Excel file
      const workbook = new excel.Workbook();
      const worksheet = workbook.addWorksheet('Water Meter Report');
      
      // Add columns
      worksheet.columns = [
        { header: 'Meter ID', key: 'WaterMeterId', width: 10 },
        { header: 'Water Type', key: 'WaterType', width: 12 },
        { header: 'Location', key: 'Location', width: 15 },
        { header: 'Indication', key: 'Indication', width: 12 },
        { header: 'Reading Date', key: 'WaterMeterDate', width: 20 },
        { header: 'Apartment Code', key: 'ApartmentCode', width: 15 },
        { header: 'Apartment Name', key: 'ApartmentName', width: 20 },
        { header: 'City', key: 'CityName', width: 15 },
        { header: 'District', key: 'DistrictName', width: 15 },
        { header: 'Block Number', key: 'BlockNumber', width: 12 },
        { header: 'Unit Number', key: 'UnitNumber', width: 12 },
        { header: 'Created By', key: 'CreatedByUser', width: 20 }
      ];
      
      // Format dates and add rows
      results.forEach(meter => {
        meter.WaterMeterDate = meter.WaterMeterDate ? formatDate(meter.WaterMeterDate) : null;
        worksheet.addRow(meter);
      });
      
      // Style the header row
      worksheet.getRow(1).font = { bold: true };
      
      // Set response headers for file download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=water_meter_report.xlsx');
      
      // Write to response
      await workbook.xlsx.write(res);
      res.end();
    } else {
      // Return JSON if not requesting Excel
      res.status(200).json(results);
    }
  } catch (err) {
    console.error('Error generating water meter report:', err);
    res.status(500).json({ error: 'Failed to generate water meter report' });
  }
};

// Generate service report
exports.getServiceReport = async (req, res) => {
  try {
    const { startDate, endDate, status, apartmentId } = req.query;

    let query = `
      SELECT 
        s.ServiceId,
        s.Description,
        s.Respond,
        s.RequestDate,
        s.SubmitDate,
        s.Status,
        a.ApartmentCode,
        a.ApartmentName,
        a.BlockNumber,
        a.UnitNumber,
        CONCAT(u.Firstname, ' ', u.Lastname) AS UserName,
        ps.Amount AS ServiceAmount,
        ps.PaidDay,
        ps.PayDay
      FROM Service s
      JOIN UserAdmin u ON s.UserAdminId = u.UserId
      LEFT JOIN Apartment a ON s.ApartmentId = a.ApartmentId
      LEFT JOIN PaymentService ps ON s.ServiceId = ps.ServiceId
      WHERE 1=1
    `;
    
    const queryParams = [];
    
    // Add filters if provided
    if (startDate && endDate) {
      query += ' AND s.RequestDate BETWEEN ? AND ?';
      queryParams.push(startDate, endDate);
    }
    
    if (status) {
      query += ' AND s.Status = ?';
      queryParams.push(status);
    }
    
    if (apartmentId) {
      query += ' AND s.ApartmentId = ?';
      queryParams.push(apartmentId);
    }
    
    query += ' ORDER BY s.RequestDate DESC';
    
    const [results] = await db.query(query, queryParams);
    
    if (req.query.format === 'excel') {
      // Create Excel file
      const workbook = new excel.Workbook();
      const worksheet = workbook.addWorksheet('Service Report');
      
      // Add columns
      worksheet.columns = [
        { header: 'Service ID', key: 'ServiceId', width: 10 },
        { header: 'Description', key: 'Description', width: 30 },
        { header: 'Response', key: 'Respond', width: 30 },
        { header: 'Request Date', key: 'RequestDate', width: 15 },
        { header: 'Submit Date', key: 'SubmitDate', width: 15 },
        { header: 'Status', key: 'Status', width: 15 },
        { header: 'Apartment Code', key: 'ApartmentCode', width: 15 },
        { header: 'Apartment Name', key: 'ApartmentName', width: 20 },
        { header: 'Block Number', key: 'BlockNumber', width: 12 },
        { header: 'Unit Number', key: 'UnitNumber', width: 12 },
        { header: 'User Name', key: 'UserName', width: 20 },
        { header: 'Service Amount', key: 'ServiceAmount', width: 15 },
        { header: 'Paid Date', key: 'PaidDay', width: 15 },
        { header: 'Pay Date', key: 'PayDay', width: 15 }
      ];
      
      // Format dates and add rows
      results.forEach(service => {
        service.RequestDate = service.RequestDate ? formatDate(service.RequestDate) : null;
        service.SubmitDate = service.SubmitDate ? formatDate(service.SubmitDate) : null;
        service.PaidDay = service.PaidDay ? formatDate(service.PaidDay) : null;
        service.PayDay = service.PayDay ? formatDate(service.PayDay) : null;
        worksheet.addRow(service);
      });
      
      // Style the header row
      worksheet.getRow(1).font = { bold: true };
      
      // Set response headers for file download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=service_report.xlsx');
      
      // Write to response
      await workbook.xlsx.write(res);
      res.end();
    } else {
      // Return JSON if not requesting Excel
      res.status(200).json(results);
    }
  } catch (err) {
    console.error('Error generating service report:', err);
    res.status(500).json({ error: 'Failed to generate service report' });
  }
};

// Generate feedback report
exports.getFeedbackReport = async (req, res) => {
  try {
    const { startDate, endDate, type, status } = req.query;

    let query = `
      SELECT 
        f.ApplicationId,
        f.Type,
        f.Description,
        f.AdminResponse,
        f.Status,
        f.CreatedAt,
        f.UpdatedAt,
        CONCAT(u.Firstname, ' ', u.Lastname) AS UserName,
        u.Email AS UserEmail,
        CONCAT(a.Firstname, ' ', a.Lastname) AS AdminResponder
      FROM Feedback f
      JOIN UserAdmin u ON f.UserAdminId = u.UserId
      LEFT JOIN UserAdmin a ON f.AdminResponderId = a.UserId
      WHERE 1=1
    `;
    
    const queryParams = [];
    
    // Add filters if provided
    if (startDate && endDate) {
      query += ' AND f.CreatedAt BETWEEN ? AND ?';
      queryParams.push(startDate, endDate);
    }
    
    if (type) {
      query += ' AND f.Type = ?';
      queryParams.push(type);
    }
    
    if (status) {
      query += ' AND f.Status = ?';
      queryParams.push(status);
    }
    
    query += ' ORDER BY f.CreatedAt DESC';
    
    const [results] = await db.query(query, queryParams);
    
    if (req.query.format === 'excel') {
      // Create Excel file
      const workbook = new excel.Workbook();
      const worksheet = workbook.addWorksheet('Feedback Report');
      
      // Add columns
      worksheet.columns = [
        { header: 'Feedback ID', key: 'ApplicationId', width: 10 },
        { header: 'Type', key: 'Type', width: 15 },
        { header: 'Description', key: 'Description', width: 40 },
        { header: 'Admin Response', key: 'AdminResponse', width: 40 },
        { header: 'Status', key: 'Status', width: 20 },
        { header: 'Created At', key: 'CreatedAt', width: 20 },
        { header: 'Updated At', key: 'UpdatedAt', width: 20 },
        { header: 'User Name', key: 'UserName', width: 20 },
        { header: 'User Email', key: 'UserEmail', width: 25 },
        { header: 'Admin Responder', key: 'AdminResponder', width: 20 }
      ];
      
      // Format dates and add rows
      results.forEach(feedback => {
        feedback.CreatedAt = feedback.CreatedAt ? formatDate(feedback.CreatedAt) : null;
        feedback.UpdatedAt = feedback.UpdatedAt ? formatDate(feedback.UpdatedAt) : null;
        worksheet.addRow(feedback);
      });
      
      // Style the header row
      worksheet.getRow(1).font = { bold: true };
      
      // Set response headers for file download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=feedback_report.xlsx');
      
      // Write to response
      await workbook.xlsx.write(res);
      res.end();
    } else {
      // Return JSON if not requesting Excel
      res.status(200).json(results);
    }
  } catch (err) {
    console.error('Error generating feedback report:', err);
    res.status(500).json({ error: 'Failed to generate feedback report' });
  }
};

// Generate user report
exports.getUserReport = async (req, res) => {
  try {
    const { adminRight, isVerified } = req.query;

    let query = `
      SELECT 
        u.UserId,
        u.AdminRight,
        u.Username,
        u.Firstname,
        u.Lastname,
        u.Phonenumber,
        u.Email,
        u.IsVerified,
        u.CreatedAt,
        u.UpdatedAt,
        COUNT(DISTINCT aua.ApartmentId) AS ApartmentCount
      FROM UserAdmin u
      LEFT JOIN ApartmentUserAdmin aua ON u.UserId = aua.UserId
      WHERE 1=1
    `;
    
    const queryParams = [];
    
    // Add filters if provided
    if (adminRight !== undefined && adminRight !== null) {
      query += ' AND u.AdminRight = ?';
      queryParams.push(parseInt(adminRight));
    }
    
    if (isVerified !== undefined && isVerified !== null) {
      query += ' AND u.IsVerified = ?';
      queryParams.push(parseInt(isVerified));
    }
    
    query += ' GROUP BY u.UserId ORDER BY u.CreatedAt DESC';
    
    const [results] = await db.query(query, queryParams);
    
    if (req.query.format === 'excel') {
      // Create Excel file
      const workbook = new excel.Workbook();
      const worksheet = workbook.addWorksheet('User Report');
      
      // Add columns
      worksheet.columns = [
        { header: 'User ID', key: 'UserId', width: 10 },
        { header: 'Admin Right', key: 'AdminRight', width: 12 },
        { header: 'Username', key: 'Username', width: 20 },
        { header: 'First Name', key: 'Firstname', width: 15 },
        { header: 'Last Name', key: 'Lastname', width: 15 },
        { header: 'Phone Number', key: 'Phonenumber', width: 15 },
        { header: 'Email', key: 'Email', width: 25 },
        { header: 'Is Verified', key: 'IsVerified', width: 12 },
        { header: 'Created At', key: 'CreatedAt', width: 20 },
        { header: 'Updated At', key: 'UpdatedAt', width: 20 },
        { header: 'Apartment Count', key: 'ApartmentCount', width: 15 }
      ];
      
      // Format dates and add rows
      results.forEach(user => {
        user.CreatedAt = user.CreatedAt ? formatDate(user.CreatedAt) : null;
        user.UpdatedAt = user.UpdatedAt ? formatDate(user.UpdatedAt) : null;
        user.AdminRight = user.AdminRight === 1 ? 'Admin' : 'Regular User';
        user.IsVerified = user.IsVerified === 1 ? 'Verified' : 'Not Verified';
        worksheet.addRow(user);
      });
      
      // Style the header row
      worksheet.getRow(1).font = { bold: true };
      
      // Set response headers for file download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=user_report.xlsx');
      
      // Write to response
      await workbook.xlsx.write(res);
      res.end();
    } else {
      // Return JSON if not requesting Excel
      res.status(200).json(results);
    }
  } catch (err) {
    console.error('Error generating user report:', err);
    res.status(500).json({ error: 'Failed to generate user report' });
  }
};

// Generate apartment report
exports.getApartmentReport = async (req, res) => {
  try {
    const { cityName, districtName } = req.query;

    let query = `
      SELECT 
        a.ApartmentId,
        a.ApartmentCode,
        a.CityName,
        a.DistrictName,
        a.SubDistrictName,
        a.ApartmentName,
        a.BlockNumber,
        a.UnitNumber,
        a.CreatedAt,
        a.UpdatedAt,
        COUNT(DISTINCT aua.UserId) AS UserCount,
        (SELECT COUNT(*) FROM WaterMeter wm WHERE wm.ApartmentId = a.ApartmentId) AS MeterReadingsCount,
        (SELECT COUNT(*) FROM Payment p WHERE p.ApartmentId = a.ApartmentId) AS PaymentsCount
      FROM Apartment a
      LEFT JOIN ApartmentUserAdmin aua ON a.ApartmentId = aua.ApartmentId
      WHERE 1=1
    `;
    
    const queryParams = [];
    
    // Add filters if provided
    if (cityName) {
      query += ' AND a.CityName = ?';
      queryParams.push(cityName);
    }
    
    if (districtName) {
      query += ' AND a.DistrictName = ?';
      queryParams.push(districtName);
    }
    
    query += ' GROUP BY a.ApartmentId ORDER BY a.CreatedAt DESC';
    
    const [results] = await db.query(query, queryParams);
    
    if (req.query.format === 'excel') {
      // Create Excel file
      const workbook = new excel.Workbook();
      const worksheet = workbook.addWorksheet('Apartment Report');
      
      // Add columns
      worksheet.columns = [
        { header: 'Apartment ID', key: 'ApartmentId', width: 12 },
        { header: 'Apartment Code', key: 'ApartmentCode', width: 15 },
        { header: 'City', key: 'CityName', width: 15 },
        { header: 'District', key: 'DistrictName', width: 15 },
        { header: 'SubDistrict', key: 'SubDistrictName', width: 15 },
        { header: 'Apartment Name', key: 'ApartmentName', width: 25 },
        { header: 'Block Number', key: 'BlockNumber', width: 15 },
        { header: 'Unit Number', key: 'UnitNumber', width: 15 },
        { header: 'Created At', key: 'CreatedAt', width: 20 },
        { header: 'Updated At', key: 'UpdatedAt', width: 20 },
        { header: 'User Count', key: 'UserCount', width: 12 },
        { header: 'Meter Readings', key: 'MeterReadingsCount', width: 15 },
        { header: 'Payments Count', key: 'PaymentsCount', width: 15 }
      ];
      
      // Format dates and add rows
      results.forEach(apartment => {
        apartment.CreatedAt = apartment.CreatedAt ? formatDate(apartment.CreatedAt) : null;
        apartment.UpdatedAt = apartment.UpdatedAt ? formatDate(apartment.UpdatedAt) : null;
        worksheet.addRow(apartment);
      });
      
      // Style the header row
      worksheet.getRow(1).font = { bold: true };
      
      // Set response headers for file download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=apartment_report.xlsx');
      
      // Write to response
      await workbook.xlsx.write(res);
      res.end();
    } else {
      // Return JSON if not requesting Excel
      res.status(200).json(results);
    }
  } catch (err) {
    console.error('Error generating apartment report:', err);
    res.status(500).json({ error: 'Failed to generate apartment report' });
  }
};

// Generate water consumption analysis
exports.getWaterConsumptionAnalysis = async (req, res) => {
  try {
    const { year, month, apartmentId } = req.query;
    
    let timeFilter = '';
    const queryParams = [];
    
    if (year && month) {
      timeFilter = 'AND YEAR(w.WaterMeterDate) = ? AND MONTH(w.WaterMeterDate) = ?';
      queryParams.push(parseInt(year), parseInt(month));
    } else if (year) {
      timeFilter = 'AND YEAR(w.WaterMeterDate) = ?';
      queryParams.push(parseInt(year));
    }
    
    // Query for analyzing water consumption by type and location
    let query = `
      SELECT 
        a.ApartmentCode,
        a.ApartmentName,
        w.Type,
        w.Location,
        MAX(w.Indication) - MIN(w.Indication) AS Consumption,
        COUNT(w.WaterMeterId) AS ReadingsCount,
        MIN(w.WaterMeterDate) AS FirstReading,
        MAX(w.WaterMeterDate) AS LastReading
      FROM WaterMeter w
      JOIN Apartment a ON w.ApartmentId = a.ApartmentId
      WHERE 1=1 ${timeFilter}
    `;
    
    if (apartmentId) {
      query += ' AND w.ApartmentId = ?';
      queryParams.push(parseInt(apartmentId));
    }
    
    query += ' GROUP BY a.ApartmentId, w.Type, w.Location';
    
    const [results] = await db.query(query, queryParams);
    
    // Process results to make them more useful
    const formattedResults = results.map(record => {
      return {
        ...record,
        TypeName: record.Type === 0 ? 'Cold Water' : 'Hot Water',
        FirstReading: record.FirstReading ? formatDate(record.FirstReading) : null,
        LastReading: record.LastReading ? formatDate(record.LastReading) : null
      };
    });
    
    if (req.query.format === 'excel') {
      // Create Excel file
      const workbook = new excel.Workbook();
      const worksheet = workbook.addWorksheet('Water Consumption Analysis');
      
      // Add columns
      worksheet.columns = [
        { header: 'Apartment Code', key: 'ApartmentCode', width: 15 },
        { header: 'Apartment Name', key: 'ApartmentName', width: 25 },
        { header: 'Water Type', key: 'TypeName', width: 12 },
        { header: 'Location', key: 'Location', width: 15 },
        { header: 'Consumption', key: 'Consumption', width: 15 },
        { header: 'Readings Count', key: 'ReadingsCount', width: 15 },
        { header: 'First Reading Date', key: 'FirstReading', width: 20 },
        { header: 'Last Reading Date', key: 'LastReading', width: 20 }
      ];
      
      // Add rows
      formattedResults.forEach(record => {
        worksheet.addRow(record);
      });
      
      // Style the header row
      worksheet.getRow(1).font = { bold: true };
      
      // Set response headers for file download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=water_consumption_analysis.xlsx');
      
      // Write to response
      await workbook.xlsx.write(res);
      res.end();
    } else {
      // Return JSON if not requesting Excel
      res.status(200).json(formattedResults);
    }
  } catch (err) {
    console.error('Error generating water consumption analysis:', err);
    res.status(500).json({ error: 'Failed to generate water consumption analysis' });
  }
};

// Get payment statistics
exports.getPaymentStatistics = async (req, res) => {
  try {
    const { year } = req.query;
    
    // Default to current year if not specified
    const reportYear = year || new Date().getFullYear();
    
    // Query for monthly payment statistics
    const query = `
      SELECT 
        MONTH(PayDate) AS Month,
        PaymentType,
        COUNT(*) AS TotalPayments,
        SUM(CASE WHEN Status = 'paid' THEN 1 ELSE 0 END) AS PaidPayments,
        SUM(CASE WHEN Status = 'pending' THEN 1 ELSE 0 END) AS PendingPayments,
        SUM(Amount) AS TotalAmount,
        SUM(CASE WHEN Status = 'paid' THEN Amount ELSE 0 END) AS PaidAmount,
        SUM(CASE WHEN Status = 'pending' THEN Amount ELSE 0 END) AS PendingAmount
      FROM Payment
      WHERE YEAR(PayDate) = ?
      GROUP BY MONTH(PayDate), PaymentType
      ORDER BY MONTH(PayDate)
    `;
    
    const [results] = await db.query(query, [reportYear]);
    
    // Format results into a more structured response
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const formattedResults = results.map(row => {
      return {
        ...row,
        MonthName: monthNames[row.Month - 1],
        CollectionRate: row.TotalAmount > 0 ? 
          ((row.PaidAmount / row.TotalAmount) * 100).toFixed(2) + '%' : 
          '0%'
      };
    });
    
    if (req.query.format === 'excel') {
      // Create Excel file
      const workbook = new excel.Workbook();
      const worksheet = workbook.addWorksheet('Payment Statistics');
      
      // Add columns
      worksheet.columns = [
        { header: 'Month', key: 'MonthName', width: 15 },
        { header: 'Payment Type', key: 'PaymentType', width: 15 },
        { header: 'Total Payments', key: 'TotalPayments', width: 15 },
        { header: 'Paid Payments', key: 'PaidPayments', width: 15 },
        { header: 'Pending Payments', key: 'PendingPayments', width: 15 },
        { header: 'Total Amount', key: 'TotalAmount', width: 15 },
        { header: 'Paid Amount', key: 'PaidAmount', width: 15 },
        { header: 'Pending Amount', key: 'PendingAmount', width: 15 },
        { header: 'Collection Rate', key: 'CollectionRate', width: 15 }
      ];
      
      // Add rows
      formattedResults.forEach(row => {
        worksheet.addRow(row);
      });
      
      // Style the header row
      worksheet.getRow(1).font = { bold: true };
      
      // Set response headers for file download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=payment_statistics.xlsx');
      
      // Write to response
      await workbook.xlsx.write(res);
      res.end();
    } else {
      // Return JSON if not requesting Excel
      res.status(200).json(formattedResults);
    }
  } catch (err) {
    console.error('Error generating payment statistics:', err);
    res.status(500).json({ error: 'Failed to generate payment statistics' });
  }
};

// Get service statistics
exports.getServiceStatistics = async (req, res) => {
  try {
    const { year } = req.query;
    
    // Default to current year if not specified
    const reportYear = year || new Date().getFullYear();
    
    // Query for monthly service request statistics
    const query = `
      SELECT 
        MONTH(RequestDate) AS Month,
        COUNT(*) AS TotalRequests,
        SUM(CASE WHEN Status = 'completed' THEN 1 ELSE 0 END) AS CompletedRequests,
        SUM(CASE WHEN Status = 'pending' THEN 1 ELSE 0 END) AS PendingRequests,
        SUM(CASE WHEN Status = 'in progress' THEN 1 ELSE 0 END) AS InProgressRequests,
        AVG(DATEDIFF(SubmitDate, RequestDate)) AS AvgResolutionDays
      FROM Service
      WHERE YEAR(RequestDate) = ?
      GROUP BY MONTH(RequestDate)
      ORDER BY MONTH(RequestDate)
    `;
    
    const [results] = await db.query(query, [reportYear]);
    
    // Format results into a more structured response
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const formattedResults = results.map(row => {
      return {
        ...row,
        MonthName: monthNames[row.Month - 1],
        CompletionRate: row.TotalRequests > 0 ? 
          ((row.CompletedRequests / row.TotalRequests) * 100).toFixed(2) + '%' : 
          '0%',
        AvgResolutionDays: row.AvgResolutionDays ? 
          parseFloat(row.AvgResolutionDays).toFixed(1) : 
          'N/A'
      };
    });
    
    if (req.query.format === 'excel') {
      // Create Excel file
      const workbook = new excel.Workbook();
      const worksheet = workbook.addWorksheet('Service Statistics');
      
      // Add columns
      worksheet.columns = [
        { header: 'Month', key: 'MonthName', width: 15 },
        { header: 'Total Requests', key: 'TotalRequests', width: 15 },
        { header: 'Completed', key: 'CompletedRequests', width: 15 },
        { header: 'Pending', key: 'PendingRequests', width: 15 },
        { header: 'In Progress', key: 'InProgressRequests', width: 15 },
        { header: 'Completion Rate', key: 'CompletionRate', width: 15 },
        { header: 'Avg. Resolution (Days)', key: 'AvgResolutionDays', width: 20 }
      ];
      
      // Add rows
      formattedResults.forEach(row => {
        worksheet.addRow(row);
      });
      
      // Style the header row
      worksheet.getRow(1).font = { bold: true };
      
      // Set response headers for file download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=service_statistics.xlsx');
      
      // Write to response
      await workbook.xlsx.write(res);
      res.end();
    } else {
      // Return JSON if not requesting Excel
      res.status(200).json(formattedResults);
    }
  } catch (err) {
    console.error('Error generating service statistics:', err);
    res.status(500).json({ error: 'Failed to generate service statistics' });
  }
};

module.exports = exports;