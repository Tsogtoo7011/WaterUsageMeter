import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export function MeterCounterDetails() {
  const navigate = useNavigate();
  const [waterMeters, setWaterMeters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetchWaterMeters();
  }, []);
  
  const fetchWaterMeters = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get('/api/water-meters/details', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setWaterMeters(response.data.waterMeters || []);
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
  
  return (
    <div className="p-6 relative min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-6">Усны тоолуурын дэлгэрэнгүй</h1>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
          <p>{error}</p>
        </div>
      ) : (
        <>
          {/* Counter List */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дугаар</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Төрөл</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Байршил</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Заалт</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Огноо</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {waterMeters.map((meter) => (
                  <tr key={meter.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{meter.number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 rounded-full text-xs ${meter.type.includes('Халуун') ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                        {meter.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{meter.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{meter.lastReading}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{meter.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {waterMeters.length === 0 && (
            <div className="text-center py-10">
              <p className="text-gray-500">Тоолуурын мэдээлэл олдсонгүй</p>
            </div>
          )}
        </>
      )}
      
      {/* Back Button */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition flex items-center shadow-md"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Буцах
        </button>
      </div>
    </div>
  );
}

export default MeterCounterDetails;