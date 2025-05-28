const db = require('../config/db');

exports.getAllServices = async (req, res) => {
  try {
    const query = `
      SELECT s.ServiceId, s.Description, s.Respond, s.RequestDate, s.SubmitDate, s.Status, 
             u.Username, s.ApartmentId, a.ApartmentName, a.UnitNumber, a.BlockNumber,
             sp.Amount, sp.PaidDate, sp.PayDate 
      FROM Service s
      JOIN UserAdmin u ON s.UserAdminId = u.UserId
      LEFT JOIN Apartment a ON s.ApartmentId = a.ApartmentId
      LEFT JOIN ServicePayment sp ON s.ServiceId = sp.ServiceId
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
    if (!serviceId || isNaN(parseInt(serviceId))) {
      return res.status(400).json({ error: 'Invalid service ID' });
    }
    const query = `
      SELECT s.*, u.Username, a.ApartmentName, a.UnitNumber, a.BlockNumber,
             sp.Amount, sp.PaidDate, sp.PayDate 
      FROM Service s
      JOIN UserAdmin u ON s.UserAdminId = u.UserId
      LEFT JOIN Apartment a ON s.ApartmentId = a.ApartmentId
      LEFT JOIN ServicePayment sp ON s.ServiceId = sp.ServiceId
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
    if (apartmentId) {
      if (isNaN(parseInt(apartmentId))) {
        return res.status(400).json({ message: 'Invalid apartment ID' });
      }
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
      INSERT INTO Service (UserAdminId, Description, Respond, ApartmentId, Status)
      VALUES (?, ?, '', ?, 'Хүлээгдэж буй')
    `;
    const [results] = await db.query(query, [userId, description, apartmentId || null]);
    await db.query(
      `INSERT INTO ServicePayment (ApartmentId, UserAdminId, ServiceId, Amount, PayDate, Status, PaidDate)
       VALUES (?, ?, ?, 0, CURDATE(), 'Төлөгдөөгүй', NULL)`,
      [
        apartmentId || null,
        userId,
        results.insertId
      ]
    );
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
  const connection = await db.getConnection();
  try {
    const serviceId = req.params.id;
    let { respond, status, amount, cancelReason } = req.body;
    if (cancelReason && typeof cancelReason === 'string' && cancelReason.trim().length > 0) {
      respond = cancelReason.trim();
    }
    if (!serviceId || isNaN(parseInt(serviceId))) {
      return res.status(400).json({ message: 'Invalid service ID' });
    }
    const allowedStatuses = ['Хүлээгдэж буй', 'Төлөвлөгдсөн', 'Дууссан', 'Цуцлагдсан'];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status. Must be one of: ' + allowedStatuses.join(', ')
      });
    }
    await connection.beginTransaction();
    const checkQuery = 'SELECT * FROM Service WHERE ServiceId = ?';
    const [checkResults] = await connection.query(checkQuery, [serviceId]);
    if (checkResults.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Service not found' });
    }
    if (status === 'Хүлээгдэж буй') {
      respond = '';
    }
    const updateQuery = `
      UPDATE Service
      SET Respond = ?, Status = ?, SubmitDate = NOW()
      WHERE ServiceId = ?
    `;
    await connection.query(
      updateQuery, 
      [
        respond !== undefined && respond !== null ? respond : checkResults[0].Respond,
        status || checkResults[0].Status,
        serviceId
      ]
    );
    let paymentUpdated = false;
    let setServiceDate = false;
    if (amount !== undefined) {
      if (amount === null || amount === undefined || isNaN(Number(amount))) {
        amount = 0;
      }
      const checkPaymentQuery = 'SELECT * FROM ServicePayment WHERE ServiceId = ?';
      const [paymentResults] = await connection.query(checkPaymentQuery, [serviceId]);
      if (paymentResults.length > 0) {
        const updatePaymentQuery = `
          UPDATE ServicePayment
          SET Amount = ?
          WHERE ServiceId = ?
        `;
        await connection.query(updatePaymentQuery, [amount, serviceId]);
        paymentUpdated = true;
      } else if (amount && amount > 0) {
        await connection.query(
          `INSERT INTO ServicePayment (ApartmentId, UserAdminId, ServiceId, Amount, PayDate, Status)
           VALUES (?, ?, ?, ?, CURDATE(), 'Төлөгдөөгүй')`,
          [
            checkResults[0].ApartmentId || null,
            checkResults[0].UserAdminId,
            serviceId,
            amount
          ]
        );
        paymentUpdated = true;
      }
    }
    if (status === 'Дууссан') {
      await connection.query(
        `UPDATE ServicePayment SET PaidDate = NOW() WHERE ServiceId = ?`,
        [serviceId]
      );
      setServiceDate = true;
      const [paymentRows] = await connection.query(
        'SELECT * FROM ServicePayment WHERE ServiceId = ?',
        [serviceId]
      );
      if (paymentRows.length > 0) {
        const now = new Date();
        let year = now.getFullYear();
        let month = now.getMonth() + 1;
        if (month > 11) {
          month = 0;
          year += 1;
        }
        const payDay = new Date(year, month + 1, 0, 0, 0, 0, 0);
        await connection.query(
          'UPDATE ServicePayment SET PayDate = ? WHERE ServiceId = ?',
          [payDay, serviceId]
        );
      }
    }
    if (status === 'Төлөвлөгдсөн') {
      await connection.query(
        'UPDATE ServicePayment SET PaidDate = NULL, PayDate = CURDATE() WHERE ServiceId = ?',
        [serviceId]
      );
    }
    await connection.commit();
    res.status(200).json({ 
      message: 'Service updated successfully',
      paymentUpdated,
      setServiceDate
    });
  } catch (err) {
    await connection.rollback();
    console.error('Error updating service:', err);
    res.status(500).json({ message: 'Failed to update service: ' + err.message });
  } finally {
    connection.release();
  }
};

exports.getUserServiceRequests = async (req, res) => {
  try {
    const userId = req.userData.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }
    const query = `
      SELECT s.ServiceId, s.Description, s.Respond, s.RequestDate, s.SubmitDate, s.Status,
             s.ApartmentId, a.ApartmentName, a.UnitNumber, a.BlockNumber,
             sp.Amount, sp.PaidDate, sp.PayDate
      FROM Service s
      LEFT JOIN Apartment a ON s.ApartmentId = a.ApartmentId
      LEFT JOIN ServicePayment sp ON s.ServiceId = sp.ServiceId
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
    const allowedStatuses = ['Хүлээгдэж буй', 'Төлөвлөгдсөн', 'Дууссан', 'Цуцлагдсан'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status. Must be one of: ' + allowedStatuses.join(', ')
      });
    }
    const query = `
      SELECT s.ServiceId, s.Description, s.Respond, s.RequestDate, s.SubmitDate, s.Status, 
             u.Username, s.ApartmentId, a.ApartmentName, a.UnitNumber, a.BlockNumber,
             sp.Amount, sp.PaidDate, sp.PayDate 
      FROM Service s
      JOIN UserAdmin u ON s.UserAdminId = u.UserId
      LEFT JOIN Apartment a ON s.ApartmentId = a.ApartmentId
      LEFT JOIN ServicePayment sp ON s.ServiceId = sp.ServiceId
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
    
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }
    
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
  const connection = await db.getConnection();
  try {
    const serviceId = req.params.id;
    if (!serviceId || isNaN(parseInt(serviceId))) {
      return res.status(400).json({ message: 'Invalid service ID' });
    }
    await connection.beginTransaction();
    const checkServiceQuery = 'SELECT * FROM Service WHERE ServiceId = ?';
    const [serviceResults] = await connection.query(checkServiceQuery, [serviceId]);
    if (serviceResults.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Service not found' });
    }
    const checkPaymentQuery = `
      SELECT * FROM ServicePayment WHERE ServiceId = ? AND PaidDate IS NOT NULL
    `;
    const [paymentResults] = await connection.query(checkPaymentQuery, [serviceId]);
    if (paymentResults.length > 0) {
      await connection.rollback();
      return res.status(400).json({ 
        message: 'Cannot delete service request with associated paid payment records'
      });
    }
    const deletePaymentQuery = `
      DELETE FROM ServicePayment WHERE ServiceId = ? AND PaidDate IS NULL
    `;
    await connection.query(deletePaymentQuery, [serviceId]);
    const deleteServiceQuery = 'DELETE FROM Service WHERE ServiceId = ?';
    await connection.query(deleteServiceQuery, [serviceId]);
    await connection.commit();
    res.status(200).json({ message: 'Service deleted successfully' });
  } catch (err) {
    await connection.rollback();
    console.error('Error deleting service:', err);
    res.status(500).json({ message: 'Failed to delete service: ' + err.message });
  } finally {
    connection.release();
  }
};

exports.processServicePayment = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const serviceId = req.params.id;
    const { payDay } = req.body;
    if (!serviceId || isNaN(parseInt(serviceId))) {
      return res.status(400).json({ message: 'Invalid service ID' });
    }
    await connection.beginTransaction();
    const checkServiceQuery = 'SELECT * FROM Service WHERE ServiceId = ?';
    const [serviceResults] = await connection.query(checkServiceQuery, [serviceId]);
    if (serviceResults.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Service not found' });
    }
    const checkPaymentQuery = 'SELECT * FROM ServicePayment WHERE ServiceId = ?';
    const [paymentResults] = await connection.query(checkPaymentQuery, [serviceId]);
    if (paymentResults.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'No payment record found for this service' });
    }
    const updateQuery = `
      UPDATE ServicePayment
      SET PaidDate = NOW(), PayDate = ?
      WHERE ServiceId = ?
    `;
    await connection.query(updateQuery, [payDay || null, serviceId]);
    if (serviceResults[0].Status !== 'Дууссан') {
      await connection.query(
        `UPDATE Service SET Status = 'Дууссан' WHERE ServiceId = ?`,
        [serviceId]
      );
    }
    // Set PayDate to 20th of next month if not already set
    const [paymentRows] = await connection.query(
      'SELECT * FROM ServicePayment WHERE ServiceId = ?',
      [serviceId]
    );
    if (paymentRows.length > 0 && !paymentRows[0].PayDate) {
      const now = new Date();
      let year = now.getFullYear();
      let month = now.getMonth() + 1;
      if (month > 11) {
        month = 0;
        year += 1;
      }
      // Set payDay to the last day of next month
      const payDayDate = new Date(year, month + 1, 0, 0, 0, 0, 0);
      await connection.query(
        'UPDATE ServicePayment SET PayDate = ? WHERE ServiceId = ?',
        [payDayDate, serviceId]
      );
    }
    await connection.commit();
    res.status(200).json({ message: 'Payment processed successfully' });
  } catch (err) {
    await connection.rollback();
    console.error('Error processing payment:', err);
    res.status(500).json({ message: 'Failed to process payment: ' + err.message });
  } finally {
    connection.release();
  }
};

exports.userCompleteService = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const serviceId = req.params.id;
    const userId = req.userData.userId;
    if (!serviceId || isNaN(parseInt(serviceId))) {
      return res.status(400).json({ message: 'Invalid service ID' });
    }
    await connection.beginTransaction();
    const [serviceRows] = await connection.query(
      'SELECT * FROM Service WHERE ServiceId = ? AND UserAdminId = ?',
      [serviceId, userId]
    );
    if (serviceRows.length === 0) {
      await connection.rollback();
      return res.status(403).json({ message: 'Not allowed to complete this service' });
    }
    if (serviceRows[0].Status !== 'Төлөвлөгдсөн') {
      await connection.rollback();
      return res.status(400).json({ message: 'Service must be in "Төлөвлөгдсөн" status to complete' });
    }
    await connection.query(
      'UPDATE Service SET Status = ?, SubmitDate = NOW() WHERE ServiceId = ?',
      ['Дууссан', serviceId]
    );
    const [paymentRows] = await connection.query(
      'SELECT * FROM ServicePayment WHERE ServiceId = ?',
      [serviceId]
    );
    if (paymentRows.length > 0) {
      await connection.query(
        'UPDATE ServicePayment SET PaidDate = NOW() WHERE ServiceId = ?',
        [serviceId]
      );
      const now = new Date();
      let year = now.getFullYear();
      let month = now.getMonth() + 1;
      if (month > 11) {
        month = 0;
        year += 1;
      }
      const payDayDate = new Date(year, month, 20, 0, 0, 0, 0);
      await connection.query(
        'UPDATE ServicePayment SET PayDate = ? WHERE ServiceId = ?',
        [payDayDate, serviceId]
      );
    }
    await connection.commit();
    res.status(200).json({ message: 'Service marked as complete' });
  } catch (err) {
    await connection.rollback();
    console.error('Error completing service:', err);
    res.status(500).json({ message: 'Failed to complete service: ' + err.message });
  } finally {
    connection.release();
  }
};

exports.cancelServiceRequest = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const serviceId = req.params.id;
    const { reason } = req.body;
    if (!serviceId || isNaN(parseInt(serviceId))) {
      return res.status(400).json({ message: 'Invalid service ID' });
    }
    await connection.beginTransaction();
    const [serviceRows] = await connection.query(
      'SELECT * FROM Service WHERE ServiceId = ?',
      [serviceId]
    );
    if (serviceRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Service not found' });
    }
    await connection.query(
      'UPDATE Service SET Status = ?, Respond = ?, SubmitDate = NOW() WHERE ServiceId = ?',
      ['Цуцлагдсан', reason || '', serviceId]
    );
    await connection.query(
      'UPDATE ServicePayment SET Status = "Цуцлагдсан" WHERE ServiceId = ?',
      [serviceId]
    );
    await connection.commit();
    res.status(200).json({ message: 'Service cancelled successfully' });
  } catch (err) {
    await connection.rollback();
    console.error('Error cancelling service:', err);
    res.status(500).json({ message: 'Failed to cancel service: ' + err.message });
  } finally {
    connection.release();
  }
};

exports.restoreServiceRequest = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const serviceId = req.params.id;
    if (!serviceId || isNaN(parseInt(serviceId))) {
      return res.status(400).json({ message: 'Invalid service ID' });
    }
    await connection.beginTransaction();
    const [serviceRows] = await connection.query(
      'SELECT * FROM Service WHERE ServiceId = ?',
      [serviceId]
    );
    if (serviceRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Service not found' });
    }
    await connection.query(
      'UPDATE Service SET Status = ?, Respond = "", SubmitDate = NOW() WHERE ServiceId = ?',
      ['Хүлээгдэж буй', serviceId]
    );
    await connection.query(
      'UPDATE ServicePayment SET Amount = 0, Status = "Төлөгдөөгүй" WHERE ServiceId = ?',
      [serviceId]
    );
    await connection.commit();
    res.status(200).json({ message: 'Service restored successfully' });
  } catch (err) {
    await connection.rollback();
    console.error('Error restoring service:', err);
    res.status(500).json({ message: 'Failed to restore service: ' + err.message });
  } finally {
    connection.release();
  }
};