const db = require('../config/db');
const excel = require('exceljs');
const path = require('path');
const fs = require('fs');

const formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

exports.getDashboardStats = async (req, res) => {
  try {
    const [userCount] = await db.query('SELECT COUNT(*) as total FROM UserAdmin');
    const [apartmentCount] = await db.query('SELECT COUNT(*) as total FROM Apartment');
    const [pendingServiceCount] = await db.query(
      "SELECT COUNT(*) as total FROM Service WHERE Status = 'Хүлээгдэж буй'"
    );
    const [pendingFeedbackCount] = await db.query(
      "SELECT COUNT(*) as total FROM Feedback WHERE Status = 'Хүлээгдэж байна'"
    );
    const [pendingPaymentsCount] = await db.query(
      "SELECT COUNT(*) as total FROM WaterPayment WHERE Status = 'Төлөгдөөгүй'"
    );
    const [pendingPaymentsAmount] = await db.query(
      "SELECT COALESCE(SUM(TotalAmount), 0) as total FROM WaterPayment WHERE Status = 'Төлөгдөөгүй'"
    );
    res.status(200).json({
      userCount: userCount[0].total,
      apartmentCount: apartmentCount[0].total,
      pendingServiceCount: pendingServiceCount[0].total,
      pendingFeedbackCount: pendingFeedbackCount[0].total,
      pendingPaymentsCount: pendingPaymentsCount[0].total,
      pendingPaymentsAmount: pendingPaymentsAmount[0].total
    });
  } catch (err) {
    console.error('Error fetching dashboard statistics:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
};

exports.getPaymentReport = async (req, res) => {
  try {
    const { startDate, endDate, status, apartmentId, paymentType } = req.query;

    // WaterPayment query
    let waterQuery = `
      SELECT 
        wp.WaterPaymentId AS PaymentId,
        'Усны төлбөр' AS PaymentType,
        wp.TotalAmount AS Amount,
        wp.PayDate,
        wp.PaidDate,
        wp.Status,
        a.ApartmentCode,
        a.CityName,
        a.DistrictName,
        a.SubDistrictName,
        a.ApartmentName,
        a.BlockNumber,
        a.UnitNumber,
        CONCAT(u.Firstname, ' ', u.Lastname) AS UserName
      FROM WaterPayment wp
      JOIN Apartment a ON wp.ApartmentId = a.ApartmentId
      JOIN UserAdmin u ON wp.UserAdminId = u.UserId
      WHERE 1=1
    `;
    const waterParams = [];
    if (startDate && endDate) {
      waterQuery += ' AND wp.PayDate BETWEEN ? AND ?';
      waterParams.push(startDate, endDate);
    }
    if (status) {
      waterQuery += ' AND wp.Status = ?';
      waterParams.push(status);
    }
    if (apartmentId) {
      waterQuery += ' AND wp.ApartmentId = ?';
      waterParams.push(apartmentId);
    }
    waterQuery += ' ORDER BY wp.PayDate DESC';

    // ServicePayment query
    let serviceQuery = `
      SELECT 
        sp.ServicePaymentId AS PaymentId,
        'Үйлчилгээний төлбөр' AS PaymentType,
        sp.Amount AS Amount,
        sp.PayDate,
        sp.PaidDate,
        sp.Status,
        a.ApartmentCode,
        a.CityName,
        a.DistrictName,
        a.SubDistrictName,
        a.ApartmentName,
        a.BlockNumber,
        a.UnitNumber,
        CONCAT(u.Firstname, ' ', u.Lastname) AS UserName
      FROM ServicePayment sp
      JOIN Apartment a ON sp.ApartmentId = a.ApartmentId
      JOIN UserAdmin u ON sp.UserAdminId = u.UserId
      WHERE 1=1
    `;
    const serviceParams = [];
    if (startDate && endDate) {
      serviceQuery += ' AND sp.PayDate BETWEEN ? AND ?';
      serviceParams.push(startDate, endDate);
    }
    if (status) {
      serviceQuery += ' AND sp.Status = ?';
      serviceParams.push(status);
    }
    if (apartmentId) {
      serviceQuery += ' AND sp.ApartmentId = ?';
      serviceParams.push(apartmentId);
    }
    serviceQuery += ' ORDER BY sp.PayDate DESC';

    let results = [];
    if (!paymentType || paymentType === 'all') {
      const [waterResults] = await db.query(waterQuery, waterParams);
      const [serviceResults] = await db.query(serviceQuery, serviceParams);
      results = [...waterResults, ...serviceResults];
      // Sort by PayDate descending
      results.sort((a, b) => new Date(b.PayDate) - new Date(a.PayDate));
    } else if (paymentType === 'water') {
      const [waterResults] = await db.query(waterQuery, waterParams);
      results = waterResults;
    } else if (paymentType === 'service') {
      const [serviceResults] = await db.query(serviceQuery, serviceParams);
      results = serviceResults;
    }

    if (req.query.format === 'excel') {
      const workbook = new excel.Workbook();
      const worksheet = workbook.addWorksheet('Payment Report');
      worksheet.columns = [
        { header: 'Payment ID', key: 'PaymentId', width: 15 },
        { header: 'Payment Type', key: 'PaymentType', width: 18 },
        { header: 'Amount', key: 'Amount', width: 12 },
        { header: 'Pay Date', key: 'PayDate', width: 15 },
        { header: 'Paid Date', key: 'PaidDate', width: 15 },
        { header: 'Status', key: 'Status', width: 15 },
        { header: 'Apartment Code', key: 'ApartmentCode', width: 15 },
        { header: 'Apartment Name', key: 'ApartmentName', width: 20 },
        { header: 'City', key: 'CityName', width: 15 },
        { header: 'District', key: 'DistrictName', width: 15 },
        { header: 'Block Number', key: 'BlockNumber', width: 12 },
        { header: 'Unit Number', key: 'UnitNumber', width: 12 },
        { header: 'User Name', key: 'UserName', width: 20 }
      ];
      results.forEach(payment => {
        payment.PayDate = payment.PayDate ? formatDate(payment.PayDate) : null;
        payment.PaidDate = payment.PaidDate ? formatDate(payment.PaidDate) : null;
        worksheet.addRow(payment);
      });
      worksheet.getRow(1).font = { bold: true };
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=payment_report.xlsx');
      await workbook.xlsx.write(res);
      res.end();
    } else {
      res.status(200).json(results);
    }
  } catch (err) {
    console.error('Error generating payment report:', err);
    res.status(500).json({ error: 'Failed to generate payment report' });
  }
};

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

    if (startDate && endDate) {
      query += ' AND w.WaterMeterDate BETWEEN ? AND ?';
      queryParams.push(startDate, endDate);
    }
    
    if (apartmentId) {
      query += ' AND w.ApartmentId = ?';
      queryParams.push(apartmentId);
    }
    
    if (type !== undefined && type !== null && type !== '') {
      const typeNum = parseInt(type);
      if (!isNaN(typeNum) && (typeNum === 0 || typeNum === 1)) {
        query += ' AND w.Type = ?';
        queryParams.push(typeNum);
      }
    }
    
    query += ' ORDER BY w.WaterMeterDate DESC';
    
    const [results] = await db.query(query, queryParams);
    
    if (req.query.format === 'excel') {
      const workbook = new excel.Workbook();
      const worksheet = workbook.addWorksheet('Water Meter Report');
      
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
      
      results.forEach(meter => {
        meter.WaterMeterDate = meter.WaterMeterDate ? formatDate(meter.WaterMeterDate) : null;
        worksheet.addRow(meter);
      });

      worksheet.getRow(1).font = { bold: true };

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=water_meter_report.xlsx');
      
      await workbook.xlsx.write(res);
      res.end();
    } else {

      res.status(200).json(results);
    }
  } catch (err) {
    console.error('Error generating water meter report:', err);
    res.status(500).json({ error: 'Failed to generate water meter report' });
  }
};

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
        sp.Amount AS ServiceAmount,
        sp.PaidDate,
        sp.PayDate
      FROM Service s
      JOIN UserAdmin u ON s.UserAdminId = u.UserId
      LEFT JOIN Apartment a ON s.ApartmentId = a.ApartmentId
      LEFT JOIN ServicePayment sp ON s.ServiceId = sp.ServiceId
      WHERE 1=1
    `;
    const queryParams = [];
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
      const workbook = new excel.Workbook();
      const worksheet = workbook.addWorksheet('Service Report');
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
        { header: 'Paid Date', key: 'PaidDate', width: 15 },
        { header: 'Pay Date', key: 'PayDate', width: 15 }
      ];

      results.forEach(service => {
        service.RequestDate = service.RequestDate ? formatDate(service.RequestDate) : null;
        service.SubmitDate = service.SubmitDate ? formatDate(service.SubmitDate) : null;
        service.PaidDate = service.PaidDate ? formatDate(service.PaidDate) : null;
        service.PayDate = service.PayDate ? formatDate(service.PayDate) : null;
        worksheet.addRow(service);
      });

      worksheet.getRow(1).font = { bold: true };

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=service_report.xlsx');
      await workbook.xlsx.write(res);
      res.end();
    } else {
      res.status(200).json(results);
    }
  } catch (err) {
    console.error('Error generating service report:', err);
    res.status(500).json({ error: 'Failed to generate service report' });
  }
};

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
      const workbook = new excel.Workbook();
      const worksheet = workbook.addWorksheet('Feedback Report');
      
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
      
      results.forEach(feedback => {
        feedback.CreatedAt = feedback.CreatedAt ? formatDate(feedback.CreatedAt) : null;
        feedback.UpdatedAt = feedback.UpdatedAt ? formatDate(feedback.UpdatedAt) : null;
        worksheet.addRow(feedback);
      });
      
      worksheet.getRow(1).font = { bold: true };
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=feedback_report.xlsx');
      
      await workbook.xlsx.write(res);
      res.end();
    } else {
      res.status(200).json(results);
    }
  } catch (err) {
    console.error('Error generating feedback report:', err);
    res.status(500).json({ error: 'Failed to generate feedback report' });
  }
};

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
      const workbook = new excel.Workbook();
      const worksheet = workbook.addWorksheet('User Report');
      
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
      
      results.forEach(user => {
        user.CreatedAt = user.CreatedAt ? formatDate(user.CreatedAt) : null;
        user.UpdatedAt = user.UpdatedAt ? formatDate(user.UpdatedAt) : null;
        user.AdminRight = user.AdminRight === 1 ? 'Admin' : 'Regular User';
        user.IsVerified = user.IsVerified === 1 ? 'Verified' : 'Not Verified';
        worksheet.addRow(user);
      });
      
      worksheet.getRow(1).font = { bold: true };
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=user_report.xlsx');
      
      await workbook.xlsx.write(res);
      res.end();
    } else {
      res.status(200).json(results);
    }
  } catch (err) {
    console.error('Error generating user report:', err);
    res.status(500).json({ error: 'Failed to generate user report' });
  }
};

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
        (SELECT COUNT(*) FROM WaterPayment wp WHERE wp.ApartmentId = a.ApartmentId) AS PaymentsCount
      FROM Apartment a
      LEFT JOIN ApartmentUserAdmin aua ON a.ApartmentId = aua.ApartmentId
      WHERE 1=1
    `;
    
    const queryParams = [];
    
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
      const workbook = new excel.Workbook();
      const worksheet = workbook.addWorksheet('Apartment Report');
      
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
      
      results.forEach(apartment => {
        apartment.CreatedAt = apartment.CreatedAt ? formatDate(apartment.CreatedAt) : null;
        apartment.UpdatedAt = apartment.UpdatedAt ? formatDate(apartment.UpdatedAt) : null;
        worksheet.addRow(apartment);
      });
      
      worksheet.getRow(1).font = { bold: true };
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=apartment_report.xlsx');
      
      await workbook.xlsx.write(res);
      res.end();
    } else {
      res.status(200).json(results);
    }
  } catch (err) {
    console.error('Error generating apartment report:', err);
    res.status(500).json({ error: 'Failed to generate apartment report' });
  }
};

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
    
    const formattedResults = results.map(record => {
      return {
        ...record,
        TypeName: record.Type === 0 ? 'Cold Water' : 'Hot Water',
        FirstReading: record.FirstReading ? formatDate(record.FirstReading) : null,
        LastReading: record.LastReading ? formatDate(record.LastReading) : null
      };
    });
    
    if (req.query.format === 'excel') {
      const workbook = new excel.Workbook();
      const worksheet = workbook.addWorksheet('Water Consumption Analysis');
      
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
      
      formattedResults.forEach(record => {
        worksheet.addRow(record);
      });
      
      worksheet.getRow(1).font = { bold: true };
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=water_consumption_analysis.xlsx');
      
      await workbook.xlsx.write(res);
      res.end();
    } else {
      res.status(200).json(formattedResults);
    }
  } catch (err) {
    console.error('Error generating water consumption analysis:', err);
    res.status(500).json({ error: 'Failed to generate water consumption analysis' });
  }
};

exports.getPaymentStatistics = async (req, res) => {
  try {
    const { year } = req.query;
    const reportYear = year || new Date().getFullYear();
    const query = `
      SELECT 
        MONTH(PayDate) AS Month,
        'Усны төлбөр' AS PaymentType,
        COUNT(*) AS TotalPayments,
        SUM(CASE WHEN Status = 'Төлөгдсөн' THEN 1 ELSE 0 END) AS PaidPayments,
        SUM(CASE WHEN Status = 'Төлөгдөөгүй' THEN 1 ELSE 0 END) AS PendingPayments,
        SUM(TotalAmount) AS TotalAmount,
        SUM(CASE WHEN Status = 'Төлөгдсөн' THEN TotalAmount ELSE 0 END) AS PaidAmount,
        SUM(CASE WHEN Status = 'Төлөгдөөгүй' THEN TotalAmount ELSE 0 END) AS PendingAmount,
        SUM(CASE WHEN Status = 'Хоцорсон' THEN TotalAmount ELSE 0 END) AS OverdueAmount
      FROM WaterPayment
      WHERE YEAR(PayDate) = ?
      GROUP BY MONTH(PayDate)
      ORDER BY MONTH(PayDate)
    `;
    const [results] = await db.query(query, [reportYear]);
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const formattedResults = results.map(row => ({
      ...row,
      MonthName: monthNames[row.Month - 1],
      year: reportYear,
      CollectionRate: row.TotalAmount > 0
        ? ((row.PaidAmount / row.TotalAmount) * 100).toFixed(2) + '%'
        : '0%'
    }));
    res.status(200).json(formattedResults);
  } catch (err) {
    console.error('Error generating payment statistics:', err);
    res.status(500).json({ error: 'Failed to generate payment statistics' });
  }
};

exports.getServiceStatistics = async (req, res) => {
  try {
    const { year } = req.query;
    const reportYear = year || new Date().getFullYear();
    const query = `
      SELECT 
        MONTHNAME(RequestDate) AS MonthName,
        MONTH(RequestDate) AS Month,
        COUNT(*) AS TotalRequests,
        SUM(CASE WHEN Status = 'Дууссан' THEN 1 ELSE 0 END) AS CompletedRequests,
        SUM(CASE WHEN Status = 'Хүлээгдэж буй' THEN 1 ELSE 0 END) AS PendingRequests,
        SUM(CASE WHEN Status = 'Төлөвлөгдсөн' THEN 1 ELSE 0 END) AS InProgressRequests
      FROM Service
      WHERE YEAR(RequestDate) = ?
      GROUP BY MONTH(RequestDate), MONTHNAME(RequestDate)
      ORDER BY MONTH(RequestDate)
    `;
    const [results] = await db.query(query, [reportYear]);
    const formattedResults = results.map(row => ({
      ...row,
      CompletionRate: row.TotalRequests > 0
        ? ((row.CompletedRequests / row.TotalRequests) * 100).toFixed(2) + '%'
        : '0%'
    }));
    res.status(200).json(formattedResults);
  } catch (err) {
    console.error('Error generating service statistics:', err);
    res.status(500).json({ error: 'Failed to generate service statistics' });
  }
};

exports.updatePaymentAmount = async (req, res) => {
  try {
    const { paymentType, paymentId, amount } = req.body;
    if (!paymentType || !paymentId || amount === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    let query = '';
    if (paymentType === 'water') {
      query = 'UPDATE WaterPayment SET TotalAmount = ? WHERE WaterPaymentId = ?';
    } else if (paymentType === 'service') {
      query = 'UPDATE ServicePayment SET Amount = ? WHERE ServicePaymentId = ?';
    } else {
      return res.status(400).json({ error: 'Invalid payment type' });
    }
    const [result] = await db.query(query, [amount, paymentId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error updating payment amount:', err);
    res.status(500).json({ error: 'Failed to update payment amount' });
  }
};

// Update water meter indication
exports.updateWaterMeterIndication = async (req, res) => {
  try {
    const { waterMeterId, indication } = req.body;
    if (!waterMeterId || indication === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const [result] = await db.query(
      'UPDATE WaterMeter SET Indication = ? WHERE WaterMeterId = ?',
      [indication, waterMeterId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Water meter not found' });
    }
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error updating water meter indication:', err);
    res.status(500).json({ error: 'Failed to update water meter indication' });
  }
};

exports.deletePayment = async (req, res) => {
  try {
    const { paymentType, paymentId } = req.body;
    if (!paymentType || !paymentId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    let query = '';
    if (paymentType === 'water') {
      query = 'DELETE FROM WaterPayment WHERE WaterPaymentId = ?';
    } else if (paymentType === 'service') {
      query = 'DELETE FROM ServicePayment WHERE ServicePaymentId = ?';
    } else {
      return res.status(400).json({ error: 'Invalid payment type' });
    }
    const [result] = await db.query(query, [paymentId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error deleting payment:', err);
    res.status(500).json({ error: 'Failed to delete payment' });
  }
};

exports.deleteWaterMeter = async (req, res) => {
  try {
    const { waterMeterId } = req.body;
    if (!waterMeterId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const [result] = await db.query(
      'DELETE FROM WaterMeter WHERE WaterMeterId = ?',
      [waterMeterId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Water meter not found' });
    }
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error deleting water meter:', err);
    res.status(500).json({ error: 'Failed to delete water meter' });
  }
};
exports.getApartmentUsers = async (req, res) => {
  try {
    const { apartmentId } = req.params;
    const [users] = await db.query(
      `SELECT u.UserId, u.Username, u.Email
       FROM ApartmentUserAdmin aua
       JOIN UserAdmin u ON aua.UserId = u.UserId
       WHERE aua.ApartmentId = ?`,
      [apartmentId]
    );
    const usersWithType = users.map(u => ({
      ...u,
      UserType: '' 
    }));
    res.status(200).json(usersWithType);
  } catch (err) {
    console.error('Error fetching apartment users:', err);
    res.status(500).json({ error: 'Failed to fetch apartment users' });
  }
};

// Add user to apartment
exports.addApartmentUser = async (req, res) => {
  try {
    const { apartmentId } = req.params;
    const { email, userType } = req.body;
    if (!email || !userType) {
      return res.status(400).json({ error: 'Email and userType are required' });
    }
    // Find user by email
    const [users] = await db.query('SELECT UserId FROM UserAdmin WHERE Email = ?', [email]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const userId = users[0].UserId;
    // Check if already exists
    const [exists] = await db.query(
      'SELECT * FROM ApartmentUserAdmin WHERE ApartmentId = ? AND UserId = ?',
      [apartmentId, userId]
    );
    if (exists.length > 0) {
      return res.status(409).json({ error: 'User already added to this apartment' });
    }
    await db.query(
      'INSERT INTO ApartmentUserAdmin (ApartmentId, UserId, UserType) VALUES (?, ?, ?)',
      [apartmentId, userId, userType]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    console.error('Error adding user to apartment:', err);
    res.status(500).json({ error: 'Failed to add user to apartment' });
  }
};

// Remove user from apartment
exports.removeApartmentUser = async (req, res) => {
  try {
    const { apartmentId, userId } = req.params;
    await db.query(
      'DELETE FROM ApartmentUserAdmin WHERE ApartmentId = ? AND UserId = ?',
      [apartmentId, userId]
    );
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error removing user from apartment:', err);
    res.status(500).json({ error: 'Failed to remove user from apartment' });
  }
};

module.exports = exports;