import React from 'react';
import { useNavigate } from 'react-router-dom';

export function MeterCounterDetails() {
  const navigate = useNavigate();
  
  // Sample data - replace with your actual data source
  const waterCounters = [
    { id: 1, number: 'WC-2023-001', lastReading: '120 m³', date: '2023-05-15' },
    { id: 2, number: 'WC-2023-002', lastReading: '85 m³', date: '2023-05-14' },
    { id: 3, number: 'WC-2023-003', lastReading: '210 m³', date: '2023-05-16' },
    { id: 4, number: 'WC-2023-004', lastReading: '65 m³', date: '2023-05-13' },
    { id: 5, number: 'WC-2023-005', lastReading: '180 m³', date: '2023-05-17' },
  ];

  return (
    <div className="p-6 relative min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Усны тоолуурын дэлгэрэнгүй</h1>
      
      {/* Counter List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дугаар</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сүүлийн уншилт</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Огноо</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {waterCounters.map((counter) => (
              <tr key={counter.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{counter.number}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{counter.lastReading}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{counter.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Back Button - Bottom Right */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={() => navigate(-1)} // Goes back to previous page
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition flex items-center"
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