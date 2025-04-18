const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const csrf = require('csurf');

const authRoutes = require('./routes/authRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const passwordRoutes = require('./routes/passwordRoutes');
const userRoutes = require('./routes/userRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');

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

const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    sameSite: 'strict'
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
app.use('/api/password/forgot', passwordResetLimiter);
app.use('/api/password/reset', passwordResetLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/password', passwordRoutes);

app.use('/api/user', csrfProtection, userRoutes);
app.use('/api/feedback', feedbackRoutes);

app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

app.get('/', (req, res) => {
  res.send('API is running...');
});

app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({
      message: 'CSRF токен хүчингүй байна. Хуудсыг дахин ачааллана уу.'
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