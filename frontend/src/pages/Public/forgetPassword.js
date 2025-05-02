import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, CheckCircle, ChevronLeft } from 'lucide-react';
import api from "../../utils/api";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function forgetPassword() {
  const navigate = useNavigate();
  const query = useQuery();
  const resetToken = query.get('token');
  
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

      <div className="flex-grow flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-lg shadow p-8" style={{ borderColor: '#2D6B9F', borderWidth: '1px' }}>
          <h2 className="text-xl font-medium mb-6" style={{ color: '#2D6B9F' }}>
            {resetToken ? 'Нууц үг шинэчлэх' : 'Нууц үг сэргээх'}
          </h2>
          <p className="mb-6 text-sm" style={{ color: '#2D6B9F' }}>
            {resetToken 
              ? 'Шинэ нууц үгээ оруулна уу' 
              : 'Имэйл хаягаа оруулна уу. Бид нууц үг шинэчлэх зааврыг имэйлээр илгээх болно.'}
          </p>
          
          {resetToken ? (
            <ResetPasswordForm token={resetToken} />
          ) : (
            <ForgotPasswordForm />
          )}
        </div>
      </div>
      
      <div className="bg-blue-800 h-12" style={{ backgroundColor: '#2D6B9F' }}></div>
    </div>
  );
}

// Forgot Password Form Component
function ForgotPasswordForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await api.post('/password/forgot', { email });

      if (response.data) {
        setStatus({ 
          type: 'success', 
          message: response.data.message || 'Нууц үг шинэчлэх зааврыг имэйлээр илгээлээ. Имэйлээ шалгана уу.' 
        });
        setEmail('');
      }
    } catch (err) {
      let errorMessage = 'Алдаа гарлаа. Дахин оролдоно уу.';
      
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
      
      setStatus({ 
        type: 'error', 
        message: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Имэйл хаяг"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 border rounded text-sm"
          style={{ color: '#2D6B9F', caretColor: '#2D6B9F', borderColor: '#2D6B9F' }}
        />
      </div>

      {status.message && (
        <div className={`p-3 ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'} rounded-lg border text-sm`} style={{ borderWidth: '2px' }}>
          <div className="flex">
            <div className="flex-shrink-0">
              {status.type === 'success' ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
            </div>
            <div className="ml-3">
              {status.message}
            </div>
          </div>
        </div>
      )}

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
            Илгээж байна...
          </>
        ) : 'Зааврыг илгээх'}
      </button>

      <div className="text-center mt-4">
        <button
          type="button" 
          onClick={() => navigate('/login')}
          className="text-sm font-medium flex items-center justify-center w-full"
          style={{ color: '#2D6B9F' }}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Нэвтрэх хуудас руу буцах
        </button>
      </div>
    </form>
  );
}

// Reset Password Form Component
function ResetPasswordForm({ token }) {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [csrfToken, setCsrfToken] = useState('');

  // Get CSRF token on component mount
  useEffect(() => {
    // Try to get CSRF token
    const getCsrfToken = async () => {
      try {
        const response = await api.get('/csrf-token');
        if (response.data && response.data.csrfToken) {
          setCsrfToken(response.data.csrfToken);
        }
      } catch (err) {
        console.error('Failed to fetch CSRF token', err);
        setStatus({
          type: 'error',
          message: 'Аюулгүй байдлын токен авахад алдаа гарлаа. Хуудсыг дахин ачаална уу.'
        });
      }
    };
    
    getCsrfToken();
  }, []);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const validatePassword = (password) => {
    const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/;
    return regex.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (password !== confirmPassword) {
      setStatus({ type: 'error', message: 'Нууц үгнүүд таарахгүй байна' });
      return;
    }

    if (!validatePassword(password)) {
      setStatus({ 
        type: 'error', 
        message: 'Нууц үг доод тал нь 6 тэмдэгт байх ба 1 онцгой тэмдэг, 1 тоо агуулсан байх ёстой' 
      });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      const headers = {};
      if (csrfToken) {
        headers['CSRF-Token'] = csrfToken;
      }
      
      const response = await api.post('/password/reset', {
        token,
        password
      }, { headers });

      if (response.data) {
        setStatus({ 
          type: 'success', 
          message: response.data.message || 'Нууц үг амжилттай шинэчлэгдлээ' 
        });
        
        // Redirect to login page after successful password reset
        setTimeout(() => {
            navigate('/login');
        }, 2000);
      }
    } catch (err) {
      let errorMessage = 'Нууц үг шинэчлэхэд алдаа гарлаа. Дахин оролдоно уу.';
      
      if (err.response) {
        if (err.response.status === 429) {
          errorMessage = 'Хэт олон оролдлого хийгдсэн. Түр хүлээгээд дахин оролдоно уу.';
        } else if (err.response.status === 400) {
          errorMessage = err.response.data?.message || 'Хүсэлт буруу байна. Оруулсан мэдээллээ шалгана уу.';
        } else if (err.response.status === 401 || err.response.status === 403) {
          errorMessage = 'Токен хүчингүй болсон эсвэл хугацаа дууссан байна. Шинэ хүсэлт илгээнэ үү.';
        } else {
          errorMessage = err.response.data?.message || errorMessage;
        }
      } else if (err.request) {
        errorMessage = 'Серверээс хариу ирсэнгүй. Дахин оролдоно уу';
      } else {
        errorMessage = err.message;
      }
      
      setStatus({ 
        type: 'error', 
        message: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {/* Password field */}
      <div className="relative">
        <input
          id="password"
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder="Шинэ нууц үг"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 border rounded text-sm"
          style={{ color: '#2D6B9F', caretColor: '#2D6B9F', borderColor: '#2D6B9F' }}
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
      </div>

      {/* Password requirements helper text */}
      <div className="text-xs" style={{ color: '#666' }}>
        Нууц үг доод тал нь 6 тэмдэгт, 1 тоо, 1 онцгой тэмдэгт (!@#$%^&*) агуулсан байх ёстой
      </div>

      {/* Confirm Password field */}
      <div className="relative">
        <input
          id="confirmPassword"
          name="confirmPassword"
          type={showConfirmPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder="Нууц үгээ давтах"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full p-3 border rounded text-sm"
          style={{ color: '#2D6B9F', caretColor: '#2D6B9F', borderColor: '#2D6B9F' }}
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
      </div>

      {status.message && (
        <div className={`p-3 ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'} rounded-lg border text-sm`} style={{ borderWidth: '2px' }}>
          <div className="flex">
            <div className="flex-shrink-0">
              {status.type === 'success' ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
            </div>
            <div className="ml-3">
              {status.message}
            </div>
          </div>
        </div>
      )}

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
            Шинэчилж байна...
          </>
        ) : 'Нууц үг шинэчлэх'}
      </button>

      <div className="text-center mt-4">
        <button
          type="button" 
          onClick={() => navigate('/login')}
          className="text-sm font-medium flex items-center justify-center w-full"
          style={{ color: '#2D6B9F' }}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Нэвтрэх хуудас руу буцах
        </button>
      </div>
    </form>
  );
}