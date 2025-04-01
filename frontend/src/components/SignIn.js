import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import backgroundImage from '../figures/images/apartment.jpg';

function SignIn() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false,
    isAdmin: false
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Load remembered username on component mount
  useEffect(() => {
    const rememberedUsername = localStorage.getItem('rememberedUsername');
    if (rememberedUsername) {
      setFormData(prev => ({
        ...prev,
        username: rememberedUsername,
        rememberMe: true
      }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/api/auth/signin', {
        username: formData.username,
        password: formData.password,
        isAdmin: formData.isAdmin
      });

      // Handle "Remember Me" functionality
      if (formData.rememberMe) {
        localStorage.setItem('rememberedUsername', formData.username);
      } else {
        localStorage.removeItem('rememberedUsername');
      }

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Redirect based on admin rights
      if (response.data.user.AdminRight === 1) {
        navigate('/admin/dashboard');
      } else {
        let errorMessage = 'Хэрэглэгчийн нэр эсвэл нууц үг буруу байна';
      }
    } catch (err) {
      let errorMessage = 'Хэрэглэгчийн нэр эсвэл нууц үг буруу байна';
      if (err.response) {
        errorMessage = err.response.data?.message || errorMessage;
      } else if (err.request) {
        errorMessage = 'Серверээс хариу ирсэнгүй. Дахин оролдоно уу';
      } else {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  return (
    <div className="min-h-screen flex relative">
      {/* Background image for entire left side */}
      <div 
        className="absolute top-0 left-0 w-1/2 h-full"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Darker overlay for better text visibility */}
        <div className="absolute inset-0 bg-black opacity-40"></div>
      </div>
      
      {/* Left side content */}
      <div className="w-1/2 p-8 flex flex-col justify-between relative z-10">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white">Усны хэрэглээний бүртгэлийн систем</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 group hover:cursor-pointer">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                  <circle cx="10" cy="10" r="5" />
                </svg>
              </div>
              <span className="text-white group-hover:text-blue-100 group-hover:drop-shadow-[0_0_8px_rgba(147,197,253,0.8)] transition-all duration-200">
                Тоолуурын заалтыг онлайнаар өгөх
              </span>
            </div>
            <div className="flex items-center space-x-3 group hover:cursor-pointer">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                  <circle cx="10" cy="10" r="5" />
                </svg>
              </div>
              <span className="text-white group-hover:text-blue-100 group-hover:drop-shadow-[0_0_8px_rgba(147,197,253,0.8)] transition-all duration-200">
                Төлбөрийн дэлгэрэнгүйг танилцуулах
              </span>
            </div>
            <div className="flex items-center space-x-3 group hover:cursor-pointer">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                  <circle cx="10" cy="10" r="5" />
                </svg>
              </div>
              <span className="text-white group-hover:text-blue-100 group-hover:drop-shadow-[0_0_8px_rgba(147,197,253,0.8)] transition-all duration-200">
                Онлайнаар усны хэрэглээний төлбөрөө төлөх
              </span>
            </div>
            <div className="flex items-center space-x-3 group hover:cursor-pointer">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                  <circle cx="10" cy="10" r="5" />
                </svg>
              </div>
              <span className="text-white group-hover:text-blue-100 group-hover:drop-shadow-[0_0_8px_rgba(147,197,253,0.8)] transition-all duration-200">
                Өргөдөл гомдол, санал хүсэлт өгөх
              </span>
            </div>
            <div className="flex items-center space-x-3 group hover:cursor-pointer">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                  <circle cx="10" cy="10" r="5" />
                </svg>
              </div>
              <span className="text-white group-hover:text-blue-100 group-hover:drop-shadow-[0_0_8px_rgba(147,197,253,0.8)] transition-all duration-200">
                Засвар үйлчилгээ дуудах
              </span>
            </div>
            <div className="flex items-center space-x-3 group hover:cursor-pointer">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                  <circle cx="10" cy="10" r="5" />
                </svg>
              </div>
              <span className="text-white group-hover:text-blue-100 group-hover:drop-shadow-[0_0_8px_rgba(147,197,253,0.8)] transition-all duration-200">
                Мэдээ мэдээлэл авах
              </span>
            </div>
          </div>
        </div>
        
        {/* Larger bottom icons in single line */}
        <div className="flex justify-between mt-8">
          <div className="bg-white p-6 rounded-lg shadow-md text-center w-1/3 mx-2 hover:shadow-lg transition-shadow duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-blue-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <span className="text-sm font-medium text-gray-700">Усны хэрэглээгээ</span>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center w-1/3 mx-2 hover:shadow-lg transition-shadow duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-blue-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-gray-700">Онлайн тоолуурын заалт</span>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center w-1/3 mx-2 hover:shadow-lg transition-shadow duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-blue-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-gray-700">Төлбөрийн шийдэл</span>
          </div>
        </div>
      </div>
      
      {/* Right side with login form */}
      <div className="w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">Нэвтрэх</h1>
          
          {/* Admin User Toggle Switch */}
          <div className="mb-6 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Админ эрхээр нэвтрэх</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                name="isAdmin"
                checked={formData.isAdmin}
                onChange={handleChange}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Нэвтрэх нэр
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                autoFocus
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Нууц үг
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                minLength="6"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="rememberMe"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                 Бүртгэл сануулах 
                </label>
              </div>
              
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Нууц үгээ мартсан?
              </button>
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200 flex justify-center items-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Нэвтэрч байна...
                </>
              ) : 'Нэвтрэх'}
            </button>
          </form>
          
          <div className="mt-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="h-px w-20 bg-gray-300"></div>
              <span className="text-gray-500 text-sm">эсвэл</span>
              <div className="h-px w-20 bg-gray-300"></div>
            </div>
            
            <button className="w-full py-3 px-4 rounded-lg border border-gray-300 text-gray-700 flex items-center justify-center space-x-2 hover:bg-gray-50 transition-colors duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="24" height="24" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
              </svg>
              <span>Google-аар нэвтрэх</span>
            </button>
            
            <p className="mt-4 text-sm text-gray-600">
              Бүртгэл байхгүй бол{' '}
              <Link to="/signup" className="text-blue-600 hover:text-blue-800 font-medium">
                Бүртгүүлэх
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignIn;