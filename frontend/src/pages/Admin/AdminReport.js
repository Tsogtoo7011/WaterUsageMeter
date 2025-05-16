import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Download, 
  BarChart, 
  FileText, 
  Home, 
  Users, 
  Building, 
  Droplet, 
  Activity, 
  MessageSquare, 
  Filter,
  ChevronDown,
  X
} from 'lucide-react';
import { Pie } from 'react-chartjs-2'; 
import 'chart.js/auto'; 
import api from "../../utils/api";
import Breadcrumb from '../../components/common/Breadcrumb'; 

export default function AdminReport() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [reportData, setReportData] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
    apartmentId: '',
    type: '',
    year: new Date().getFullYear(),
    month: '',
    cityName: '',
    districtName: '',
    adminRight: '',
    isVerified: ''
  });
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboardStats();
    } else {
      fetchReportData();
    }
  }, [activeTab, filters]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/AdminReport/dashboard-stats');
      if (response.data) {
        setDashboardStats(response.data);
        setError(null);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Хяналтын самбарын мэдээлэл авахад алдаа гарлаа';
      setError(errorMessage);
      console.error('Error fetching dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  const getEndpoint = (tab) => {
    switch (tab) {
      case 'payments':
        return '/AdminReport/payments';
      case 'paymentStats':
        return '/AdminReport/payment-statistics';
      case 'waterMeters':
        return '/AdminReport/water-meters';
      case 'waterConsumption':
        return '/AdminReport/water-consumption';
      case 'services':
        return '/AdminReport/services';
      case 'serviceStats':
        return '/AdminReport/service-statistics';
      case 'feedback':
        return '/AdminReport/feedback';
      case 'users':
        return '/AdminReport/users';
      case 'apartments':
        return '/AdminReport/apartments';
      default:
        return '';
    }
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const endpoint = getEndpoint(activeTab);
      if (!endpoint) return;

      const params = {};
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params[key] = filters[key];
        }
      });

      const response = await api.get(endpoint, { params });
      setReportData(response.data || []);
      setError(null);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || `${getTabLabel(activeTab)} тайлан авахад алдаа гарлаа`;
      setError(errorMessage);
      console.error(`Error fetching ${activeTab} report data:`, err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const downloadExcel = async () => {
    try {
      const endpoint = getEndpoint(activeTab);
      if (!endpoint) return;

      setMessage('Тайлан татаж байна...');
      const params = {
        ...filters,
        format: 'excel'
      };

      const response = await api.get(endpoint, { 
        params,
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${activeTab}_report.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setMessage('Тайлан амжилттай татагдлаа');
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Excel тайлан татахад алдаа гарлаа';
      setError(errorMessage);
      console.error('Error downloading Excel report:', err);
      setTimeout(() => setError(null), 3000);
    }
  };

  const getTabLabel = (tabId) => {
    const tab = allTabs.find(tab => tab.id === tabId);
    return tab ? tab.label : '';
  };

  const toggleDropdown = (dropdown) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const allTabs = [
    { id: 'dashboard', label: 'Хяналтын самбар', icon: Home, category: 'dashboard' },
    { id: 'paymentStats', label: 'Төлбөрийн статистик', icon: BarChart, category: 'statistics' },
    { id: 'serviceStats', label: 'Үйлчилгээний статистик', icon: BarChart, category: 'statistics' },
    { id: 'payments', label: 'Төлбөрийн тайлан', icon: FileText, category: 'reports' },
    { id: 'waterMeters', label: 'Усны тоолуурын тайлан', icon: Droplet, category: 'reports' },
    { id: 'waterConsumption', label: 'Усны хэрэглээний тайлан', icon: Activity, category: 'reports' },
    { id: 'services', label: 'Үйлчилгээний тайлан', icon: MessageSquare, category: 'reports' },
    { id: 'feedback', label: 'Санал хүсэлтийн тайлан', icon: MessageSquare, category: 'reports' },
    { id: 'users', label: 'Хэрэглэгчийн тайлан', icon: Users, category: 'reports' },
    { id: 'apartments', label: 'Орон сууцны тайлан', icon: Building, category: 'reports' }
  ];

  const statisticsTabs = allTabs.filter(tab => tab.category === 'statistics');
  const reportTabs = allTabs.filter(tab => tab.category === 'reports');

  const renderFilters = () => {
    if (!['dashboard', 'paymentStats', 'serviceStats'].includes(activeTab)) {
      return (
        <div className="mb-6 bg-white shadow rounded-lg border border-gray-200">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-[#2D6B9F] flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Шүүлтүүр
              </h2>
              {reportTabs.some(tab => tab.id === activeTab) && (
                <button
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#2D6B9F] hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={downloadExcel}
                >
                  <Download className="h-5 w-5 mr-2" />
                  Excel татах
                </button>
              )}
            </div>
            {/* Render specific filters based on the active tab */}
            {(() => {
              switch (activeTab) {
                case 'payments':
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <div className="space-y-2">
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                          Эхлэх огноо
                        </label>
                        <input
                          type="date"
                          id="startDate"
                          name="startDate"
                          value={filters.startDate}
                          onChange={handleFilterChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                          Дуусах огноо
                        </label>
                        <input
                          type="date"
                          id="endDate"
                          name="endDate"
                          value={filters.endDate}
                          onChange={handleFilterChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                          Төлөв
                        </label>
                        <select
                          id="status"
                          name="status"
                          value={filters.status}
                          onChange={handleFilterChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Бүх төлөв</option>
                          <option value="paid">Төлсөн</option>
                          <option value="pending">Хүлээгдэж буй</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="apartmentId" className="block text-sm font-medium text-gray-700">
                          Орон сууцны ID
                        </label>
                        <input
                          type="text"
                          id="apartmentId"
                          name="apartmentId"
                          value={filters.apartmentId}
                          onChange={handleFilterChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Орон сууцны ID"
                        />
                      </div>
                    </div>
                  );
                case 'waterMeters':
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <div className="space-y-2">
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                          Эхлэх огноо
                        </label>
                        <input
                          type="date"
                          id="startDate"
                          name="startDate"
                          value={filters.startDate}
                          onChange={handleFilterChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                          Дуусах огноо
                        </label>
                        <input
                          type="date"
                          id="endDate"
                          name="endDate"
                          value={filters.endDate}
                          onChange={handleFilterChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                          Төрөл
                        </label>
                        <select
                          id="type"
                          name="type"
                          value={filters.type}
                          onChange={handleFilterChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Бүх төрөл</option>
                          <option value="0">Хүйтэн ус</option>
                          <option value="1">Халуун ус</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="apartmentId" className="block text-sm font-medium text-gray-700">
                          Орон сууцны ID
                        </label>
                        <input
                          type="text"
                          id="apartmentId"
                          name="apartmentId"
                          value={filters.apartmentId}
                          onChange={handleFilterChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Орон сууцны ID"
                        />
                      </div>
                    </div>
                  );
                case 'waterConsumption':
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      <div className="space-y-2">
                        <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                          Он
                        </label>
                        <input
                          type="number"
                          id="year"
                          name="year"
                          value={filters.year}
                          onChange={handleFilterChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Он"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="month" className="block text-sm font-medium text-gray-700">
                          Сар
                        </label>
                        <select
                          id="month"
                          name="month"
                          value={filters.month}
                          onChange={handleFilterChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Бүх сар</option>
                          <option value="1">1-р сар</option>
                          <option value="2">2-р сар</option>
                          <option value="3">3-р сар</option>
                          <option value="4">4-р сар</option>
                          <option value="5">5-р сар</option>
                          <option value="6">6-р сар</option>
                          <option value="7">7-р сар</option>
                          <option value="8">8-р сар</option>
                          <option value="9">9-р сар</option>
                          <option value="10">10-р сар</option>
                          <option value="11">11-р сар</option>
                          <option value="12">12-р сар</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="apartmentId" className="block text-sm font-medium text-gray-700">
                          Орон сууцны ID
                        </label>
                        <input
                          type="text"
                          id="apartmentId"
                          name="apartmentId"
                          value={filters.apartmentId}
                          onChange={handleFilterChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Орон сууцны ID"
                        />
                      </div>
                    </div>
                  );
                case 'services':
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <div className="space-y-2">
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                          Эхлэх огноо
                        </label>
                        <input
                          type="date"
                          id="startDate"
                          name="startDate"
                          value={filters.startDate}
                          onChange={handleFilterChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                          Дуусах огноо
                        </label>
                        <input
                          type="date"
                          id="endDate"
                          name="endDate"
                          value={filters.endDate}
                          onChange={handleFilterChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                          Төлөв
                        </label>
                        <select
                          id="status"
                          name="status"
                          value={filters.status}
                          onChange={handleFilterChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Бүх төлөв</option>
                          <option value="pending">Хүлээгдэж буй</option>
                          <option value="in progress">Хийгдэж буй</option>
                          <option value="completed">Дууссан</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="apartmentId" className="block text-sm font-medium text-gray-700">
                          Орон сууцны ID
                        </label>
                        <input
                          type="text"
                          id="apartmentId"
                          name="apartmentId"
                          value={filters.apartmentId}
                          onChange={handleFilterChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Орон сууцны ID"
                        />
                      </div>
                    </div>
                  );
                case 'feedback':
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <div className="space-y-2">
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                          Эхлэх огноо
                        </label>
                        <input
                          type="date"
                          id="startDate"
                          name="startDate"
                          value={filters.startDate}
                          onChange={handleFilterChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                          Дуусах огноо
                        </label>
                        <input
                          type="date"
                          id="endDate"
                          name="endDate"
                          value={filters.endDate}
                          onChange={handleFilterChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                          Төрөл
                        </label>
                        <input
                          type="text"
                          id="type"
                          name="type"
                          value={filters.type}
                          onChange={handleFilterChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Санал хүсэлтийн төрөл"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                          Төлөв
                        </label>
                        <input
                          type="text"
                          id="status"
                          name="status"
                          value={filters.status}
                          onChange={handleFilterChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Төлөв"
                        />
                      </div>
                    </div>
                  );
                case 'users':
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      <div className="space-y-2">
                        <label htmlFor="adminRight" className="block text-sm font-medium text-gray-700">
                          Админ эрх
                        </label>
                        <select
                          id="adminRight"
                          name="adminRight"
                          value={filters.adminRight}
                          onChange={handleFilterChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Бүх хэрэглэгч</option>
                          <option value="1">Админ</option>
                          <option value="0">Энгийн хэрэглэгч</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="isVerified" className="block text-sm font-medium text-gray-700">
                          Баталгаажуулалтын төлөв
                        </label>
                        <select
                          id="isVerified"
                          name="isVerified"
                          value={filters.isVerified}
                          onChange={handleFilterChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Бүх хэрэглэгч</option>
                          <option value="1">Баталгаажсан</option>
                          <option value="0">Баталгаажаагүй</option>
                        </select>
                      </div>
                    </div>
                  );
                case 'apartments':
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      <div className="space-y-2">
                        <label htmlFor="cityName" className="block text-sm font-medium text-gray-700">
                          Хот
                        </label>
                        <input
                          type="text"
                          id="cityName"
                          name="cityName"
                          value={filters.cityName}
                          onChange={handleFilterChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Хотын нэр"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="districtName" className="block text-sm font-medium text-gray-700">
                          Дүүрэг
                        </label>
                        <input
                          type="text"
                          id="districtName"
                          name="districtName"
                          value={filters.districtName}
                          onChange={handleFilterChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Дүүргийн нэр"
                        />
                      </div>
                    </div>
                  );
                default:
                  return null;
              }
            })()}
          </div>
        </div>
      );
    }
    return null;
  };

  const renderDashboard = () => {
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-bold text-[#2D6B9F] mb-4">Хяналтын самбар</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <h3 className="text-sm font-semibold text-blue-800">Нийт хэрэглэгч</h3>
                  <p className="text-2xl font-bold text-blue-600">{dashboardStats.userCount || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <Building className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <h3 className="text-sm font-semibold text-green-800">Нийт орон сууц</h3>
                  <p className="text-2xl font-bold text-green-600">{dashboardStats.apartmentCount || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <Activity className="w-8 h-8 text-yellow-600 mr-3" />
                <div>
                  <h3 className="text-sm font-semibold text-yellow-800">Хүлээгдэж буй үйлчилгээ</h3>
                  <p className="text-2xl font-bold text-yellow-600">{dashboardStats.pendingServiceCount || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <MessageSquare className="w-8 h-8 text-purple-600 mr-3" />
                <div>
                  <h3 className="text-sm font-semibold text-purple-800">Хүлээгдэж буй санал хүсэлт</h3>
                  <p className="text-2xl font-bold text-purple-600">{dashboardStats.pendingFeedbackCount || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg col-span-1 sm:col-span-2 border border-gray-200">
              <div className="flex items-center">
                <Calendar className="w-8 h-8 text-red-600 mr-3" />
                <div>
                  <h3 className="text-sm font-semibold text-red-800">Хүлээгдэж буй төлбөр</h3>
                  <div className="flex items-baseline">
                    <p className="text-2xl font-bold text-red-600 mr-2">{dashboardStats.pendingPaymentsCount || 0}</p>
                    <p className="text-lg text-red-500">
                      (₮{dashboardStats.pendingPaymentsAmount ? dashboardStats.pendingPaymentsAmount.toLocaleString() : 0})
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-semibold mb-2 text-blue-800">Тайлангийн тухай</h3>
            <p className="text-sm text-gray-700">
              Энэхүү хяналтын самбар нь таны системийн ерөнхий статистик мэдээллийг харуулж байна. 
              Дэлгэрэнгүй тайлан авахын тулд дээрх цэснээс сонгоно уу. Тайлангууд нь Excel форматаар татаж авах боломжтой.
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderReportTable = () => {
    if (!reportData || reportData.length === 0 || !Array.isArray(reportData)) {
      return (
        <div className="bg-white rounded-lg shadow p-6 text-center border border-gray-200">
          <p className="text-gray-500">Энэ тайланд мэдээлэл олдсонгүй.</p>
        </div>
      );
    }
  
    const getVisibleColumns = () => {
      switch (activeTab) {
        case 'payments':
          return ['id', 'apartmentId', 'amount', 'status', 'createdAt'];
        case 'waterMeters':
          return ['id', 'apartmentId', 'type', 'currentValue', 'createdAt'];
        case 'waterConsumption':
          return ['id', 'apartmentId', 'coldWater', 'hotWater', 'period'];
        case 'services':
          return ['id', 'apartmentId', 'type', 'status', 'createdAt'];
        case 'feedback':
          return ['id', 'userId', 'type', 'status', 'createdAt'];
        case 'users':
          return ['id', 'firstName', 'lastName', 'email', 'phone', 'isVerified', 'isAdmin'];
        case 'apartments':
          return ['id', 'cityName', 'districtName', 'address'];
        default:
          return reportData.length > 0 ? Object.keys(reportData[0] || {}).slice(0, 5) : [];
      }
    };
  
    const visibleColumns = getVisibleColumns();

    const filteredColumns = visibleColumns.filter(column => 
      reportData.length > 0 && 
      reportData.some(item => Object.prototype.hasOwnProperty.call(item, column))
    );
  
    const columnsToUse = filteredColumns.length > 0 
      ? filteredColumns 
      : (reportData.length > 0 ? Object.keys(reportData[0]).slice(0, 5) : []);

    const paginatedData = reportData.slice(
      (currentPage - 1) * rowsPerPage,
      currentPage * rowsPerPage
    );
  
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-bold text-[#2D6B9F] mb-4">{getTabLabel(activeTab)}</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columnsToUse.map((column, index) => (
                    <th
                      key={index}
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {column.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дэлгэрэнгүй
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedData.map((item, rowIndex) => (
                  <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {columnsToUse.map((column, colIndex) => {
                      // Format the value based on its type
                      let displayValue = '-';
                      if (item[column] !== undefined && item[column] !== null) {
                        if (typeof item[column] === 'boolean') {
                          displayValue = item[column] ? 'Тийм' : 'Үгүй';
                        } else if (column === 'createdAt' && typeof item[column] === 'string') {
                          // Format date if it's a date string
                          try {
                            const date = new Date(item[column]);
                            displayValue = date.toLocaleDateString('mn-MN');
                          } catch (e) {
                            displayValue = item[column];
                          }
                        } else if (column === 'amount' && typeof item[column] === 'number') {
                          // Format currency
                          displayValue = '₮' + item[column].toLocaleString();
                        } else {
                          displayValue = String(item[column]);
                        }
                      }
  
                      return (
                        <td
                          key={`${rowIndex}-${colIndex}`}
                          className="px-3 py-4 whitespace-nowrap text-sm text-gray-500"
                        >
                          {displayValue}
                        </td>
                      );
                    })}
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="text-[#2D6B9F] hover:text-blue-900"
                      >
                        Харах
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Нийт {reportData.length} бичлэг. Хуудас {currentPage} / {Math.ceil(reportData.length / rowsPerPage)}
            </p>
            <div className="flex space-x-2">
              <button
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className={`px-3 py-1 border rounded ${currentPage === 1 ? 'text-gray-400' : 'text-[#2D6B9F] hover:bg-gray-100'}`}
              >
                Өмнөх
              </button>
              <button
                disabled={currentPage === Math.ceil(reportData.length / rowsPerPage)}
                onClick={() => handlePageChange(currentPage + 1)}
                className={`px-3 py-1 border rounded ${currentPage === Math.ceil(reportData.length / rowsPerPage) ? 'text-gray-400' : 'text-[#2D6B9F] hover:bg-gray-100'}`}
              >
                Дараах
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStatisticsWithGraphics = () => {
    const isServiceStats = activeTab === 'serviceStats';

    const handleYearChange = (e) => {
      const { value } = e.target;
      setFilters(prev => ({
        ...prev,
        year: value
      }));
    };

    const getAvailableYears = () => {
      if (!reportData || !reportData.length) return [];
      const years = new Set();
      reportData.forEach(item => {
        if (item.year) {
          years.add(item.year);
        }
      });
      if (filters.year && !years.has(filters.year)) {
        years.add(filters.year);
      }

      return Array.from(years).sort((a, b) => b - a);
    };

    let labels = [];
    let data = [];

    if (reportData && reportData.length) {
      if (isServiceStats) {
        labels = ['Дууссан хүсэлтүүд', 'Хүлээгдэж буй хүсэлтүүд', 'Хийгдэж буй хүсэлтүүд'];
        const serviceData = reportData[0] || {};
        data = [
          serviceData.CompletedRequests || 0,
          serviceData.PendingRequests || 0,
          serviceData.InProgressRequests || 0
        ];
      } else {
        const firstItem = reportData[0] || {};
        labels = Object.keys(firstItem).filter(key => key !== 'id');
        data = Object.values(firstItem).filter((_, index) => index !== 0);
      }
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Year Filter */}
        <div className="col-span-1 lg:col-span-2 mb-4">
          <label htmlFor="year" className="block text-sm font-medium text-gray-700">
            Он
          </label>
          <select
            id="year"
            name="year"
            value={filters.year}
            onChange={handleYearChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {getAvailableYears().map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {reportData && reportData.length ? (
          <>
            {/* Mini Table */}
            <div className="bg-white rounded-lg shadow p-6 overflow-auto border border-gray-200">
              <h3 className="text-lg font-bold text-[#2D6B9F] mb-4">Хүснэгт</h3>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(reportData[0] || {}).map((key, index) => (
                      <th
                        key={index}
                        className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.map((item, rowIndex) => (
                    <tr key={rowIndex}>
                      {Object.values(item).map((value, colIndex) => (
                        <td key={colIndex} className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Circle Chart */}
            <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-[#2D6B9F] mb-4">График</h3>
              <Pie data={{
                labels: labels,
                datasets: [
                  {
                    data: data,
                    backgroundColor: ['#4CAF50', '#FFC107', '#2196F3', '#9C27B0', '#FF5722', '#607D8B'],
                    hoverBackgroundColor: ['#4CAF50', '#FFC107', '#2196F3', '#9C27B0', '#FF5722', '#607D8B']
                  }
                ]
              }} />
            </div>
          </>
        ) : (
          <div className="col-span-1 lg:col-span-2 bg-white rounded-lg shadow p-6 text-center border border-gray-200">
            <p className="text-gray-500">Энэ жилд статистик мэдээлэл олдсонгүй.</p>
          </div>
        )}
      </div>
    );
  };

  const renderReport = () => {
    if (loading) {
      return (
        <div className="bg-white rounded-lg shadow p-6 text-center border border-gray-200">
          <p className="text-gray-500">Тайлан ачааллаж байна...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="rounded-md bg-red-50 p-4 border border-red-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293-1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'paymentStats' || activeTab === 'serviceStats') {
      return renderStatisticsWithGraphics();
    }

    return renderReportTable();
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="px-4 sm:px-8 pt-4">
        <div className="max-w-7xl mx-auto pt-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#2D6B9F] mb-2">
              Админ тайлан
            </h1>
            <div className="px-4 pt-2 sm:px-0">
              <Breadcrumb />
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto py-6 px-0 sm:px-0 lg:px-0">
          {/* Tabs */}
          <div className="mb-6 bg-white shadow rounded-lg border border-gray-200">
            <div className="flex items-center p-2">
              {/* Dashboard tab (not in dropdown) */}
              <button
                className={`px-4 py-2 text-center text-sm font-medium flex items-center justify-center rounded-t ${
                  activeTab === 'dashboard'
                    ? 'text-[#2D6B9F] border-b-2 border-[#2D6B9F] bg-blue-50'
                    : 'text-gray-500 hover:text-[#2D6B9F] hover:bg-blue-50'
                }`}
                onClick={() => setActiveTab('dashboard')}
              >
                <Home className="h-5 w-5 mr-2" />
                Хяналтын самбар
              </button>
              <div className="relative ml-2">
                <button
                  className={`px-4 py-2 text-sm font-medium flex items-center justify-center rounded-t ${
                    statisticsTabs.some(tab => tab.id === activeTab)
                      ? 'text-[#2D6B9F] bg-blue-50'
                      : 'text-gray-500 hover:text-[#2D6B9F] hover:bg-blue-50'
                  }`}
                  onClick={() => toggleDropdown('statistics')}
                >
                  Статистик
                  <ChevronDown className="h-5 w-5 ml-1" />
                </button>
                {openDropdown === 'statistics' && (
                  <div className="absolute z-10 mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200">
                    <div className="py-1">
                      {statisticsTabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                          <button
                            key={tab.id}
                            className={`w-full text-left px-4 py-2 text-sm flex items-center rounded ${
                              activeTab === tab.id
                                ? 'bg-blue-50 text-[#2D6B9F]'
                                : 'text-gray-700 hover:bg-blue-50'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTab(tab.id);
                              setOpenDropdown(null);
                            }}
                          >
                            <Icon className="h-5 w-5 mr-2" />
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div className="relative ml-2">
                <button
                  className={`px-4 py-2 text-sm font-medium flex items-center justify-center rounded-t ${
                    reportTabs.some(tab => tab.id === activeTab)
                      ? 'text-[#2D6B9F] bg-blue-50'
                      : 'text-gray-500 hover:text-[#2D6B9F] hover:bg-blue-50'
                  }`}
                  onClick={() => toggleDropdown('reports')}
                >
                  Тайлан
                  <ChevronDown className="h-5 w-5 ml-1" />
                </button>
                {openDropdown === 'reports' && (
                  <div className="absolute z-10 mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200">
                    <div className="py-1">
                      {reportTabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                          <button
                            key={tab.id}
                            className={`w-full text-left px-4 py-2 text-sm flex items-center rounded ${
                              activeTab === tab.id
                                ? 'bg-blue-50 text-[#2D6B9F]'
                                : 'text-gray-700 hover:bg-blue-50'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTab(tab.id);
                              setOpenDropdown(null);
                            }}
                          >
                            <Icon className="h-5 w-5 mr-2" />
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Filters section */}
          <div className="mb-6">{renderFilters()}</div>
          {/* Message display */}
          {message && (
            <div className="mb-6">
              <div className="rounded-md bg-green-50 p-4 border border-green-200 max-w-md mx-auto">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">{message}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div>
            {activeTab === 'dashboard' ? renderDashboard() : renderReport()}
          </div>
        </div>
      </div>
      {/* Details Modal */}
      {selectedItem && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-black opacity-50" onClick={() => setSelectedItem(null)}></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full border border-gray-200">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg leading-6 font-bold text-[#2D6B9F] mb-4">
                    Дэлгэрэнгүй мэдээлэл
                  </h3>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="text-gray-400 hover:text-[#2D6B9F]"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="mt-2">
                  <div className="overflow-auto max-h-96">
                    <table className="min-w-full divide-y divide-gray-200">
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Object.entries(selectedItem).map(([key, value]) => {
                          let displayValue = value;
                          if (value === null || value === undefined) {
                            displayValue = '-';
                          } else if (typeof value === 'boolean') {
                            displayValue = value ? 'Тийм' : 'Үгүй';
                          } else if (key.includes('Date') || key === 'createdAt' || key === 'updatedAt') {
                            try {
                              const date = new Date(value);
                              if (!isNaN(date)) {
                                displayValue = date.toLocaleString('mn-MN');
                              }
                            } catch (e) {}
                          } else if (typeof value === 'object') {
                            displayValue = JSON.stringify(value);
                          }
                          return (
                            <tr key={key}>
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                {displayValue}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-[#2D6B9F] hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2D6B9F] sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setSelectedItem(null)}
                >
                  Хаах
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Bottom blue bar */}
      <div className="w-full bg-[#2D6B9F]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8" style={{ height: "48px", display: "flex", alignItems: "center" }}>
        </div>
      </div>
    </div>
  );
}