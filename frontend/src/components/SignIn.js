import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import loginImage from '../figures/images/apartment.jpg'; 

function SignIn() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
        password: formData.password
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/home');
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

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:block w-1/2 bg-cover bg-center" 
           style={{ backgroundImage: `url(${loginImage})` }}>
        <div className="h-full bg-black bg-opacity-30 flex items-center justify-center">
          <div className="text-white p-8 max-w-md">
            <h2 className="text-4xl font-bold mb-4 text-cen">Орон сууцны усны хэрэглээний бүртгэлийн систем</h2>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 lg:hidden">
            <h1 className="text-3xl font-bold text-gray-800">Тавтай морил</h1>
            <p className="text-gray-600 mt-2">Нэвтрэхийн тулд мэдээллээ оруулна уу</p>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Хэрэглэгчийн нэр
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
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
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
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Намайг сана
                </label>
              </div>
              
              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                  Нууц үгээ мартсан уу?
                </Link>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white ${isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} transition-colors duration-200 flex justify-center items-center`}
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
          
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Та бүртгэлгүй бол?{' '}
              <Link to="/signup" className="text-blue-600 hover:text-blue-800 font-medium">
                Энд бүртгүүлнэ үү
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignIn;