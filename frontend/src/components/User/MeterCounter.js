import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export function MeterCounter() {
  const navigate = useNavigate();
  const [selectedMeter, setSelectedMeter] = useState('54-22');
  const meterData = {
    '54-22': { hot: 3, cold: 5, bathroom: [503, 402], kitchen: [503, 402], toilet: [503], cost: 15000 },
    '54-8': { hot: 2, cold: 4, bathroom: [450, 390], kitchen: [460, 400], toilet: [480], cost: 12000 },
    '54-7': { hot: 4, cold: 6, bathroom: [520, 410], kitchen: [530, 420], toilet: [510], cost: 18000 },
  };

  const { hot, cold, bathroom, kitchen, toilet, cost } = meterData[selectedMeter];

  const chartOptions = {
    responsive: true,
    plugins: { legend: { position: 'top' } },
  };

  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];

  const chartData = (title, data, color) => ({
    labels,
    datasets: [
      {
        label: title,
        data: data,
        borderColor: color,
        backgroundColor: `${color}40`,
        tension: 0.1,
        fill: true,
      },
    ],
  });

  return (
    <div className="p-6 bg-white min-h-screen flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6">Усны тоолуур</h1>
      
      <div className="flex space-x-4 mb-4">
        {Object.keys(meterData).map((meter) => (
          <button
            key={meter}
            className={`px-4 py-2 rounded border ${selectedMeter === meter ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setSelectedMeter(meter)}
          >
            {meter}
          </button>
        ))}
      </div>
      
      <div className="border p-6 rounded-lg shadow w-full max-w-3xl mb-6">
        <p className="text-lg font-semibold text-blue-600">Тоолуур: {selectedMeter}</p>
        <div className="mt-4 text-gray-700">
          <p><strong>Нийт энэ сарын усны хэрэглээ:</strong></p>
          <p>Халуун ус: <strong>{hot}м³</strong> | Хүйтэн ус: <strong>{cold}м³</strong></p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl mb-6">
        <div className="border p-4 rounded-lg shadow text-center">
          <p className="text-lg font-semibold">Ванн өрөө</p>
          <p>Халуун ус: {bathroom[0]}</p>
          <p>Хүйтэн ус: {bathroom[1]}</p>
        </div>
        <div className="border p-4 rounded-lg shadow text-center">
          <p className="text-lg font-semibold">Гал тогоо</p>
          <p>Халуун ус: {kitchen[0]}</p>
          <p>Хүйтэн ус: {kitchen[1]}</p>
        </div>
        <div className="border p-4 rounded-lg shadow text-center">
          <p className="text-lg font-semibold">Нойл өрөө</p>
          <p>Хүйтэн ус: {toilet[0]}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mb-8">
        <div className="border p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Хүйтэн ус</h2>
          <div className="h-64">
            <Line options={chartOptions} data={chartData('Хүйтэн ус', [65, 59, 80, 81, 56, 55, 40], 'rgb(53, 162, 235)')} />
          </div>
        </div>
        <div className="border p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Халуун ус</h2>
          <div className="h-64">
            <Line options={chartOptions} data={chartData('Халуун ус', [28, 48, 40, 19, 86, 27, 90], 'rgb(255, 99, 132)')} />
          </div>
        </div>
      </div>
      
      <div className="border p-4 rounded-lg shadow w-full max-w-3xl text-center">
        <p className="text-sm text-gray-600 mt-2">Та усны заалтаа сар бүрийн 1 - 20 ны хооронд өгнө үү.</p>
        <div className="flex justify-center mt-4 space-x-4">
          <button 
            onClick={() => navigate('/user/metercounter/details')}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
          >
            Дэлгэрэнгүй
          </button>
          <button 
            onClick={() => navigate('/user/metercounter/import')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            Заалт өгөх
          </button>
        </div>
      </div>
    </div>
  );
}

export default MeterCounter;
