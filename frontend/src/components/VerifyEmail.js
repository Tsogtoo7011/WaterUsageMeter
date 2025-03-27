import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';

function VerifyEmail() {
  const { token } = useParams();
  const [verificationStatus, setVerificationStatus] = useState('pending');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/auth/verify/${token}`);
        setVerificationStatus('success');
      } catch (error) {
        setVerificationStatus('error');
        console.error('Verification error:', error);
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-xl shadow-lg text-center">
        {verificationStatus === 'pending' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Verifying...</h2>
            <p className="text-gray-600">Please wait while we verify your email.</p>
          </div>
        )}
        
        {verificationStatus === 'success' && (
          <div>
            <h2 className="text-2xl font-bold text-green-600 mb-4">Email Verified!</h2>
            <p className="text-gray-600 mb-6">Your email has been successfully verified.</p>
            <Link 
              to="/signin" 
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Go to Sign In
            </Link>
          </div>
        )}
        
        {verificationStatus === 'error' && (
          <div>
            <h2 className="text-2xl font-bold text-red-600 mb-4">Verification Failed</h2>
            <p className="text-gray-600 mb-6">The verification link may be invalid or expired.</p>
            <Link 
              to="/resend-verification" 
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Resend Verification Email
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default VerifyEmail;