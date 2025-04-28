import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from "../../utils/api"; 
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';

const PaymentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [waterUsage, setWaterUsage] = useState({ cold: 0, hot: 0, total: 0 });
  const [costs, setCosts] = useState({ coldWater: 0, hotWater: 0, dirtyWater: 0, total: 0 });
  const [tariff, setTariff] = useState({ coldWater: 0, hotWater: 0, dirtyWater: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        const response = await api.get(`/payments/${id}`);
        setPayment(response.data.payment);
        setWaterUsage(response.data.waterUsage);
        setCosts(response.data.costs);
        setTariff(response.data.tariff);
      } catch (err) {
        setError('Failed to load payment details');
        console.error('Error fetching payment details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentDetails();
  }, [id]);

  const handlePayNow = async () => {
    setProcessing(true);
    
    try {
      await api.post('/payments/process', { paymentId: payment.id });
      // Refresh the payment details
      const response = await api.get(`/payments/${id}`);
      setPayment(response.data.payment);
    } catch (err) {
      setError('Payment processing failed. Please try again.');
      console.error('Error processing payment:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorAlert message={error} onClose={() => setError(null)} />;
  }

  if (!payment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-red-700">Payment not found</p>
          <button 
            onClick={handleBack}
            className="mt-4 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <button 
        onClick={handleBack}
        className="mb-4 flex items-center text-blue-500 hover:text-blue-700"
      >
        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Back to Payments
      </button>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            Payment Details
          </h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Information</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment ID:</span>
                    <span className="font-medium">{payment.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Apartment:</span>
                    <span className="font-medium">{payment.apartment.displayName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Date:</span>
                    <span className="font-medium">{formatDate(payment.payDate)}</span>
                  </div>
                  {payment.paidDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Paid Date:</span>
                      <span className="font-medium">{formatDate(payment.paidDate)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-medium ${
                      payment.status === 'PAID' 
                        ? 'text-green-600' 
                        : 'text-yellow-600'
                    }`}>
                      {payment.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-bold text-lg">₮{payment.amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Water Usage</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cold Water:</span>
                    <span className="font-medium">{waterUsage.cold} m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hot Water:</span>
                    <span className="font-medium">{waterUsage.hot} m³</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="text-gray-600">Total Usage:</span>
                    <span className="font-medium">{waterUsage.total} m³</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Cost Breakdown</h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-3 items-center gap-4">
                  <span className="text-gray-600">Cold Water</span>
                  <div className="text-sm text-gray-500">
                    {waterUsage.cold} m³ × ₮{tariff.coldWater} per m³
                  </div>
                  <div className="text-right font-medium">
                    ₮{costs.coldWater.toLocaleString()}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 items-center gap-4">
                  <span className="text-gray-600">Hot Water</span>
                  <div className="text-sm text-gray-500">
                    {waterUsage.hot} m³ × ₮{tariff.hotWater} per m³
                  </div>
                  <div className="text-right font-medium">
                    ₮{costs.hotWater.toLocaleString()}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 items-center gap-4">
                  <span className="text-gray-600">Sewage</span>
                  <div className="text-sm text-gray-500">
                    {waterUsage.total} m³ × ₮{tariff.dirtyWater} per m³
                  </div>
                  <div className="text-right font-medium">
                    ₮{costs.dirtyWater.toLocaleString()}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 items-center gap-4 border-t pt-4">
                  <span className="text-gray-800 font-bold">Total</span>
                  <div className="text-sm text-gray-500"></div>
                  <div className="text-right font-bold">
                    ₮{costs.total.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {payment.status === 'PENDING' && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={handlePayNow}
                disabled={processing}
                className={`${
                  processing 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-500 hover:bg-green-600'
                } text-white px-6 py-2 rounded-md`}
              >
                {processing ? 'Processing...' : 'Pay Now'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentDetails;