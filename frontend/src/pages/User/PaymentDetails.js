import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from "../../utils/api";
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import Breadcrumb from '../../components/common/Breadcrumb';

const PaymentDetail = () => {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    const fetchPaymentDetail = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/payments/${paymentId}`);
        
        if (response.data && response.data.payment) {
          setPayment(response.data.payment);
        } else {
          setError('Payment details not found.');
        }
      } catch (err) {
        setError('Failed to load payment details. Please try again later.');
        console.error('Error fetching payment details:', err);
      } finally {
        setLoading(false);
      }
    };

    if (paymentId) {
      fetchPaymentDetail();
    }
  }, [paymentId]);

  const handlePayNow = async () => {
    if (processingPayment || !payment || payment.status === 'paid') return;
    
    setProcessingPayment(true);
    
    try {
      const response = await api.post('/payments/process', { paymentId });
      
      if (response.data && response.data.success) {
        // Update payment status locally
        setPayment(prev => ({
          ...prev,
          status: 'paid',
          paidDate: new Date().toISOString()
        }));
      } else {
        setError('Payment processing failed. Please try again.');
      }
    } catch (err) {
      setError('Payment processing failed. Please try again.');
      console.error('Error processing payment:', err);
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleGoBack = () => {
    navigate('/user/payment');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumb navigation */}
        <div className="max-w-7xl mx-auto px-4 pt-2 sm:px-0">
          <Breadcrumb />
        </div>

        <div className="container mx-auto px-4 py-6">
          <ErrorAlert 
            message="Payment not found"
            onClose={() => navigate('/user/payment')}
          />
          <div className="mt-4">
            <button
              onClick={handleGoBack}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Payments
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb navigation */}
      <div className="max-w-7xl mx-auto px-4 pt-2 sm:px-0">
        <Breadcrumb />
      </div>

      <div className="container mx-auto px-4 py-6">
        {error && (
          <ErrorAlert 
            message={error}
            onClose={() => setError(null)}
          />
        )}
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Payment Details</h1>
          
          <button
            onClick={handleGoBack}
            className="inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
        </div>
        
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Payment #{payment.id} - {payment.description || 'Water Bill'}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {new Date(payment.dueDate).toLocaleDateString()} - {payment.apartmentName || 'Apartment'}
            </p>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Payment ID
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {payment.id}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Amount
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  ${payment.amount.toFixed(2)}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Status
                </dt>
                <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    payment.status === 'paid' 
                      ? 'bg-green-100 text-green-800' 
                      : new Date(payment.dueDate) < new Date() 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {payment.status === 'paid' ? 'Paid' : new Date(payment.dueDate) < new Date() ? 'Overdue' : 'Pending'}
                  </span>
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Due Date
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {new Date(payment.dueDate).toLocaleDateString()}
                </dd>
              </div>
              {payment.status === 'paid' && payment.paidDate && (
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Payment Date
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {new Date(payment.paidDate).toLocaleDateString()}
                  </dd>
                </div>
              )}
              {payment.paymentMethod && (
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Payment Method
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {payment.paymentMethod}
                  </dd>
                </div>
              )}
              {payment.description && (
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Description
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {payment.description}
                  </dd>
                </div>
              )}
            </dl>
          </div>
          {payment.status !== 'paid' && (
            <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handlePayNow}
                disabled={processingPayment}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {processingPayment ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Pay Now'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentDetail;