// middleware/csrfMiddleware.js

const csrf = require('csurf');

// Create reusable CSRF protection middleware
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
});

// Middleware to handle CSRF errors
const handleCsrfError = (err, req, res, next) => {
  if (err.code !== 'EBADCSRFTOKEN') {
    return next(err);
  }
  
  // CSRF token validation failed
  return res.status(403).json({
    message: 'CSRF токен хүчингүй байна. Хуудсыг дахин ачааллана уу.'
  });
};

module.exports = {
  csrfProtection,
  handleCsrfError
};