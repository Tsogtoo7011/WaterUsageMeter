import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from "../../utils/api";
import Breadcrumb from '../../components/common/Breadcrumb';

export default function MeterCounter() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [coldValue, setColdValue] = useState('');
  const [hotValue, setHotValue] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('Ванн');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [waterMeterData, setWaterMeterData] = useState({});
  const [apartments, setApartments] = useState([]);
  const [selectedApartmentId, setSelectedApartmentId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [hasExistingReadings, setHasExistingReadings] = useState(false);

  useEffect(() => {
    // Get apartment ID from URL if present
    const urlApartmentId = searchParams.get('apartmentId');
    fetchWaterMeterData(urlApartmentId);
  }, [searchParams]);

  const fetchWaterMeterData = async (apartmentId = null) => {
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
        
        const newSelectedId = response.data.selectedApartmentId || 
          (response.data.apartments && response.data.apartments.length > 0 ? 
            response.data.apartments[0].id : null);
        
        setSelectedApartmentId(newSelectedId);
        
        // Check if current month has readings
        const currentDate = new Date();
        const currentYearMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        
        setHasExistingReadings(!!response.data.waterMeters[currentYearMonth]);
        
        // Update URL if needed
        if (newSelectedId && !apartmentId) {
          setSearchParams({ apartmentId: newSelectedId });
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
    setEditMode(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('mn-MN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  };

  const handleSubmit = async () => {
    if (!coldValue || (selectedLocation !== 'Нойл' && !hotValue)) {
      setError('Бүх байршлын хүйтэн болон халуун усны тоолуурын заалтыг оруулна уу.');
      return;
    }

    if (!selectedLocation) {
      setError('Тоолуурын байршлыг сонгоно уу.');
      return;
    }

    if (!selectedApartmentId) {
      setError('Орон сууц сонгоно уу.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);
      
      // Prepare readings array for API
      const readings = [
        {
          type: 0, // Cold water
          location: selectedLocation,
          indication: parseFloat(coldValue)
        }
      ];

      if (selectedLocation !== 'Нойл') {
        readings.push({
          type: 1, // Hot water
          location: selectedLocation,
          indication: parseFloat(hotValue)
        });
      }
      
      const payload = {
        apartmentId: selectedApartmentId,
        readings: readings
      };
      
      const response = await api.post('/water-meters/add', payload);
      
      if (response.data.success) {
        setSuccess(response.data.message || 'Тоолуурын заалт амжилттай хадгалагдлаа!');
        
        // Reset form after successful submission
        setColdValue('');
        setHotValue('');
        setHasExistingReadings(true);
        setEditMode(false);
        
        // Refresh data
        fetchWaterMeterData(selectedApartmentId);
      } else {
        setError(response.data.message || 'Хадгалахад алдаа гарлаа.');
      }
    } catch (error) {
      console.error('Error submitting readings:', error);
      setError(error.response?.data?.message || 'Серверт хүсэлт илгээхэд алдаа гарлаа.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
    setError(null);
    setSuccess(null);
  };

  const renderEntryForm = () => {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden mt-6">
        <div className="bg-blue-600 text-white p-4">
          <h2 className="text-xl font-bold text-center">Тоолуурын заалт оруулах</h2>
        </div>
        
        <div className="p-4 sm:p-6">
          {/* Existing Readings Warning */}
          {hasExistingReadings && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg mb-4" role="alert">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="font-medium">Анхааруулга:</span>
                <span className="ml-2">Та энэ сард тоолуурын заалтаа өгсөн байна. Үргэлжлүүлбэл одоогийн утгыг дарж шинэчлэх болно.</span>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          {/* Success Message */}
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4" role="alert">
              <span className="block sm:inline">{success}</span>
            </div>
          )}

          {/* Location Radio Buttons */}
          <div className="mb-4 mt-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Байршил:
            </label>
            <div className="flex flex-wrap gap-4">
              {['Ванн', 'Гал тогоо', 'Нойл'].map(location => (
                <div key={location} className="flex items-center">
                  <input
                    type="radio"
                    id={location}
                    name="location"
                    value={location}
                    checked={selectedLocation === location}
                    onChange={() => setSelectedLocation(location)}
                    className="mr-2 h-4 w-4"
                  />
                  <label htmlFor={location} className="text-gray-700">{location}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Input Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="cold">
                Хүйтэн усны тоолуур (м³)
              </label>
              <input
                id="cold"
                type="number"
                value={coldValue}
                onChange={(e) => setColdValue(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Хүйтэн усны утга оруулах"
              />
            </div>
            
            {/* Only show hot water input for locations other than Нойл */}
            {selectedLocation !== 'Нойл' && (
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="hot">
                  Халуун усны тоолуур (м³)
                </label>
                <input
                  id="hot"
                  type="number"
                  value={hotValue}
                  onChange={(e) => setHotValue(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Халуун усны утга оруулах"
                />
              </div>
            )}
          </div>
          
          {/* Submit Button */}
          <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <button
              onClick={toggleEditMode}
              className="w-full sm:w-auto px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Буцах
            </button>
            
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedApartmentId}
              className={`w-full sm:w-auto px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center shadow-md ${
                (isSubmitting || !selectedApartmentId) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                  Оруулж байна...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Оруулах
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderMonthlyData = () => {
    if (Object.keys(waterMeterData).length === 0) {
      return (
        <div className="bg-white rounded-xl shadow-lg p-8 mt-6 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 mt-4">Тоолуурын мэдээлэл олдсонгүй</p>
          <button
            onClick={toggleEditMode}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            Тоолуурын заалт оруулах
          </button>
        </div>
      );
    }

    return Object.entries(waterMeterData).map(([month, readings]) => {
      const [year, monthNum] = month.split('-');
      const monthName = new Date(year, parseInt(monthNum) - 1, 1).toLocaleDateString('mn-MN', { month: 'long' });
      
      // Calculate totals for summary
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
        <div key={month} className="bg-white rounded-xl shadow-lg overflow-hidden mt-6">
          <div className="bg-blue-600 text-white p-4">
            <h2 className="text-xl font-bold">{monthName} {year}</h2>
          </div>
          
          {/* Monthly Summary */}
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Хүйтэн ус</p>
                <p className="text-xl font-bold text-blue-700">{coldTotal} м³</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Халуун ус</p>
                <p className="text-xl font-bold text-red-700">{hotTotal} м³</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Нийт</p>
                <p className="text-xl font-bold text-purple-700">{coldTotal + hotTotal} м³</p>
              </div>
            </div>
          
            {/* Readings Table */}
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                <div className="overflow-hidden border rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Төрөл</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Байршил</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Өмнөх заалт</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Одоогийн заалт</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Огноо</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {readings.map((meter) => (
                        <tr key={meter.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className={`px-2 py-1 rounded-full text-xs ${meter.type === 1 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                              {meter.type === 1 ? "Халуун ус" : "Хүйтэн ус"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{meter.location}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{meter.previousIndication || "-"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{meter.indication}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(meter.date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 pt-2 sm:px-0">
          <Breadcrumb />
        </div>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (apartments.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 pt-2 sm:px-0">
          <Breadcrumb />
        </div>
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-bold mt-4">Орон сууц олдсонгүй</h2>
            <p className="mt-2 text-gray-600">Таны хандалтай холбоотой орон сууц олдсонгүй.</p>
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => navigate('/user/apartments')}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                Орон сууц нэмэх
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb navigation */}
      <div className="max-w-7xl mx-auto px-4 pt-2 sm:px-0">
        <Breadcrumb />
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">
            {editMode ? "Тоолуурын заалт оруулах" : "Тоолуурын мэдээлэл"}
          </h1>
          
          {/* Apartment Selector */}
          <div className="w-full md:w-1/3 flex items-center space-x-4">
            <select 
              className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={selectedApartmentId || ''}
              onChange={handleApartmentChange}
            >
              <option value="">-- Орон сууц сонгох --</option>
              {apartments.map(apt => (
                <option key={apt.id} value={apt.id}>
                  {apt.displayName}
                </option>
              ))}
            </select>
            
            {!editMode && (
              <button
                onClick={toggleEditMode}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex-shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {editMode ? renderEntryForm() : renderMonthlyData()}
      </div>
    </div>
  );
}