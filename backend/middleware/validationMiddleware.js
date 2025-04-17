exports.validateSignup = (req, res, next) => {
  const { username, email, password, firstname, lastname } = req.body;
  
  if (!username || !email || !password || !firstname || !lastname) {
    return res.status(400).json({ message: 'Бүх шаардлагатай талбарыг бөглөнө үү' });
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Хүчинтэй имэйл хаяг оруулна уу' });
  }
  
  // Validate password strength (min 6 chars, at least 1 letter, 1 number, and 1 special character)
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      message: 'Нууц үг доод тал нь 6 тэмдэгт байх ба 1 онцгой тэмдэг, 1 тоо агуулсан байх ёстой'
    });
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
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(Email)) {
    return res.status(400).json({ message: 'Хүчинтэй имэйл хаяг оруулна уу' });
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