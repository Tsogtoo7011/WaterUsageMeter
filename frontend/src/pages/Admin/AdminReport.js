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
import AdminReportStatistics from '../../components/AdminReports/AdminReportStatistics';
import AdminReportTable from '../../components/AdminReports/AdminReportTable';

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
      if ((activeTab === 'paymentStats' || activeTab === 'serviceStats') && !filters.year) {
        setFilters(prev => ({
          ...prev,
          year: new Date().getFullYear()
        }));
      } else {
        fetchReportData();
      }
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
    return null;
  };

  const renderDashboard = () => {
    return (
      <div className="bg-white rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-bold text-[#2D6B9F] mb-4">Хяналтын самбар</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <h3 className="text-sm font-semibold text-blue-800">Нийт хэрэглэгч</h3>
                  <p className="text-2xl font-bold text-blue-600">{dashboardStats.userCount || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Building className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <h3 className="text-sm font-semibold text-green-800">Нийт орон сууц</h3>
                  <p className="text-2xl font-bold text-green-600">{dashboardStats.apartmentCount || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Activity className="w-8 h-8 text-yellow-600 mr-3" />
                <div>
                  <h3 className="text-sm font-semibold text-yellow-800">Хүлээгдэж буй үйлчилгээ</h3>
                  <p className="text-2xl font-bold text-yellow-600">{dashboardStats.pendingServiceCount || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center">
                <MessageSquare className="w-8 h-8 text-purple-600 mr-3" />
                <div>
                  <h3 className="text-sm font-semibold text-purple-800">Хүлээгдэж буй санал хүсэлт</h3>
                  <p className="text-2xl font-bold text-purple-600">{dashboardStats.pendingFeedbackCount || 0}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 bg-blue-50 p-4 rounded-lg">
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

  const renderStatisticsWithGraphics = () => {
    return (
      <div>
        <div className="flex justify-end mb-4">
          <button
            onClick={downloadExcel}
            className="flex items-center px-4 py-2 bg-[#2D6B9F] text-white rounded hover:bg-blue-700 transition"
          >
            <Download className="h-5 w-5 mr-2" />
            Excel татах
          </button>
        </div>
        <AdminReportStatistics
          activeTab={activeTab}
          reportData={reportData}
          loading={loading}
          error={error}
        />
      </div>
    );
  };

  const renderReport = () => {
    if (loading) {
      return (
        <div className="bg-white rounded-lg p-6 text-center">
          <p className="text-gray-500">Тайлан ачааллаж байна...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-white rounded-lg p-6">
          <div className="rounded-md bg-red-50 p-4">
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

    return (
      <AdminReportTable
        activeTab={activeTab}
        reportData={reportData}
        getTabLabel={getTabLabel}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        rowsPerPage={rowsPerPage}
        setSelectedItem={setSelectedItem}
        downloadExcel={downloadExcel}
      />
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="px-4 sm:px-8 pt-4"> 
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#2D6B9F] mb-2">
              Админ тайлан
            </h1>
            <div className="px-4 pt-2 sm:px-0">
              <Breadcrumb />
            </div>
          </div>
          <div className="mb-6 bg-white rounded-lg w-full sm:w-auto sm:mb-0 sm:ml-0 sm:mr-24">
            <div className="flex items-center p-2">
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
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setOpenDropdown(null)}
                      tabIndex={-1}
                    />
                    <div className="absolute left-0 z-40 mt-1 w-56 bg-white rounded-md shadow-lg">
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
                  </>
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
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setOpenDropdown(null)}
                      tabIndex={-1}
                    />
                    <div className="absolute left-0 z-40 mt-1 w-56 bg-white rounded-md shadow-lg">
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
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <hr className="border-t border-gray-200 my-2" /> 
        <div className="max-w-7xl mx-auto  px-0 sm:px-0 lg:px-0">
          <div className="mb-6">{renderFilters()}</div>
          {message && (
            <div className="mb-6">
              <div className="rounded-md bg-green-50 p-4 max-w-md mx-auto">
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
      {selectedItem && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-black opacity-50" onClick={() => setSelectedItem(null)}></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
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
    </div>
  );
}