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
  Filter 
} from 'lucide-react';
import api from "../../utils/api";

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

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboardStats();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'dashboard') {
      fetchReportData();
    }
  }, [activeTab, filters]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/AdminReport/dashboard-stats');
      setDashboardStats(response.data);
      setError(null);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Хяналтын самбарын мэдээлэл авахад алдаа гарлаа';
      setError(errorMessage);
      console.error('Error fetching dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);
      let endpoint = '';
      
      switch (activeTab) {
        case 'payments':
          endpoint = '/AdminReport/payments';
          break;
        case 'paymentStats':
          endpoint = '/AdminReport/payment-statistics';
          break;
        case 'waterMeters':
          endpoint = '/AdminReport/water-meters';
          break;
        case 'waterConsumption':
          endpoint = '/AdminReport/water-consumption';
          break;
        case 'services':
          endpoint = '/AdminReport/services';
          break;
        case 'serviceStats':
          endpoint = '/AdminReport/service-statistics';
          break;
        case 'feedback':
          endpoint = '/AdminReport/feedback';
          break;
        case 'users':
          endpoint = '/AdminReport/users';
          break;
        case 'apartments':
          endpoint = '/AdminReport/apartments';
          break;
        default:
          break;
      }

      if (endpoint) {
        const params = {};
        Object.keys(filters).forEach(key => {
          if (filters[key]) {
            params[key] = filters[key];
          }
        });

        const response = await api.get(endpoint, { params });
        setReportData(response.data);
        setError(null);
      }
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
      let endpoint = '';
      setMessage('Тайлан татаж байна...');
      
      switch (activeTab) {
        case 'payments':
          endpoint = '/AdminReport/payments';
          break;
        case 'paymentStats':
          endpoint = '/AdminReport/payment-statistics';
          break;
        case 'waterMeters':
          endpoint = '/AdminReport/water-meters';
          break;
        case 'waterConsumption':
          endpoint = '/AdminReport/water-consumption';
          break;
        case 'services':
          endpoint = '/AdminReport/services';
          break;
        case 'serviceStats':
          endpoint = '/AdminReport/service-statistics';
          break;
        case 'feedback':
          endpoint = '/AdminReport/feedback';
          break;
        case 'users':
          endpoint = '/AdminReport/users';
          break;
        case 'apartments':
          endpoint = '/AdminReport/apartments';
          break;
        default:
          break;
      }

      if (endpoint) {
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
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Excel тайлан татахад алдаа гарлаа';
      setError(errorMessage);
      console.error('Error downloading Excel report:', err);
      setTimeout(() => setError(null), 3000);
    }
  };

  const getTabLabel = (tabId) => {
    const tab = tabs.find(tab => tab.id === tabId);
    return tab ? tab.label : '';
  };

  const renderFilters = () => {
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
        
      case 'paymentStats':
      case 'serviceStats':
        return (
          <div className="grid grid-cols-1 gap-4 mb-6">
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
          </div>
        );
        
      default:
        return null;
    }
  };

  const renderDashboard = () => {
    return (
      <div className="bg-white shadow-lg rounded-lg overflow-hidden p-4 sm:p-6">
        <div className="px-4 sm:px-6 py-4 bg-blue-500 text-white flex justify-between items-center mb-4 sm:mb-6 -mx-4 sm:-mx-6 -mt-4 sm:-mt-6">
          <h2 className="text-lg sm:text-xl font-bold">Хяналтын самбар</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-blue-50 p-4 sm:p-6 rounded-lg">
            <div className="flex items-center">
              <Users className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 mr-3 sm:mr-4" />
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-blue-800">Нийт хэрэглэгч</h3>
                <p className="text-2xl sm:text-3xl font-bold text-blue-600">{dashboardStats.userCount || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 sm:p-6 rounded-lg">
            <div className="flex items-center">
              <Building className="w-8 h-8 sm:w-10 sm:h-10 text-green-600 mr-3 sm:mr-4" />
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-green-800">Нийт орон сууц</h3>
                <p className="text-2xl sm:text-3xl font-bold text-green-600">{dashboardStats.apartmentCount || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 sm:p-6 rounded-lg">
            <div className="flex items-center">
              <Activity className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-600 mr-3 sm:mr-4" />
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-yellow-800">Хүлээгдэж буй үйлчилгээ</h3>
                <p className="text-2xl sm:text-3xl font-bold text-yellow-600">{dashboardStats.pendingServiceCount || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 sm:p-6 rounded-lg">
            <div className="flex items-center">
              <MessageSquare className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600 mr-3 sm:mr-4" />
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-purple-800">Хүлээгдэж буй санал хүсэлт</h3>
                <p className="text-2xl sm:text-3xl font-bold text-purple-600">{dashboardStats.pendingFeedbackCount || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 p-4 sm:p-6 rounded-lg col-span-1 sm:col-span-2">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-red-600 mr-3 sm:mr-4" />
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-red-800">Хүлээгдэж буй төлбөр</h3>
                <div className="flex items-baseline">
                  <p className="text-2xl sm:text-3xl font-bold text-red-600 mr-2">{dashboardStats.pendingPaymentsCount || 0}</p>
                  <p className="text-lg sm:text-xl text-red-500">
                    (₮{dashboardStats.pendingPaymentsAmount ? dashboardStats.pendingPaymentsAmount.toLocaleString() : 0})
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 sm:mt-8 bg-blue-50 p-4 sm:p-6 rounded-lg">
          <h3 className="text-sm sm:text-base font-semibold mb-2 text-blue-800">Тайлангийн тухай</h3>
          <p className="text-xs sm:text-sm text-gray-700">
            Энэхүү хяналтын самбар нь таны системийн ерөнхий статистик мэдээллийг харуулж байна. 
            Дэлгэрэнгүй тайлан авахын тулд дээрх цэснээс сонгоно уу. Тайлангууд нь Excel форматаар татаж авах боломжтой.
          </p>
        </div>
      </div>
    );
  };

  const renderReportTable = () => {
    if (!reportData || reportData.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <p className="text-gray-500">Энэ тайланд мэдээлэл олдсонгүй.</p>
        </div>
      );
    }

    const columns = Object.keys(reportData[0]);

    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-4 sm:px-6 py-4 bg-blue-500 text-white">
          <h2 className="text-lg sm:text-xl font-bold">{getTabLabel(activeTab)}</h2>
        </div>
        
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((column, index) => (
                    <th 
                      key={index}
                      className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {column.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.map((row, rowIndex) => (
                  <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {columns.map((column, colIndex) => (
                      <td 
                        key={colIndex}
                        className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500"
                      >
                        {row[column] !== null && row[column] !== undefined 
                          ? typeof row[column] === 'boolean'
                            ? row[column] ? 'Тийм' : 'Үгүй'
                            : typeof row[column] === 'object'
                              ? JSON.stringify(row[column])
                              : row[column].toString()
                          : '-'
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'dashboard', label: 'Хяналтын самбар', icon: Home },
    { id: 'payments', label: 'Төлбөрийн тайлан', icon: Calendar },
    { id: 'paymentStats', label: 'Төлбөрийн статистик', icon: BarChart },
    { id: 'waterMeters', label: 'Усны тоолуурын тайлан', icon: Droplet },
    { id: 'waterConsumption', label: 'Усны хэрэглээний тайлан', icon: Activity },
    { id: 'services', label: 'Үйлчилгээний тайлан', icon: Building },
    { id: 'serviceStats', label: 'Үйлчилгээний статистик', icon: BarChart },
    { id: 'feedback', label: 'Санал хүсэлтийн тайлан', icon: MessageSquare },
    { id: 'users', label: 'Хэрэглэгчийн тайлан', icon: Users },
    { id: 'apartments', label: 'Орон сууцны тайлан', icon: Building }
  ];

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 text-center sm:text-left">Тайлан</h1>
        
        <div className="mb-4 sm:mb-6">
          <div className="relative">
            <div className="flex space-x-2 pb-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-shrink-0 flex items-center px-3 sm:px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                    <span className="text-xs sm:text-sm">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 sm:mb-6 text-center sm:text-left">
            <strong className="font-bold">Алдаа!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}
        
        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 sm:mb-6 text-center sm:text-left">
            <span className="block sm:inline">{message}</span>
          </div>
        )}
        
        {activeTab !== 'dashboard' && (
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-0">Шүүлтүүр</h2>
              <button
                onClick={downloadExcel}
                className="flex items-center px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs sm:text-sm"
              >
                <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                Excel татах
              </button>
            </div>
            
            {renderFilters()}
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center h-48 sm:h-64">
            <div className="animate-spin rounded-full h-12 sm:h-16 w-12 sm:w-16 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          activeTab === 'dashboard' ? renderDashboard() : renderReportTable()
        )}
      </div>
    </div>
  );
}