module.exports = (req, res, next) => {
    if (!req.user.IsVerified) {
      return res.status(403).json({
        success: false,
        message: 'Та баталгаажуулалт хийсний дараа санал хүсэлт илгээх боломжтой.'
      });
    }
    next();
  };