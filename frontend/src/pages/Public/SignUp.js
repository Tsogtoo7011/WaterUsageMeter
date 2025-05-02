import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from "../../utils/api";

const SignUp = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    firstname: '',
    lastname: '',
    phonenumber: '',
    email: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const validateStep = (currentStep) => {
    const newErrors = {};
    
    // Step 1 validation - Basic info
    if (currentStep === 1) {
      if (!formData.firstname.trim()) {
        newErrors.firstname = 'Нэр заавал оруулна уу';
      }
      
      if (!formData.lastname.trim()) {
        newErrors.lastname = 'Овог заавал оруулна уу';
      }
      
      if (!formData.email.trim()) {
        newErrors.email = 'Имэйл хаяг заавал оруулна уу';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Зөв имэйл хаяг оруулна уу';
      }
    }
    
    // Step 2 validation - Contact
    if (currentStep === 2) {
      if (!formData.phonenumber.trim()) {
        newErrors.phonenumber = 'Утасны дугаар заавал оруулна уу';
      } else if (!/^[\d\s+-]+$/.test(formData.phonenumber)) {
        newErrors.phonenumber = 'Зөв утасны дугаар оруулна уу';
      }
      
      if (!formData.username.trim()) {
        newErrors.username = 'Хэрэглэгчийн нэр заавал оруулна уу';
      } else if (formData.username.length < 4) {
        newErrors.username = 'Хэрэглэгчийн нэр хамгийн багадаа 4 тэмдэгтээс бүрдэнэ';
      }
    }
    
    // Step 3 validation - Password
    if (currentStep === 3) {
      if (!formData.password) {
        newErrors.password = 'Нууц үг заавал оруулна уу';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Нууц үг хамгийн багадаа 6 тэмдэгтээс бүрдэнэ';
      } else if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*]{6,}$/.test(formData.password)) {
        newErrors.password = 'Нууц үг доод тал нь 6 тэмдэгт байх ба 1 тоо агуулсан байх ёстой';
      }
      
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Нууц үг таарахгүй байна';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setSuccessMessage('');
    
    if (!validateStep(step)) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await api.post('/auth/signup', {
        username: formData.username,
        password: formData.password,
        firstname: formData.firstname,
        lastname: formData.lastname,
        phonenumber: formData.phonenumber,
        email: formData.email,
        adminRight: 0
      });
      
      localStorage.setItem('token', response.data.token);
      setSuccessMessage('Бүртгэл амжилттай үүслээ! Нэвтрэх хуудас руу чиглүүлж байна...');
      
      setTimeout(() => {
        navigate('/');
      }, 2000);
      
    } catch (err) {
      setServerError(err.response?.data?.message || 'Бүртгэл амжилтгүй боллоо. Дахин оролдоно уу.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render form steps
  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <>
            <div className="w-full md:w-2/5 p-6 flex items-center justify-center">
              <div className="w-full max-w-sm">
                <h2 className="text-xl font-medium mb-4" style={{ color: '#2D6B9F' }}>
                  Бүртгүүлэх <span className="float-right">{step}/3</span>
                </h2>
                
                {serverError && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border text-sm" style={{ borderWidth: '2px' }}>
                    {serverError}
                  </div>
                )}
                
                <form className="space-y-4">
                  <div>
                    <input
                      type="text"
                      id="firstname"
                      name="firstname"
                      placeholder="Нэр"
                      className="w-full p-3 border rounded text-sm"
                      value={formData.firstname}
                      onChange={handleChange}
                      required
                      style={{ color: '#2D6B9F', caretColor: '#2D6B9F', borderColor: errors.firstname ? 'red' : '#2D6B9F' }}
                    />
                    {errors.firstname && <p className="mt-1 text-xs text-red-600">{errors.firstname}</p>}
                  </div>
                  
                  <div>
                    <input
                      type="text"
                      id="lastname"
                      name="lastname"
                      placeholder="Овог"
                      className="w-full p-3 border rounded text-sm"
                      value={formData.lastname}
                      onChange={handleChange}
                      required
                      style={{ color: '#2D6B9F', caretColor: '#2D6B9F', borderColor: errors.lastname ? 'red' : '#2D6B9F' }}
                    />
                    {errors.lastname && <p className="mt-1 text-xs text-red-600">{errors.lastname}</p>}
                  </div>
                  
                  <div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="Имэйл"
                      className="w-full p-3 border rounded text-sm"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      style={{ color: '#2D6B9F', caretColor: '#2D6B9F', borderColor: errors.email ? 'red' : '#2D6B9F' }}
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                  </div>
                  
                  <button
                    type="button"
                    onClick={nextStep}
                    className="w-full py-3 rounded text-sm font-medium"
                    style={{ backgroundColor: '#2D6B9F', color: 'white' }}
                  >
                    Дараагийн
                  </button>
                  
                  <div className="text-center text-gray-400 text-sm my-2">эсвэл</div>
                  
                  <button
                    type="button"
                    className="w-full flex items-center justify-center border border-gray-300 py-3 rounded text-sm font-medium"
                    style={{ color: '#2D6B9F' }}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
                      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
                      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
                      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                    </svg>
                    <span>Google account ашиглан нэвтрэх</span>
                  </button>
                  
                  <div className="mt-4 text-center">
                    <button 
                      type="button"
                      onClick={() => navigate('/')}
                      className="text-xs"
                      style={{ color: '#2D6B9F' }}
                    >
                      Та бүртгэлтэй бол энд дарж нэвтэрнэ үү
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </>
        );
      case 2:
        return (
          <>
            <div className="w-full md:w-2/5 p-6 flex items-center justify-center">
              <div className="w-full max-w-sm">
                <h2 className="text-xl font-medium mb-4" style={{ color: '#2D6B9F' }}>
                  Бүртгүүлэх <span className="float-right">{step}/3</span>
                </h2>
                
                <form className="space-y-4">
                  <div>
                    <input
                      type="text"
                      id="phonenumber"
                      name="phonenumber"
                      placeholder="Утасны дугаар"
                      className="w-full p-3 border rounded text-sm"
                      value={formData.phonenumber}
                      onChange={handleChange}
                      required
                      style={{ color: '#2D6B9F', caretColor: '#2D6B9F', borderColor: errors.phonenumber ? 'red' : '#2D6B9F' }}
                    />
                    {errors.phonenumber && <p className="mt-1 text-xs text-red-600">{errors.phonenumber}</p>}
                  </div>
                  
                  <div>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      placeholder="Хэрэглэгчийн нэр"
                      className="w-full p-3 border rounded text-sm"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      style={{ color: '#2D6B9F', caretColor: '#2D6B9F', borderColor: errors.username ? 'red' : '#2D6B9F' }}
                    />
                    {errors.username && <p className="mt-1 text-xs text-red-600">{errors.username}</p>}
                  </div>
                  
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="w-1/2 py-3 rounded text-sm font-medium border"
                      style={{ borderColor: '#2D6B9F', color: '#2D6B9F' }}
                    >
                      Буцах
                    </button>
                    
                    <button
                      type="button"
                      onClick={nextStep}
                      className="w-1/2 py-3 rounded text-sm font-medium"
                      style={{ backgroundColor: '#2D6B9F', color: 'white' }}
                    >
                      Дараагийн
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </>
        );
      case 3:
        return (
          <>
            <div className="w-full md:w-2/5 p-6 flex items-center justify-center">
              <div className="w-full max-w-sm">
                <h2 className="text-xl font-medium mb-4" style={{ color: '#2D6B9F' }}>
                  Бүртгүүлэх <span className="float-right">{step}/3</span>
                </h2>
                
                {successMessage && (
                  <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg border text-sm" style={{ borderWidth: '2px' }}>
                    {successMessage}
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      placeholder="Нууц үг"
                      className="w-full p-3 border rounded text-sm"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      style={{ color: '#2D6B9F', caretColor: '#2D6B9F', borderColor: errors.password ? 'red' : '#2D6B9F' }}
                    />
                    <button 
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={togglePasswordVisibility}
                    >
                      <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {showPassword ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        )}
                      </svg>
                    </button>
                    {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                  </div>
                  
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      placeholder="Нууц үг давтах"
                      className="w-full p-3 border rounded text-sm"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      style={{ color: '#2D6B9F', caretColor: '#2D6B9F', borderColor: errors.confirmPassword ? 'red' : '#2D6B9F' }}
                    />
                    <button 
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={toggleConfirmPasswordVisibility}
                    >
                      <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {showConfirmPassword ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        )}
                      </svg>
                    </button>
                    {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
                  </div>
                  
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="w-1/2 py-3 rounded text-sm font-medium border"
                      style={{ borderColor: '#2D6B9F', color: '#2D6B9F' }}
                    >
                      Буцах
                    </button>
                    
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-1/2 py-3 rounded text-sm font-medium"
                      style={{ backgroundColor: '#2D6B9F', color: 'white' }}
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Бүртгэж байна...
                        </>
                      ) : 'Бүртгүүлэх'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-blue-50 min-h-screen flex flex-col">
      {/* Top Navigation Bar */}
      <div className="bg-white flex justify-between items-center px-5 py-4 border-b-2" style={{ borderColor: '#2D6B9F', borderLeft: '2px solid #2D6B9F' }}>
        <div className="flex items-center">
          <svg className="w-8 h-8" style={{ color: '#2D6B9F' }} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 10.5L12 5.5L17 10.5M17 10.5V19.5H7V10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5 19.5H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M12 14.5V19.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span className="text-base font-medium ml-2" style={{ color: '#2D6B9F' }}>Усны хэрэглээний вэб</span>
        </div>
        <button 
          className="text-sm px-6 py-2 rounded border" 
          style={{ borderColor: '#2D6B9F', borderWidth: '1px', color: '#2D6B9F' }}
          onClick={() => navigate('/')}
        >
          Нэвтрэх
        </button>
      </div>

      <div className="flex flex-col md:flex-row flex-grow">
        {/* Left Side */}
        <div className="w-full md:w-3/5 p-10 border-b md:border-b-0 md:border-r flex flex-col justify-between" style={{ borderWidth: '1px', paddingTop: '40px' }}>
          <div>
            <h2 className="text-lg font-medium mb-4" style={{ color: '#2D6B9F' }}>
              Орон сууцан дахь айл өрхийн усны хэрэглээ бүртгэх вэбсайт
            </h2>

            <ul className="space-y-3 mb-8 pl-6">
              <li className="flex items-center">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#2D6B9F', marginRight: '8px' }}></div>
                <span className="text-base" style={{ color: '#2D6B9F' }}>Усны хэрэглээгээ хянах</span>
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#2D6B9F', marginRight: '8px' }}></div>
                <span className="text-base" style={{ color: '#2D6B9F' }}>Төлбөрийн дэлгэрэнгүйтэй танилцах</span>
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#2D6B9F', marginRight: '8px' }}></div>
                <span className="text-base" style={{ color: '#2D6B9F' }}>Онлайнаар төлбөрөө төлөх</span>
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#2D6B9F', marginRight: '8px' }}></div>
                <span className="text-base" style={{ color: '#2D6B9F' }}>Өргөдөл гомдол, санал хүсэлт өгөх</span>
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#2D6B9F', marginRight: '8px' }}></div>
                <span className="text-base" style={{ color: '#2D6B9F' }}>Ажлын захиалга болон дуудлага өгөх</span>
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#2D6B9F', marginRight: '8px' }}></div>
                <span className="text-base" style={{ color: '#2D6B9F' }}>Тоолуурын мэдээлэл, бичилт харах, заалт илгээх</span>
              </li>
            </ul>
          </div>

        {/* Bottom Cards */}
         <div className="flex flex-row justify-between gap-3 mt-auto">
            <div className="bg-white rounded-lg shadow p-3 w-1/3 flex flex-col items-center" style={{ borderColor: '#2D6B9F', borderWidth: '1.5px' }}>
              <div className="mb-2 flex items-center justify-center">
                <svg className="w-8 h-8" style={{ color: '#2D6B9F' }} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="text-base text-center" style={{ color: '#2D6B9F' }}>Хэрэгцээт мэдээллийг өдөр тутамд хүргэнэ</span>
            </div>
            <div className="bg-white rounded-lg shadow p-3 w-1/3 flex flex-col items-center" style={{ borderColor: '#2D6B9F', borderWidth: '1.5px' }}>
              <div className="mb-2 flex items-center justify-center">
                <svg className="w-8 h-8" style={{ color: '#2D6B9F' }} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="text-base text-center" style={{ color: '#2D6B9F' }}>Усны төлбөрийн задаргааг харуулна</span>
            </div>
            <div className="bg-white rounded-lg shadow p-3 w-1/3 flex flex-col items-center" style={{ borderColor: '#2D6B9F', borderWidth: '1.5px' }}>
              <div className="mb-2 flex items-center justify-center">
                <svg className="w-8 h-8" style={{ color: '#2D6B9F' }} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 8V16M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="text-base text-center" style={{ color: '#2D6B9F' }}>Хэрэглэгчийн санал хүсэлтэд хариулна </span>
            </div>
          </div>
          </div>

        {/* Right Side - Signup Form */}
        {renderStep()}
      </div>
      <div className="bg-blue-800 h-12" style={{ backgroundColor: '#2D6B9F' }}></div>
    </div>
  );
};

export default SignUp;