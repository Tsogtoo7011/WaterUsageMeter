import React, { useState } from 'react';
import api from "../../utils/api"; 

const GeneratePayment = ({ apartmentId, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [paymentData, setPaymentData] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/payments/generate', {
        apartmentId: apartmentId
      });
      
      setSuccess(true);
      setPaymentData(response.data);
      setTimeout(() => {
        onSuccess();
      }, 2000);
      
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to generate payment. Please try again.');
      }
      console.error('Error generating payment:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-xl mx-4 md:mx-auto w-full max-w-md">
        <div className="flex justify-between items-center p-5 border-b">
          <h3 className="text-lg font-medium text-gray-900">Generate Monthly Payment</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {success ? (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="mt-3 text-lg font-medium text-gray-900">Payment Generated Successfully</h3>
              
              {paymentData && (
                <div className="mt-4 text-left bg-gray-50 p-4 rounded-md">
                  <div className="mb-2">
                    <span className="text-gray-600">Water Usage:</span>
                    <div className="ml-4 text-sm">
                      <div>Cold: {paymentData.waterUsage.cold} m³</div>
                      <div>Hot: {paymentData.waterUsage.hot} m³</div>
                      <div>Total: {paymentData.waterUsage.total} m³</div>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-gray-600">Total Amount:</span>
                    <div className="ml-4 text-lg font-bold">
                      ₮{paymentData.costs.total.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mt-5">
                <button
                  type="button"
                  onClick={onSuccess}
                  className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-gray-600 mb-6">
                This will generate a new payment for the current month based on your water meter readings. Continue?
              </p>
              
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 ${
                    loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  } text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2`}
                >
                  {loading ? 'Generating...' : 'Generate Payment'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeneratePayment;