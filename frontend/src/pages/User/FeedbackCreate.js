import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VerificationReminder from '../../components/verificationReminder';
import api from "../../utils/api";

export function FeedbackCreate() {
  const [formData, setFormData] = useState({
    feedbackType: 1, // Default: 1 (Санал)
    description: ''
  });

  const [errors, setErrors] = useState({
    description: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [user, setUser] = useState(null);
  const [characterCount, setCharacterCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/');
          return;
        }
        
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };
    
    fetchUserData();
  }, [navigate]);

  useEffect(() => {

    setCharacterCount(formData.description.length);
  }, [formData.description]);

  const handleVerificationSuccess = () => {
    setUser(prev => ({
      ...prev,
      IsVerified: true
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: false
      }));
    }
    
    setSubmitError('');
  };

  const validateForm = () => {
    const newErrors = {
      description: !formData.description.trim()
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (!user?.IsVerified) {
      setSubmitError('Та имэйл хаягаа баталгаажуулсны дараа санал хүсэлт илгээх боломжтой.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await api.post('/feedback', {
        feedbackType: parseInt(formData.feedbackType),
        description: formData.description
      });
      
      setIsSubmitted(true);
      setFormData({
        feedbackType: 1,
        description: ''
      });
      
      setTimeout(() => {
        navigate('/feedback');
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting feedback:', error);
      if (error.response?.status === 403) {
        setSubmitError('Та имэйл хаягаа баталгаажуулсны дараа санал хүсэлт илгээх боломжтой.');
      } else {
        setSubmitError(error.response?.data?.message || 'Санал хүсэлт илгээхэд алдаа гарлаа. Дахин оролдоно уу.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToList = () => {
    navigate('/feedback');
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-2xl p-8 bg-white rounded-lg shadow-lg">
        <div className="flex items-center justify-between mb-6">    
          <h1 className="text-2xl font-bold text-center">Санал хүсэлт бичих</h1>
        </div>
        
        {user && !user.IsVerified && (
          <VerificationReminder user={user} onVerify={handleVerificationSuccess} />
        )}
        
        {isSubmitted ? (
          <div className="p-6 mb-6 bg-green-100 text-green-700 rounded-lg text-center">
            <div className="flex justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-medium text-lg">Таны санал хүсэлт амжилттай илгээгдлээ.</p>
            <p className="mt-2">Жагсаалт руу шилжиж байна...</p>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            {submitError && (
              <div className="p-4 mb-6 bg-red-100 text-red-700 rounded-lg">
                <p>{submitError}</p>
              </div>
            )}
            
            <div>
              <label className="block text-gray-800 font-medium mb-2">
                Хэлбэр <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className={`flex items-center p-3 border ${formData.feedbackType === 1 ? 'border-blue-500 bg-blue-50' : 'border-gray-300'} rounded-lg cursor-pointer hover:bg-gray-100`}>
                  <input
                    type="radio"
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500"
                    name="feedbackType"
                    value="1"
                    checked={formData.feedbackType === 1}
                    onChange={() => setFormData(prev => ({ ...prev, feedbackType: 1 }))}
                  />
                  <span className="ml-3 text-gray-800">Санал</span>
                </label>
                
                <label className={`flex items-center p-3 border ${formData.feedbackType === 2 ? 'border-blue-500 bg-blue-50' : 'border-gray-300'} rounded-lg cursor-pointer hover:bg-gray-100`}>
                  <input
                    type="radio"
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500"
                    name="feedbackType"
                    value="2"
                    checked={formData.feedbackType === 2}
                    onChange={() => setFormData(prev => ({ ...prev, feedbackType: 2 }))}
                  />
                  <span className="ml-3 text-gray-800">Хүсэлт</span>
                </label>
                
                <label className={`flex items-center p-3 border ${formData.feedbackType === 3 ? 'border-blue-500 bg-blue-50' : 'border-gray-300'} rounded-lg cursor-pointer hover:bg-gray-100`}>
                  <input
                    type="radio"
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500"
                    name="feedbackType"
                    value="3"
                    checked={formData.feedbackType === 3}
                    onChange={() => setFormData(prev => ({ ...prev, feedbackType: 3 }))}
                  />
                  <span className="ml-3 text-gray-800">Гомдол</span>
                </label>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-gray-800 font-medium" htmlFor="description">
                  Дэлгэрэнгүй <span className="text-red-400">*</span>
                </label>
                <span className="text-sm text-gray-500">{characterCount}/2000</span>
              </div>
              <textarea
                className={`w-full px-4 py-3 bg-gray-50 border ${errors.description ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                id="description"
                name="description"
                rows="8"
                placeholder="Таны санал хүсэлт, гомдол, өргөдлийг дэлгэрэнгүй бичнэ үү..."
                value={formData.description}
                onChange={handleChange}
                disabled={!user?.IsVerified}
                maxLength={2000}
              ></textarea>
              {errors.description && <p className="mt-1 text-sm text-red-400">Дэлгэрэнгүй мэдээлэл заавал шаардлагатай</p>}
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={handleBackToList}
                className="text-gray-600 hover:text-gray-800 font-medium py-3 px-6 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-200"
              >
                Цуцлах
              </button>
              
              <button
                className={`${user?.IsVerified 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-gray-400 cursor-not-allowed'} 
                  text-white font-medium py-3 px-6 rounded-lg transition duration-200 flex items-center`}
                type="submit"
                disabled={isSubmitting || !user?.IsVerified}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Илгээж байна...
                  </>
                ) : (
                  'Илгээх'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default FeedbackCreate;