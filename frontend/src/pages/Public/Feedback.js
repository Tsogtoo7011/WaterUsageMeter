import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from "../../utils/api";
import VerificationReminder from '../../components/common/verificationReminder';
import Breadcrumb from '../../components/common/Breadcrumb';
import { Search, Eye, Edit, Trash2, PlusCircle, ChevronLeft, ChevronRight, X, Pencil, Check } from 'lucide-react';

export function Feedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(true); 
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const navigate = useNavigate();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    feedbackType: 1,
    description: ''
  });
  const [createError, setCreateError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');
  const [editFeedback, setEditFeedback] = useState(null);
  const [editFeedbackType, setEditFeedbackType] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

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

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/', { state: { from: '/feedback' } });
          return;
        }
        
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setIsAdmin(parsedUser.AdminRight === 1);
          setIsEmailVerified(!!parsedUser.IsVerified);
        } else {
          try {
            const { data } = await api.get('/users/profile');
            if (data.success && data.user) {
              setUser(data.user);
              setIsAdmin(data.user.AdminRight === 1);
              setIsEmailVerified(!!data.user.IsVerified);
              localStorage.setItem('user', JSON.stringify(data.user));
            }
          } catch (err) {
            console.error('Error fetching user profile:', err);
            navigate('/');
          }
        }
      } catch (err) {
        console.error('Error checking authentication:', err);
        navigate('/');
      }
    };
    
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const endpoint = isAdmin ? '/feedback/admin/all' : '/feedback';
        const { data } = await api.get(endpoint);
        
        if (data.success) {
          setFeedbacks(data.feedbacks);
        } else {
          setError('Санал хүсэлтийн жагсаалтыг авахад алдаа гарлаа');
        }
      } catch (err) {
        console.error('Error fetching feedbacks:', err);
        setError(err.response?.data?.message || 'Санал хүсэлтийн жагсаалтыг авахад алдаа гарлаа');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchFeedbacks();
    }
  }, [user, isAdmin]);

  const handleOpenCreateModal = () => {
    setCreateForm({ feedbackType: 1, description: '' });
    setCreateError('');
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setCreateError('');
  };

  const handleCreateInputChange = (e) => {
    const { name, value } = e.target;
    setCreateForm(prev => ({
      ...prev,
      [name]: value
    }));
    setCreateError('');
  };

  const handleCreateFeedback = async (e) => {
    e.preventDefault();
    if (!createForm.description.trim()) {
      setCreateError('Дэлгэрэнгүй мэдээлэл заавал шаардлагатай');
      return;
    }
    if (!user?.IsVerified) {
      setCreateError('Та имэйл хаягаа баталгаажуулсны дараа санал хүсэлт илгээх боломжтой.');
      return;
    }
    setIsCreating(true);
    try {
      await api.post('/feedback', {
        feedbackType: parseInt(createForm.feedbackType),
        description: createForm.description
      });
      setShowCreateModal(false);
      setCreateForm({ feedbackType: 1, description: '' });
      setCreateError('');
      // Refresh feedbacks
      if (user) {
        const endpoint = isAdmin ? '/feedback/admin/all' : '/feedback';
        const { data } = await api.get(endpoint);
        if (data.success) setFeedbacks(data.feedbacks);
      }
    } catch (error) {
      setCreateError(
        error.response?.data?.message ||
        'Санал хүсэлт илгээхэд алдаа гарлаа. Дахин оролдоно уу.'
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenEditModal = async (feedbackId) => {
    setEditLoading(true);
    setEditError('');
    setShowEditModal(true);
    try {
      const { data } = await api.get(`/feedback/${feedbackId}`);
      if (data.success) {
        setEditFeedback(data.feedback);
        setEditFeedbackType(String(data.feedback.Type));
        setEditDescription(data.feedback.Description || '');
        // If not pending, show error and close modal after delay
        if (
          data.feedback.Status !== 0 &&
          data.feedback.Status !== "Хүлээгдэж байна"
        ) {
          setEditError('Энэ санал хүсэлтийг засах боломжгүй байна');
          setTimeout(() => {
            setShowEditModal(false);
          }, 2000);
        }
      } else {
        setEditError('Санал хүсэлтийн мэдээллийг авахад алдаа гарлаа');
      }
    } catch (err) {
      setEditError(err.response?.data?.message || 'Санал хүсэлтийн мэдээллийг авахад алдаа гарлаа');
      setTimeout(() => {
        setShowEditModal(false);
      }, 2000);
    } finally {
      setEditLoading(false);
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditError('');
    setEditFeedback(null);
    setEditFeedbackType('');
    setEditDescription('');
    setEditLoading(false);
    setEditSubmitting(false);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editFeedbackType || !editDescription.trim()) {
      setEditError('Бүх талбарыг бөглөнө үү');
      return;
    }
    setEditSubmitting(true);
    setEditError('');
    try {
      const { data } = await api.put(`/feedback/${editFeedback.ApplicationId}`, {
        feedbackType: parseInt(editFeedbackType),
        description: editDescription.trim()
      });
      if (data.success) {
        // Refresh feedbacks
        const endpoint = isAdmin ? '/feedback/admin/all' : '/feedback';
        const { data: listData } = await api.get(endpoint);
        if (listData.success) setFeedbacks(listData.feedbacks);
        setShowEditModal(false);
      } else {
        setEditError(data.message || 'Санал хүсэлтийг шинэчлэхэд алдаа гарлаа');
      }
    } catch (err) {
      setEditError(err.response?.data?.message || 'Санал хүсэлтийг шинэчлэхэд алдаа гарлаа');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteFeedback = async (feedbackId) => {
    if (window.confirm('Энэ санал хүсэлтийг устгахдаа итгэлтэй байна уу?')) {
      try {
        const { data } = await api.delete(`/feedback/${feedbackId}`);
        
        if (data.success) {
          setFeedbacks(feedbacks.filter(feedback => feedback.ApplicationId !== feedbackId));
        } else {
          setError('Санал хүсэлтийг устгахад алдаа гарлаа');
        }
      } catch (err) {
        console.error('Error deleting feedback:', err);
        setError(err.response?.data?.message || 'Санал хүсэлтийг устгахад алдаа гарлаа');
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('mn-MN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleOpenDetailModal = async (feedbackId) => {
    setDetailLoading(true);
    setDetailError('');
    setShowDetailModal(true);
    try {
      const endpoint = isAdmin ? `/feedback/admin/${feedbackId}` : `/feedback/${feedbackId}`;
      const { data } = await api.get(endpoint);
      if (data.success) {
        setSelectedFeedback(data.feedback);
      } else {
        setDetailError('Санал хүсэлтийн мэдээллийг авахад алдаа гарлаа');
      }
    } catch (err) {
      setDetailError(err.response?.data?.message || 'Санал хүсэлтийн мэдээллийг авахад алдаа гарлаа');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedFeedback(null);
    setDetailError('');
  };

  const handleViewDetails = (feedbackId) => {
    handleOpenDetailModal(feedbackId);
  };

  const handleVerificationSuccess = () => {
    setUser(prev => ({
      ...prev,
      IsVerified: true
    }));
    setIsEmailVerified(true);
  };

  const canEditFeedback = (status, feedback) => {
    if (isAdmin) return false; 
    
    const currentUserId = user?.UserId;
    const feedbackUserId = feedback.UserAdminId;
    
    return status === 'Хүлээгдэж байна' && 
           currentUserId && 
           feedbackUserId && 
           Number(currentUserId) === Number(feedbackUserId);
  };
  
  const canDeleteFeedback = (status, feedback) => {
    if (isAdmin) return true; 
    
    const currentUserId = user?.UserId;
    const feedbackUserId = feedback.UserAdminId;
    
    return status === 'Хүлээгдэж байна' && 
           currentUserId && 
           feedbackUserId && 
           Number(currentUserId) === Number(feedbackUserId);
  };

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const renderSortArrow = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
  };

  const filteredFeedbacks = feedbacks.filter(feedback => {
    const matchesSearch =
      (feedback.Description && feedback.Description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (feedback.AdminResponse && feedback.AdminResponse.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (feedback.Username && feedback.Username.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (feedbackTypeNames[feedback.Type] && feedbackTypeNames[feedback.Type].toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || feedback.Status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedFeedbacks = React.useMemo(() => {
    let sortable = [...filteredFeedbacks];
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
  }, [filteredFeedbacks, sortConfig]);

  // Pagination logic
  const totalPages = Math.ceil(sortedFeedbacks.length / itemsPerPage);
  const paginatedFeedbacks = sortedFeedbacks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="px-4 sm:px-8 pt-4">
        <div className="max-w-7xl mx-auto pt-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#2D6B9F]">
              {isAdmin ? 'Санал хүсэлтийн удирдлага' : 'Санал хүсэлтийн жагсаалт'}
            </h1>
            <div className="px-4 pt-2 sm:px-0">
              <Breadcrumb />
            </div>
            <p className="text-gray-600 mt-2">
              {isAdmin
                ? 'Бүх хэрэглэгчийн санал хүсэлтийг хянах, удирдах'
                : 'Өөрийн илгээсэн санал, хүсэлт, гомдлын жагсаалт'}
            </p>
          </div>
          <div className="flex space-x-2 self-end sm:self-auto">
            {!isAdmin && (
              <button
                onClick={handleOpenCreateModal}
                className="flex items-center px-3 py-1.5 border rounded text-sm font-medium hover:bg-blue-50/50"
                style={{ borderColor: "#2D6B9F", color: "#2D6B9F", minWidth: "110px", fontSize: "14px" }}
              >
                <PlusCircle size={15} className="mr-1" />
                Шинэ хүсэлт
              </button>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto py-6 px-0 sm:px-0 lg:px-0">
            {user && !isEmailVerified && (
              <VerificationReminder user={user} onVerify={handleVerificationSuccess} />
            )}

            {error && (
              <div className="bg-red-50 p-4 rounded-md max-w-md mx-auto mb-6">
                <p className="text-red-600">{error}</p>
              </div>
            )}
            
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Санал хүсэлт хайх..."
                  className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2D6B9F]"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="w-full md:w-auto">
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2D6B9F] text-sm"
                >
                  <option value="all">Бүгд</option>
                  <option value="Хүлээгдэж байна">Хүлээгдэж байна</option>
                  <option value="Хүлээн авсан">Хүлээн авсан</option>
                  <option value="Хүлээн авахаас татгалзсан">Хүлээн авахаас татгалзсан</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredFeedbacks.length === 0 ? (
              <div className="bg-gray-100 p-8 rounded-lg text-center">
                <p className="text-lg text-gray-600">
                  {isAdmin ? 'Одоогоор бүртгэлтэй санал хүсэлт байхгүй байна.' : 
                  'Танд одоогоор бүртгэлтэй санал хүсэлт байхгүй байна.'}
                </p>
                {!isAdmin && (
                  <button
                    onClick={handleOpenCreateModal}
                    className="mt-4 bg-[#2D6B9F]/90 border rounded text-white font-medium py-2 px-4 hover:bg-[#2D6B9F] transition duration-200"
                    style={{ borderColor: "#2D6B9F" }}
                  >
                    Санал хүсэлт үүсгэх
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="align-middle inline-block min-w-full shadow overflow-hidden rounded-lg">
                  <table className="min-w-full bg-white rounded-lg overflow-hidden divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          className="px-2 md:px-6 py-2 md:py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider cursor-pointer select-none"
                          onClick={() => handleSort('ApplicationId')}
                        >
                          Дугаар{renderSortArrow('ApplicationId')}
                        </th>
                        {isAdmin && (
                          <th
                            className="px-2 md:px-6 py-2 md:py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider cursor-pointer select-none"
                            onClick={() => handleSort('Username')}
                          >
                            Хэрэглэгч{renderSortArrow('Username')}
                        </th>
                        )}
                        <th
                          className="px-2 md:px-6 py-2 md:py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider cursor-pointer select-none"
                          onClick={() => handleSort('Type')}
                        >
                          Төрөл{renderSortArrow('Type')}
                        </th>
                        <th
                          className="px-2 md:px-6 py-2 md:py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider cursor-pointer select-none"
                          onClick={() => handleSort('Description')}
                        >
                          Тайлбар{renderSortArrow('Description')}
                        </th>
                        <th
                          className="px-2 md:px-6 py-2 md:py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider cursor-pointer select-none"
                          onClick={() => handleSort('AdminResponse')}
                        >
                          Хариу{renderSortArrow('AdminResponse')}
                        </th>
                        <th
                          className="px-2 md:px-6 py-2 md:py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider cursor-pointer select-none"
                          onClick={() => handleSort('Status')}
                        >
                          Төлөв{renderSortArrow('Status')}
                        </th>
                        <th className="px-2 md:px-6 py-2 md:py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider">
                          Үйлдэл
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {paginatedFeedbacks.map((feedback, index) => {
                        const shouldShowEdit = canEditFeedback(feedback.Status, feedback);
                        const shouldShowDelete = canDeleteFeedback(feedback.Status, feedback);
                        return (
                          <tr key={feedback.ApplicationId} className="hover:bg-blue-50 transition group">
                            <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap font-medium text-xs md:text-sm text-gray-900 text-center">
                              {feedback.ApplicationId}
                            </td>
                            {isAdmin && (
                              <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500 text-center">
                                {feedback.Username || 'Хэрэглэгч'}
                              </td>
                            )}
                            <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500 text-center">
                              {feedbackTypeNames[feedback.Type] || 'Тодорхойгүй'}
                            </td>
                            <td className="px-2 md:px-6 py-2 md:py-4 text-xs md:text-sm text-gray-500 text-center">
                              <div className="max-w-[200px] truncate mx-auto">{feedback.Description}</div>
                            </td>
                            <td className="px-2 md:px-6 py-2 md:py-4 text-xs md:text-sm text-gray-500 text-center">
                              <div className="max-w-[200px] truncate mx-auto">{feedback.AdminResponse || '-'}</div>
                            </td>
                            <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-center">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(feedback.Status)}`}>
                                {statusNames[feedback.Status] || 'Тодорхойгүй'}
                              </span>
                            </td>
                            <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-center text-xs md:text-sm font-medium">
                              <div className="flex justify-center gap-1">
                                <button
                                  onClick={() => handleViewDetails(feedback.ApplicationId)}
                                  className="text-[#2D6B9F] hover:text-[#2D6B9F] w-8 h-8 flex items-center justify-center"
                                  title={isAdmin ? "Хянах" : "Дэлгэрэнгүй"}
                                >
                                  <Eye size={16} />
                                </button>
                                {shouldShowEdit && (
                                  <button
                                    onClick={() => handleOpenEditModal(feedback.ApplicationId)}
                                    className="text-green-600 hover:text-green-900 w-8 h-8 flex items-center justify-center"
                                    title="Засах"
                                  >
                                    <Edit size={16} />
                                  </button>
                                )}
                                {shouldShowDelete && (
                                  <button
                                    onClick={() => handleDeleteFeedback(feedback.ApplicationId)}
                                    className="text-red-600 hover:text-red-900 w-8 h-8 flex items-center justify-center"
                                    title="Устгах"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {/* Pagination controls */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-4 items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
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
                            onClick={() => setCurrentPage(page)}
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
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
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
              </div>
            )}
          </div>
        </div>
        {/* Feedback Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200 z-[110]">
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-m font-bold text-[#2D6B9F]">Санал хүсэлт бичих</h2>
                  <button
                    onClick={handleCloseCreateModal}
                    className="text-gray-400 hover:text-[#2D6B9F]"
                  >
                    <X size={20} />
                  </button>
                </div>
                {createError && (
                  <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{createError}</div>
                )}
                <form onSubmit={handleCreateFeedback} className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-[#2D6B9F] text-sm font-medium" htmlFor="feedbackType">
                        Төрөл <span className="text-red-400">*</span>
                      </label>
                    </div>
                    <select
                      id="feedbackType"
                      name="feedbackType"
                      value={createForm.feedbackType}
                      onChange={handleCreateInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#2D6B9F] focus:border-[#2D6B9F]"
                      required
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
                      <span className="text-sm text-gray-500">{createForm.description.length}/2000</span>
                    </div>
                    <div className="relative">
                      <textarea
                        className="w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg focus:ring-2 focus:ring-[#2D6B9F] focus:border-[#2D6B9F] focus:outline-none shadow-sm transition-all"
                        id="description"
                        name="description"
                        rows="8"
                        placeholder="Таны санал хүсэлт, гомдол, өргөдлийг дэлгэрэнгүй бичнэ үү..."
                        value={createForm.description}
                        onChange={handleCreateInputChange}
                        maxLength={2000}
                        required
                      ></textarea>
                      <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                        {createForm.description.length} тэмдэгт
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-end mt-6 gap-2">
                    <button
                      type="submit"
                      className={`bg-[#2D6B9F]/90 text-white hover:bg-[#2D6B9F] flex items-center justify-center px-3 py-1.5 rounded text-sm font-medium transition duration-200`}
                      style={{ borderColor: "#2D6B9F", minWidth: "110px", fontSize: "14px" }}
                      disabled={isCreating}
                    >
                      {isCreating ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Илгээж байна...
                        </>
                      ) : (
                        <>
                          <Check size={15} className="mr-1" />
                          Илгээх
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        {showDetailModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[120] p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200 z-[130]">
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-m font-bold text-[#2D6B9F]">Санал хүсэлт дэлгэрэнгүй</h2>
                  <button
                    onClick={handleCloseDetailModal}
                    className="text-gray-400 hover:text-[#2D6B9F]"
                  >
                    <X size={20} />
                  </button>
                </div>
                {detailLoading ? (
                  <div className="flex justify-center items-center py-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : detailError ? (
                  <div className="p-4 mb-6 bg-red-100 text-red-700 rounded-lg">
                    <p>{detailError}</p>
                  </div>
                ) : selectedFeedback ? (
                  <div className="space-y-6">
                    <div className="bg-white p-4 md:p-6 rounded-lg">
                      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm text-[#2D6B9F] font-semibold mb-1">Төрөл</h3>
                          <p className="text-gray-700">{feedbackTypeNames[selectedFeedback.Type] || 'Тодорхойгүй'}</p>
                        </div>
                        <div>
                          <h3 className="text-sm text-[#2D6B9F] font-semibold mb-1">Төлөв</h3>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(selectedFeedback.Status)}`}>
                            {statusNames[selectedFeedback.Status] || 'Тодорхойгүй'}
                          </span>
                        </div>
                      </div>
                      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm text-[#2D6B9F] font-semibold mb-1">Огноо</h3>
                          <p className="text-gray-700">{formatDate(selectedFeedback.CreatedAt)}</p>
                        </div>
                        {selectedFeedback.UpdatedAt !== selectedFeedback.CreatedAt && (
                          <div>
                            <h3 className="text-sm text-[#2D6B9F] font-semibold mb-1">Шинэчилсэн</h3>
                            <p className="text-gray-700">{formatDate(selectedFeedback.UpdatedAt)}</p>
                          </div>
                        )}
                      </div>
                      {isAdmin && selectedFeedback.Username && (
                        <div className="mb-4">
                          <h3 className="text-sm text-[#2D6B9F] font-semibold mb-1">Хэрэглэгч</h3>
                          <p className="text-gray-700">{selectedFeedback.Username}</p>
                        </div>
                      )}
                    </div>
                    <div className="bg-white p-4 md:p-6 rounded-lg">
                      <h3 className="text-sm font-semibold mb-2 text-[#2D6B9F] flex items-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-2" stroke="#2D6B9F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        Тайлбар
                      </h3>
                      <div
                        className="bg-blue-50 rounded-lg p-4 text-gray-700 shadow-sm max-h-56 overflow-y-auto break-words leading-relaxed scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-blue-50"
                        style={{ scrollbarWidth: 'thin', maxHeight: '14rem' }}
                      >
                        {selectedFeedback.Description}
                      </div>
                    </div>
                    <div className="bg-white p-4 md:p-6 rounded-lg">
                      <h3 className="text-sm font-semibold mb-2 text-green-700 flex items-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-2" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Хариу
                      </h3>
                      <div className="p-4 bg-green-50 rounded-lg text-gray-800 shadow-sm max-h-56 overflow-y-auto break-words leading-relaxed scrollbar-thin scrollbar-thumb-green-200 scrollbar-track-green-50"
                        style={{ scrollbarWidth: 'thin', maxHeight: '14rem' }}
                      >
                        {selectedFeedback.AdminResponse || 'Одоогоор хариу ирээгүй байна.'}
                      </div>
                    </div>
                    {selectedFeedback && (
                      <div className="flex flex-col sm:flex-row justify-end mt-4 gap-2">
                        {canEditFeedback(selectedFeedback.Status, selectedFeedback) && (
                          <button
                            onClick={() => {
                              setShowDetailModal(false);
                              handleOpenEditModal(selectedFeedback.ApplicationId);
                            }}
                            className="flex items-center justify-center px-3 py-1.5 rounded text-sm font-medium bg-[#2D6B9F]/90 text-white hover:bg-[#2D6B9F]"
                            style={{ minWidth: "110px", fontSize: "14px", border: "none" }}
                          >
                            <Pencil size={15} className="mr-1" />
                            <span>Засварлах</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}
        {/* Feedback Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[130] p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200 z-[140]">
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-m font-bold text-[#2D6B9F]">Санал хүсэлт засах</h2>
                  <button
                    onClick={handleCloseEditModal}
                    className="text-gray-400 hover:text-[#2D6B9F]"
                  >
                    <X size={20} />
                  </button>
                </div>
                {editError && (
                  <div className="p-4 mb-4 bg-red-100 text-red-700 rounded-lg">
                    <p>{editError}</p>
                  </div>
                )}
                {editLoading ? (
                  <div className="flex justify-center items-center py-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <form onSubmit={handleEditSubmit} className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-[#2D6B9F] text-sm font-medium" htmlFor="feedbackType">
                          Төрөл <span className="text-red-400">*</span>
                        </label>
                      </div>
                      <select
                        id="feedbackType"
                        value={editFeedbackType}
                        onChange={(e) => setEditFeedbackType(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#2D6B9F] focus:border-[#2D6B9F]"
                        required
                        disabled={editFeedback && !(editFeedback.Status === 0 || editFeedback.Status === "Хүлээгдэж байна")}
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
                        <span className="text-sm text-gray-500">{editDescription.length}/2000</span>
                      </div>
                      <div className="relative">
                        <textarea
                          id="description"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          rows={8}
                          className="w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg focus:ring-2 focus:ring-[#2D6B9F] focus:border-[#2D6B9F] focus:outline-none shadow-sm transition-all"
                          placeholder="Санал хүсэлтийн дэлгэрэнгүй мэдээллийг бичнэ үү"
                          required
                          maxLength={2000}
                          disabled={editFeedback && !(editFeedback.Status === 0 || editFeedback.Status === "Хүлээгдэж байна")}
                        />
                        <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                          {editDescription.length} тэмдэгт
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end mt-6 gap-2">
                      <button
                        type="submit"
                        disabled={editSubmitting || (editFeedback && !(editFeedback.Status === 0 || editFeedback.Status === "Хүлээгдэж байна"))}
                        className={`bg-[#2D6B9F]/90 text-white hover:bg-[#2D6B9F] flex items-center justify-center px-3 py-1.5 rounded text-sm font-medium transition duration-200 ${
                          (editSubmitting || (editFeedback && !(editFeedback.Status === 0 || editFeedback.Status === "Хүлээгдэж байна"))) ? 'opacity-70 cursor-not-allowed' : ''
                        }`}
                        style={{ borderColor: "#2D6B9F", minWidth: "110px", fontSize: "14px" }}
                      >
                        {editSubmitting ? 'Хадгалж байна...' : (
                          <>
                            <Pencil size={15} className="mr-1" />
                            Хадгалах
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
  );  
}
export default Feedback;