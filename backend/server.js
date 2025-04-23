const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { csrfProtection, handleCsrfError } = require('./middleware/csrfMiddleware');

const authRoutes = require('./routes/authRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const passwordRoutes = require('./routes/passwordRoutes');
const userRoutes = require('./routes/userRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const newsRoutes = require('./routes/newsRoutes'); 
const tariffRoutes = require('./routes/tariffRoutes'); 
const waterMeterRoutes = require('./routes/waterMeterRoutes');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10, 
  message: {
    message: 'Хэт олон удаа нэвтрэх оролдлого хийсэн байна. 15 минутын дараа дахин оролдоно уу.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 10, 
  message: {
    message: 'Хэт олон удаа бүртгүүлэх оролдлого хийсэн байна. 1 цагийн дараа дахин оролдоно уу.'
  }
});

const verificationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, 
  max: 10, 
  message: {
    message: 'Хэт олон удаа баталгаажуулах оролдлого хийсэн байна. 5 минутын дараа дахин оролдоно уу.'
  }
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 10, 
  message: {
    message: 'Хэт олон удаа нууц үг шинэчлэх оролдлого хийсэн байна. 1 цагийн дараа дахин оролдоно уу.'
  }
});

// Rate limiter for news creation/editing
const contentCreationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: {
    message: 'Хэт олон удаа контент үүсгэх оролдлого хийсэн байна. 15 минутын дараа дахин оролдоно уу.'
  }
});

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true 
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cookieParser());


app.use('/api/auth/signin', authLimiter);
app.use('/api/auth/signup', signupLimiter);
app.use('/api/verification', verificationLimiter);
app.use('/api/password/forgot', passwordResetLimiter);
app.use('/api/password/reset', passwordResetLimiter);
app.use('/api/news', contentCreationLimiter); 

app.use('/api/auth', authRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/password', passwordRoutes);
app.use('/api/user', userRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/tariff', tariffRoutes);
app.use('/api/water-meters', waterMeterRoutes);

// CSRF token endpoint
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

app.get('/', (req, res) => {
  res.send('API is running...');
});

// CSRF error handler
app.use(handleCsrfError);

// General error handler
app.use((err, req, res, next) => {
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'Файлын хэмжээ хэтэрсэн байна. Хамгийн ихдээ 5MB байх ёстой.'
      });
    }
    return res.status(400).json({
      message: `Файл байршуулахад алдаа гарлаа: ${err.message}`
    });
  }

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/build')));
    
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
    });
  }
  
  console.error(err.stack);
  res.status(500).json({
    message: 'Алдаа гарлаа, дараа дахин оролдоно уу'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;