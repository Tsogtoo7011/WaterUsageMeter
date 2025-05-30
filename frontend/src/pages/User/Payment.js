import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from "../../utils/api";
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PaymentsSummary from '../../components/payments/PaymentsSummary';
import PaymentsList from '../../components/payments/PaymentsList';
import PaymentStatistics from '../../components/payments/PaymentStatistics';
import Breadcrumb from '../../components/common/Breadcrumb';
import NoApartment from '../../components/common/NoApartment';
import ApartmentSelector from '../../components/common/ApartmentSelector';

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

  useEffect(() => {
    const fetchApartments = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/payments');
        if (response.data && response.data.hasApartments) {
          setApartments(response.data.apartments || []);
        } else {
          setApartments([]);
        }
      } catch (err) {
        setError('Түрээслэгчийн мэдээлэл авахад алдаа гарлаа. Дахин оролдоно уу.');
        console.error('Error fetching apartments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchApartments();
  }, []);

  useEffect(() => {
    if (
      apartments.length > 0 &&
      (selectedApartment === null ||
        !apartments.some(
          a =>
            String(a.id || a.ApartmentId || a._id) === String(selectedApartment)
        ))
    ) {
      const firstId = String(apartments[0].id || apartments[0].ApartmentId || apartments[0]._id);
      setSelectedApartment(firstId);
    }
  }, [apartments]); 

  useEffect(() => {
    if (!selectedApartment) return;

    const fetchPayments = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await api.get(`/payments?apartmentId=${selectedApartment}`);
        
        if (response.data) {
          const filteredPayments = response.data.payments
            ? response.data.payments.filter(
                payment => String(payment.ApartmentId) === String(selectedApartment)
              )
            : [];
          
          setPayments(filteredPayments);
          if (response.data.summary) {
            setSummary(response.data.summary);
          } else {
            let totalAmount = 0;
            let paidAmount = 0;
            let pendingAmount = 0;
            let overdueAmount = 0;
            filteredPayments.forEach(payment => {
              totalAmount += Number(payment.amount);
              if (payment.status === 'paid') paidAmount += Number(payment.amount);
              else if (payment.status === 'overdue') overdueAmount += Number(payment.amount);
              else if (payment.status === 'pending') pendingAmount += Number(payment.amount);
            });
            setSummary({
              total: totalAmount,
              paid: paidAmount,
              pending: pendingAmount,
              overdue: overdueAmount
            });
          }
        }
      } catch (err) {
        setError('Төлбөрийн мэдээлэл авахад алдаа гарлаа. Дахин оролдоно уу.');
        console.error('Error fetching payments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [refreshKey, selectedApartment]);

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
      // Use backend status directly
      const status = paymentToUpdate?.status;
      const wasOverdue = status === 'overdue';

      setPayments(prevPayments => 
        prevPayments.map(payment => 
          payment.id === paymentId 
            ? { 
                ...payment, 
                status: 'paid', 
                paidDate: new Date().toISOString() 
              } 
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
      setRefreshKey(prev => prev + 1); 
    } catch (err) {
      setError('Төлбөрийн процессын үед алдаа гарлаа. Дахин оролдоно уу.');
      console.error('Error processing payment:', err);
    } finally {
      setProcessingPayment(false);
    }
  };

  // Accept both string and event for apartment change
  const handleApartmentChange = (apartmentIdOrEvent) => {
    const newApartmentId =
      typeof apartmentIdOrEvent === 'string'
        ? apartmentIdOrEvent
        : apartmentIdOrEvent.target.value;
    setSelectedApartment(newApartmentId);
  };

  if (loading && apartments.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="px-4 sm:px-8 pt-4">
        <div className="max-w-7xl mx-auto pt-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#2D6B9F]">
              Төлбөрүүд (Ус, үйлчилгээ)
            </h1>
            <div className="px-4 pt-2 sm:px-0">
              <Breadcrumb />
            </div>
            <p className="text-gray-600 mt-2">
              Өөрийн байрны ус болон үйлчилгээний төлбөрийн мэдээлэл, төлөлтийн түүх
            </p>
          </div>
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 w-full md:w-auto">
            {apartments.length > 0 && (
              <ApartmentSelector
                apartments={apartments}
                selectedApartment={selectedApartment}
                onChange={handleApartmentChange}
              />
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto py-6 px-0 sm:px-0 lg:px-0">
          {error && (
            <div className="bg-red-50 p-4 rounded-md max-w-md mx-auto mb-6">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {apartments.length === 0 ? (
            <NoApartment />
          ) : (
            <>
              <div className="mt-6">
                <PaymentsSummary summary={summary} />
              </div>
              <div className="mt-8 mb-8">
                <h2 className="text-xl font-semibold text-[#2D6B9F] mb-4">Сүүлийн төлөлтүүд</h2>
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
      </div>
    </div>
  );
};

export default Payment;