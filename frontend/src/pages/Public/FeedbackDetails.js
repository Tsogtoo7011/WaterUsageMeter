import React, { useState, useEffect } from 'react';
import api from "../../utils/api";
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Pencil, Edit, MessageSquare, X } from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';

const feedbackTypeNames = {
  '1': 'Санал',
  '2': 'Хүсэлт',
  '3': 'Гомдол'
};

const statusNames = {
  'Хүлээгдэж байна': 'Хүлээгдэж байна',
  'Хүлээн авсан': 'Хүлээн авсан',
  'Хүлээн авахаас татгалзсан': 'Хүлээн авахаас татгалзсан'
};

const getStatusBadgeColor = (status) => {
  switch (status) {
    case 'Хүлээгдэж байна': return 'bg-yellow-100 text-yellow-800';
    case 'Хүлээн авсан': return 'bg-green-100 text-green-800';
    case 'Хүлээн авахаас татгалзсан': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('mn-MN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const FeedbackDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const mode = queryParams.get('mode');
  const isEditMode = location.pathname.endsWith('/edit') || mode === 'edit';

  const navigate = useNavigate();
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [showResponse, setShowResponse] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    feedbackType: '',
    description: '',
    adminResponse: '',
  });
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {}
    }
    fetchFeedbackDetail();
    // eslint-disable-next-line
  }, [id]);

  useEffect(() => {
    if (feedback && (isEditMode || isEditing)) {
      setIsEditing(true);
      setFormData({
        feedbackType: String(feedback.Type || ''),
        description: feedback.Description || '',
        adminResponse: feedback.AdminResponse || '',
      });
    } else {
      setIsEditing(false);
    }
    // eslint-disable-next-line
  }, [feedback, isEditMode]);

  const fetchFeedbackDetail = async () => {
    try {
      setLoading(true);
      setError('');
      const storedUser = localStorage.getItem('user');
      let isAdmin = false;
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          isAdmin = parsedUser.AdminRight === 1;
        } catch {}
      }
      const endpoint = isAdmin ? `/feedback/admin/${id}` : `/feedback/${id}`;
      const { data } = await api.get(endpoint);
      if (data.success) {
        setFeedback(data.feedback);
      } else {
        setError('Санал хүсэлтийн мэдээллийг авахад алдаа гарлаа');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Санал хүсэлтийн мэдээллийг авахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const canEditFeedback = () => {
    if (!user || !feedback) return false;
    if (user.AdminRight === 1) return false;
    return feedback.Status === 'Хүлээгдэж байна' &&
      (Number(user.UserId) === Number(feedback.UserAdminId) || Number(user.id) === Number(feedback.UserAdminId));
  };

  const isAdmin = user && user.AdminRight === 1;

  const handleEdit = () => {
    setIsEditing(true);
    setFormData({
      feedbackType: String(feedback.Type || ''),
      description: feedback.Description || '',
      adminResponse: feedback.AdminResponse || '',
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditError('');
    navigate(-1); 
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setEditError('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditSubmitting(true);
    try {
      let endpoint, payload;
      if (isAdmin) {
        let adminResponse = formData.adminResponse.trim();
        if (!adminResponse) {
          const typeName = feedbackTypeNames[feedback.Type] || 'санал хүсэлт';
          adminResponse = `Таны ${typeName.toLowerCase()} хүлээн авлаа`;
        }
        endpoint = `/feedback/admin/${feedback.ApplicationId}`;
        payload = { adminResponse };
      } else {
        endpoint = `/feedback/${feedback.ApplicationId}`;
        payload = {
          feedbackType: parseInt(formData.feedbackType),
          description: formData.description.trim(),
        };
      }
      const { data } = await api.put(endpoint, payload);
      if (data.success) {
        if (isAdmin) {
          navigate(-1); 
        } else {
          await fetchFeedbackDetail();
          setIsEditing(false);
          navigate(-1); 
        }
      } else {
        setEditError(data.message || 'Шинэчлэхэд алдаа гарлаа');
      }
    } catch (err) {
      setEditError(err.response?.data?.message || 'Шинэчлэхэд алдаа гарлаа');
    } finally {
      setEditSubmitting(false);
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
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mt-6 max-w-md mx-auto">
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

  if (!feedback) {
    return (
      <div className="min-h-screen bg-white">
        <div className="px-4 sm:px-8 pt-4">
          <Breadcrumb />
        </div>
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold text-gray-700">Санал хүсэлт олдсонгүй</h2>
          <button
            onClick={() => navigate('/feedback')}
            className="mt-4 flex items-center mx-auto px-4 py-2 bg-[#2D6B9F]/90 text-white rounded-md hover:bg-[#2D6B9F]"
          >
            <ChevronLeft size={16} className="mr-1" />
            Санал хүсэлтийн жагсаалт руу буцах
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="px-4 sm:px-8 py-6">
        <div className="flex mb-4 justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/feedback')}
              className="flex items-center px-2 py-1"
              style={{ color: "#2D6B9F" }}
              title="Буцах"
            >
              <ChevronLeft size={25} />
            </button>
            <span className="text-2xl font-bold text-[#2D6B9F] ml-3 select-none">Хэрэглэгчийн санал хүсэлт</span>
          </div>
        </div>
        <div className="px-4 pt-2 sm:px-0">
          <Breadcrumb />
        </div>
        <div className="w-full flex flex-col md:flex-row p-6 bg-white rounded-lg shadow-sm">
          <div className="md:flex-[3_3_0%] pr-4 pb-6">
            <h1 className="text-xl font-bold text-[#2D6B9F] mb-4">Санал хүсэлт #{feedback.ApplicationId}</h1>
            <div className="flex items-center text-sm text-gray-500 mb-6">
              <span>Илгээсэн: {feedback.Username || '-'}</span>
              <span className="mx-2">•</span>
              <span>{formatDate(feedback.CreatedAt)}</span>
            </div>
            <div className="mb-4 grid grid-cols-1 gap-4">
              <div>
                <h3 className="text-sm text-[#2D6B9F] font-semibold mb-1">Төрөл</h3>
                <p className="text-gray-700">{feedbackTypeNames[feedback.Type] || 'Тодорхойгүй'}</p>
              </div>
              <div>
                <h3 className="text-sm text-[#2D6B9F] font-semibold mb-1">Төлөв</h3>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(feedback.Status)}`}>
                  {statusNames[feedback.Status] || 'Тодорхойгүй'}
                </span>
              </div>
              <div>
                <h3 className="text-sm text-[#2D6B9F] font-semibold mb-1">Хариу өгсөн огноо</h3>
                <p className="text-gray-700">
                  {feedback.UpdatedAt !== feedback.CreatedAt ? formatDate(feedback.UpdatedAt) : 'Шинэчлэгдээгүй'}
                </p>
              </div>
            </div>
          </div>
          <div className="hidden md:block w-px bg-gray-300 mx-1"></div>
          <div className="md:flex-[7_7_0%] md:pl-4 flex flex-col h-full">
            {isEditing ? (
              <form onSubmit={handleEditSubmit} className="space-y-6">
                {editError && (
                  <div className="p-4 mb-4 bg-red-100 text-red-700 rounded-lg">
                    <p>{editError}</p>
                  </div>
                )}
                {isAdmin ? (
                  <>
                    <div>
                      <label className="block text-green-700 text-sm font-medium mb-2" htmlFor="adminResponse">
                        Хариу <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <textarea
                          id="adminResponse"
                          name="adminResponse"
                          value={formData.adminResponse}
                          onChange={handleInputChange}
                          rows={8}
                          className="w-full px-4 py-3 bg-green-50 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600 focus:outline-none shadow-sm transition-all"
                          placeholder="Хариу бичнэ үү..."
                          maxLength={2000}
                        />
                        <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                          {formData.adminResponse.length} тэмдэгт
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-[#2D6B9F] text-sm font-medium mb-2" htmlFor="feedbackType">
                        Төрөл <span className="text-red-400">*</span>
                      </label>
                      <select
                        id="feedbackType"
                        name="feedbackType"
                        value={formData.feedbackType}
                        onChange={handleInputChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#2D6B9F] focus:border-[#2D6B9F]"
                      >
                        <option value="" disabled>Төрлөө сонгоно уу</option>
                        <option value="1">Санал</option>
                        <option value="2">Хүсэлт</option>
                        <option value="3">Гомдол</option>
                      </select>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-[#2D6B9F] text-sm font-medium" htmlFor="description">
                          Дэлгэрэнгүй <span className="text-red-400">*</span>
                        </label>
                        <span className="text-sm text-gray-500">{formData.description.length}/2000</span>
                      </div>
                      <div className="relative">
                        <textarea
                          id="description"
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows={8}
                          className="w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg focus:ring-2 focus:ring-[#2D6B9F] focus:border-[#2D6B9F] focus:outline-none shadow-sm transition-all"
                          placeholder="Санал хүсэлтийн дэлгэрэнгүй мэдээллийг бичнэ үү"
                          maxLength={2000}
                        />
                        <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                          {formData.description.length} тэмдэгт
                        </div>
                      </div>
                    </div>
                  </>
                )}
                <div className="flex flex-col sm:flex-row justify-end mt-6 gap-2">
                  <button
                    type="submit"
                    disabled={editSubmitting}
                    className={`bg-[#2D6B9F]/90 text-white hover:bg-[#2D6B9F] flex items-center justify-center px-2 py-1 border rounded text-xs font-medium transition duration-200 ${
                      editSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                    style={{ borderColor: "#2D6B9F", minWidth: "70px", fontSize: "12px" }}
                  >
                    {editSubmitting ? 'Хадгалж байна...' : (
                      <>
                        <Pencil size={13} className="mr-1" />
                        Хадгалах
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex items-center px-2 py-1 border rounded text-xs font-medium hover:bg-blue-50/50"
                    style={{ borderColor: "#2D6B9F", color: "#2D6B9F", minWidth: "70px", fontSize: "12px" }}
                  >
                    <X size={13} className="mr-1" />
                    Болих
                  </button>
                </div>
              </form>
            ) : (
              (() => {
                const contentBoxClass =
                  "text-gray-800 flex-grow overflow-y-auto break-all whitespace-normal border rounded p-3 h-64 md:h-80";
                return !showResponse ? (
                  <>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm text-[#2D6B9F] font-semibold">Тайлбар</h3>
                      {feedback.AdminResponse && (
                        <button 
                          onClick={() => setShowResponse(true)}
                          className="flex items-center justify-center text-[#2D6B9F] hover:text-[#1A4B7E] focus:outline-none"
                          aria-label="Show response"
                        >
                          <MessageSquare size={20} className="mr-1" />
                          <ChevronRight size={20} />
                        </button>
                      )}
                    </div>
                    <div className={`${contentBoxClass} border-blue-200 bg-blue-50/50`}>
                      {feedback.Description}
                    </div>
                    <div className="flex justify-end mt-2">
                      {user && (
                        isAdmin ? (
                          <button
                            onClick={handleEdit}
                            className="flex items-center px-2 py-1 border rounded text-xs font-medium hover:bg-blue-50/50"
                            style={{ borderColor: "#2D6B9F", color: "#2D6B9F", minWidth: "70px", fontSize: "12px" }}
                          >
                            <MessageSquare size={13} className="mr-1" />
                            Хариу өгөх
                          </button>
                        ) : (
                          canEditFeedback() && (
                            <button
                              onClick={handleEdit}
                              className="flex items-center px-2 py-1 border rounded text-xs font-medium hover:bg-blue-50/50"
                              style={{ borderColor: "#2D6B9F", color: "#2D6B9F", minWidth: "70px", fontSize: "12px" }}
                            >
                              <Edit size={13} className="mr-1" />
                              Засах
                            </button>
                          )
                        )
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm text-green-700 font-semibold">Хариу</h3>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setShowResponse(false)}
                          className="flex items-center justify-center text-green-700 hover:text-green-800 focus:outline-none"
                          aria-label="Show description"
                        >
                          <ChevronLeft size={20} />
                        </button>
                      </div>
                    </div>
                    <div className={`${contentBoxClass} border-green-200 bg-green-50`}>
                      {feedback.AdminResponse || "Одоогоор хариу ирээгүй байна."}
                    </div>
                    {isAdmin && (
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={handleEdit}
                          className="flex items-center px-2 py-1 border rounded text-xs font-medium hover:bg-green-100"
                          style={{ borderColor: "#16a34a", color: "#16a34a", minWidth: "70px", fontSize: "12px" }}
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

export default FeedbackDetails;