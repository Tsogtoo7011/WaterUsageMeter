import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import signupImage from '../figures/images/apartment.jpg'; 

function SignUp() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    firstname: '',
    lastname: '',
    phonenumber: '',
    email: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [verificationRequired, setVerificationRequired] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Хэрэглэгчийн нэр заавал оруулна уу';
    } else if (formData.username.length < 4) {
      newErrors.username = 'Хэрэглэгчийн нэр хамгийн багадаа 4 тэмдэгтээс бүрдэнэ';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Имэйл хаяг заавал оруулна уу';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Зөв имэйл хаяг оруулна уу';
    }
    
    if (!formData.password) {
      newErrors.password = 'Нууц үг заавал оруулна уу';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Нууц үг хамгийн багадаа 6 тэмдэгтээс бүрдэнэ';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Нууц үг таарахгүй байна';
    }
    
    if (!formData.firstname.trim()) {
      newErrors.firstname = 'Нэр заавал оруулна уу';
    }
    
    if (!formData.lastname.trim()) {
      newErrors.lastname = 'Овог заавал оруулна уу';
    }
    
    if (!formData.phonenumber.trim()) {
      newErrors.phonenumber = 'Утасны дугаар заавал оруулна уу';
    } else if (!/^[\d\s+-]+$/.test(formData.phonenumber)) {
      newErrors.phonenumber = 'Зөв утасны дугаар оруулна уу';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await axios.post('http://localhost:5000/api/auth/signup', {
        username: formData.username,
        password: formData.password,
        firstname: formData.firstname,
        lastname: formData.lastname,
        phonenumber: formData.phonenumber,
        email: formData.email,
        adminRight: 0
      });
      
      if (response.data.requiresVerification) {
        setVerificationRequired(true);
      } else {
        localStorage.setItem('token', response.data.token);
        navigate('/home');
      }
    } catch (err) {
      setServerError(err.response?.data?.message || 'Бүртгэл амжилтгүй боллоо. Дахин оролдоно уу.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (verificationRequired) {
    return (
      <div className="text-center p-8">
        <h2>Verification Required</h2>
        <p>Please check your email to verify your account.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="hidden md:flex md:w-1/2 h-screen sticky top-0">
        <img 
          src={signupImage}
          alt="Бүртгүүлэх хуудас" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="w-full md:w-1/2 overflow-y-auto h-screen">
        <div className="flex items-center justify-center min-h-full p-4 md:p-8">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800">Бүртгүүлэх</h1>
              <p className="text-gray-600 mt-2">Хурдан шуурхай үйлчилгээг авах боломж</p>
            </div>
            {serverError && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                {serverError}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="Хэрэглэгчийн нэр" className="input" />
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Имэйл" className="input" />
              <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Нууц үг" className="input" />
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Нууц үг давтах" className="input" />
              <input type="text" name="firstname" value={formData.firstname} onChange={handleChange} placeholder="Нэр" className="input" />
              <input type="text" name="lastname" value={formData.lastname} onChange={handleChange} placeholder="Овог" className="input" />
              <input type="text" name="phonenumber" value={formData.phonenumber} onChange={handleChange} placeholder="Утасны дугаар" className="input" />
              <button type="submit" disabled={isSubmitting} className="w-full py-3 px-4 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200">
                {isSubmitting ? 'Бүртгэл үүсгэж байна...' : 'Бүртгүүлэх'}
              </button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Та бүртгэлтэй бол?{' '}
                <Link to="/signin" className="text-blue-600 hover:text-blue-800 font-medium">
                  Нэвтрэх
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
