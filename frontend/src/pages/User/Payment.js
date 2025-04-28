import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from "../../utils/api";
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import PaymentsSummary from '../../components/payments/PaymentsSummary';
import PaymentsList from '../../components/payments/PaymentsList';
import PaymentStatistics from '../../components/payments/PaymentStatistics';

const Payment = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({ total: 0, paid: 0, pending: 0, overdue: 0 });
  const [apartments, setApartments] = useState([]);
  const [selectedApartment, setSelectedApartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch apartments first
  useEffect(() => {
    const fetchApartments = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await api.get('/payments');
        
        if (response.data && response.data.hasApartments) {
          setApartments(response.data.apartments || []);
          
          // Set default selected apartment if none is selected
          if (!selectedApartment && response.data.apartments && response.data.apartments.length > 0) {
            setSelectedApartment(response.data.apartments[0].id);
          }
        } else {
          // No apartments assigned to user
          setApartments([]);
        }
      } catch (err) {
        setError('Failed to load apartments. Please try again later.');
        console.error('Error fetching apartments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchApartments();
  }, []);

  // Fetch payments data for selected apartment
  useEffect(() => {
    const fetchPayments = async () => {
      if (!selectedApartment) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Modified to send apartmentId as a query parameter
        const response = await api.get(`/payments?apartmentId=${selectedApartment}`);
        
        if (response.data) {
          // Filter payments for the selected apartment only
          const filteredPayments = response.data.payments ? 
            response.data.payments.filter(payment => payment.apartmentId === selectedApartment) : 
            [];
          
          setPayments(filteredPayments);
          
          // Check if we need to generate payment for the current month
          checkAndGeneratePayment(filteredPayments);

          let totalAmount = 0;
          let paidAmount = 0;
          let pendingAmount = 0;
          let overdueAmount = 0;
          
          const today = new Date();
          
          filteredPayments.forEach(payment => {
            totalAmount += Number(payment.amount);
            
            if (payment.status === 'paid') {
              paidAmount += Number(payment.amount);
            } else {
              // Check if payment is overdue
              const dueDate = new Date(payment.dueDate);
              if (dueDate < today) {
                overdueAmount += Number(payment.amount);
              } else {
                pendingAmount += Number(payment.amount);
              }
            }
          });
          
          setSummary({
            total: totalAmount,
            paid: paidAmount,
            pending: pendingAmount,
            overdue: overdueAmount
          });
        }
      } catch (err) {
        setError('Failed to load payments. Please try again later.');
        console.error('Error fetching payments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [refreshKey, selectedApartment]);

  // New function to check and generate payment automatically if needed
  const checkAndGeneratePayment = async (existingPayments) => {
    if (!selectedApartment) return;
    
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // JS months are 0-indexed
    const currentYear = currentDate.getFullYear();
    
    // Check if we already have a payment for the current month
    const hasCurrentMonthPayment = existingPayments.some(payment => {
      const paymentDate = new Date(payment.payDate);
      return paymentDate.getMonth() + 1 === currentMonth && 
             paymentDate.getFullYear() === currentYear;
    });
    
    if (!hasCurrentMonthPayment) {
      try {
        // Generate payment for current month
        await api.post('/payments/generate', {
          apartmentId: selectedApartment
        });
        
        // Refresh to show the new payment
        handleRefresh();
      } catch (err) {
        console.error('Error generating automatic payment:', err);
      }
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  const handleViewPayment = (paymentId) => {
    navigate(`/user/payment/${paymentId}`);
  };

  const handlePayNow = async (paymentId) => {
    if (processingPayment) return;
    
    setProcessingPayment(true);
    
    try {
      await api.post('/payments/process', { paymentId });

      const paymentToUpdate = payments.find(p => p.id === paymentId);
      const paymentAmount = paymentToUpdate?.amount || 0;
      const wasOverdue = paymentToUpdate && new Date(paymentToUpdate.dueDate) < new Date();
      
      setPayments(prevPayments => 
        prevPayments.map(payment => 
          payment.id === paymentId 
            ? { ...payment, status: 'paid', paidDate: new Date().toISOString() } 
            : payment
        )
      );
 
      setSummary(prevSummary => {
        return {
          total: prevSummary.total,
          paid: prevSummary.paid + Number(paymentAmount),
          pending: wasOverdue ? prevSummary.pending : prevSummary.pending - Number(paymentAmount),
          overdue: wasOverdue ? prevSummary.overdue - Number(paymentAmount) : prevSummary.overdue
        };
      });
      handleRefresh();
    } catch (err) {
      setError('Payment processing failed. Please try again.');
      console.error('Error processing payment:', err);
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleApartmentChange = (e) => {
    setSelectedApartment(Number(e.target.value));
  };

  if (loading && apartments.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {error && (
        <ErrorAlert 
          message={error} 
          onClose={() => setError(null)} 
        />
      )}
      
      <div className="flex flex-col md:flex-row justify-between items-start mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Water Payments</h1>
        
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 w-full md:w-auto">
          {apartments.length > 0 && (
            <div className="w-full md:w-auto">
              <select
                value={selectedApartment || ''}
                onChange={handleApartmentChange}
                className="block w-full bg-white border border-gray-300 rounded-md py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {apartments.map(apt => (
                  <option key={apt.id} value={apt.id}>
                    {apt.displayName}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div className="flex space-x-2 w-full md:w-auto">
            <button
              onClick={handleRefresh}
              className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>
      
      {apartments.length === 0 ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You don't have any apartments assigned. Please contact your administrator.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <PaymentsSummary summary={summary} />
          
          <div className="mt-8 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Payments</h2>
            <PaymentsList 
              payments={payments} 
              onViewPayment={handleViewPayment} 
              onPayNow={handlePayNow}
              loading={processingPayment}
            />
          </div>
          
          <div className="mt-8">
            <PaymentStatistics 
              apartmentId={selectedApartment} 
              refreshKey={refreshKey} 
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Payment;