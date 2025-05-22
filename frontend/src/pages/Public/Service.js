import React, { useState, useEffect } from 'react';
import api from "../../utils/api";
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Edit, Trash2, ChevronLeft, ChevronRight, Eye, Home, MessageSquare, Search, Check, X, Pencil, RotateCcw } from 'lucide-react';
import ApartmentSelector from '../../components/common/ApartmentSelector';
import Breadcrumb from '../../components/common/Breadcrumb';

const Service = () => {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedService, setSelectedService] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [csrfToken, setCsrfToken] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [apartments, setApartments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const [formData, setFormData] = useState({
    description: '',
    respond: '',
    status: 'pending',
    amount: '',
    apartmentId: '',
  });
  
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  
  const servicesPerPage = 5;
  
  useEffect(() => {
    fetchCsrfToken();
    
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userData && token) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser({ ...parsedUser, token });
        
        fetchUserApartments();
        
        if (parsedUser.isAdmin === true || parsedUser.AdminRight === 1) {
          fetchAllServices();
        } else {
          fetchUserServices();
        }
      } catch (err) {
        console.error("Error parsing user data:", err);
      }
    } else {
      navigate('/login');
    }
  }, []);

  useEffect(() => {
    const filtered = services.filter(service => {
      const matchesSearch = 
        service.Description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.ServiceId.toString().includes(searchQuery) ||
        (service.ApartmentName && service.ApartmentName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (service.Status && service.Status.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || service.Status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
    
    setFilteredServices(filtered);
    setCurrentPage(1);
  }, [searchQuery, services, statusFilter]);

  const fetchUserApartments = async () => {
    try {
      const response = await api.get('/services/my-apartments');
      setApartments(response.data);
      
      if (response.data.length > 0) {
        setFormData(prevState => ({
          ...prevState,
          apartmentId: response.data[0].id
        }));
      }
    } catch (err) {
      console.error('Error fetching user apartments:', err);
    }
  };
  
  const fetchCsrfToken = async () => {
    try {
      const response = await api.get('/csrf-token');
      setCsrfToken(response.data.csrfToken);
      api.defaults.headers.common['X-CSRF-Token'] = response.data.csrfToken;
    } catch (err) {
      console.error('Error fetching CSRF token:', err);
      setError('CSRF токен авахад алдаа гарлаа. Хуудас дахин ачааллана уу.');
    }
  };
  
  const fetchAllServices = async () => {
    try {
      setLoading(true);
      const response = await api.get('/services/admin/all');
      setServices(response.data);
      setLoading(false);
    } catch (err) {
      setError('Үйлчилгээний хүсэлтүүдийг авахад алдаа гарлаа');
      setLoading(false);
      console.error('Error fetching services:', err);
    }
  };
  
  const fetchUserServices = async () => {
    try {
      setLoading(true);
      const response = await api.get('/services/my-services');
      setServices(response.data);
      setLoading(false);
    } catch (err) {
      setError('Таны үйлчилгээний хүсэлтүүдийг авахад алдаа гарлаа');
      setLoading(false);
      console.error('Error fetching services:', err);
    }
  };
  
  const isUserAdmin = () => {
    return user && (user.isAdmin === true || user.AdminRight === 1);
  };
  
  const handleViewDetails = async (serviceId) => {
    try {
      setLoading(true);
      let endpoint = isUserAdmin() 
        ? `/services/admin/${serviceId}`
        : `/services/${serviceId}`;
        
      const response = await api.get(endpoint);
      setSelectedService(response.data);
      setFormMode('view');
      setShowModal(true);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching service details:', err);
      alert('Үйлчилгээний дэлгэрэнгүйг авахад алдаа гарлаа');
      setLoading(false);
    }
  };
  
  const handleOpenModal = (mode, serviceItem = null) => {
    setFormMode(mode);

    if ((mode === 'edit' || mode === 'respond') && serviceItem) {
      navigate(`/services/${serviceItem.ServiceId}?mode=${mode}`);
    } else if (mode === 'create') {
      setFormData({
        description: '',
        respond: '',
        status: 'pending',
        amount: '',
        apartmentId: apartments.length > 0 ? apartments[0].id : '',
      });
      setSelectedService(null);
      setShowModal(true);
    } else if (mode === 'view' && serviceItem) {
      navigate(`/services/${serviceItem.ServiceId}`);
    }
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      description: '',
      respond: '',
      status: 'pending',
      amount: '',
      apartmentId: apartments.length > 0 ? apartments[0].id : '',
    });
    setSelectedService(null);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleApartmentChange = (apartmentId) => {
    setFormData({
      ...formData,
      apartmentId,
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!csrfToken) {
      alert('CSRF токен байхгүй байна. Хуудас дахин ачааллана уу.');
      fetchCsrfToken();
      return;
    }
    
    try {
      api.defaults.headers.common['X-CSRF-Token'] = csrfToken;
      
      if (formMode === 'create') {
        const response = await api.post('/services', {
          description: formData.description,
          apartmentId: formData.apartmentId || null
        });
        console.log('Create response:', response.data);
      } else if (formMode === 'edit' && selectedService) {
        let endpoint;
        let payload;
        
        if (isUserAdmin()) {
          const amount = formData.amount ? parseFloat(formData.amount) : null;
          
          endpoint = `/services/admin/${selectedService.ServiceId}`;
          payload = {
            respond: formData.respond,
            status: formData.status,
            amount: amount
          };
        } else {
          endpoint = `/services/update/${selectedService.ServiceId}`;
          payload = {
            description: formData.description,
            apartmentId: formData.apartmentId || null
          };
        }
        
        const response = await api.put(endpoint, payload);
        console.log('Update response:', response.data);
      }
      
      handleCloseModal();
      
      if (isUserAdmin()) {
        fetchAllServices();
      } else {
        fetchUserServices();
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      
      if (err.response?.status === 403 && err.response?.data?.message?.includes('CSRF')) {
        alert('CSRF токен буруу байна. Хуудас дахин ачааллана уу.');
        fetchCsrfToken();
        return;
      }
      
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Үйлчилгээний хүсэлт хадгалахад алдаа гарлаа';
      alert(errorMessage);
    }
  };
  
  const handleDelete = async (serviceId) => {
    if (!window.confirm('Та энэ үйлчилгээний хүсэлтийг устгахдаа итгэлтэй байна уу?')) {
      return;
    }
    
    if (!csrfToken) {
      alert('CSRF токен байхгүй байна. Хуудас дахин ачааллана уу.');
      fetchCsrfToken();
      return;
    }
    
    try {
      api.defaults.headers.common['X-CSRF-Token'] = csrfToken;
      
      const endpoint = isUserAdmin() 
        ? `/services/admin/${serviceId}`
        : `/services/${serviceId}`;
        
      await api.delete(endpoint);
      
      if (isUserAdmin()) {
        fetchAllServices();
      } else {
        fetchUserServices();
      }
    } catch (err) {
      console.error('Error deleting service:', err);
      
      if (err.response?.status === 403 && err.response?.data?.message?.includes('CSRF')) {
        alert('CSRF токен буруу байна. Хуудас дахин ачааллана уу.');
        fetchCsrfToken();
        return;
      }
      
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Үйлчилгээний хүсэлт устгахад алдаа гарлаа';
      alert(errorMessage);
    }
  };
  
  const handleCancelService = async (serviceId) => {
    if (!window.confirm('Та энэ үйлчилгээний хүсэлтийг цуцлахдаа итгэлтэй байна уу?')) {
      return;
    }

    if (!csrfToken) {
      alert('CSRF токен байхгүй байна. Хуудас дахин ачааллана уу.');
      fetchCsrfToken();
      return;
    }

    try {
      api.defaults.headers.common['X-CSRF-Token'] = csrfToken;
      const endpoint = `/services/admin/${serviceId}`;
      const payload = {
        status: 'Цуцлагдсан',
        amount: null 
      };
      await api.put(endpoint, payload);

      fetchAllServices();
    } catch (err) {
      console.error('Error cancelling service:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Үйлчилгээний хүсэлтийг цуцлахад алдаа гарлаа';
      alert(errorMessage);
    }
  };

  const handleRestoreService = async (serviceId) => {
    if (!window.confirm('Та энэ үйлчилгээний хүсэлтийг сэргээхдээ итгэлтэй байна уу?')) {
      return;
    }

    if (!csrfToken) {
      alert('CSRF токен байхгүй байна. Хуудас дахин ачааллана уу.');
      fetchCsrfToken();
      return;
    }

    try {
      api.defaults.headers.common['X-CSRF-Token'] = csrfToken;
      const endpoint = `/services/admin/${serviceId}`;
      const payload = {
        status: 'Хүлээгдэж буй'
      };
      await api.put(endpoint, payload);

      fetchAllServices();
    } catch (err) {
      console.error('Error restoring service:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Үйлчилгээний хүсэлтийг сэргээхэд алдаа гарлаа';
      alert(errorMessage);
    }
  };
  const handleCompleteService = async (serviceId) => {
    if (!window.confirm('Та энэ үйлчилгээний хүсэлтийг дууссанд тэмдэглэхдээ итгэлтэй байна уу?')) {
      return;
    }

    if (!csrfToken) {
      alert('CSRF токен байхгүй байна. Хуудас дахин ачааллана уу.');
      fetchCsrfToken();
      return;
    }

    try {
      api.defaults.headers.common['X-CSRF-Token'] = csrfToken;
      let endpoint, payload;
      if (isUserAdmin()) {
        endpoint = `/services/admin/${serviceId}`;
        payload = { status: 'Дууссан' };
        await api.put(endpoint, payload);
        fetchAllServices();
      } else {
        endpoint = `/services/${serviceId}/complete`;
        await api.put(endpoint);
        fetchUserServices();
      }
    } catch (err) {
      console.error('Error completing service:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Үйлчилгээний хүсэлтийг дууссанд тэмдэглэхэд алдаа гарлаа';
      alert(errorMessage);
    }
  };
  
  const handleStatusFilterChange = (e) => {
    const newStatus = e.target.value;
    setStatusFilter(newStatus);
  };
  
  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'Хүлээгдэж буй':
        return 'bg-yellow-100 text-yellow-800';
      case 'Төлөвлөгдсөн':
        return 'bg-blue-100 text-blue-800';
      case 'Дууссан':
        return 'bg-green-100 text-green-800';
      case 'Цуцлагдсан':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const formatStatus = (status) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getApartmentDisplay = (service) => {
    if (!service.ApartmentId) return 'Тодорхойгүй';
    return `${service.ApartmentName} - Блок ${service.BlockNumber}, Нэгж ${service.UnitNumber}`;
  };
  
  const canUserEditService = (service) => {
    return (
      !isUserAdmin() &&
      (service.Status === 'Хүлээгдэж буй' || service.Status === 'Цуцлагдсан') &&
      user &&
      service.UserId === user.id
    );
  };
  
  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const sortedServices = React.useMemo(() => {
    let sortable = [...filteredServices];
    if (sortConfig.key) {
      sortable.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortable;
  }, [filteredServices, sortConfig]);

  const indexOfLastService = currentPage * servicesPerPage;
  const indexOfFirstService = indexOfLastService - servicesPerPage;
  const currentServices = sortedServices.slice(indexOfFirstService, indexOfLastService);
  const totalPages = Math.ceil(filteredServices.length / servicesPerPage);
  
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  const renderSortArrow = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 pt-2 sm:px-0">
          <Breadcrumb />
        </div>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 pt-2 sm:px-0">
          <Breadcrumb />
        </div>
        <div className="bg-red-50 p-4 rounded-md max-w-md mx-auto mt-10">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 bg-red-200 hover:bg-red-300 px-4 py-2 rounded w-full"
          >
            Хуудас дахин ачаалах
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-white">
      <div className="px-4 sm:px-8 pt-4">
        {/* Page Header */}
        <div className="max-w-7xl mx-auto pt-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#2D6B9F]">Үйлчилгээний жагсаалт</h1>
            <div className="px-4 pt-2 sm:px-0">
              <Breadcrumb />
            </div>
            <p className="text-gray-600 mt-2">Өөрийн илгээсэн болон хүлээн авсан үйлчилгээний жагсаалт</p>
          </div>
          {!isUserAdmin() && (
            <button
              onClick={() => handleOpenModal('create')}
              className="flex items-center px-3 py-1.5 border rounded text-sm font-medium hover:bg-blue-50/50"
              style={{ borderColor: "#2D6B9F", color: "#2D6B9F", minWidth: "110px", fontSize: "14px" }}
            >
              <PlusCircle size={15} className="mr-1" />
              Шинэ хүсэлт
            </button>
          )}
        </div>

        <div className="max-w-7xl mx-auto py-6 px-0 sm:px-0 lg:px-0">
            {/* Search and Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Хүсэлт хайх..."
                  className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2D6B9F]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="w-full md:w-auto">
                <select 
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2D6B9F] text-sm"
                >
                  <option value="all">Бүгд</option>
                  <option value="Хүлээгдэж буй">Хүлээгдэж буй</option>
                  <option value="Төлөвлөгдсөн">Төлөвлөгдсөн</option>
                  <option value="Дууссан">Дууссан</option>
                  <option value="Цуцлагдсан">Цуцлагдсан</option>
                </select>
              </div>
            </div>

            {/* Responsive Table */}
            <div className="overflow-x-auto">
              <div className="align-middle inline-block min-w-full shadow overflow-hidden rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        className="px-4 py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider cursor-pointer select-none"
                        onClick={() => handleSort('ServiceId')}
                      >
                        Дугаар{renderSortArrow('ServiceId')}
                      </th>
                      <th
                        className="px-4 py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider hidden sm:table-cell cursor-pointer select-none"
                        onClick={() => handleSort('ApartmentName')}
                      >
                        Байр{renderSortArrow('ApartmentName')}
                      </th>
                      <th
                        className="px-4 py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider cursor-pointer select-none"
                        onClick={() => handleSort('Description')}
                      >
                        Тайлбар{renderSortArrow('Description')}
                      </th>
                      {isUserAdmin() && (
                        <th
                          className="px-4 py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider hidden md:table-cell cursor-pointer select-none"
                          onClick={() => handleSort('Username')}
                        >
                          Хэрэглэгч{renderSortArrow('Username')}
                        </th>
                      )}
                      <th
                        className="px-4 py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider hidden md:table-cell cursor-pointer select-none"
                        onClick={() => handleSort('Amount')}
                      >
                        Дүн{renderSortArrow('Amount')}
                      </th>
                      <th
                        className="px-4 py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider cursor-pointer select-none"
                        onClick={() => handleSort('Status')}
                      >
                        Төлөв{renderSortArrow('Status')}
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider sticky right-0 bg-gray-50 z-10">
                        Үйлдэл
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentServices.length > 0 ? (
                      currentServices.map((service) => (
                        <tr
                          key={service.ServiceId}
                          className="hover:bg-blue-50 transition group cursor-pointer"
                          onClick={() => handleOpenModal('view', service)}
                        >
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-center text-gray-900">
                            {service.ServiceId}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell text-center">
                            {service.ApartmentId ? (
                              <div className="flex items-center justify-center">
                                <Home size={16} className="mr-1 text-[#2D6B9F]" />
                                <span className="truncate max-w-[150px]">{getApartmentDisplay(service)}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">Тодорхойгүй</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-500 text-center">
                            <div className="max-w-[200px] truncate mx-auto">{service.Description}</div>
                          </td>
                          {isUserAdmin() && (
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell text-center">
                              <div className="truncate max-w-[100px] mx-auto">{service.Username}</div>
                            </td>
                          )}
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell text-center">
                            {service.Amount !== null && service.Amount !== undefined
                              ? `$${parseFloat(service.Amount).toFixed(2)}`
                              : '-'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(service.Status)}`}>
                              {formatStatus(service.Status)}
                            </span>
                          </td>
                          <td
                            className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium sticky right-0 bg-white z-10 border-l border-gray-100 group-hover:bg-blue-50 transition"
                            onClick={e => e.stopPropagation()}
                          >
                            {(!isUserAdmin() && service.Status === 'Дууссан') ? (
                              <span className="text-gray-400">—</span>
                            ) : (
                              <div className="flex justify-center gap-1">
                                {isUserAdmin() && (
                                  <>
                                    <button
                                      onClick={() => handleOpenModal('edit', service)}
                                      className="text-green-600 hover:text-green-900 w-8 h-8 flex items-center justify-center"
                                      title="Хариу өгөх"
                                    >
                                      <MessageSquare size={16} className="mr-0.5" />
                                      <span className="sr-only">Хариу өгөх</span>
                                    </button>
                                    {/* Hide Сэргээх and Цуцлах when status is Дууссан */}
                                    {service.Status !== 'Дууссан' && (
                                      <>
                                        {service.Status === 'Цуцлагдсан' ? (
                                          <button
                                            onClick={() => handleRestoreService(service.ServiceId)}
                                            className="text-green-600 hover:text-green-900 w-8 h-8 flex items-center justify-center"
                                            title="Сэргээх"
                                          >
                                            <RotateCcw size={16} strokeWidth={2.5} className="mr-0.5" />
                                            <span className="sr-only">Сэргээх</span>
                                          </button>
                                        ) : (
                                          <button
                                            onClick={() => handleCancelService(service.ServiceId)}
                                            className="text-red-600 hover:text-red-900 w-8 h-8 flex items-center justify-center"
                                            title="Цуцлах"
                                          >
                                            <Trash2 size={16} strokeWidth={2.5} className="mr-0.5" />
                                            <span className="sr-only">Цуцлах</span>
                                          </button>
                                        )}
                                      </>
                                    )}
                                    {service.Status === 'Төлөвлөгдсөн' && (
                                      <button
                                        onClick={() => handleCompleteService(service.ServiceId)}
                                        className="text-blue-600 hover:text-blue-900 w-8 h-8 flex items-center justify-center"
                                        title="Дууссан"
                                      >
                                        <Check size={16} strokeWidth={2.5} className="mr-0.5" />
                                        <span className="sr-only">Дууссан</span>
                                      </button>
                                    )}
                                  </>
                                )}
                                {!isUserAdmin() && service.Status === 'Төлөвлөгдсөн' && user && service.UserId === user.id && (
                                  <button
                                    onClick={() => handleCompleteService(service.ServiceId)}
                                    className="text-blue-600 hover:text-blue-900 w-8 h-8 flex items-center justify-center"
                                    title="Дууссан"
                                  >
                                    <Check size={16} strokeWidth={2.5} className="mr-0.5" />
                                    <span className="sr-only">Дууссан</span>
                                  </button>
                                )}
                                {canUserEditService(service) && (
                                  <>
                                    <button
                                      onClick={() => handleOpenModal('edit', service)}
                                      className="text-green-600 hover:text-green-900 w-8 h-8 flex items-center justify-center"
                                      title="Засах"
                                    >
                                      <Edit size={16} className="mr-0.5" />
                                      <span className="sr-only">Засах</span>
                                    </button>
                                    <button
                                      onClick={() => handleDelete(service.ServiceId)}
                                      className="text-red-600 hover:text-red-900 w-8 h-8 flex items-center justify-center"
                                      title="Устгах"
                                    >
                                      <Trash2 size={16} className="mr-0.5" />
                                      <span className="sr-only">Устгах</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={isUserAdmin() ? 7 : 6} className="px-6 py-4 text-center text-gray-500">
                          Хүсэлт олдсонгүй
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-4 items-center space-x-2">
                <button
                  onClick={() => paginate(Math.max(1, currentPage - 1))}
                  className={`w-8 h-8 flex items-center justify-center rounded-full border ${
                    currentPage === 1
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "border-[#2D6B9F] text-[#2D6B9F] hover:bg-blue-50"
                  } transition font-bold text-sm`}
                  title="Өмнөх"
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, index) => index + 1)
                  .filter((page) => {
                    return (
                      page <= 2 ||
                      page > totalPages - 2 ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    );
                  })
                  .map((page, index, pages) => (
                    <React.Fragment key={page}>
                      {index > 0 && page !== pages[index - 1] + 1 && (
                        <span className="text-gray-500">...</span>
                      )}
                      <button
                        onClick={() => paginate(page)}
                        className={`w-8 h-8 flex items-center justify-center rounded-full text-sm ${
                          currentPage === page
                            ? "bg-[#2D6B9F] text-white"
                            : "border border-[#2D6B9F] text-[#2D6B9F] hover:bg-blue-50"
                        } transition`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  ))}
                <button
                  onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                  className={`w-8 h-8 flex items-center justify-center rounded-full border ${
                    currentPage === totalPages
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "border-[#2D6B9F] text-[#2D6B9F] hover:bg-blue-50"
                  } transition font-bold text-sm`}
                  title="Дараах"
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
            {/* End Pagination */}
          </div>
        </div>

        {showModal && formMode !== 'view' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200 z-[110]">
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-[#2D6B9F]">
                    {formMode === 'create' && 'Үйлчилгээний хүсэлт үүсгэх'}
                    {formMode === 'edit' && (isUserAdmin() ? 'Хариу өгөх' : 'Үйлчилгээний хүсэлт засах')}
                  </h2>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-[#2D6B9F]"
                  >
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleSubmit}>
                  {formMode === 'create' || (!isUserAdmin() && formMode === 'edit') ? (
                    <>
                      <div className="mb-5">
                        <label className="text-[#2D6B9F] text-sm font-bold mb-2 flex items-center">
                          <MessageSquare size={16} className="mr-2 text-[#2D6B9F]" />
                          Тайлбар
                        </label>
                        <div className="relative">
                          <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            className="w-full p-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6B9F] focus:border-[#2D6B9F] h-40 shadow-sm bg-blue-50/30 transition-all"
                            placeholder="Хүсэлтийнхээ дэлгэрэнгүйг бичнэ үү..."
                            required
                          />
                          <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                            {formData.description.length} тэмдэгт
                          </div>
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="block text-[#2D6B9F] text-sm font-bold mb-2">
                          Байр сонгох
                        </label>
                        {apartments.length > 0 ? (
                          <ApartmentSelector 
                            apartments={apartments}
                            selectedApartment={formData.apartmentId}
                            onChange={handleApartmentChange}
                          />
                        ) : (
                          <p className="text-gray-500 italic">Байр олдсонгүй. Админтай холбогдоно уу.</p>
                        )}
                      </div>
                    </>
                  ) : isUserAdmin() && formMode === 'edit' ? (
                    <>
                      <div className="mb-5">
                        <h3 className="text-sm font-semibold mb-2 text-[#2D6B9F] flex items-center">
                          <MessageSquare size={16} className="mr-2" />
                          Тайлбар
                        </h3>
                        <div
                          className="text-gray-800 mb-5 p-4 bg-blue-50 border border-blue-200 rounded-lg shadow-sm max-h-40 overflow-y-auto break-words leading-relaxed scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-blue-50"
                          style={{ scrollbarWidth: 'thin', maxHeight: '10rem' }}
                        >
                          {formData.description}
                        </div>
                      </div>
                      <div className="mb-5">
                        <label className="text-sm text-green-700 font-bold mb-2 flex items-center">
                          <Check size={16} className="mr-2" />
                          Хариу
                        </label>
                        <div className="relative">
                          <textarea
                            name="respond"
                            value={formData.respond}
                            onChange={handleInputChange}
                            className="w-full p-3 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 h-40 shadow-sm bg-green-50/30 transition-all"
                            placeholder="Хариу бичнэ үү..."
                          />
                          <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                            {formData.respond.length} тэмдэгт
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="mb-4">
                          <label className="block text-sm text-gray-700 font-bold mb-2">
                            Төлөв
                          </label>
                          <select
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2D6B9F]"
                            required
                          >
                            <option value="pending">Хүлээгдэж буй</option>
                            <option value="in_progress">Төлөвлөгдсөн</option>
                            <option value="completed">Дууссан</option>
                            <option value="cancelled">Цуцлагдсан</option>
                          </select>
                        </div>
                        <div className="mb-4">
                          <label className="block text-sm text-gray-700 font-bold mb-2">
                            Төлбөр ($)
                          </label>
                          <input
                            type="number"
                            name="amount"
                            value={formData.amount}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:[#2D6B9F]"
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                          />
                        </div>
                      </div>
                    </>
                  ) : null}
                  <div className="flex flex-col sm:flex-row justify-end mt-6 gap-2">
                    <button
                      type="submit"
                      className="flex items-center justify-center px-3 py-1.5 bg-[#2D6B9F]/90 border rounded text-sm font-medium hover:bg-[#2D6B9F]"
                      style={{ borderColor: "#2D6B9F", color: 'white', minWidth: "110px", fontSize: "14px" }}
                    >
                      {formMode === 'create' ? (
                        <>
                          <Check size={15} className="mr-1" />
                          <span>Илгээх</span>
                        </>
                      ) : (
                        <>
                          <Pencil size={15} className="mr-1" />
                          <span>Хадгалах</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};

export default Service;