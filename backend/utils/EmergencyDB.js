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
        UserId INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        AdminRight TINYINT(1) NOT NULL,
        Username VARCHAR(100) NOT NULL UNIQUE,
        Password VARCHAR(255) NOT NULL,
        Firstname VARCHAR(100) NOT NULL,
        Lastname VARCHAR(100) NOT NULL,
        Phonenumber CHAR(8) NOT NULL, 
        Email VARCHAR(150) NOT NULL UNIQUE,
        IsVerified TINYINT(1) DEFAULT 0 NOT NULL,
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
        ApartmentId INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
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
        ApartmentId INT UNSIGNED NOT NULL,
        UserId INT UNSIGNED NOT NULL,
        UserRole TINYINT(1) NOT NULL,
        StartDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        EndDate TIMESTAMP NULL,
        PRIMARY KEY (ApartmentId, UserId),
        FOREIGN KEY (ApartmentId) REFERENCES Apartment(ApartmentId) ON DELETE CASCADE,
        FOREIGN KEY (UserId) REFERENCES UserAdmin(UserId) ON DELETE CASCADE,
        CONSTRAINT chk_user_role CHECK (UserRole IN (0, 1))
      );
    `);
    if (apartmentUserAdminResult.warningStatus === 0) console.log('ApartmentUserAdmin table created.');

    // WaterMeter
    const [waterMeterResult] = await connection.query(`
      CREATE TABLE IF NOT EXISTS WaterMeter (
        WaterMeterId INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        ApartmentId INT UNSIGNED NOT NULL,
        Type TINYINT UNSIGNED NOT NULL,
        Location ENUM('Гал тогоо', 'Нойл', 'Ванн') NOT NULL,
        Indication INT UNSIGNED NOT NULL,
        WaterMeterDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CreatedBy INT UNSIGNED NULL,
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
        TariffId INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        ColdWaterTariff INT UNSIGNED NOT NULL,
        HeatWaterTariff INT UNSIGNED NOT NULL,
        DirtyWaterTariff INT UNSIGNED NOT NULL,
        EffectiveFrom DATE NOT NULL,
        EffectiveTo DATE NULL,
        IsActive TINYINT(1) NOT NULL DEFAULT 1,
        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT chk_is_active CHECK (IsActive IN (0, 1))
      );
    `);
    if (tarifResult.warningStatus === 0) console.log('Tarif table created.');

    // Payment
    const [paymentResult] = await connection.query(`
      CREATE TABLE IF NOT EXISTS Payment (
        PaymentId INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        ApartmentId INT UNSIGNED NOT NULL,
        UserAdminId INT UNSIGNED NOT NULL,
        ServiceId INT UNSIGNED NULL,
        TariffId INT UNSIGNED NULL,
        PaymentType ENUM('water', 'service') NOT NULL,
        Amount DECIMAL(10,2) NOT NULL,
        PayDate DATE NOT NULL,  
        PaidDate TIMESTAMP NULL,
        Status ENUM('Төлөгдөөгүй', 'Төлөгдсөн', 'Хоцорсон', 'Цуцлагдсан') NOT NULL DEFAULT 'Төлөгдөөгүй',
        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (ApartmentId) REFERENCES Apartment(ApartmentId) ON DELETE CASCADE,
        FOREIGN KEY (UserAdminId) REFERENCES UserAdmin(UserId) ON DELETE CASCADE,
        FOREIGN KEY (ServiceId) REFERENCES Service(ServiceId) ON DELETE SET NULL,
        FOREIGN KEY (TariffId) REFERENCES Tarif(TariffId) ON DELETE SET NULL
      );
    `);
    if (paymentResult.warningStatus === 0) console.log('Payment table created.');

    // Service
    const [serviceResult] = await connection.query(`
      CREATE TABLE IF NOT EXISTS Service (
        ServiceId INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        UserAdminId INT UNSIGNED NOT NULL,
        ApartmentId INT UNSIGNED NULL,
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

    // Feedback
    const [feedbackResult] = await connection.query(`
      CREATE TABLE IF NOT EXISTS Feedback (
        ApplicationId INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        UserAdminId INT UNSIGNED NOT NULL,
        Type ENUM('1', '2', '3') NOT NULL,
        Description TEXT NOT NULL,
        AdminResponse TEXT NULL,
        AdminResponderId INT UNSIGNED NULL,
        Status ENUM('Хүлээгдэж байна', 'Хүлээн авсан', 'Хүлээн авахаас татгалзсан') NOT NULL DEFAULT 'Хүлээгдэж байна',
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
        NewsId INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        UserAdminId INT UNSIGNED NOT NULL,
        Title VARCHAR(200) NOT NULL,
        NewsDescription TEXT NOT NULL,
        CoverImageType VARCHAR(10) NOT NULL,
        CoverImageData MEDIUMBLOB NOT NULL,
        IsPublished TINYINT(1) NOT NULL DEFAULT 1,
        PublishDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ExpiryDate TIMESTAMP NULL,
        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (UserAdminId) REFERENCES UserAdmin(UserId) ON DELETE CASCADE,
        CONSTRAINT chk_is_published CHECK (IsPublished IN (0, 1))
      );
    `);
    if (newsResult.warningStatus === 0) console.log('News table created.');

    // Insert sample tariff data if not exists
    await connection.query(`
      INSERT INTO Tarif (ColdWaterTariff, HeatWaterTariff, DirtyWaterTariff, EffectiveFrom, EffectiveTo, IsActive)
      SELECT 50, 75, 100, '2025-01-01', NULL, 1
      WHERE NOT EXISTS (SELECT 1 FROM Tarif WHERE IsActive = 1)
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
