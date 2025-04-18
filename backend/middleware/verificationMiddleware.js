module.exports = (req, res, next) => {
  if (!req.userData || !req.userData.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Та баталгаажуулалт хийсний дараа санал хүсэлт илгээх боломжтой.'
    });
  }
  next();
};