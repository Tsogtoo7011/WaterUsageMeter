import React, { useState, useEffect } from 'react';
import api from "../../utils/api";
import VerificationReminder from '../../components/common/verificationReminder';
import NoApartments from '../../components/common/NoApartment';
import Breadcrumb from '../../components/common/Breadcrumb';
import ApartmentSelector from '../../components/common/ApartmentSelector';
import WaterMeterCard from '../../components/MeterCounters/WaterMeterCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const MeterCounter = () => {
  const [user, setUser] = useState(null);
  const [waterMeters, setWaterMeters] = useState([]);
  const [months, setMonths] = useState([]);
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
    fetchApartmentsAndWaterMeterData();
  }, []);

  const fetchApartmentsAndWaterMeterData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const apartmentsResponse = await api.get('/user/Profile/Apartment');
      console.log('Apartments response:', apartmentsResponse.data);
      
      let userApartments = [];
      if (Array.isArray(apartmentsResponse.data)) {
        userApartments = apartmentsResponse.data;
      } else if (apartmentsResponse.data && Array.isArray(apartmentsResponse.data.apartments)) {
        userApartments = apartmentsResponse.data.apartments;
      } else if (apartmentsResponse.data && apartmentsResponse.data.success && Array.isArray(apartmentsResponse.data.data)) {
        userApartments = apartmentsResponse.data.data;
      }
      userApartments = (userApartments || []).filter(Boolean);

      setApartments(userApartments);
      setHasApartments(Array.isArray(userApartments) && userApartments.length > 0);
      

      if (userApartments.length > 0) {

        const defaultApartment = userApartments[0];
        const defaultApartmentId = defaultApartment.id || defaultApartment._id || defaultApartment.ApartmentId;
        console.log('Selected apartment ID:', defaultApartmentId);
        
        setSelectedApartmentId(defaultApartmentId);
        
        await fetchWaterMeterData(defaultApartmentId);
      } else {
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error fetching apartments:', err);
      try {
        const storedApartments = localStorage.getItem('userApartments');
        if (storedApartments) {
          const parsedApartments = JSON.parse(storedApartments);
          if (Array.isArray(parsedApartments) && parsedApartments.length > 0) {
            setApartments(parsedApartments);
            setHasApartments(true);
            const defaultApartmentId = parsedApartments[0].id || parsedApartments[0]._id || parsedApartments[0].ApartmentId;
            setSelectedApartmentId(defaultApartmentId);
            await fetchWaterMeterData(defaultApartmentId);
            return;
          }
        }
      } catch (localStorageErr) {
        console.error('Error reading apartments from localStorage:', localStorageErr);
      }
      
      setApartments([]);
      setHasApartments(false);
      setIsLoading(false);
    }
  };

  const fetchWaterMeterData = async (apartmentId = null) => {
    if (!apartmentId) {
      setWaterMeters([]);
      setHasReadings(false);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const url = `/water-meters/details?apartmentId=${apartmentId}`;
      const response = await api.get(url);
      console.log('Water meter response:', response.data);
      
      // Use backend's months array for correct status
      if (response.data && Array.isArray(response.data.months)) {
        setMonths(response.data.months);
        // Optionally, keep waterMeters for other uses
        setWaterMeters(Object.values(response.data.waterMeters || {}).flat());
        setHasReadings(response.data.months.some(m => m.status === "done"));
      } else {
        setMonths([]);
        setWaterMeters([]);
        setHasReadings(false);
      }
    } catch (err) {
      console.error('Error fetching water meter data:', err);
      if (err.response && err.response.status !== 404) {
        setError('Серверээс мэдээлэл авахад алдаа гарлаа.');
      }
      setWaterMeters([]);
      setHasReadings(false);
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
    
    console.log('Apartment changed to:', newApartmentId);
    setSelectedApartmentId(newApartmentId);
    fetchWaterMeterData(newApartmentId);
  };

  const totalPages = Math.ceil(months.length / itemsPerPage);
  const paginatedMonths = months.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getCurrentYearMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-white pb-12">
      <div className="px-4 sm:px-8 py-6">
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
            {apartments && apartments.length > 0 && (
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
            <LoadingSpinner />
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
              buttonHref="/profile/apartment"
              iconColor="blue"
            />
          ) : !hasReadings && selectedApartmentId ? (
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
                  href={`/user/metercounter/details?apartmentId=${selectedApartmentId}&month=${getCurrentYearMonth()}`}
                  className="px-6 py-3 text-white transition-all bg-[#2D6B9F]/90 rounded-md hover:bg-[#2D6B9F] focus:outline-none focus:ring-2 focus:ring-[#2D6B9F] focus:ring-offset-2"
                >
                  Заалт өгөх
                </a>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                {paginatedMonths.length === 0 ? (
                  <div className="col-span-full text-center text-gray-500 py-10">Тоолуурын мэдээлэл олдсонгүй</div>
                ) : (
                  paginatedMonths.map((monthObj, idx) => {
                    const { monthKey, year, month, status, readings } = monthObj;
                    // Sum all current readings by type
                    let hotTotal = 0, coldTotal = 0;
                    readings.forEach(meter => {
                      if (meter.type === 1) hotTotal += meter.indication;
                      else coldTotal += meter.indication;
                    });

                    let prevMeters = [];
                    const globalIdx = (currentPage - 1) * itemsPerPage + idx;
                    let prevDoneMonth = null;
                    for (let i = globalIdx + 1; i < months.length; i++) {
                      if (months[i].status === "done") {
                        prevDoneMonth = months[i];
                        break;
                      }
                    }
                    if (prevDoneMonth && prevDoneMonth.readings) {
                      prevMeters = prevDoneMonth.readings;
                    }

                    let prevHotTotal = 0, prevColdTotal = 0;
                    prevMeters.forEach(meter => {
                      if (meter.type === 1) prevHotTotal += meter.indication;
                      else prevColdTotal += meter.indication;
                    });

                    // Use integer values for diffs
                    const hotDiff = prevMeters.length === 0
                      ? hotTotal === 0 ? "0" : Math.round(hotTotal).toString()
                      : Math.round(hotTotal - prevHotTotal).toString();
                    const coldDiff = prevMeters.length === 0
                      ? coldTotal === 0 ? "0" : Math.round(coldTotal).toString()
                      : Math.round(coldTotal - prevColdTotal).toString();

                    return (
                      <WaterMeterCard
                        key={monthKey}
                        year={year}
                        month={String(month).padStart(2, '0')}
                        hot={hotDiff}
                        cold={coldDiff}
                        meters={readings}
                        apartmentId={selectedApartmentId}
                        status={status}
                        prevMeters={prevMeters}
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

export default MeterCounter;