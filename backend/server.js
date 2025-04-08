const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const csrf = require('csurf');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per window
  message: {
    message: 'Хэт олон удаа нэвтрэх оролдлого хийсэн байна. 15 минутын дараа дахин оролдоно уу.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 signup requests per hour
  message: {
    message: 'Хэт олон удаа бүртгүүлэх оролдлого хийсэн байна. 1 цагийн дараа дахин оролдоно уу.'
  }
});

// CSRF protection
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    sameSite: 'strict'
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true // Allow cookies to be sent with request
}));
app.use(express.json());
app.use(morgan('dev'));
app.use(cookieParser());

// Apply rate limits to specific endpoints
// Note: These must come before mounting the routers
app.use('/api/auth/signin', authLimiter);
app.use('/api/auth/signup', signupLimiter);

// Auth routes (no CSRF needed for login/signup, but needed for other sensitive operations)
app.use('/api/auth', authRoutes);

// User routes with CSRF protection
app.use('/api/user', csrfProtection, userRoutes);

// CSRF token endpoint
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Home route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
  // Handle CSRF errors specifically
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