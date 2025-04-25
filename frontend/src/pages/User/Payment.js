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
import NoApartments from '../../components/common/NoApartment';
import VerificationReminder from '../../components/common/verificationReminder';

const Payment = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({ total: 0, paid: 0, pending: 0 });
  const [apartments, setApartments] = useState([]);
  const [selectedApartmentId, setSelectedApartmentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [hasApartments, setHasApartments] = useState(true);
  const [activeTab, setActiveTab] = useState('payments'); 

  useEffect(() => {
    // Get user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    fetchPayments();
  }, []);

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

  const handleVerificationSuccess = () => {
    setUser(prev => ({
      ...prev,
      IsVerified: true
    }));
  };

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
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-screen">
        {user && !user.IsVerified && (
          <div className="w-full max-w-3xl mb-6 mx-auto">
            <VerificationReminder user={user} onVerify={handleVerificationSuccess} />
          </div>
        )}
        <NoApartments 
          title="Таньд холбоотой байр байхгүй байна" 
          description="Төлбөрийн мэдээлэл харахын тулд эхлээд байраа бүртгүүлнэ үү."
          buttonText="Байр нэмэх"
          buttonHref="/user/profile/apartment"
          iconColor="blue"
        />
      </div>
    );
  }
  return (
    <div className="container mx-auto px-4 py-8">
      {user && !user.IsVerified && (
        <div className="w-full max-w-3xl mb-6 mx-auto">
          <VerificationReminder user={user} onVerify={handleVerificationSuccess} />
        </div>
      )}
      
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

export default Payment;