const mysql = require('mysql2/promise');
require('dotenv').config();

async function createWaterUsageDB() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  });

  try {
    const [dbResult] = await connection.query('CREATE DATABASE IF NOT EXISTS waterusage');
    if (dbResult.warningStatus === 0) {
      console.log('waterusage database created.');
    }

    await connection.changeUser({ database: 'waterusage' });

    // UserAdmin
    const [userAdminResult] = await connection.query(`
      CREATE TABLE IF NOT EXISTS UserAdmin (
        UserId VARCHAR(20) PRIMARY KEY,
        AdminRight TINYINT(1) NOT NULL COMMENT '0 = Regular user, 1 = Admin',
        Username VARCHAR(100) NOT NULL UNIQUE,
        Password VARCHAR(255) NOT NULL,
        Firstname VARCHAR(100) NOT NULL,
        Lastname VARCHAR(100) NOT NULL,
        Phonenumber CHAR(8) NOT NULL, 
        Email VARCHAR(150) NOT NULL UNIQUE,
        IsVerified TINYINT(1) DEFAULT 0 NOT NULL COMMENT '0 = Not verified, 1 = Verified',
        VerificationToken VARCHAR(255),
        TokenExpiry DATETIME,
        RefreshToken VARCHAR(255),
        RefreshTokenExpiry DATETIME,
        ResetPasswordToken VARCHAR(255),
        ResetPasswordExpiry DATETIME,
        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_reset_token (ResetPasswordToken),
        CONSTRAINT chk_admin_right CHECK (AdminRight IN (0, 1)),
        CONSTRAINT chk_is_verified CHECK (IsVerified IN (0, 1))
      );
    `);
    if (userAdminResult.warningStatus === 0) console.log('UserAdmin table created.');

    // Apartment
    const [apartmentResult] = await connection.query(`
      CREATE TABLE IF NOT EXISTS Apartment (
        ApartmentId VARCHAR(20) PRIMARY KEY,
        ApartmentCode INT UNSIGNED NOT NULL UNIQUE,
        CityName VARCHAR(100) NOT NULL,
        DistrictName VARCHAR(100) NOT NULL,
        SubDistrictName SMALLINT UNSIGNED NOT NULL,
        ApartmentName VARCHAR(255) NOT NULL,
        BlockNumber SMALLINT UNSIGNED NOT NULL,
        UnitNumber SMALLINT UNSIGNED NOT NULL,
        MeterCount TINYINT UNSIGNED NOT NULL DEFAULT 2 CHECK (MeterCount BETWEEN 2 AND 5),
        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_apartment_location (CityName, DistrictName, SubDistrictName)
      );
    `);
    if (apartmentResult.warningStatus === 0) console.log('Apartment table created.');

    // ApartmentUserAdmin
    const [apartmentUserAdminResult] = await connection.query(`
      CREATE TABLE IF NOT EXISTS ApartmentUserAdmin (
        RelationId VARCHAR(20) PRIMARY KEY,
        ApartmentId VARCHAR(20) NOT NULL,
        UserId VARCHAR(20) NOT NULL,
        UserRole TINYINT(1) NOT NULL COMMENT '0 = landlord, 1 = renter',
        StartDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        EndDate TIMESTAMP NULL,
        UNIQUE KEY unique_apt_user (ApartmentId, UserId),
        FOREIGN KEY (ApartmentId) REFERENCES Apartment(ApartmentId) ON DELETE CASCADE,
        FOREIGN KEY (UserId) REFERENCES UserAdmin(UserId) ON DELETE CASCADE,
        CONSTRAINT chk_user_role CHECK (UserRole IN (0, 1))
      );
    `);
    if (apartmentUserAdminResult.warningStatus === 0) console.log('ApartmentUserAdmin table created.');

    // WaterMeter
    const [waterMeterResult] = await connection.query(`
      CREATE TABLE IF NOT EXISTS WaterMeter (
        WaterMeterId VARCHAR(20) PRIMARY KEY,
        ApartmentId VARCHAR(20) NOT NULL,
        Type TINYINT UNSIGNED NOT NULL COMMENT '0 = Хүйтэн ус (Cold water), 1 = Халуун ус (Hot water)',
        Location ENUM('Гал тогоо', 'Нойл', 'Ванн') NOT NULL COMMENT 'Гал тогоо = Kitchen, Нойл = Toilet, Ванн = Bathroom',
        Indication INT UNSIGNED NOT NULL,
        WaterMeterDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CreatedBy VARCHAR(20) NULL,
        UpdatedAt TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (ApartmentId) REFERENCES Apartment(ApartmentId) ON DELETE CASCADE,
        FOREIGN KEY (CreatedBy) REFERENCES UserAdmin(UserId) ON DELETE SET NULL,
        CONSTRAINT chk_water_type CHECK (Type IN (0, 1))
      );
    `);
    if (waterMeterResult.warningStatus === 0) console.log('WaterMeter table created.');

    // Tarif
    const [tarifResult] = await connection.query(`
      CREATE TABLE IF NOT EXISTS Tarif (
        TariffId VARCHAR(20) PRIMARY KEY,
        ColdWaterTariff INT UNSIGNED NOT NULL,
        HeatWaterTariff INT UNSIGNED NOT NULL,
        DirtyWaterTariff INT UNSIGNED NOT NULL,
        EffectiveFrom DATE NOT NULL,
        EffectiveTo DATE NULL,
        IsActive TINYINT(1) NOT NULL DEFAULT 1 COMMENT '0 = Inactive, 1 = Active',
        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT chk_is_active CHECK (IsActive IN (0, 1))
      );
    `);
    if (tarifResult.warningStatus === 0) console.log('Tarif table created.');

    // Service
    const [serviceResult] = await connection.query(`
      CREATE TABLE IF NOT EXISTS Service (
        ServiceId VARCHAR(20) PRIMARY KEY,
        UserAdminId VARCHAR(20) NOT NULL,
        ApartmentId VARCHAR(20) NULL,
        ServiceName VARCHAR(255) NOT NULL,
        Description TEXT NOT NULL,
        Respond TEXT NOT NULL,
        RequestDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        SubmitDate TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        Status ENUM('Хүлээгдэж буй', 'Төлөвлөгдсөн', 'Дууссан', 'Цуцлагдсан') NOT NULL DEFAULT 'Хүлээгдэж буй',
        FOREIGN KEY (UserAdminId) REFERENCES UserAdmin(UserId) ON DELETE CASCADE,
        FOREIGN KEY (ApartmentId) REFERENCES Apartment(ApartmentId) ON DELETE SET NULL
      );
    `);
    if (serviceResult.warningStatus === 0) console.log('Service table created.');

    // WaterPayment
    const [waterPaymentResult] = await connection.query(`
      CREATE TABLE IF NOT EXISTS WaterPayment (
        WaterPaymentId VARCHAR(20) PRIMARY KEY,
        ApartmentId VARCHAR(20) NOT NULL,
        UserAdminId VARCHAR(20) NOT NULL,
        TariffId VARCHAR(20) NOT NULL,
        ColdWaterUsage DECIMAL(8,2) NOT NULL DEFAULT 0.00,
        HotWaterUsage DECIMAL(8,2) NOT NULL DEFAULT 0.00,
        ColdWaterCost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        HotWaterCost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        DirtyWaterCost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        TotalAmount DECIMAL(10,2) NOT NULL,
        PayDate DATE NOT NULL,
        PaidDate TIMESTAMP NULL,
        Status ENUM('Төлөгдөөгүй', 'Төлөгдсөн', 'Хоцорсон', 'Цуцлагдсан') NOT NULL DEFAULT 'Төлөгдөөгүй',
        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (ApartmentId) REFERENCES Apartment(ApartmentId) ON DELETE CASCADE,
        FOREIGN KEY (UserAdminId) REFERENCES UserAdmin(UserId) ON DELETE CASCADE,
        FOREIGN KEY (TariffId) REFERENCES Tarif(TariffId) ON DELETE RESTRICT
      );
    `);
    if (waterPaymentResult.warningStatus === 0) console.log('WaterPayment table created.');

    // ServicePayment
    const [servicePaymentResult] = await connection.query(`
      CREATE TABLE IF NOT EXISTS ServicePayment (
        ServicePaymentId VARCHAR(20) PRIMARY KEY,
        ApartmentId VARCHAR(20) NOT NULL,
        UserAdminId VARCHAR(20) NOT NULL,
        ServiceId VARCHAR(20) NOT NULL,
        Amount DECIMAL(10,2) NOT NULL,
        PayDate DATE NOT NULL,
        PaidDate TIMESTAMP NULL,
        Status ENUM('Төлөгдөөгүй', 'Төлөгдсөн', 'Хоцорсон', 'Цуцлагдсан') NOT NULL DEFAULT 'Төлөгдөөгүй',
        Description TEXT NULL,
        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (ApartmentId) REFERENCES Apartment(ApartmentId) ON DELETE CASCADE,
        FOREIGN KEY (UserAdminId) REFERENCES UserAdmin(UserId) ON DELETE CASCADE,
        FOREIGN KEY (ServiceId) REFERENCES Service(ServiceId) ON DELETE RESTRICT
      );
    `);
    if (servicePaymentResult.warningStatus === 0) console.log('ServicePayment table created.');

    // Feedback
    const [feedbackResult] = await connection.query(`
      CREATE TABLE IF NOT EXISTS Feedback (
        ApplicationId VARCHAR(20) PRIMARY KEY,
        UserAdminId VARCHAR(20) NOT NULL,
        Type ENUM('1', '2', '3') NOT NULL COMMENT '1: Санал (Suggestion), 2: Хүсэлт (Request), 3: Гомдол (Complaint)',
        Description TEXT NOT NULL,
        AdminResponse TEXT NULL,
        AdminResponderId VARCHAR(20) NULL,
        Status ENUM('Хүлээгдэж байна', 'Хүлээн авсан', 'Хүлээн авахаас татгалзсан') NOT NULL DEFAULT 'Хүлээгдэж байна' COMMENT 'Хүлээгдэж байна (Pending), Хүлээн авсан (Accepted), Хүлээн авахаас татгалзсан (Rejected)',
        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (UserAdminId) REFERENCES UserAdmin(UserId) ON DELETE CASCADE,
        FOREIGN KEY (AdminResponderId) REFERENCES UserAdmin(UserId) ON DELETE SET NULL
      );
    `);
    if (feedbackResult.warningStatus === 0) console.log('Feedback table created.');

    // News
    const [newsResult] = await connection.query(`
      CREATE TABLE IF NOT EXISTS News (
        NewsId VARCHAR(20) PRIMARY KEY,
        UserAdminId VARCHAR(20) NOT NULL,
        Title VARCHAR(200) NOT NULL,
        NewsDescription TEXT NOT NULL,
        CoverImageType VARCHAR(10) NOT NULL,
        CoverImageData MEDIUMBLOB NOT NULL,
        IsPublished TINYINT(1) NOT NULL DEFAULT 1 COMMENT '0 = Draft, 1 = Published',
        PublishDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ExpiryDate TIMESTAMP NULL,
        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (UserAdminId) REFERENCES UserAdmin(UserId) ON DELETE CASCADE,
        CONSTRAINT chk_is_published CHECK (IsPublished IN (0, 1))
      );
    `);
    if (newsResult.warningStatus === 0) console.log('News table created.');

    await connection.query(`
      INSERT INTO Tarif (TariffId, ColdWaterTariff, HeatWaterTariff, DirtyWaterTariff, EffectiveFrom, EffectiveTo, IsActive)
      SELECT 'T000001', 50, 75, 100, '2025-01-01', NULL, 1
      WHERE NOT EXISTS (SELECT 1 FROM Tarif WHERE IsActive = 1)
    `);

    // UserAdmin trigger
    await connection.query(`
      DROP TRIGGER IF EXISTS tr_useradmin_id;
    `);
    await connection.query(`
      CREATE TRIGGER tr_useradmin_id BEFORE INSERT ON UserAdmin
      FOR EACH ROW BEGIN
        DECLARE next_id INT;
        SELECT COALESCE(MAX(CAST(SUBSTRING(UserId, 2) AS UNSIGNED)), 0) + 1 INTO next_id FROM UserAdmin;
        SET NEW.UserId = CONCAT('U', LPAD(next_id, 6, '0'));
      END
    `);

    // Apartment trigger
    await connection.query(`
      DROP TRIGGER IF EXISTS tr_apartment_id;
    `);
    await connection.query(`
      CREATE TRIGGER tr_apartment_id BEFORE INSERT ON Apartment
      FOR EACH ROW BEGIN
        DECLARE next_id INT;
        SELECT COALESCE(MAX(CAST(SUBSTRING(ApartmentId, 2) AS UNSIGNED)), 0) + 1 INTO next_id FROM Apartment;
        SET NEW.ApartmentId = CONCAT('A', LPAD(next_id, 6, '0'));
      END
    `);

    // ApartmentUserAdmin trigger
    await connection.query(`
      DROP TRIGGER IF EXISTS tr_apartmentuser_id;
    `);
    await connection.query(`
      CREATE TRIGGER tr_apartmentuser_id BEFORE INSERT ON ApartmentUserAdmin
      FOR EACH ROW BEGIN
        DECLARE next_id INT;
        SELECT COALESCE(MAX(CAST(SUBSTRING(RelationId, 2) AS UNSIGNED)), 0) + 1 INTO next_id FROM ApartmentUserAdmin;
        SET NEW.RelationId = CONCAT('R', LPAD(next_id, 6, '0'));
      END
    `);

    // WaterMeter trigger
    await connection.query(`
      DROP TRIGGER IF EXISTS tr_watermeter_id;
    `);
    await connection.query(`
      CREATE TRIGGER tr_watermeter_id BEFORE INSERT ON WaterMeter
      FOR EACH ROW BEGIN
        DECLARE next_id INT;
        SELECT COALESCE(MAX(CAST(SUBSTRING(WaterMeterId, 3) AS UNSIGNED)), 0) + 1 INTO next_id FROM WaterMeter;
        SET NEW.WaterMeterId = CONCAT('WM', LPAD(next_id, 5, '0'));
      END
    `);

    // Tarif trigger
    await connection.query(`
      DROP TRIGGER IF EXISTS tr_tarif_id;
    `);
    await connection.query(`
      CREATE TRIGGER tr_tarif_id BEFORE INSERT ON Tarif
      FOR EACH ROW BEGIN
        DECLARE next_id INT;
        SELECT COALESCE(MAX(CAST(SUBSTRING(TariffId, 2) AS UNSIGNED)), 0) + 1 INTO next_id FROM Tarif;
        SET NEW.TariffId = CONCAT('T', LPAD(next_id, 6, '0'));
      END
    `);

    // Service trigger
    await connection.query(`
      DROP TRIGGER IF EXISTS tr_service_id;
    `);
    await connection.query(`
      CREATE TRIGGER tr_service_id BEFORE INSERT ON Service
      FOR EACH ROW BEGIN
        DECLARE next_id INT;
        SELECT COALESCE(MAX(CAST(SUBSTRING(ServiceId, 2) AS UNSIGNED)), 0) + 1 INTO next_id FROM Service;
        SET NEW.ServiceId = CONCAT('S', LPAD(next_id, 6, '0'));
      END
    `);

    // WaterPayment trigger
    await connection.query(`
      DROP TRIGGER IF EXISTS tr_waterpayment_id;
    `);
    await connection.query(`
      CREATE TRIGGER tr_waterpayment_id BEFORE INSERT ON WaterPayment
      FOR EACH ROW BEGIN
        DECLARE next_id INT;
        SELECT COALESCE(MAX(CAST(SUBSTRING(WaterPaymentId, 3) AS UNSIGNED)), 0) + 1 INTO next_id FROM WaterPayment;
        SET NEW.WaterPaymentId = CONCAT('WP', LPAD(next_id, 5, '0'));
      END
    `);

    // ServicePayment trigger
    await connection.query(`
      DROP TRIGGER IF EXISTS tr_servicepayment_id;
    `);
    await connection.query(`
      CREATE TRIGGER tr_servicepayment_id BEFORE INSERT ON ServicePayment
      FOR EACH ROW BEGIN
        DECLARE next_id INT;
        SELECT COALESCE(MAX(CAST(SUBSTRING(ServicePaymentId, 3) AS UNSIGNED)), 0) + 1 INTO next_id FROM ServicePayment;
        SET NEW.ServicePaymentId = CONCAT('SP', LPAD(next_id, 5, '0'));
      END
    `);

    // Feedback trigger
    await connection.query(`
      DROP TRIGGER IF EXISTS tr_feedback_id;
    `);
    await connection.query(`
      CREATE TRIGGER tr_feedback_id BEFORE INSERT ON Feedback
      FOR EACH ROW BEGIN
        DECLARE next_id INT;
        SELECT COALESCE(MAX(CAST(SUBSTRING(ApplicationId, 2) AS UNSIGNED)), 0) + 1 INTO next_id FROM Feedback;
        SET NEW.ApplicationId = CONCAT('F', LPAD(next_id, 6, '0'));
      END
    `);

    // News trigger
    await connection.query(`
      DROP TRIGGER IF EXISTS tr_news_id;
    `);
    await connection.query(`
      CREATE TRIGGER tr_news_id BEFORE INSERT ON News
      FOR EACH ROW BEGIN
        DECLARE next_id INT;
        SELECT COALESCE(MAX(CAST(SUBSTRING(NewsId, 2) AS UNSIGNED)), 0) + 1 INTO next_id FROM News;
        SET NEW.NewsId = CONCAT('N', LPAD(next_id, 6, '0'));
      END
    `);

    console.log('All waterusage tables checked.');
  } catch (err) {
    console.error('Error creating waterusage:', err);
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  createWaterUsageDB();
}

module.exports = createWaterUsageDB;
