import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import VerificationReminder from '../../components/verificationReminder';
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
  const [user, setUser] = useState(null);
  const [waterMeters, setWaterMeters] = useState([]);
  const [summary, setSummary] = useState({ hot: 0, cold: 0, locationBreakdown: {} });
  const [chartData, setChartData] = useState({ labels: [], hot: [], cold: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    fetchWaterMeterData();
  }, []);

  const fetchWaterMeterData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get('/api/water-meters/user', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setWaterMeters(response.data.waterMeters || []);
        setSummary(response.data.summary || { hot: 0, cold: 0, locationBreakdown: {} });
        setChartData(response.data.chartData || { labels: [], hot: [], cold: [] });
      } else {
        setError('Мэдээлэл авахад алдаа гарлаа.');
      }
    } catch (err) {
      console.error('Error fetching water meter data:', err);
      setError('Серверээс мэдээлэл авахад алдаа гарлаа.');
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

  const chartOptions = {
    responsive: true,
    plugins: { legend: { position: 'top' } },
  };

  const getChartConfig = (title, data, color) => ({
    labels: chartData.labels,
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
      {user && !user.IsVerified && (
        <div className="w-full max-w-3xl mb-6">
          <VerificationReminder user={user} onVerify={handleVerificationSuccess} />
        </div>
      )}
      
      <h1 className="text-3xl font-bold mb-6">Усны тоолуур</h1>
      
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
          <div className="border p-6 rounded-lg shadow w-full max-w-3xl mb-6">
            <p className="text-lg font-semibold text-blue-600">Тоолуурын мэдээлэл</p>
            <div className="mt-4 text-gray-700">
              <p><strong>Нийт энэ сарын усны хэрэглээ:</strong></p>
              <p>Халуун ус: <strong>{summary.hot}м³</strong> | Хүйтэн ус: <strong>{summary.cold}м³</strong></p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl mb-6">
            {summary.locationBreakdown && Object.entries(summary.locationBreakdown).map(([location, values]) => (
              <div key={location} className="border p-4 rounded-lg shadow text-center">
                <p className="text-lg font-semibold">{location}</p>
                {values.hot !== undefined && <p>Халуун ус: {values.hot}</p>}
                {values.cold !== undefined && <p>Хүйтэн ус: {values.cold}</p>}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mb-8">
            <div className="border p-4 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Хүйтэн ус</h2>
              <div className="h-64">
                <Line 
                  options={chartOptions} 
                  data={getChartConfig('Хүйтэн ус', chartData.cold, 'rgb(53, 162, 235)')} 
                />
              </div>
            </div>
            <div className="border p-4 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Халуун ус</h2>
              <div className="h-64">
                <Line 
                  options={chartOptions} 
                  data={getChartConfig('Халуун ус', chartData.hot, 'rgb(255, 99, 132)')} 
                />
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
        </>
      )}
    </div>
  );
}

export default MeterCounter;