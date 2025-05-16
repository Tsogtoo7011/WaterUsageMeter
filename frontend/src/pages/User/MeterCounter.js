import React, { useState, useEffect } from 'react';
import api from "../../utils/api";
import VerificationReminder from '../../components/common/verificationReminder';
import NoApartments from '../../components/common/NoApartment';
import Breadcrumb from '../../components/common/Breadcrumb';
import ApartmentSelector from '../../components/common/ApartmentSelector';

// Water Meter Card Component
const WaterMeterCard = ({ year, month, hot, cold }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition group">
      <div className="flex justify-between items-center border-b border-gray-100 px-4 py-3">
        <div className="flex items-center">
          <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div className="text-sm text-gray-800">{year}-{month} сар</div>
        </div>
        <div className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
          Дууссан
        </div>
      </div>
      <div className="p-3">
        <div className="text-sm text-gray-800 mb-3">
          Халуун ус: {hot} м³&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Хүйтэн ус: {cold} м³
        </div>
        <a 
          href="/user/watercounter/details"
          className="block w-full bg-blue-500 text-white py-2 rounded text-sm text-center"
        >
          Дэлгэрэнгүй
        </a>
      </div>
    </div>
  );
};

const WaterCounter = () => {
  const [user, setUser] = useState(null);
  const [waterMeters, setWaterMeters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasApartments, setHasApartments] = useState(true);
  const [hasReadings, setHasReadings] = useState(true);
  const [apartments, setApartments] = useState([]);
  const [selectedApartmentId, setSelectedApartmentId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const MONGOLIAN_MONTHS = [
    '1-р сар', '2-р сар', '3-р сар', '4-р сар', '5-р сар', '6-р сар',
    '7-р сар', '8-р сар', '9-р сар', '10-р сар', '11-р сар', '12-р сар'
  ];

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchWaterMeterData();
  }, []);

  const fetchWaterMeterData = async (apartmentId = null) => {
    try {
      setIsLoading(true);
      setError(null);
      const url = apartmentId 
        ? `/water-meters/user?apartmentId=${apartmentId}`
        : '/water-meters/user';
      const response = await api.get(url);
      if (response.data.success) {
        setWaterMeters(response.data.waterMeters || []);
        setHasReadings(response.data.hasReadings !== false);
        setHasApartments(response.data.hasApartments !== false);
        setApartments(response.data.apartments || []);
        setSelectedApartmentId(response.data.selectedApartmentId || null);
      } else {
        setError('Мэдээлэл авахад алдаа гарлаа.');
        setHasApartments(false);
      }
    } catch (err) {
      console.error('Error fetching water meter data:', err);
      if (err.response && err.response.data) {
        if (err.response.data.hasApartments === false) {
          setHasApartments(false);
          setError(null);
        } else {
          setError('Серверээс мэдээлэл авахад алдаа гарлаа.');
        }
      } else {
        setError('Серверээс мэдээлэл авахад алдаа гарлаа.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationSuccess = () => {
    setUser(prev => ({
      ...prev,
      IsVerified: true
    }));
  };

  const handleApartmentChange = (apartmentIdOrEvent) => {
    const newApartmentId = typeof apartmentIdOrEvent === 'string'
      ? apartmentIdOrEvent
      : apartmentIdOrEvent.target.value;
    setSelectedApartmentId(newApartmentId);
    fetchWaterMeterData(newApartmentId);
  };

  // Group water meters by month (YYYY-MM)
  const groupedByMonth = React.useMemo(() => {
    if (!Array.isArray(waterMeters)) return {};
    return waterMeters.reduce((acc, meter) => {
      const date = meter.date ? new Date(meter.date) : null;
      if (!date) return acc;
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!acc[monthKey]) acc[monthKey] = [];
      acc[monthKey].push(meter);
      return acc;
    }, {});
  }, [waterMeters]);

  const monthKeys = Object.keys(groupedByMonth).sort((a, b) => b.localeCompare(a));
  const totalPages = Math.ceil(monthKeys.length / itemsPerPage);
  const paginatedMonthKeys = monthKeys.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="min-h-screen bg-white">
      <div className="px-4 sm:px-8 pt-4">
        <div className="max-w-7xl mx-auto pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#2D6B9F]">
              Тоолуурын заалт
            </h1>
            <div className="px-4 pt-2 sm:px-0">
              <Breadcrumb />
            </div>
            <p className="text-gray-600 mt-2">
              Та өөрийн байрны усны хэрэглээ, заалтыг эндээс хянах боломжтой.
            </p>
          </div>
          <div className="flex flex-col items-end mt-4 sm:mt-0">
            {apartments && apartments.length > 1 && (
              <div className="min-w-[220px] ml-0 sm:ml-6">
                <ApartmentSelector
                  apartments={apartments}
                  selectedApartment={selectedApartmentId}
                  onChange={handleApartmentChange}
                />
              </div>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-0 py-6">
          {user && !user.IsVerified && (
            <div className="w-full max-w-3xl mb-6">
              <VerificationReminder user={user} onVerify={handleVerificationSuccess} />
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2D6B9F]"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mt-6 max-w-md mx-auto">
              <strong className="font-bold">Алдаа!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          ) : !hasApartments ? (
            <NoApartments 
              title="Таньд холбоотой байр байхгүй байна"
              description="Усны тоолуурын мэдээлэл харахын тулд эхлээд байраа бүртгүүлнэ үү."
              buttonText="Байр нэмэх"
              buttonHref="/user/profile/apartment"
              iconColor="blue"
            />
          ) : !hasReadings ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] w-full">
              <div className="flex flex-col items-center justify-center w-full max-w-3xl p-8 mb-6 text-center bg-white border border-[#2D6B9F]/30 rounded-lg shadow">
                <div className="mb-4 text-[#2D6B9F]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="mb-4 text-xl font-bold text-gray-800">Тоолуурын мэдээлэл олдсонгүй</h2>
                <p className="mb-6 text-gray-600">Та тоолуурын заалтаа өгнө үү.</p>
                <a 
                  href="/user/watercounter/details"
                  className="px-6 py-3 text-white transition-all bg-[#2D6B9F]/90 rounded-md hover:bg-[#2D6B9F] focus:outline-none focus:ring-2 focus:ring-[#2D6B9F] focus:ring-offset-2"
                >
                  Заалт өгөх
                </a>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                {paginatedMonthKeys.length === 0 ? (
                  <div className="col-span-full text-center text-gray-500 py-10">Тоолуурын мэдээлэл олдсонгүй</div>
                ) : (
                  paginatedMonthKeys.map((monthKey) => {
                    const meters = groupedByMonth[monthKey];
                    let hot = 0, cold = 0;
                    meters.forEach(meter => {
                      if (meter.type === 1) hot += meter.indication;
                      else cold += meter.indication;
                    });
                    
                    const [year, month] = monthKey.split('-');
                    
                    return (
                      <WaterMeterCard
                        key={monthKey}
                        year={year}
                        month={month}
                        hot={hot}
                        cold={cold}
                      />
                    );
                  })
                )}
              </div>
              
              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8 items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    className={`w-8 h-8 flex items-center justify-center rounded-full border ${
                      currentPage === 1
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "border-[#2D6B9F] text-[#2D6B9F] hover:bg-blue-50"
                    } transition font-bold text-sm`}
                    title="Өмнөх"
                    disabled={currentPage === 1}
                  >
                    &lt;
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, index) => index + 1)
                    .filter((page) => {
                      return (
                        page <= 2 ||
                        page > totalPages - 2 ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      );
                    })
                    .map((page, index, pages) => (
                      <React.Fragment key={page}>
                        {index > 0 && page !== pages[index - 1] + 1 && (
                          <span className="text-gray-500">...</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 flex items-center justify-center rounded-full text-sm ${
                            currentPage === page
                              ? "bg-[#2D6B9F] text-white"
                              : "border border-[#2D6B9F] text-[#2D6B9F] hover:bg-blue-50"
                          } transition`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    ))}
                    
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    className={`w-8 h-8 flex items-center justify-center rounded-full border ${
                      currentPage === totalPages
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "border-[#2D6B9F] text-[#2D6B9F] hover:bg-blue-50"
                    } transition font-bold text-sm`}
                    title="Дараах"
                    disabled={currentPage === totalPages}
                  >
                    &gt;
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WaterCounter;