import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from "../../utils/api";
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PaymentsSummary from '../../components/payments/PaymentsSummary';
import PaymentsList from '../../components/payments/PaymentsList';
import PaymentStatistics from '../../components/payments/PaymentStatistics';
import Breadcrumb from '../../components/common/Breadcrumb';
import NoApartment from '../../components/common/NoApartment';

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
          
          // Set default selected apartment if none is selected
          if (!selectedApartment && response.data.apartments && response.data.apartments.length > 0) {
            setSelectedApartment(response.data.apartments[0].id);
          }
        } else {
          // No apartments assigned to user
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

          let totalAmount = 0;
          let paidAmount = 0;
          let pendingAmount = 0;
          let overdueAmount = 0;
          
          const today = new Date();
          
          filteredPayments.forEach(payment => {
            totalAmount += Number(payment.amount);

            let status = payment.status;
            let statusKey;
            switch (status) {
              case 'Төлөгдсөн': statusKey = 'paid'; break;
              case 'Төлөгдөөгүй': statusKey = 'pending'; break;
              case 'Хоцорсон': statusKey = 'overdue'; break;
              case 'Цуцлагдсан': statusKey = 'cancelled'; break;
              default: statusKey = 'pending';
            }
            if (statusKey === 'paid') {
              paidAmount += Number(payment.amount);
            } else if (statusKey === 'overdue') {
              overdueAmount += Number(payment.amount);
            } else if (statusKey === 'pending') {
              pendingAmount += Number(payment.amount);
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
      // Map DB status to UI status
      let status = paymentToUpdate?.status;
      let statusKey;
      switch (status) {
        case 'Төлөгдсөн': statusKey = 'paid'; break;
        case 'Төлөгдөөгүй': statusKey = 'pending'; break;
        case 'Хоцорсон': statusKey = 'overdue'; break;
        case 'Цуцлагдсан': statusKey = 'cancelled'; break;
        default: statusKey = 'pending';
      }
      const wasOverdue = statusKey === 'overdue';

      const translateStatus = (status) => {
        switch (status) {
          case 'paid': return 'Төлөгдсөн';
          case 'pending': return 'Хүлээгдэж буй';
          case 'overdue': return 'Хоцорсон';
          case 'cancelled': return 'Цуцлагдсан';
          default: return status;
        }
      };
      
      setPayments(prevPayments => 
        prevPayments.map(payment => 
          payment.id === paymentId 
            ? { 
                ...payment, 
                status: 'Төлөгдсөн', 
                statusMn: 'Төлөгдсөн',
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
      handleRefresh();
    } catch (err) {
      setError('Төлбөрийн процессын үед алдаа гарлаа. Дахин оролдоно уу.');
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
    <div className="min-h-screen bg-white">
      <div className="px-4 sm:px-8 pt-4">
        <div className="max-w-7xl mx-auto pt-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#2D6B9F]">
              Усны хэрэглээний төлбөр
            </h1>
            <div className="px-4 pt-2 sm:px-0">
              <Breadcrumb />
            </div>
            <p className="text-gray-600 mt-2">
              Өөрийн байрны усны төлбөрийн мэдээлэл, төлөлтийн түүх
            </p>
          </div>
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 w-full md:w-auto">
            {apartments.length > 0 && (
              <div className="w-full md:w-auto">
                <select
                  value={selectedApartment || ''}
                  onChange={handleApartmentChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2D6B9F] focus:border-[#2D6B9F] text-gray-700 text-sm"
                >
                  {apartments.map(apt => (
                    <option key={apt.id} value={apt.id}>
                      {apt.displayName}
                    </option>
                  ))}
                </select>
              </div>
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