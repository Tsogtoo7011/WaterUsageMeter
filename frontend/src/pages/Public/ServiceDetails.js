import React, { useState, useEffect } from 'react';
import api from "../../utils/api";
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, PlusCircle, Edit, MessageSquare, X, Pencil } from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';

const ServiceDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const mode = queryParams.get('mode'); 

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [showResponse, setShowResponse] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    respond: '',
    status: '',
    amount: '',
    apartmentId: '',
  });
  const [csrfToken, setCsrfToken] = useState(null);
  const [amountError, setAmountError] = useState(''); 

  const navigate = useNavigate();

  useEffect(() => {
    fetchServiceDetail();
    fetchCsrfToken();

    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (userData && token) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser({ ...parsedUser, token });
      } catch (err) {
      }
    }
  }, [id]);

  useEffect(() => {

    if (service && (mode === 'edit' || mode === 'respond')) {
      setIsEditing(true);
      setFormData({
        description: service.Description || '',
        respond: service.Respond || '',
        status: service.Status || 'pending',
        amount: service.Amount !== null && service.Amount !== undefined ? service.Amount.toString() : '',
        apartmentId: service.ApartmentId || '',
      });
    } else {
      setIsEditing(false);
    }
  }, [service, mode]);

  useEffect(() => {
    if (service) {
      if (service.Status === 'Төлөвлөгдсөн' || service.Status === 'Цуцлагдсан') {
        setShowResponse(true);
      } else {
        setShowResponse(false);
      }
    }
  }, [service]);

  const fetchCsrfToken = async () => {
    try {
      const response = await api.get('/csrf-token');
      setCsrfToken(response.data.csrfToken);
      api.defaults.headers.common['X-CSRF-Token'] = response.data.csrfToken;
    } catch (err) {
    }
  };

  const fetchServiceDetail = async () => {
    try {
      setLoading(true);
      const userData = localStorage.getItem('user');
      let isAdmin = false;
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          isAdmin = parsedUser.isAdmin === true || parsedUser.AdminRight === 1;
        } catch {}
      }
      const endpoint = isAdmin ? `/services/admin/${id}` : `/services/${id}`;
      const response = await api.get(endpoint);
      setService(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch service details');
      setLoading(false);
    }
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
    if (!status) return '';
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getApartmentDisplay = (service) => {
    if (!service.ApartmentId) return 'Тодорхойгүй';
    return `${service.ApartmentName} - Блок ${service.BlockNumber}, Нэгж ${service.UnitNumber}`;
  };

  const toggleResponse = () => {
    setShowResponse(!showResponse);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
      let endpoint, payload;
      const isAdmin = user && (user.isAdmin === true || user.AdminRight === 1);

      if (isAdmin) {
        if (
          !formData.amount ||
          isNaN(parseFloat(formData.amount)) ||
          parseFloat(formData.amount) <= 0
        ) {
          setAmountError('Төлбөр оруулна уу');
          return;
        } else {
          setAmountError('');
        }
        endpoint = `/services/admin/${service.ServiceId}`;
        let status = formData.status;
        if (formData.amount && parseFloat(formData.amount) > 0) {
          status = "Төлөвлөгдсөн";
        }
        let respondValue = formData.respond && formData.respond.trim().length > 0
          ? formData.respond
          : "Таны үйлчилгээний хүсэлтийг хүлээн авлаа. Таньтай эргээд холбогдох болно.";
        payload = {
          respond: respondValue,
          status: status,
          amount: formData.amount ? parseFloat(formData.amount) : null,
        };
      } else {
        endpoint = `/services/update/${service.ServiceId}`;
        payload = {
          description: formData.description,
          apartmentId: formData.apartmentId || null,
        };
      }
      await api.put(endpoint, payload);
      setIsEditing(false);
      fetchServiceDetail();
      navigate(-1);
    } catch (err) {
      alert(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Хадгалах үед алдаа гарлаа'
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="px-4 sm:px-8 pt-4">
          <Breadcrumb />
        </div>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2D6B9F]"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <div className="px-4 sm:px-8 pt-4">
          <Breadcrumb />
        </div>
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-md mt-6 max-w-md mx-auto">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 bg-red-200 hover:bg-red-300 px-4 py-2 rounded"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-white">
        <div className="px-4 sm:px-8 pt-4">
          <Breadcrumb />
        </div>
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold text-gray-700">Service not found</h2>
          <button
            onClick={() => navigate('/services')}
            className="mt-4 flex items-center mx-auto px-4 py-2 bg-[#2D6B9F]/90 text-white rounded-md hover:bg-[#2D6B9F]"
          >
            <ChevronLeft size={16} className="mr-1" />
            Back to Service List
          </button>
        </div>
      </div>
    );
  }

  const isAdmin = user && (user.isAdmin === true || user.AdminRight === 1);

  return (
    <div className="min-h-screen bg-white">
      <div className="px-4 sm:px-8 py-6">
        <div className="flex mb-4 justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/service')}
              className="flex items-center px-2 py-1"
              style={{ color: "#2D6B9F" }}
              title="Буцах"
            >
              <ChevronLeft size={25} />
            </button>
            <span className="text-2xl font-bold text-[#2D6B9F] ml-3 select-none">Хэрэглэгчийн үйлчилгээ</span>
          </div>
        </div>
        <div className="px-4 pt-2 sm:px-0">
          <Breadcrumb />
        </div>
        
        <div className="w-full flex flex-col md:flex-row p-6 bg-white rounded-lg shadow-sm">
          <div className="md:flex-[3_3_0%] pr-4 pb-6">
            <h1 className="text-xl font-bold text-[#2D6B9F] mb-4">Үйлчилгээ #{service.ServiceId}</h1>
            <div className="flex items-center text-sm text-gray-500 mb-6">
              <span>Илгээсэн: {service.Username}</span>
              <span className="mx-2">•</span>
              <span>{service.RequestDate ? new Date(service.RequestDate).toLocaleString() : ''}</span>
            </div>
            <div className="mb-4 grid grid-cols-1 gap-4">
              <div>
                <h3 className="text-sm text-[#2D6B9F] font-semibold mb-1">Байр</h3>
                <p className="text-gray-700">
                  {service.ApartmentId ? getApartmentDisplay(service) : 'Тодорхойгүй'}
                </p>
              </div>
              <div>
                <h3 className="text-sm text-[#2D6B9F] font-semibold mb-1">Төлөв</h3>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(service.Status)}`}>
                  {formatStatus(service.Status)}
                </span>
              </div>
              <div>
                <h3 className="text-sm text-[#2D6B9F] font-semibold mb-1">Сүүлд шинэчилсэн</h3>
                <p className="text-gray-700">
                  {service.SubmitDate ? new Date(service.SubmitDate).toLocaleString() : 'Шинэчлэгдээгүй'}
                </p>
              </div>
              <div>
                <h3 className="text-sm text-[#2D6B9F] font-semibold mb-1">Төлбөр</h3>
                <p className="text-gray-700">
                  {service.Amount !== null && service.Amount !== undefined && !isNaN(parseFloat(service.Amount))
                    ? `${parseFloat(service.Amount).toFixed(2)}`
                    : '-'}
                </p>
              </div>
              {service.PaidDay && (
                <div>
                  <h3 className="text-sm text-[#2D6B9F] font-semibold mb-1">Төлбөр төлсөн огноо</h3>
                  <p className="text-gray-700">{new Date(service.PaidDay).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
          <div className="hidden md:block w-px bg-gray-300 mx-1"></div>
          <div className="md:flex-[7_7_0%] md:pl-4 flex flex-col h-full">
            {isEditing ? (
              <form onSubmit={handleSubmit}>
                {isAdmin ? (
                  <>
                    <div className="mb-5">
                      <label className="text-sm text-green-700 font-bold mb-2 flex items-center">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div className="mb-4 col-span-2">
                        <label className="block text-sm text-[#2D6B9F] font-bold mb-2">
                          Төлбөр ($)
                        </label>
                        <input
                          type="text"
                          name="amount"
                          value={formData.amount}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:[#2D6B9F] text-lg"
                          placeholder="0"
                          style={{ minWidth: "200px" }} 
                        />
                        {amountError && (
                          <div className="text-red-600 text-xs mt-1">{amountError}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end mt-6 gap-2">
                      <button
                        type="submit"
                        className="flex items-center px-2 py-1 border rounded text-xs font-medium hover:bg-[#2D6B9F] bg-[#2D6B9F]/90"
                        style={{ borderColor: "#2D6B9F", color: 'white', minWidth: "70px", fontSize: "12px" }}
                      >
                        <Pencil size={13} className="mr-1" />
                        Хадгалах
                      </button>
                      <button
                        type="button"
                        onClick={() => { setIsEditing(false); navigate(-1); }}
                        className="flex items-center px-2 py-1 border rounded text-xs font-medium hover:bg-blue-50/50"
                        style={{ borderColor: "#2D6B9F", color: "#2D6B9F", minWidth: "70px", fontSize: "12px" }}
                      >
                        <X size={13} className="mr-1" />
                        Болих
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-5">
                      <label className="text-[#2D6B9F] text-sm font-bold mb-2 flex items-center">
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
                    <div className="flex flex-col sm:flex-row justify-end mt-6 gap-2">
                      <button
                        type="submit"
                        className="flex items-center px-2 py-1 border rounded text-xs font-medium hover:bg-[#2D6B9F] bg-[#2D6B9F]/90"
                        style={{ borderColor: "#2D6B9F", color: 'white', minWidth: "70px", fontSize: "12px" }}
                      >
                        <Pencil size={13} className="mr-1" />
                        Хадгалах
                      </button>
                      <button
                        type="button"
                        onClick={() => { setIsEditing(false); navigate(`/services/${service.ServiceId}`); }}
                        className="flex items-center px-2 py-1 border rounded text-xs font-medium hover:bg-blue-50/50"
                        style={{ borderColor: "#2D6B9F", color: "#2D6B9F", minWidth: "70px", fontSize: "12px" }}
                      >
                        <X size={13} className="mr-1" />
                        Болих
                      </button>
                    </div>
                  </>
                )}
              </form>
            ) : (
              (() => {
                const contentBoxClass =
                  "text-gray-800 flex-grow overflow-y-auto break-all whitespace-normal border rounded p-3 h-64 md:h-80";
                // Determine if we should show the response and what label/color to use
                const isCancelled = service.Status === 'Цуцлагдсан';
                const isPlanned = service.Status === 'Төлөвлөгдсөн';
                const responseLabel = isCancelled ? "Цуцлагдсан" : "Хариу";
                const responseLabelClass = isCancelled ? "text-red-700 font-semibold" : "text-green-700 font-semibold";
                const responseBoxClass = isCancelled
                  ? `${contentBoxClass} border-red-200 bg-red-50`
                  : `${contentBoxClass} border-green-200 bg-green-50`;

                return !showResponse ? (
                  <>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm text-[#2D6B9F] font-semibold">Тайлбар</h3>
                      {service.Respond && (
                        <button 
                          onClick={toggleResponse} 
                          className="flex items-center justify-center text-[#2D6B9F] hover:text-[#1A4B7E] focus:outline-none"
                          aria-label="Show response"
                        >
                          <MessageSquare size={20} className="mr-1" />
                          <ChevronRight size={20} />
                        </button>
                      )}
                    </div>
                    <div className={`${contentBoxClass} border-blue-200 bg-blue-50/50`}>
                      {service.Description}
                    </div>
                    {user && (
                      <div className="flex justify-end mt-2">
                        {isAdmin ? (
                          service.Status !== 'Дууссан' && service.Status !== 'Цуцлагдсан' && (
                          <button
                            onClick={() => navigate(`/services/${service.ServiceId}?mode=edit`)}
                            className="flex items-center px-2 py-1 border rounded text-xs font-medium hover:bg-blue-50/50"
                            style={{ borderColor: "#2D6B9F", color: "#2D6B9F", minWidth: "70px", fontSize: "12px" }}
                          >
                            <MessageSquare size={13} className="mr-1" />
                            Хариу өгөх
                          </button>
                          )
                        ) : (
                          service.Status === 'Хүлээгдэж буй' && service.UserId === user.id && (
                            <button
                              onClick={() => navigate(`/services/${service.ServiceId}?mode=edit`)}
                              className="flex items-center px-2 py-1 border rounded text-xs font-medium hover:bg-blue-50/50"
                              style={{ borderColor: "#2D6B9F", color: "#2D6B9F", minWidth: "70px", fontSize: "12px" }}
                            >
                              <Edit size={13} className="mr-1" />
                              Засах
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className={`text-sm ${responseLabelClass}`}>{responseLabel}</h3>
                      <button 
                        onClick={toggleResponse} 
                        className={`flex items-center justify-center ${isCancelled ? "text-red-700 hover:text-red-800" : "text-green-700 hover:text-green-800"} focus:outline-none`}
                        aria-label="Show description"
                      >
                        <ChevronLeft size={20} />
                      </button>
                    </div>
                    <div className={responseBoxClass}>
                      {service.Respond || (isCancelled ? "Одоогоор хариу өгөөгүй байна." : "Одоогоор хариу өгөөгүй байна.")}
                    </div>
                    {isAdmin && isCancelled && (
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={async () => {

                            try {
                              await api.put(`/services/admin/${service.ServiceId}`, {
                                respond: "",
                                status: service.Status,
                                amount: service.Amount,
                              });
                              fetchServiceDetail();
                            } catch (err) {
                              alert('Сэргээх үед алдаа гарлаа');
                            }
                          }}
                          className="flex items-center px-2 py-1 border rounded text-xs font-medium hover:bg-red-100"
                          style={{
                            borderColor: "#dc2626",
                            color: "#dc2626",
                            minWidth: "70px",
                            fontSize: "12px"
                          }}
                        >
                          Сэргээх
                        </button>
                      </div>
                    )}
                    {isAdmin && !isCancelled && (
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={() => navigate(`/services/${service.ServiceId}?mode=edit`)}
                          className={`flex items-center px-2 py-1 border rounded text-xs font-medium hover:bg-green-100`}
                          style={{
                            borderColor: "#16a34a",
                            color: "#16a34a",
                            minWidth: "70px",
                            fontSize: "12px"
                          }}
                        >
                          <Edit size={13} className="mr-1" />
                          Засах
                        </button>
                      </div>
                    )}
                  </>
                );
              })()
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetails;