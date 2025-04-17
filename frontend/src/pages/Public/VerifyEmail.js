import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

function VerifyEmail() {
  const [status, setStatus] = useState('pending');
  const [message, setMessage] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyUserEmail = async () => {
      try {
        const searchParams = new URLSearchParams(location.search);
        const urlToken = searchParams.get('token');

        if (urlToken) {
          setStatus('verifying');
          setMessage('Таны имэйл хаягийг баталгаажуулж байна...');
          
          const response = await axios.get(`http://localhost:5000/api/auth/verify-email?token=${urlToken}`);
          
          if (response.data.success) {
            setStatus('success');
            setMessage(response.data.message);
            
            localStorage.setItem('token', response.data.token);
            
            const user = JSON.parse(localStorage.getItem('user'));
            if (user) {
              user.isVerified = true;
              localStorage.setItem('user', JSON.stringify(user));
            }
            
            setTimeout(() => {
              navigate('/home');
            }, 3000);
          } else {
            setStatus('error');
            setMessage(response.data.message || 'Баталгаажуулахад алдаа гарлаа.');
          }
        } else {

          const token = localStorage.getItem('token');
          
          if (!token) {
            setStatus('error');
            setMessage('Бүртгэлийн мэдээлэл олдсонгүй. Дахин бүртгүүлнэ үү.');
            return;
          }
          
          // API call to request email verification
          const response = await axios.post(
            'http://localhost:5000/api/auth/verify-email-request',
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          setStatus('sent');
          setMessage(response.data.message || 'Имэйл баталгаажуулах хүсэлт илгээгдлээ. Та имэйлээ шалгана уу.');
        }
      } catch (error) {
        console.error('Email verification error:', error);
        setStatus('error');
        setMessage(
          error.response?.data?.message || 
          'Баталгаажуулахад алдаа гарлаа. Дахин оролдоно уу.'
        );
      }
    };

    verifyUserEmail();
  }, [location, navigate]);

  const handleRedirect = () => {
    navigate('/home');
  };

  const handleResend = async () => {
    setStatus('pending');
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setStatus('error');
        setMessage('Бүртгэлийн мэдээлэл олдсонгүй. Дахин бүртгүүлнэ үү.');
        return;
      }
      
      const response = await axios.post(
        'http://localhost:5000/api/auth/resend-verification',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setStatus('sent');
      setMessage(response.data.message || 'Баталгаажуулах имэйл дахин илгээгдлээ. Та имэйлээ шалгана уу.');
    } catch (error) {
      console.error('Resend verification error:', error);
      setStatus('error');
      setMessage(
        error.response?.data?.message || 
        'Баталгаажуулах имэйл дахин илгээхэд алдаа гарлаа. Дахин оролдоно уу.'
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Имэйл баталгаажуулалт
        </h1>
        
        {status === 'pending' && (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Таны имэйл хаягийг баталгаажуулах хүсэлтийг илгээж байна...</p>
          </div>
        )}
        
        {status === 'verifying' && (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Таны имэйл хаягийг баталгаажуулж байна...</p>
          </div>
        )}
        
        {status === 'sent' && (
          <div className="flex flex-col items-center">
            <div className="rounded-full h-12 w-12 bg-blue-100 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-700 mb-6">{message}</p>
            <p className="text-gray-600 mb-6">
              Бид таны имэйл хаяг руу баталгаажуулах холбоос илгээсэн. 
              Имэйлээ шалгаад, баталгаажуулах холбоос дээр дарна уу.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <button
                onClick={handleResend}
                className="px-4 py-2 bg-white border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex-1"
              >
                Дахин илгээх
              </button>
              <button
                onClick={handleRedirect}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-1"
              >
                Нүүр хуудас руу
              </button>
            </div>
          </div>
        )}
        
        {status === 'success' && (
          <div className="flex flex-col items-center">
            <div className="rounded-full h-12 w-12 bg-green-100 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-600 font-medium mb-2">{message}</p>
            <p className="text-gray-600">Та удахгүй шилжих болно...</p>
          </div>
        )}
        
        {status === 'error' && (
          <div className="flex flex-col items-center">
            <div className="rounded-full h-12 w-12 bg-red-100 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-red-600 font-medium mb-4">{message}</p>
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              {!location.search.includes('token') && (
                <button
                  onClick={handleResend}
                  className="px-4 py-2 bg-white border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex-1"
                >
                  Дахин оролдох
                </button>
              )}
              <button
                onClick={handleRedirect}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-1"
              >
                Нүүр хуудас руу
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VerifyEmail;