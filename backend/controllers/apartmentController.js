const pool = require('../config/db');
const { handleError } = require('../utils/errorHandler');

exports.getApartments = async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT UserId FROM UserAdmin WHERE UserId = ?',
      [req.userData.userId]
    );
    if (!users.length) {
      return res.status(404).json({ message: 'Хэрэглэгч олдсонгүй' });
    }

    const [apartments] = await pool.execute(
      `SELECT a.ApartmentId, aua.UserRole, a.ApartmentCode as ApartmentCode, a.CityName as City, 
              a.DistrictName as District, a.SubDistrictName as SubDistrict, a.ApartmentName as AptName, 
              a.BlockNumber as BlckNmbr, a.UnitNumber as UnitNmbr
       FROM Apartment a
       JOIN ApartmentUserAdmin aua ON a.ApartmentId = aua.ApartmentId
       WHERE aua.UserId = ?`,
      [req.userData.userId]
    );

    const apartmentPromises = apartments.map(async (apt) => {
      const [validCode] = await pool.execute(
        'SELECT ApartmentCode FROM Apartment WHERE ApartmentId = ? AND ApartmentCode = ?',
        [apt.ApartmentId, apt.ApartmentCode]
      );
      if (!validCode.length) return null;
      return {
        ...apt,
        ApartmentType: apt.UserRole === 0 ? 'эзэмшигч' : 'түрээслэгч'
      };
    });

    const validApartments = (await Promise.all(apartmentPromises)).filter(apt => apt !== null);
    res.json(validApartments);
  } catch (error) {
    handleError(res, error, 'Байрны мэдээлэл авах');
  }
};

exports.searchApartments = async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT UserId FROM UserAdmin WHERE UserId = ?',
      [req.userData.userId]
    );
    if (!users.length) {
      return res.status(404).json({ message: 'Хэрэглэгч олдсонгүй' });
    }

    const { ApartmentCode, City, District, SubDistrict, AptName, BlckNmbr, UnitNmbr } = req.query;

    let whereConditions = [];
    let params = [];
    let hasSearchCriteria = false;

    if (AptName && AptName.trim() !== '') {
      whereConditions.push('a.ApartmentName LIKE ?');
      params.push(`%${AptName}%`);
      hasSearchCriteria = true;
    }

    if (City && City.trim() !== '') {
      whereConditions.push('a.CityName LIKE ?');
      params.push(`%${City}%`);
      hasSearchCriteria = true;
    }

    if (District && District.trim() !== '') {
      whereConditions.push('a.DistrictName LIKE ?');
      params.push(`%${District}%`);
      hasSearchCriteria = true;
    }

    if (SubDistrict && SubDistrict.trim() !== '') {
      whereConditions.push('a.SubDistrictName LIKE ?');
      params.push(`%${SubDistrict}%`);
      hasSearchCriteria = true;
    }

    if (ApartmentCode && ApartmentCode.trim() !== '') {
      whereConditions.push('a.ApartmentCode LIKE ?');
      params.push(`%${ApartmentCode}%`);
      hasSearchCriteria = true;
    }

    if (BlckNmbr && BlckNmbr.trim() !== '') {
      whereConditions.push('a.BlockNumber LIKE ?');
      params.push(`%${BlckNmbr}%`);
      hasSearchCriteria = true;
    }

    if (UnitNmbr && UnitNmbr.trim() !== '') {
      whereConditions.push('a.UnitNumber LIKE ?');
      params.push(`%${UnitNmbr}%`);
      hasSearchCriteria = true;
    }

    if (!hasSearchCriteria) {
      return res.status(400).json({ message: 'Хайлтын утга оруулна уу' });
    }

    const [existingApartments] = await pool.execute(
      `SELECT ApartmentId FROM ApartmentUserAdmin WHERE UserId = ?`,
      [req.userData.userId]
    );
    let excludeClause = '';

    if (existingApartments.length > 0) {
      const placeholders = existingApartments.map(() => '?').join(',');
      excludeClause = `AND a.ApartmentId NOT IN (${placeholders})`;
      existingApartments.forEach(apt => params.push(apt.ApartmentId));
    }

    const [apartments] = await pool.execute(
      `SELECT a.ApartmentId, a.ApartmentCode, a.CityName as City, 
              a.DistrictName as District, a.SubDistrictName as SubDistrict, 
              a.ApartmentName as AptName, a.BlockNumber as BlckNmbr, a.UnitNumber as UnitNmbr
       FROM Apartment a
       WHERE (${whereConditions.join(' AND ')}) ${excludeClause}`,
      params
    );

    res.json(apartments);
  } catch (error) {
    handleError(res, error, 'Байрны хайлтын мэдээлэл авах');
  }
};

exports.addApartmentByCode = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [users] = await connection.execute(
      'SELECT UserId FROM UserAdmin WHERE UserId = ?',
      [req.userData.userId]
    );
    if (!users.length) {
      await connection.rollback();
      return res.status(404).json({ message: 'Хэрэглэгч олдсонгүй' });
    }

    const { apartmentId, apartmentCode, apartmentType } = req.body;

    if (!apartmentId || !apartmentCode || !apartmentType) {
      await connection.rollback();
      return res.status(400).json({ message: 'Байрны ID, код болон төрөл заавал шаардлагатай' });
    }

    const [apartment] = await connection.execute(
      'SELECT * FROM Apartment WHERE ApartmentId = ? AND ApartmentCode = ?',
      [apartmentId, apartmentCode]
    );
    if (!apartment.length) {
      await connection.rollback();
      return res.status(404).json({ message: 'Байрны кодын утга буруу байна' });
    }

    const [existingAssociation] = await connection.execute(
      'SELECT * FROM ApartmentUserAdmin WHERE ApartmentId = ? AND UserId = ?',
      [apartmentId, req.userData.userId]
    );
    if (existingAssociation.length > 0) {
      await connection.rollback();
      return res.status(409).json({ message: 'Энэ байр аль хэдийн таны бүртгэлд нэмэгдсэн байна' });
    }

    const userRole = apartmentType === 'эзэмшигч' ? 0 : 1;

    await connection.execute(
      'INSERT INTO ApartmentUserAdmin (ApartmentId, UserId, UserRole) VALUES (?, ?, ?)',
      [apartmentId, req.userData.userId, userRole]
    );

    const [addedApartment] = await connection.execute(
      `SELECT a.ApartmentId, aua.UserRole, a.ApartmentCode as ApartmentCode, a.CityName as City, 
              a.DistrictName as District, a.SubDistrictName as SubDistrict, a.ApartmentName as AptName, 
              a.BlockNumber as BlckNmbr, a.UnitNumber, a.UnitNumber as UnitNmbr
       FROM Apartment a
       JOIN ApartmentUserAdmin aua ON a.ApartmentId = aua.ApartmentId
       WHERE a.ApartmentId = ? AND aua.UserId = ?`,
      [apartmentId, req.userData.userId]
    );

    await connection.commit();

    const formattedApartment = {
      ...addedApartment[0],
      ApartmentType: addedApartment[0].UserRole === 0 ? 'эзэмшигч' : 'түрээслэгч'
    };

    res.status(201).json(formattedApartment);
  } catch (error) {
    await connection.rollback();
    handleError(res, error, 'Байрны мэдээлэл нэмэх');
  } finally {
    connection.release();
  }
};

exports.createApartment = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [users] = await connection.execute(
      'SELECT UserId FROM UserAdmin WHERE UserId = ?',
      [req.userData.userId]
    );
    if (!users.length) {
      await connection.rollback();
      return res.status(404).json({ message: 'Хэрэглэгч олдсонгүй' });
    }

    const requiredFields = ['ApartmentType', 'ApartmentCode', 'City', 'District', 'SubDistrict', 'AptName', 'BlckNmbr'];

    for (const field of requiredFields) {
      if (!req.body[field]) {
        await connection.rollback();
        return res.status(400).json({ message: `${field} талбар заавал шаардлагатай` });
      }
    }

    const apartmentCode = parseInt(req.body.ApartmentCode);
    const blockNumber = parseInt(req.body.BlckNmbr);

    if (isNaN(apartmentCode) || isNaN(blockNumber)) {
      await connection.rollback();
      return res.status(400).json({ message: 'ApartmentCode болон BlckNmbr тоо байх ёстой' });
    }

    const userRole = req.body.ApartmentType === 'эзэмшигч' ? 0 : 1;

    const [apartmentResult] = await connection.execute(
      `INSERT INTO Apartment (ApartmentCode, CityName, DistrictName, SubDistrictName, 
           ApartmentName, BlockNumber, UnitNumber)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        apartmentCode,
        req.body.City,
        req.body.District,
        req.body.SubDistrict,
        req.body.AptName,
        blockNumber,
        req.body.UnitNmbr || ''
      ]
    );

    const apartmentId = apartmentResult.insertId;

    await connection.execute(
      `INSERT INTO ApartmentUserAdmin (ApartmentId, UserId, UserRole)
       VALUES (?, ?, ?)`,
      [apartmentId, req.userData.userId, userRole]
    );

    const [newApartment] = await connection.execute(
      `SELECT a.ApartmentId, aua.UserRole, a.ApartmentCode as ApartmentCode, a.CityName as City, 
              a.DistrictName as District, a.SubDistrictName as SubDistrict, a.ApartmentName as AptName, 
              a.BlockNumber as BlckNmbr, a.UnitNumber, a.UnitNumber as UnitNmbr
       FROM Apartment a
       JOIN ApartmentUserAdmin aua ON a.ApartmentId = aua.ApartmentId
       WHERE a.ApartmentId = ? AND aua.UserId = ?`,
      [apartmentId, req.userData.userId]
    );

    await connection.commit();

    const formattedApartment = {
      ...newApartment[0],
      ApartmentType: newApartment[0].UserRole === 0 ? 'эзэмшигч' : 'түрээслэгч'
    };

    res.status(201).json(formattedApartment);
  } catch (error) {
    await connection.rollback();
    handleError(res, error, 'Байрны мэдээлэл хадгалах');
  } finally {
    connection.release();
  }
};

exports.deleteApartment = async (req, res) => {
  const apartmentId = req.params.id;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Verify user exists
    const [users] = await connection.execute(
      'SELECT UserId FROM UserAdmin WHERE UserId = ?',
      [req.userData.userId]
    );
    if (!users.length) {
      await connection.rollback();
      return res.status(404).json({ message: 'Хэрэглэгч олдсонгүй' });
    }

    // Verify user has access to this apartment
    const [userApartment] = await connection.execute(
      `SELECT aua.ApartmentId 
       FROM ApartmentUserAdmin aua
       WHERE aua.ApartmentId = ? AND aua.UserId = ?`,
      [apartmentId, req.userData.userId]
    );
    
    if (!userApartment.length) {
      await connection.rollback();
      return res.status(404).json({ message: 'Байр олдсонгүй эсвэл таны эрх хүрэхгүй байна' });
    }

    // Remove this user's association with the apartment
    await connection.execute(
      'DELETE FROM ApartmentUserAdmin WHERE ApartmentId = ? AND UserId = ?',
      [apartmentId, req.userData.userId]
    );

    // Check if any other users are still associated with this apartment
    const [remainingUsers] = await connection.execute(
      'SELECT COUNT(*) AS count FROM ApartmentUserAdmin WHERE ApartmentId = ?',
      [apartmentId]
    );

    // If no other users are associated, delete the apartment completely
    if (remainingUsers[0].count === 0) {
      await connection.execute(
        'DELETE FROM Apartment WHERE ApartmentId = ?',
        [apartmentId]
      );
    }

    await connection.commit();
    res.json({ 
      success: true,
      message: 'Байрны мэдээлэл амжилттай устгагдлаа', 
      isFullyDeleted: remainingUsers[0].count === 0
    });
  } catch (error) {
    await connection.rollback();
    handleError(res, error, 'Байрны мэдээлэл устгах');
  } finally {
    connection.release();
  }
};
exports.updateApartment = async (req, res) => {
  const apartmentId = req.params.id;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [users] = await connection.execute(
      'SELECT UserId FROM UserAdmin WHERE UserId = ?',
      [req.userData.userId]
    );
    if (!users.length) {
      await connection.rollback();
      return res.status(404).json({ message: 'Хэрэглэгч олдсонгүй' });
    }

    const [apartments] = await connection.execute(
      `SELECT a.ApartmentId FROM Apartment a
       JOIN ApartmentUserAdmin aua ON a.ApartmentId = aua.ApartmentId
       WHERE a.ApartmentId = ? AND aua.UserId = ?`,
      [apartmentId, req.userData.userId]
    );
    if (!apartments.length) {
      await connection.rollback();
      return res.status(404).json({ message: 'Байр олдсонгүй эсвэл таны эрх хүрэхгүй байна' });
    }

    const requiredFields = ['ApartmentType', 'ApartmentCode', 'City', 'District', 'SubDistrict', 'AptName', 'BlckNmbr'];

    for (const field of requiredFields) {
      if (!req.body[field]) {
        await connection.rollback();
        return res.status(400).json({ message: `${field} талбар заавал шаардлагатай` });
      }
    }

    const apartmentCode = parseInt(req.body.ApartmentCode);
    const blockNumber = parseInt(req.body.BlckNmbr);

    if (isNaN(apartmentCode) || isNaN(blockNumber)) {
      await connection.rollback();
      return res.status(400).json({ message: 'ApartmentCode болон BlckNmbr тоо байх ёстой' });
    }

    const userRole = req.body.ApartmentType === 'эзэмшигч' ? 0 : 1;

    await connection.execute(
      `UPDATE Apartment 
       SET ApartmentCode = ?, CityName = ?, DistrictName = ?, SubDistrictName = ?, 
           ApartmentName = ?, BlockNumber = ?, UnitNumber = ?
       WHERE ApartmentId = ?`,
      [
        apartmentCode,
        req.body.City,
        req.body.District,
        req.body.SubDistrict,
        req.body.AptName,
        blockNumber,
        req.body.UnitNmbr || '',
        apartmentId
      ]
    );

    await connection.execute(
      `UPDATE ApartmentUserAdmin SET UserRole = ?
       WHERE ApartmentId = ? AND UserId = ?`,
      [userRole, apartmentId, req.userData.userId]
    );

    const [updatedApartment] = await connection.execute(
      `SELECT a.ApartmentId, aua.UserRole, a.ApartmentCode as ApartmentCode, a.CityName as City, 
              a.DistrictName as District, a.SubDistrictName as SubDistrict, a.ApartmentName as AptName, 
              a.BlockNumber as BlckNmbr, a.UnitNumber, a.UnitNumber as UnitNmbr
       FROM Apartment a
       JOIN ApartmentUserAdmin aua ON a.ApartmentId = aua.ApartmentId
       WHERE a.ApartmentId = ? AND aua.UserId = ?`,
      [apartmentId, req.userData.userId]
    );

    await connection.commit();

    const formattedApartment = {
      ...updatedApartment[0],
      ApartmentType: updatedApartment[0].UserRole === 0 ? 'эзэмшигч' : 'түрээслэгч'
    };

    res.json(formattedApartment);
  } catch (error) {
    await connection.rollback();
    handleError(res, error, 'Байрны мэдээлэл шинэчлэх');
  } finally {
    connection.release();
  }
};

exports.getApartmentById = async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT UserId FROM UserAdmin WHERE UserId = ?',
      [req.userData.userId]
    );
    if (!users.length) {
      return res.status(404).json({ message: 'Хэрэглэгч олдсонгүй' });
    }

    const apartmentId = req.params.id;

    const [apartments] = await pool.execute(
      `SELECT a.ApartmentId, aua.UserRole, a.ApartmentCode as ApartmentCode, a.CityName as City, 
              a.DistrictName as District, a.SubDistrictName as SubDistrict, a.ApartmentName as AptName, 
              a.BlockNumber as BlckNmbr, a.UnitNumber, a.UnitNumber as UnitNmbr
       FROM Apartment a
       JOIN ApartmentUserAdmin aua ON a.ApartmentId = aua.ApartmentId
       WHERE a.ApartmentId = ? AND aua.UserId = ?`,
      [apartmentId, req.userData.userId]
    );
    if (!apartments.length) {
      return res.status(404).json({ message: 'Байр олдсонгүй эсвэл таны эрх хүрэхгүй байна' });
    }

    const formattedApartment = {
      ...apartments[0],
      ApartmentType: apartments[0].UserRole === 0 ? 'эзэмшигч' : 'түрээслэгч'
    };

    res.json(formattedApartment);
  } catch (error) {
    handleError(res, error, 'Байрны мэдээлэл авах');
  }
};

exports.shareApartment = async (req, res) => {
  const { apartmentId, email, apartmentType, apartmentCode } = req.body;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [users] = await connection.execute(
      'SELECT UserId FROM UserAdmin WHERE UserId = ?',
      [req.userData.userId]
    );
    if (!users.length) {
      await connection.rollback();
      return res.status(404).json({ message: 'Хэрэглэгч олдсонгүй' });
    }

    const [apartments] = await connection.execute(
      `SELECT a.ApartmentId, a.ApartmentCode FROM Apartment a
       JOIN ApartmentUserAdmin aua ON a.ApartmentId = aua.ApartmentId
       WHERE a.ApartmentId = ? AND aua.UserId = ?`,
      [apartmentId, req.userData.userId]
    );
    if (!apartments.length) {
      await connection.rollback();
      return res.status(404).json({ message: 'Байр олдсонгүй эсвэл таны эрх хүрэхгүй байна' });
    }

    if (apartments[0].ApartmentCode !== parseInt(apartmentCode)) {
      await connection.rollback();
      return res.status(400).json({ message: 'Байрны код буруу байна' });
    }

    const [targetUsers] = await connection.execute(
      'SELECT UserId FROM UserAdmin WHERE Email = ?',
      [email]
    );
    if (!targetUsers.length) {
      await connection.rollback();
      return res.status(404).json({ message: 'Хэрэглэгч олдсонгүй' });
    }

    const targetUserId = targetUsers[0].UserId;

    if (targetUserId === req.userData.userId) {
      await connection.rollback();
      return res.status(400).json({ message: 'Өөрийн хэрэглэгчтэй хуваалцах боломжгүй' });
    }

    const [existing] = await connection.execute(
      'SELECT * FROM ApartmentUserAdmin WHERE ApartmentId = ? AND UserId = ?',
      [apartmentId, targetUserId]
    );
    if (existing.length > 0) {
      await connection.rollback();
      return res.status(409).json({ message: 'Энэ байр аль хэдийн энэ хэрэглэгчтэй хуваалцсан байна' });
    }

    const numericUserRole = apartmentType === 'эзэмшигч' ? 0 : 1;

    await connection.execute(
      'INSERT INTO ApartmentUserAdmin (ApartmentId, UserId, UserRole) VALUES (?, ?, ?)',
      [apartmentId, targetUserId, numericUserRole]
    );

    await connection.commit();

    res.json({ message: 'Байр амжилттай хуваалцлаа' });
  } catch (error) {
    await connection.rollback();
    handleError(res, error, 'Байр хуваалцах');
  } finally {
    connection.release();
  }
};
