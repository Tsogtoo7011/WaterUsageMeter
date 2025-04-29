const db = require('../config/db');

exports.getAllServices = async (req, res) => {
  try {
    const query = `
      SELECT s.ServiceId, s.Description, s.Respond, s.RequestDate, s.SubmitDate, s.Status, 
             u.Username, s.ApartmentId, a.ApartmentName, a.UnitNumber, a.BlockNumber,
             ps.Amount, ps.PaidDay, ps.PayDay 
      FROM Service s
      JOIN UserAdmin u ON s.UserAdminId = u.UserId
      LEFT JOIN Apartment a ON s.ApartmentId = a.ApartmentId
      LEFT JOIN PaymentService ps ON s.ServiceId = ps.ServiceId
      ORDER BY s.ServiceId DESC
    `;
    
    const [results] = await db.query(query);
    
    res.status(200).json(results);
  } catch (err) {
    console.error('Error fetching services:', err);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
};

exports.getServiceById = async (req, res) => {
  try {
    const serviceId = req.params.id;
    
    const query = `
      SELECT s.*, u.Username, a.ApartmentName, a.UnitNumber, a.BlockNumber,
             ps.Amount, ps.PaidDay, ps.PayDay 
      FROM Service s
      JOIN UserAdmin u ON s.UserAdminId = u.UserId
      LEFT JOIN Apartment a ON s.ApartmentId = a.ApartmentId
      LEFT JOIN PaymentService ps ON s.ServiceId = ps.ServiceId
      WHERE s.ServiceId = ?
    `;
    
    const [results] = await db.query(query, [serviceId]);
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    res.status(200).json(results[0]);
  } catch (err) {
    console.error('Error fetching service:', err);
    res.status(500).json({ error: 'Failed to fetch service' });
  }
};

exports.createServiceRequest = async (req, res) => {
  try {
    const { description, apartmentId } = req.body;
    const userId = req.userData.userId;
    
    if (!description) {
      return res.status(400).json({ message: 'Service description is required' });
    }
    
    // Validate that the user has access to this apartment
    if (apartmentId) {
      const accessQuery = `
        SELECT * FROM ApartmentUserAdmin 
        WHERE UserId = ? AND ApartmentId = ? AND (EndDate IS NULL OR EndDate > NOW())
      `;
      
      const [accessResults] = await db.query(accessQuery, [userId, apartmentId]);
      
      if (accessResults.length === 0) {
        return res.status(403).json({ message: 'You do not have access to this apartment' });
      }
    }
    
    const query = `
      INSERT INTO Service (UserAdminId, Description, Respond, ApartmentId)
      VALUES (?, ?, '', ?)
    `;
    
    const [results] = await db.query(query, [userId, description, apartmentId || null]);
    
    res.status(201).json({
      message: 'Service request created successfully',
      serviceId: results.insertId
    });
  } catch (err) {
    console.error('Error creating service request:', err);
    res.status(500).json({ message: 'Failed to create service request: ' + err.message });
  }
};

exports.updateServiceResponse = async (req, res) => {
  try {
    const serviceId = req.params.id;
    const { respond, status, amount } = req.body;
    
    const checkQuery = 'SELECT * FROM Service WHERE ServiceId = ?';
    const [checkResults] = await db.query(checkQuery, [serviceId]);
    
    if (checkResults.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    await db.query('START TRANSACTION');
    
    const updateQuery = `
      UPDATE Service
      SET Respond = ?, Status = ?, SubmitDate = NOW()
      WHERE ServiceId = ?
    `;
    
    await db.query(updateQuery, [respond, status, serviceId]);
    
    // Check if a payment record already exists for this service
    if (amount !== undefined) {
      const checkPaymentQuery = 'SELECT * FROM PaymentService WHERE ServiceId = ?';
      const [paymentResults] = await db.query(checkPaymentQuery, [serviceId]);
      
      if (paymentResults.length > 0) {
        // Update existing payment record
        const updatePaymentQuery = `
          UPDATE PaymentService
          SET Amount = ?
          WHERE ServiceId = ?
        `;
        
        await db.query(updatePaymentQuery, [amount, serviceId]);
      } else if (amount && amount > 0) {
        // Create new payment record only if one doesn't exist
        const paymentServiceQuery = `
          INSERT INTO PaymentService (ServiceId, Amount, PaidDay)
          VALUES (?, ?, NULL)
        `;
        
        await db.query(paymentServiceQuery, [serviceId, amount]);
      }
    }

    await db.query('COMMIT');
    
    res.status(200).json({ 
      message: 'Service updated successfully',
      paymentUpdated: amount !== undefined
    });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('Error updating service:', err);
    res.status(500).json({ message: 'Failed to update service: ' + err.message });
  }
};

exports.getUserServiceRequests = async (req, res) => {
  try {
    const userId = req.userData.userId;
    
    const query = `
      SELECT s.ServiceId, s.Description, s.Respond, s.RequestDate, s.SubmitDate, s.Status,
             s.ApartmentId, a.ApartmentName, a.UnitNumber, a.BlockNumber,
             ps.Amount, ps.PaidDay, ps.PayDay
      FROM Service s
      LEFT JOIN Apartment a ON s.ApartmentId = a.ApartmentId
      LEFT JOIN PaymentService ps ON s.ServiceId = ps.ServiceId
      WHERE s.UserAdminId = ?
      ORDER BY s.ServiceId DESC
    `;
    
    const [results] = await db.query(query, [userId]);
    
    res.status(200).json(results);
  } catch (err) {
    console.error('Error fetching user services:', err);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
};

exports.getServicesByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    
    const query = `
      SELECT s.ServiceId, s.Description, s.Respond, s.RequestDate, s.SubmitDate, s.Status, 
             u.Username, s.ApartmentId, a.ApartmentName, a.UnitNumber, a.BlockNumber,
             ps.Amount, ps.PaidDay, ps.PayDay 
      FROM Service s
      JOIN UserAdmin u ON s.UserAdminId = u.UserId
      LEFT JOIN Apartment a ON s.ApartmentId = a.ApartmentId
      LEFT JOIN PaymentService ps ON s.ServiceId = ps.ServiceId
      WHERE s.Status = ?
      ORDER BY s.ServiceId DESC
    `;
    
    const [results] = await db.query(query, [status]);
    
    res.status(200).json(results);
  } catch (err) {
    console.error('Error fetching services by status:', err);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
};

exports.getUserApartments = async (req, res) => {
  try {
    const userId = req.userData.userId;
    
    const query = `
      SELECT a.ApartmentId as id, 
             CONCAT(a.ApartmentName, ' - Block ', a.BlockNumber, ', Unit ', a.UnitNumber) as displayName
      FROM ApartmentUserAdmin aua
      JOIN Apartment a ON aua.ApartmentId = a.ApartmentId
      WHERE aua.UserId = ? AND (aua.EndDate IS NULL OR aua.EndDate > NOW())
      ORDER BY a.ApartmentName, a.BlockNumber, a.UnitNumber
    `;
    
    const [results] = await db.query(query, [userId]);
    
    res.status(200).json(results);
  } catch (err) {
    console.error('Error fetching user apartments:', err);
    res.status(500).json({ error: 'Failed to fetch apartments' });
  }
};

exports.deleteServiceRequest = async (req, res) => {
  try {
    const serviceId = req.params.id;
    
    // Check if there are any related payment records with payment already made
    const checkPaymentQuery = `
      SELECT * FROM PaymentService WHERE ServiceId = ? AND PaidDay IS NOT NULL
    `;
    
    const [paymentResults] = await db.query(checkPaymentQuery, [serviceId]);
    
    if (paymentResults.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete service request with associated paid payment records'
      });
    }
    
    // First delete any unpaid payment records
    const deletePaymentQuery = `
      DELETE FROM PaymentService WHERE ServiceId = ? AND PaidDay IS NULL
    `;
    
    await db.query(deletePaymentQuery, [serviceId]);
    
    // Then delete the service
    const query = 'DELETE FROM Service WHERE ServiceId = ?';
    
    const [results] = await db.query(query, [serviceId]);
    
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    res.status(200).json({ message: 'Service deleted successfully' });
  } catch (err) {
    console.error('Error deleting service:', err);
    res.status(500).json({ message: 'Failed to delete service: ' + err.message });
  }
};

// New function to handle payment for a service
exports.processServicePayment = async (req, res) => {
  try {
    const serviceId = req.params.id;
    const { payDay } = req.body;
    
    // Check if service exists
    const checkServiceQuery = 'SELECT * FROM Service WHERE ServiceId = ?';
    const [serviceResults] = await db.query(checkServiceQuery, [serviceId]);
    
    if (serviceResults.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    // Check if payment record exists
    const checkPaymentQuery = 'SELECT * FROM PaymentService WHERE ServiceId = ?';
    const [paymentResults] = await db.query(checkPaymentQuery, [serviceId]);
    
    if (paymentResults.length === 0) {
      return res.status(404).json({ message: 'No payment record found for this service' });
    }

    const updateQuery = `
      UPDATE PaymentService
      SET PaidDay = NOW(), PayDay = ?
      WHERE ServiceId = ?
    `;
    
    await db.query(updateQuery, [payDay || null, serviceId]);
    
    res.status(200).json({ message: 'Payment processed successfully' });
  } catch (err) {
    console.error('Error processing payment:', err);
    res.status(500).json({ message: 'Failed to process payment: ' + err.message });
  }
};