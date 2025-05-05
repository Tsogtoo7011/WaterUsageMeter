import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import api from "../../utils/api"; 
import VerificationReminder from '../../components/common/verificationReminder';
import NoApartments from '../../components/common/NoApartment';
import Breadcrumb from '../../components/common/Breadcrumb';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function MeterCounter() {
  const [user, setUser] = useState(null);
  const [waterMeters, setWaterMeters] = useState([]);
  const [summary, setSummary] = useState({ hot: 0, cold: 0, locationBreakdown: {} });
  const [chartData, setChartData] = useState({ labels: [], hot: [], cold: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasApartments, setHasApartments] = useState(true);
  const [hasReadings, setHasReadings] = useState(true);
  const [apartments, setApartments] = useState([]);
  const [selectedApartmentId, setSelectedApartmentId] = useState(null);
  
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    fetchWaterMeterData();
  }, []);

  // Function to fetch data for specific apartment
  const fetchWaterMeterData = async (apartmentId = null) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Build URL with query parameter if apartment is specified
      const url = apartmentId 
        ? `/water-meters/user?apartmentId=${apartmentId}`
        : '/water-meters/user';
      
      const response = await api.get(url);
      
      if (response.data.success) {
        // Set data from response
        setWaterMeters(response.data.waterMeters || []);
        setSummary(response.data.summary || { hot: 0, cold: 0, total: 0, locationBreakdown: {} });
        setChartData(response.data.chartData || { labels: [], hot: [], cold: [], total: [] });
        
        // Set has readings flag
        setHasReadings(response.data.hasReadings !== false);
        
        // Directly use the hasApartments flag from the response
        setHasApartments(response.data.hasApartments !== false);
        setApartments(response.data.apartments || []);
        setSelectedApartmentId(response.data.selectedApartmentId || null);
      } else {
        setError('Мэдээлэл авахад алдаа гарлаа.');
        setHasApartments(false);
      }
    } catch (err) {
      console.error('Error fetching water meter data:', err);
      
      // Check response for hasApartments flag or other indicators
      if (err.response && err.response.data) {
        if (err.response.data.hasApartments === false) {
          setHasApartments(false);
          setError(null); // Clear error since this is an expected state
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

  // Function to handle apartment change
  const handleApartmentChange = (e) => {
    const newApartmentId = e.target.value;
    setSelectedApartmentId(newApartmentId);
    fetchWaterMeterData(newApartmentId); // Fetch data for the new apartment
  };

  const chartOptions = {
    responsive: true,
    plugins: { 
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.raw}м³`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Усны хэрэглээ (м³)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Сар'
        }
      }
    }
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

  // Component to display when no water meter readings are found
  const NoReadingsView = () => (
    <div className="flex flex-col items-center justify-center w-full max-w-3xl p-8 mb-6 text-center bg-yellow-50 border-2 border-yellow-200 rounded-lg shadow-lg">
      <div className="mb-4 text-yellow-600">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="mb-4 text-xl font-bold text-gray-800">Тоолуурын мэдээлэл олдсонгүй</h2>
      <p className="mb-6 text-gray-600">Та тоолуурын заалтаа өгнө үү.</p>
      <a 
        href="/user/metercounter/import"
        className="px-6 py-3 text-white transition-all bg-yellow-600 rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
      >
        Заалт өгөх
      </a>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb navigation */}
      <div className="max-w-7xl mx-auto px-4 pt-2 sm:px-0">
        <Breadcrumb />
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {user && !user.IsVerified && (
          <div className="w-full max-w-3xl mb-6">
            <VerificationReminder user={user} onVerify={handleVerificationSuccess} />
          </div>
        )}
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 w-full max-w-3xl">
            <p className="font-medium">Алдаа гарлаа</p>
            <p>{error}</p>
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
          <>
            {/* Apartment Selector (only show if there are multiple apartments) */}
            {apartments && apartments.length > 1 && (
              <div className="border p-4 rounded-lg shadow w-full max-w-3xl mb-6 bg-white">
                <label htmlFor="apartment-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Байр сонгох:
                </label>
                <select
                  id="apartment-select"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={selectedApartmentId || ''}
                  onChange={handleApartmentChange}
                >
                  {apartments.map(apt => (
                    <option key={apt.id} value={apt.id}>{apt.displayName}</option>
                  ))}
                </select>
              </div>
            )}
            
            <NoReadingsView />
          </>
        ) : (
          <>
            {/* Apartment Selector (only show if there are multiple apartments) */}
            {apartments && apartments.length > 1 && (
              <div className="border p-4 rounded-lg shadow w-full max-w-3xl mb-6 bg-white">
                <label htmlFor="apartment-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Байр сонгох:
                </label>
                <select
                  id="apartment-select"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={selectedApartmentId || ''}
                  onChange={handleApartmentChange}
                >
                  {apartments.map(apt => (
                    <option key={apt.id} value={apt.id}>{apt.displayName}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="border p-6 rounded-lg shadow w-full max-w-3xl mb-6 bg-white">
              <p className="text-lg font-semibold text-blue-600">Тоолуурын мэдээлэл</p>
              <div className="mt-4 text-gray-700">
                <p><strong>Нийт энэ сарын усны хэрэглээ:</strong></p>
                <p>Халуун ус: <strong>{summary.hot}м³</strong> | Хүйтэн ус: <strong>{summary.cold}м³</strong></p>
                <p className="mt-2">Нийт: <strong>{summary.total || (summary.hot + summary.cold)}м³</strong></p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl mb-6">
              {summary.locationBreakdown && Object.entries(summary.locationBreakdown).map(([location, values]) => (
                <div key={location} className="border p-4 rounded-lg shadow text-center bg-white">
                  <p className="text-lg font-semibold">{location}</p>
                  {values.hot !== undefined && <p>Халуун ус: <span className="font-medium">{values.hot}м³</span></p>}
                  {values.cold !== undefined && <p>Хүйтэн ус: <span className="font-medium">{values.cold}м³</span></p>}
                  <p className="mt-2 text-sm text-gray-500">
                    Нийт: {(values.hot || 0) + (values.cold || 0)}м³
                  </p>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mb-8">
              <div className="border p-4 rounded-lg shadow bg-white">
                <h2 className="text-xl font-semibold mb-4">Хүйтэн ус</h2>
                <div className="h-64">
                  <Line 
                    options={chartOptions} 
                    data={getChartConfig('Хүйтэн ус', chartData.cold, 'rgb(53, 162, 235)')} 
                  />
                </div>
              </div>
              <div className="border p-4 rounded-lg shadow bg-white">
                <h2 className="text-xl font-semibold mb-4">Халуун ус</h2>
                <div className="h-64">
                  <Line 
                    options={chartOptions} 
                    data={getChartConfig('Халуун ус', chartData.hot, 'rgb(255, 99, 132)')} 
                  />
                </div>
              </div>
            </div>
            
            <div className="border p-4 rounded-lg shadow w-full max-w-3xl text-center bg-white">
              <p className="text-sm text-gray-600 mt-2">Та усны заалтаа сар бүрийн 1 - 20 ны хооронд өгнө үү.</p>
              <div className="flex justify-center mt-4 space-x-4">
                <a 
                  href="/user/metercounter/details"
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition inline-block"
                >
                  Дэлгэрэнгүй
                </a>
                <a 
                  href="/user/metercounter/import"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition inline-block"
                >
                  Заалт өгөх
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default MeterCounter;