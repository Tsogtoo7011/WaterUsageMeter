import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from "../../utils/api"; 
import Breadcrumb from '../../components/common/Breadcrumb';

export function MeterCounterDetails() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [waterMeterData, setWaterMeterData] = useState({});
  const [apartments, setApartments] = useState([]);
  const [selectedApartmentId, setSelectedApartmentId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Get apartment ID from URL if present
    const urlApartmentId = searchParams.get('apartmentId');
    
    fetchWaterMeterDetails(urlApartmentId);
  }, [searchParams]);
  
  const fetchWaterMeterDetails = async (apartmentId = null) => {
    try {
      setIsLoading(true);
      
      let url = '/water-meters/details';
      if (apartmentId) {
        url += `?apartmentId=${apartmentId}`;
      }
      
      const response = await api.get(url);
      
      if (response.data.success) {
        setWaterMeterData(response.data.waterMeters || {});
        setApartments(response.data.apartments || []);
        setSelectedApartmentId(response.data.selectedApartmentId);
        
        // Update URL if needed
        if (response.data.selectedApartmentId && !apartmentId) {
          setSearchParams({ apartmentId: response.data.selectedApartmentId });
        }
      } else {
        setError('Мэдээлэл авахад алдаа гарлаа.');
      }
    } catch (err) {
      console.error('Error fetching water meter details:', err);
      setError(err.response?.data?.message || 'Серверээс мэдээлэл авахад алдаа гарлаа.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleApartmentChange = (e) => {
    const newApartmentId = e.target.value;
    setSearchParams({ apartmentId: newApartmentId });
  };
  
  // Helper function to format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('mn-MN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  };
  
  const renderMonthlyData = () => {
    // If no data, show message
    if (Object.keys(waterMeterData).length === 0) {
      return (
        <div className="text-center py-10">
          <p className="text-gray-500">Тоолуурын мэдээлэл олдсонгүй</p>
        </div>
      );
    }
    
    // Render each month's data
    return Object.entries(waterMeterData).map(([month, readings]) => {
      const [year, monthNum] = month.split('-');
      const monthName = new Date(year, parseInt(monthNum) - 1, 1).toLocaleDateString('mn-MN', { month: 'long' });
      
      return (
        <div key={month} className="mb-8">
          <h2 className="text-xl font-semibold mb-4 bg-gray-100 p-3 rounded-lg">
            {monthName} {year}
          </h2>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Төрөл</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Байршил</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Заалт</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Огноо</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {readings.map((meter) => (
                  <tr key={meter.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{meter.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 rounded-full text-xs ${meter.type === 1 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                        {meter.typeText}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{meter.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{meter.indication}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(meter.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    });
  };
  
  // Added usage summary section for each month
  const renderMonthlySummary = (month, readings) => {
    let hotTotal = 0;
    let coldTotal = 0;
    
    readings.forEach(meter => {
      if (meter.type === 1) {
        hotTotal += meter.indication;
      } else {
        coldTotal += meter.indication;
      }
    });
    
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Нийт хэрэглээ</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-gray-500">Хүйтэн ус</p>
            <p className="text-xl font-bold text-blue-700">{coldTotal} м³</p>
          </div>
          <div className="bg-red-50 p-3 rounded-lg">
            <p className="text-sm text-gray-500">Халуун ус</p>
            <p className="text-xl font-bold text-red-700">{hotTotal} м³</p>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <p className="text-sm text-gray-500">Нийт</p>
            <p className="text-xl font-bold text-purple-700">{coldTotal + hotTotal} м³</p>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb navigation */}
      <div className="max-w-7xl mx-auto px-4 pt-2 sm:px-0">
        <Breadcrumb />
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">Усны тоолуурын дэлгэрэнгүй</h1>
          
          {/* Apartment Selector */}
          {apartments.length > 1 && (
            <div className="w-full md:w-1/3">
              <select 
                className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={selectedApartmentId || ''}
                onChange={handleApartmentChange}
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
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            <p>{error}</p>
          </div>
        ) : apartments.length === 0 ? (
          <div className="text-center py-10 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-700">Таны өмчлөлд орон сууц бүртгэгдээгүй байна.</p>
          </div>
        ) : (
          <div>
            {/* Current apartment info */}
            {selectedApartmentId && apartments.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <h2 className="text-lg font-semibold mb-2">
                  {apartments.find(apt => apt.id === selectedApartmentId)?.displayName || 'Орон сууц'}
                </h2>
              </div>
            )}
            
            {/* Monthly data */}
            {Object.entries(waterMeterData).map(([month, readings]) => {
              const [year, monthNum] = month.split('-');
              const monthName = new Date(year, parseInt(monthNum) - 1, 1).toLocaleDateString('mn-MN', { month: 'long' });
              
              return (
                <div key={month} className="mb-8">
                  <h2 className="text-xl font-semibold mb-4 bg-gray-100 p-3 rounded-lg">
                    {monthName} {year}
                  </h2>
                  
                  {renderMonthlySummary(month, readings)}
                  
                  <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Төрөл</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Байршил</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Заалт</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Огноо</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {readings.map((meter) => (
                          <tr key={meter.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{meter.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className={`px-2 py-1 rounded-full text-xs ${meter.type === 1 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                                {meter.typeText}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{meter.location}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{meter.indication}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(meter.date)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
            
            {Object.keys(waterMeterData).length === 0 && (
              <div className="text-center py-10">
                <p className="text-gray-500">Тоолуурын мэдээлэл олдсонгүй</p>
              </div>
            )}
          </div>
        )}
        
        {/* Back Button */}
        <div className="fixed bottom-6 right-6">
          <button
            onClick={() => navigate('/user/metercounter')}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition flex items-center shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Буцах
          </button>
        </div>
      </div>
    </div>
  );
}

export default MeterCounterDetails;