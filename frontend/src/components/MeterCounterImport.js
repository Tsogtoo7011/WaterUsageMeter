import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function MeterCounterImport() {
  const navigate = useNavigate();
  const [coldValue, setColdValue] = useState('');
  const [hotValue, setHotValue] = useState('');

  const handleSubmit = () => {
    // Handle form submission logic here
    console.log('Submitted values:', { coldValue, hotValue });
    // You can add API call or other logic here
  };

  const handleImageUpload = () => {
    // Handle image upload logic here
    console.log('Image upload triggered');
    // You can implement image upload functionality here
  };

  return (
    <div className="p-6 relative min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Тоолуурын заалт оруулах</h1>
      
      {/* Input Fields */}
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl mb-8 p-6">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="cold">
            Хүйтэн усны тоолуур (m³)
          </label>
          <input
            id="cold"
            type="number"
            value={coldValue}
            onChange={(e) => setColdValue(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Хүйтэн усны утга оруулах"
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="hot">
            Халуун усны тоолуур (m³)
          </label>
          <input
            id="hot"
            type="number"
            value={hotValue}
            onChange={(e) => setHotValue(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Халуун усны утга оруулах"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-between">
          <button
            onClick={handleImageUpload}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            Зургаар өгөх
          </button>

          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Оруулах
          </button>
        </div>
      </div>

      {/* Back Button - Bottom Right */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={() => navigate(-1)}
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

export default MeterCounterImport;