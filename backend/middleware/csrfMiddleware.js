const csrf = require('csurf');

const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
});

const handleCsrfError = (err, req, res, next) => {
  if (err.code !== 'EBADCSRFTOKEN') {
    return next(err);
  }

  return res.status(403).json({
    message: 'CSRF токен хүчингүй байна. Хуудсыг дахин ачааллана уу.'
  });
};

module.exports = {
  csrfProtection,
  handleCsrfError
};