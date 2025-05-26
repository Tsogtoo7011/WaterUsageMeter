import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from "../../utils/api";
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import Breadcrumb from '../../components/common/Breadcrumb';

const PaymentDetail = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  const [costs, setCosts] = useState(null);
  const [waterUsage, setWaterUsage] = useState(null);
  const [tariff, setTariff] = useState(null);

  useEffect(() => {
    const fetchPaymentDetail = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/payments/${id}`); 
        
        if (response.data && response.data.payment) {
          setPayment(response.data.payment);
          if (response.data.costs) setCosts(response.data.costs);
          if (response.data.waterUsage) setWaterUsage(response.data.waterUsage);
          if (response.data.tariff) setTariff(response.data.tariff);
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

    if (id) {
      fetchPaymentDetail();
    }
  }, [id]);

  const handlePayNow = async () => {
    if (processingPayment || !payment || payment.status === 'paid') return;
    
    setProcessingPayment(true);
    
    try {
      const response = await api.post('/payments/process', { paymentId: id }); // <-- use id
      
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
    navigate('/user/payment-info');
  };

  const getStatusKey = (status) => {
    switch (status) {
      case 'Төлөгдсөн': return 'paid';
      case 'Төлөгдөөгүй': return 'pending';
      case 'Хоцорсон': return 'overdue';
      case 'Цуцлагдсан': return 'cancelled';
      default: return 'pending';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="px-4 sm:px-8 pt-4">
          <Breadcrumb />
        </div>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2D6B9F]"></div>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-white">
        <div className="px-4 sm:px-8 pt-4">
          <Breadcrumb />
        </div>
        <div className="flex flex-col items-center justify-center py-16">
          <ErrorAlert 
            message="Төлбөр олдсонгүй"
            onClose={() => navigate('/user/payment')}
          />
          <button
            onClick={handleGoBack}
            className="mt-6 flex items-center px-4 py-2 bg-[#2D6B9F]/90 text-white rounded-md hover:bg-[#2D6B9F]"
          >
            <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Төлбөрүүд рүү буцах
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="px-4 sm:px-8 py-6">
        <div className="flex mb-4 justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={handleGoBack}
              className="flex items-center px-2 py-1"
              style={{ color: "#2D6B9F" }}
              title="Буцах"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <span className="text-2xl font-bold text-[#2D6B9F] ml-3 select-none">Төлбөрийн дэлгэрэнгүй</span>
          </div>
        </div>
        <div className="px-4 pt-2 sm:px-0">
          <Breadcrumb />
        </div>
        <div className="w-full flex flex-col md:flex-row p-6 bg-white rounded-lg shadow-sm">
          <div className="md:flex-[3_3_0%] pr-4 pb-6">
            <h1 className="text-xl font-bold text-[#2D6B9F] mb-4">Төлбөр #{payment.id}</h1>
            <div className="flex items-center text-sm text-gray-500 mb-6">
              <span>{payment.apartmentName || 'Огноо'}</span>
              <span className="mx-2">•</span>
              <span>{new Date(payment.dueDate).toLocaleDateString()}</span>
            </div>
            <div className="mb-4 grid grid-cols-1 gap-4">
              <div>
                <h3 className="text-sm text-[#2D6B9F] font-semibold mb-1">Төлбөрийн дугаар</h3>
                <p className="text-gray-700">{payment.id}</p>
              </div>
              <div>
                <h3 className="text-sm text-[#2D6B9F] font-semibold mb-1">Дүн</h3>
                <p className="text-gray-700">₮{Number(payment.amount).toFixed(2)}</p>
              </div>
              <div>
                <h3 className="text-sm text-[#2D6B9F] font-semibold mb-1">Төлөв</h3>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  getStatusKey(payment.status) === 'paid'
                    ? 'bg-green-100 text-green-800'
                    : getStatusKey(payment.status) === 'overdue'
                      ? 'bg-red-100 text-red-800'
                      : getStatusKey(payment.status) === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                }`}>
                  {getStatusKey(payment.status) === 'paid'
                    ? 'Төлөгдсөн'
                    : getStatusKey(payment.status) === 'overdue'
                      ? 'Хоцорсон'
                      : getStatusKey(payment.status) === 'pending'
                        ? 'Хүлээгдэж буй'
                        : 'Цуцлагдсан'}
                </span>
              </div>
              <div>
                <h3 className="text-sm text-[#2D6B9F] font-semibold mb-1">Төлөх хугацаа</h3>
                <p className="text-gray-700">{new Date(payment.dueDate).toLocaleDateString()}</p>
              </div>
              {payment.status === 'paid' && payment.paidDate && (
                <div>
                  <h3 className="text-sm text-green-700 font-semibold mb-1">Төлсөн огноо</h3>
                  <p className="text-gray-700">{new Date(payment.paidDate).toLocaleDateString()}</p>
                </div>
              )}
              {payment.paymentMethod && (
                <div>
                  <h3 className="text-sm text-[#2D6B9F] font-semibold mb-1">Төлбөрийн арга</h3>
                  <p className="text-gray-700">{payment.paymentMethod}</p>
                </div>
              )}
              {payment.description && (
                <div>
                  <h3 className="text-sm text-[#2D6B9F] font-semibold mb-1">Тайлбар</h3>
                  <p className="text-gray-700">{payment.description}</p>
                </div>
              )}
            </div>
          </div>
          <div className="hidden md:block w-px bg-gray-300 mx-1"></div>
          <div className="md:flex-[7_7_0%] md:pl-4 flex flex-col h-full">
            {error && (
              <div className="p-4 mb-4 bg-red-100 text-red-700 rounded-lg">
                <p>{error}</p>
              </div>
            )}

            {(costs || waterUsage) && (
              <div className="mb-6">
                <div className=" border border-gray-200 rounded-lg p-0 shadow-sm divide-y divide-[#2D6B9F]/50">
                  <h3 className="text-lg font-semibold text-[#2D6B9F]  px-4 pt-4 pb-2">Төлбөрийн задаргаа</h3>
                  <ul className="divide-y divide-gray-200 ">
                    {waterUsage && (
                      <>
                        <li className="flex justify-between px-4 py-2 hover:bg-blue-50/50 transition">
                          <span className="text-gray-600">Хүйтэн усны хэрэглээ</span>
                          <span className="text-[#2D6B9F]">{waterUsage.cold} м³</span>
                        </li>
                        <li className="flex justify-between px-4 py-2 hover:bg-blue-50/50 transition">
                          <span className="text-gray-600">Халуун усны хэрэглээ</span>
                          <span className="text-[#2D6B9F]">{waterUsage.hot} м³</span>
                        </li>
                        <li className="flex justify-between px-4 py-2 hover:bg-blue-50/50 transition">
                          <span className="text-gray-600">Нийт хэрэглээ</span>
                          <span className="text-[#2D6B9F]">{waterUsage.total} м³</span>
                        </li>
                        <li className="flex justify-between px-4 py-2 hover:bg-blue-50/50 transition">
                          <span className="text-gray-600">Хүйтэн усны төлбөр</span>
                          <span className="text-[#2D6B9F]">₮{Number(costs.coldWater).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </li>
                        <li className="flex justify-between px-4 py-2 hover:bg-blue-50/50 transition">
                          <span className="text-gray-600">Халуун усны төлбөр</span>
                          <span className="text-[#2D6B9F]">₮{Number(costs.hotWater).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </li>
                        <li className="flex justify-between px-4 py-2 hover:bg-blue-50/50 transition">
                          <span className="text-gray-600">Бохир усны төлбөр</span>
                          <span className="text-[#2D6B9F]">₮{Number(costs.dirtyWater).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </li>
                        <li className="flex justify-between px-4 py-2 bg-blue-50 font-bold text-[#2D6B9F]">
                          <span>Нийт төлбөр</span>
                          <span className="text-[#2D6B9F]">₮{Number(costs.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </li>
                      </>
                    )}
                  </ul>
                  {tariff && (
                    <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-100 bg-gray-50">
                      Тариф: Хүйтэн ус <span className="text-[#2D6B9F]">₮{tariff.coldWater}</span>, Халуун ус <span className="text-[#2D6B9F]">₮{tariff.hotWater}</span>, Бохир ус <span className="text-[#2D6B9F]">₮{tariff.dirtyWater}</span> /м³
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="flex flex-col justify-between h-full">
              <div className="flex-1">
                {/* Additional details or payment info can go here */}
              </div>
              {payment.status !== 'paid' && (
                <div className="flex justify-end mt-6">
                  <button
                    type="button"
                    onClick={handlePayNow}
                    disabled={processingPayment}
                    className="bg-[#2D6B9F]/90 text-white hover:bg-[#2D6B9F] flex items-center justify-center px-4 py-2 border rounded text-sm font-medium transition duration-200 disabled:opacity-50"
                    style={{ borderColor: "#2D6B9F", minWidth: "120px" }}
                  >
                    {processingPayment ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Боловсруулж байна...
                      </>
                    ) : (
                      'Одоо төлөх'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetail;