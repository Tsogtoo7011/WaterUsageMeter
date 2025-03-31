// middleware/validationMiddleware.js
exports.validateSignup = (req, res, next) => {
    const { username, email, password, firstname, lastname } = req.body;
    
    if (!username || !email || !password || !firstname || !lastname) {
      return res.status(400).json({ message: 'Бүх шаардлагатай талбарыг бөглөнө үү' });
    }
    
    next();
  };
  
  exports.validateSignin = (req, res, next) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Хэрэглэгчийн нэр болон нууц үгээ оруулна уу' });
    }
    
    next();
  };
  
  exports.validateProfileUpdate = (req, res, next) => {
    const { Firstname, Lastname, Email } = req.body;
    
    if (!Firstname || !Lastname || !Email) {
      return res.status(400).json({ message: 'Овог, нэр, имэйл хаяг шаардлагатай' });
    }
    
    next();
  };
  
  exports.validateApartment = (req, res, next) => {
    const requiredFields = ['ApartmentType', 'SerialNumber', 'City', 'District', 'SubDistrict', 'Street', 'Number'];
    
    if (requiredFields.some(field => !req.body[field])) {
      return res.status(400).json({ message: 'Бүх шаардлагатай талбарыг бөглөнө үү' });
    }
    
    next();
  };