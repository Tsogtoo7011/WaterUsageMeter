const db = require('../config/db');

exports.getAllServices = async (req, res) => {
  try {
    const query = `
      SELECT s.ServiceId, s.Description, s.Respond, s.RequestDate, s.SubmitDate, s.Status, u.Username 
      FROM Service s
      JOIN UserAdmin u ON s.UserAdminId = u.UserId
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
      SELECT s.*, u.Username 
      FROM Service s
      JOIN UserAdmin u ON s.UserAdminId = u.UserId
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
    const { description } = req.body;
    const userId = req.userData.userId;
    
    if (!description) {
      return res.status(400).json({ message: 'Service description is required' });
    }
    
    const query = `
      INSERT INTO Service (UserAdminId, Description, Respond)
      VALUES (?, ?, '')
    `;
    
    const [results] = await db.query(query, [userId, description]);
    
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
      SET Respond = ?, Status = ?
      WHERE ServiceId = ?
    `;
    
    const [updateResults] = await db.query(
      updateQuery, 
      [respond, status, serviceId]
    );
    
    if (amount && amount > 0) {
      const paymentQuery = `
        INSERT INTO Payment (UserAdminId, Amount, PaymentDate, Status)
        VALUES (?, ?, NOW(), 'pending')
      `;
      
      const [paymentResults] = await db.query(
        paymentQuery,
        [checkResults[0].UserAdminId, amount]
      );

      const paymentServiceQuery = `
        INSERT INTO PaymentService (PaymentId, ServiceId, Amount)
        VALUES (?, ?, ?)
      `;
      
      await db.query(
        paymentServiceQuery,
        [paymentResults.insertId, serviceId, amount]
      );
    }

    await db.query('COMMIT');
    
    res.status(200).json({ 
      message: 'Service updated successfully',
      paymentCreated: amount && amount > 0
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
      SELECT ServiceId, Description, Respond, RequestDate, SubmitDate, Status
      FROM Service
      WHERE UserAdminId = ?
      ORDER BY ServiceId DESC
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
      SELECT s.ServiceId, s.Description, s.Respond, s.RequestDate, s.SubmitDate, s.Status, u.Username 
      FROM Service s
      JOIN UserAdmin u ON s.UserAdminId = u.UserId
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

exports.deleteServiceRequest = async (req, res) => {
  try {
    const serviceId = req.params.id;
    
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