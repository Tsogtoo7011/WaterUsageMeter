import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from "../../utils/api"; 
import PaymentsSummary from '../../components/payments/PaymentsSummary';
import PaymentsList from '../../components/payments/PaymentsList';
import ApartmentSelector from '../../components/common/ApartmentSelector';
import PaymentStatistics from '../../components/payments/PaymentStatatics'; 
import GeneratePayment from '../../components/payments/GeneratePayment';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';

const PaymentsPage = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({ total: 0, paid: 0, pending: 0 });
  const [apartments, setApartments] = useState([]);
  const [selectedApartmentId, setSelectedApartmentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [hasApartments, setHasApartments] = useState(true);
  const [activeTab, setActiveTab] = useState('payments'); // 'payments' or 'statistics'

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/payments');
      
      setPayments(response.data.payments);
      setSummary(response.data.summary);
      setApartments(response.data.apartments);
      setHasApartments(response.data.hasApartments);
      
      if (response.data.apartments.length > 0 && !selectedApartmentId) {
        setSelectedApartmentId(response.data.apartments[0].id);
      }
    } catch (err) {
      setError('Failed to load payments. Please try again later.');
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleApartmentChange = (apartmentId) => {
    setSelectedApartmentId(Number(apartmentId));
  };

  const handleViewPayment = (paymentId) => {
    navigate(`/payments/${paymentId}`);
  };

  const handlePayNow = async (paymentId) => {
    setLoading(true);
    
    try {
      await api.post('/payments/process', { paymentId });
      // Refresh payments after processing
      fetchPayments();
    } catch (err) {
      setError('Payment processing failed. Please try again.');
      console.error('Error processing payment:', err);
      setLoading(false);
    }
  };

  const handleGeneratePayment = () => {
    setShowGenerateModal(true);
  };

  const handleGenerateSuccess = () => {
    setShowGenerateModal(false);
    fetchPayments();
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  if (loading && payments.length === 0) {
    return <LoadingSpinner />;
  }

  if (!hasApartments) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You don't have any apartments registered in the system. Please contact the administrator to add your apartment.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Payments Management</h1>
      
      {error && <ErrorAlert message={error} onClose={() => setError(null)} />}
      
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <ApartmentSelector 
            apartments={apartments} 
            selectedApartmentId={selectedApartmentId}
            onChange={handleApartmentChange}
          />
          
          <button 
            onClick={handleGeneratePayment}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Generate Monthly Payment
          </button>
        </div>
      </div>
      
      <div className="mb-6">
        <PaymentsSummary summary={summary} />
      </div>
      
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'payments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => handleTabChange('payments')}
            >
              Payments
            </button>
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'statistics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => handleTabChange('statistics')}
            >
              Statistics
            </button>
          </nav>
        </div>
      </div>
      
      {activeTab === 'payments' ? (
        <PaymentsList 
          payments={payments} 
          onViewPayment={handleViewPayment}
          onPayNow={handlePayNow}
          loading={loading}
        />
      ) : (
        <PaymentStatistics apartmentId={selectedApartmentId} />
      )}
      
      {showGenerateModal && (
        <GeneratePayment
          apartmentId={selectedApartmentId}
          onClose={() => setShowGenerateModal(false)}
          onSuccess={handleGenerateSuccess}
        />
      )}
    </div>
  );
};

export default PaymentsPage;