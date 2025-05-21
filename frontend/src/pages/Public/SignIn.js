import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from "../../utils/api";

const SignIn = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const rememberedUsername = localStorage.getItem('rememberedUsername');
    if (rememberedUsername) {
      setFormData(prev => ({
        ...prev,
        username: rememberedUsername,
        rememberMe: true
      }));
    }
    setError('');
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;  
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) setError('');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    if (!formData.username.trim() || !formData.password.trim()) {
      setError('Хэрэглэгчийн нэр болон нууц үгээ оруулна уу');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await api.post('/auth/signin', {
        username: formData.username.trim(),
        password: formData.password.trim()
      });

      if (response.data) {
        if (formData.rememberMe) {
          localStorage.setItem('rememberedUsername', formData.username);
        } else {
          localStorage.removeItem('rememberedUsername');
        }

        localStorage.setItem('token', response.data.accessToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));
   
        setTimeout(() => {
   
          window.dispatchEvent(new Event('authChange'));
          navigate('/home', { replace: true });
        }, 100);
      }
    } catch (err) {
      let errorMessage = 'Хэрэглэгчийн нэр эсвэл нууц үг буруу байна';
      
      if (err.response) {
        if (err.response.status === 429) {
          errorMessage = 'Хэт олон оролдлого хийгдсэн. Түр хүлээгээд дахин оролдоно уу.';
        } else if (err.response.status === 400) {
          errorMessage = err.response.data?.message || 'Хүсэлт буруу байна. Оруулсан мэдээллээ шалгана уу.';
        } else {
          errorMessage = err.response.data?.message || errorMessage;
        }
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
    navigate('/ForgetPassword');
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
          onClick={() => navigate('/signup')}
        >
          Бүртгүүлэх
        </button>
      </div>

      <div className="flex flex-col md:flex-row flex-grow relative">
        {/* Vertical Divider */}
        <div
          className="hidden md:block absolute"
          style={{
            left: '62%',
            width: '1px',
            backgroundColor: 'rgba(45, 107, 159, 0.5)', // #2D6B9F/50
            top: '40px',
            bottom: '40px',
            borderRadius: '1px',
            zIndex: 10
          }}
        ></div>
        {/* Left Side */}
        <div className="w-full md:w-3/5 p-10 border-b md:border-b-0 flex flex-col justify-between" style={{ paddingTop: '40px' }}>
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

        {/* Right Side - Login Form */}
        <div className="w-full md:w-2/5 p-6 flex items-center justify-center">
          <div className="w-full max-w-sm">
            <h2 className="text-xl font-medium mb-4" style={{ color: '#2D6B9F' }}>Нэвтрэх</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border text-sm" style={{ borderWidth: '2px' }}>
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  id="username"
                  name="username"
                  placeholder="Нэвтрэх нэр"
                  className="w-full p-3 border rounded text-sm"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  style={{
                    color: '#2D6B9F',
                    caretColor: '#2D6B9F',
                    borderColor: '#2D6B9F',
                    outline: 'none',
                    boxShadow: 'none'
                  }}
                  onFocus={e => (e.target.style.borderColor = '#2D6B9F')}
                />
              </div>
              
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
                  style={{
                    color: '#2D6B9F',
                    caretColor: '#2D6B9F',
                    borderColor: '#2D6B9F',
                    outline: 'none',
                    boxShadow: 'none'
                  }}
                  onFocus={e => (e.target.style.borderColor = '#2D6B9F')}
                />
                <button 
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={togglePasswordVisibility}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="#2D6B9F">
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    )}
                  </svg>
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="h-4 w-4 focus:ring-2 rounded"
                    style={{ borderColor: '#2D6B9F', backgroundColor: '#2D6B9F', outlineColor: '#2D6B9F' }}
                  />
                  <label htmlFor="rememberMe" className="ml-2 block text-sm" style={{ color: '#2D6B9F' }}>
                    Бүртгэл сануулах
                  </label>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded text-sm font-medium"
                style={{ backgroundColor: '#2D6B9F', color: 'white' }}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Нэвтэрч байна...
                  </>
                ) : 'Нэвтрэх'}
              </button>            
              <div className="mt-4 text-center">
                <button 
                  type="button"
                  className="text-xs"
                  style={{ color: 'gray' }}
                  onClick={handleForgotPassword}
                >
                  Нэвтрэх нэр, нууц үгээ мартсан ?
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="bg-blue-800 h-12" style={{ backgroundColor: '#2D6B9F' }}></div>
    </div>
  );
};

export default SignIn;