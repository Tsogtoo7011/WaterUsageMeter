import React, { useState, useEffect } from 'react';
import api from "../../utils/api"; 

function VerificationReminder({ user, onVerify }) {
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  
  useEffect(() => {
    // Check for both possible cases - Email or email in the user object
    if (user) {
      if (user.Email) {
        setEmail(user.Email);
      } else if (user.email) {
        setEmail(user.email);
      }
    }
  }, [user]);

  const handleSendVerification = async () => {
    try {
      if (!email) {
        setStatus('error');
        setMessage('Имэйл хаяг шаардлагатай');
        return;
      }

      setStatus('sending');
      console.log('Sending verification request for email:', email);
      
      // Use your custom API client instead of direct axios
      const response = await api.post(
        '/verification/resend',
        { email }
      );
      
      console.log('Verification response:', response.data);
      
      setStatus('sent');
      setMessage(response.data.message || 'Баталгаажуулах имэйл илгээгдлээ. Та имэйлээ шалгана уу.');
      
      if (response.data.success) {
        onVerify && onVerify();
      }
    } catch (error) {
      console.error('Email verification request error:', error);
      console.error('Error details:', error.response?.data);
      
      setStatus('error');
      
      if (error.response?.status === 429) {
        setMessage('Дахин оролдохоос өмнө 5 минут хүлээнэ үү');
      } else {
        setMessage(
          error.response?.data?.message ||
          'Имэйл баталгаажуулах хүсэлт илгээхэд алдаа гарлаа. Дахин оролдоно уу.'
        );
      }
    }
  };

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-yellow-700">
            Таны имэйл хаяг баталгаажаагүй байна. 
            Бүрэн хандалт авахын тулд имэйлээ баталгаажуулна уу.
          </p>
          
          {status === 'idle' && (
            <div className="mt-2">
              <button
                onClick={handleSendVerification}
                className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 transition-colors text-sm"
              >
                Баталгаажуулах имэйл илгээх
              </button>
            </div>
          )}
          
          {status === 'sending' && (
            <div className="mt-2 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-700 mr-2"></div>
              <span className="text-sm text-yellow-700">Илгээж байна...</span>
            </div>
          )}
          
          {status === 'sent' && (
            <div className="mt-2">
              <p className="text-sm text-green-700">{message}</p>
              <p className="text-sm text-yellow-700 mt-1">
                Таны имэйл хаяг руу баталгаажуулах холбоос илгээгдлээ. 
                Имэйлээ шалгаад, баталгаажуулах холбоос дээр дарна уу.
              </p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="mt-2">
              <p className="text-sm text-red-700">{message}</p>
              <button
                onClick={handleSendVerification}
                className="mt-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 transition-colors text-sm"
              >
                Дахин оролдох
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerificationReminder;