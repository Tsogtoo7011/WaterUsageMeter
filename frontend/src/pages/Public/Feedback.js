import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from "../../utils/api";
import VerificationReminder from '../../components/common/verificationReminder';
import Breadcrumb from '../../components/common/Breadcrumb';
import { Search } from 'lucide-react';

export function Feedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(true); 
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

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

  const handleCreateFeedback = () => {
    navigate('/feedback/create');
  };

  const handleEditFeedback = (feedbackId) => {
    navigate(`/feedback/edit/${feedbackId}`);
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

  const handleViewDetails = (feedbackId) => {
    navigate(`/feedback/${feedbackId}`);
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

  const filteredFeedbacks = feedbacks.filter(feedback => {
    const matchesSearch =
      (feedback.Description && feedback.Description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (feedback.AdminResponse && feedback.AdminResponse.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (feedback.Username && feedback.Username.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (feedbackTypeNames[feedback.Type] && feedbackTypeNames[feedback.Type].toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || feedback.Status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
            <button
              onClick={() => navigate('/home')}
              className="flex items-center px-3 py-1.5 border rounded text-sm font-medium hover:bg-gray-100"
              style={{ borderColor: "#2D6B9F", color: "#2D6B9F", minWidth: "110px", fontSize: "14px" }}
            >
              Буцах
            </button>
            {!isAdmin && (
              <button
                onClick={handleCreateFeedback}
                className="flex items-center px-3 py-1.5 bg-[#2D6B9F]/90 border rounded text-sm font-medium hover:bg-[#2D6B9F]"
                style={{ borderColor: "#2D6B9F", color: 'white', minWidth: "110px", fontSize: "14px" }}
              >
                Бичих
              </button>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto py-6 px-0 sm:px-0 lg:px-0">
          <div className="bg-white shadow-lg rounded-lg p-6 border border-gray-200">
            {user && !isEmailVerified && (
              <VerificationReminder user={user} onVerify={handleVerificationSuccess} />
            )}

            {error && (
              <div className="p-4 mb-6 bg-red-100 text-red-700 rounded-lg">
                <p>{error}</p>
              </div>
            )}

            {/* Search and Filter Bar */}
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
                    onClick={handleCreateFeedback}
                    className="mt-4 bg-[#2D6B9F]/90 border rounded text-white font-medium py-2 px-4 hover:bg-[#2D6B9F] transition duration-200"
                    style={{ borderColor: "#2D6B9F" }}
                  >
                    Санал хүсэлт үүсгэх
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 md:px-6 py-2 md:py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider">Дугаар</th>
                      {isAdmin && (
                        <th className="px-2 md:px-6 py-2 md:py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider">Хэрэглэгч</th>
                      )}
                      <th className="px-2 md:px-6 py-2 md:py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider">Төрөл</th>
                      <th className="px-2 md:px-6 py-2 md:py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider">Тайлбар</th>
                      <th className="px-2 md:px-6 py-2 md:py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider">Хариу</th>
                      <th className="px-2 md:px-6 py-2 md:py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider">Төлөв</th>
                      <th className="px-2 md:px-6 py-2 md:py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider">Огноо</th>
                      <th className="px-2 md:px-6 py-2 md:py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider">Үйлдэл</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredFeedbacks.map((feedback, index) => {
                      const shouldShowEdit = canEditFeedback(feedback.Status, feedback);
                      const shouldShowDelete = canDeleteFeedback(feedback.Status, feedback);
                      return (
                        <tr key={feedback.ApplicationId} className="hover:bg-blue-50 transition group">
                          <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900 text-center">{index + 1}</td>
                          {isAdmin && (
                            <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900 text-center">
                              {feedback.Username || 'Хэрэглэгч'}
                            </td>
                          )}
                          <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900 text-center">
                            {feedbackTypeNames[feedback.Type] || 'Тодорхойгүй'}
                          </td>
                          <td className="px-2 md:px-6 py-2 md:py-4 text-xs md:text-sm text-gray-900 text-center">
                            <div className="max-w-xs overflow-hidden text-ellipsis">
                              {feedback.Description}
                            </div>
                          </td>
                          <td className="px-2 md:px-6 py-2 md:py-4 text-xs md:text-sm text-gray-900 text-center">
                            <div className="max-w-xs overflow-hidden text-ellipsis">
                              {feedback.AdminResponse || '-'}
                            </div>
                          </td>
                          <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-center">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(feedback.Status)}`}>
                              {statusNames[feedback.Status] || 'Тодорхойгүй'}
                            </span>
                          </td>
                          <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900 text-center">
                            {formatDate(feedback.CreatedAt)}
                          </td>
                          <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-center text-xs md:text-sm font-medium">
                            <div className="flex flex-col md:flex-row justify-center gap-1 md:gap-2">
                              <button 
                                onClick={() => handleViewDetails(feedback.ApplicationId)}
                                className="text-blue-600 hover:text-blue-900 px-2 py-1 bg-blue-50 hover:bg-blue-100 rounded"
                              >
                                {isAdmin ? "Хянах" : "Дэлгэрэнгүй"}
                              </button>
                              {shouldShowEdit && (
                                <button 
                                  onClick={() => handleEditFeedback(feedback.ApplicationId)}
                                  className="text-yellow-600 hover:text-yellow-900 px-2 py-1 bg-yellow-50 hover:bg-yellow-100 rounded"
                                >
                                  Засах
                                </button>
                              )}
                              {shouldShowDelete && (
                                <button 
                                  onClick={() => handleDeleteFeedback(feedback.ApplicationId)}
                                  className="text-red-600 hover:text-red-900 px-2 py-1 bg-red-50 hover:bg-red-100 rounded"
                                >
                                  Устгах
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Feedback;