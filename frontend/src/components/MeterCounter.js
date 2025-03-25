import React from 'react';
import { useNavigate } from 'react-router-dom';

export function MeterCounter() {
  const navigate = useNavigate();

  return (
    <div className="p-6 relative min-h-[200px]">
      <h1 className="text-3xl font-bold mb-4">Тоолуурын заалт</h1>
      <p>Та энд өөрийн тоолуурын заалтыг харах боломжтой.</p>
      
      <div className="absolute bottom-6 right-6 space-x-4">
        <button 
          onClick={() => navigate('/metercounter/details')}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
        >
          Дэлгэрэнгүй
        </button>
        <button 
          onClick={() => navigate('/metercounter/import')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          Заалт өгөх
        </button>
      </div>
    </div>
  );
}

export default MeterCounter;