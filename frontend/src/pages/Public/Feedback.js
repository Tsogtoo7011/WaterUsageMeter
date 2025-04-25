import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from "../../utils/api";
import VerificationReminder from '../../components/common/verificationReminder';

export function Feedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(true); 
  const navigate = useNavigate();

  const feedbackTypeNames = {
    1: 'Санал',
    2: 'Хүсэлт',
    3: 'Гомдол'
  };

  const statusNames = {
    0: 'Хүлээгдэж буй',
    1: 'Хянагдаж байгаа',
    2: 'Шийдвэрлэсэн'
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
          console.log("User info:", parsedUser);
          console.log("Is admin:", parsedUser.AdminRight === 1);
          console.log("Email verified:", !!parsedUser.IsVerified);
        } else {
          try {
            const { data } = await api.get('/users/profile');
            if (data.success && data.user) {
              setUser(data.user);
              setIsAdmin(data.user.AdminRight === 1);
              setIsEmailVerified(!!data.user.IsVerified);
              localStorage.setItem('user', JSON.stringify(data.user));
              console.log("User info from API:", data.user);
              console.log("Is admin from API:", data.user.AdminRight === 1);
              console.log("Email verified from API:", !!data.user.IsVerified);
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
          console.log("Fetched feedbacks:", data.feedbacks);
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
    const date = new Date(dateString);
    return date.toLocaleDateString('mn-MN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 0: return 'bg-yellow-100 text-yellow-800';
      case 1: return 'bg-blue-100 text-blue-800';
      case 2: return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewDetails = (feedbackId) => {
    navigate(`/feedback/${feedbackId}`);
  };

  // Handle verification success - update the user state like in Home.js
  const handleVerificationSuccess = () => {
    setUser(prev => ({
      ...prev,
      IsVerified: true
    }));
    setIsEmailVerified(true);
  };

  const canEditFeedback = (status, userId) => {
    const currentUserId = user?.UserId;
    console.log("Can edit check:", {
      status,
      userId,
      currentUserId,
      isAdmin,
      result: !isAdmin && status === 0 && currentUserId && Number(currentUserId) === Number(userId)
    });
    
    if (userId === undefined || userId === null) {
      return !isAdmin && status === 0;
    }
    
    return !isAdmin && status === 0 && currentUserId && Number(currentUserId) === Number(userId);
  };
  
  const canDeleteFeedback = (status, userId) => {
    if (isAdmin) {
      return true;
    }
    
    const currentUserId = user?.UserId;
    console.log("Can delete check:", {
      status,
      userId,
      currentUserId,
      isAdmin,
      result: status === 0 && currentUserId && Number(currentUserId) === Number(userId)
    });
    
    if (userId === undefined || userId === null) {
      return status === 0;
    }
    
    return status === 0 && currentUserId && Number(currentUserId) === Number(userId);
  };

  const findUserIdField = (feedback) => {
    const possibleFields = ['UserAdminUserId', 'UserId', 'userId', 'user_id', 'createdBy'];
    
    for (const field of possibleFields) {
      if (feedback[field] !== undefined && feedback[field] !== null) {
        return feedback[field];
      }
    }
  
    return null;
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-5xl p-6 bg-white rounded-lg shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">
            {isAdmin ? 'Санал хүсэлтийн удирдлага' : 'Санал хүсэлтийн жагсаалт'}
          </h1>
          <div className="flex space-x-2 self-end sm:self-auto">
            <button
              onClick={() => navigate('/home')}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-3 md:px-4 rounded-lg text-sm md:text-base transition duration-200"
            >
              Буцах
            </button>
            {!isAdmin && (
              <button
                onClick={handleCreateFeedback}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 md:px-4 rounded-lg text-sm md:text-base transition duration-200"
              >
                Бичих
              </button>
            )}
          </div>
        </div>

        {/* Display verification reminder if email is not verified - updated to match Home.js */}
        {user && !isEmailVerified && (
          <VerificationReminder user={user} onVerify={handleVerificationSuccess} />
        )}

        {error && (
          <div className="p-4 mb-6 bg-red-100 text-red-700 rounded-lg">
            <p>{error}</p>
          </div>
        )}
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="bg-gray-100 p-8 rounded-lg text-center">
            <p className="text-lg text-gray-600">
              {isAdmin ? 'Одоогоор бүртгэлтэй санал хүсэлт байхгүй байна.' : 
              'Танд одоогоор бүртгэлтэй санал хүсэлт байхгүй байна.'}
            </p>
            {!isAdmin && (
              <button
                onClick={handleCreateFeedback}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
              >
                Санал хүсэлт үүсгэх
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">№</th>
                  {isAdmin && (
                    <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Хэрэглэгч</th>
                  )}
                  <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Төрөл</th>
                  <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Тайлбар</th>
                  <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Хариу</th>
                  <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Төлөв</th>
                  <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Огноо</th>
                  <th className="px-2 md:px-6 py-2 md:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Үйлдэл</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {feedbacks.map((feedback, index) => {
                  console.log(`Feedback ${index}:`, feedback);
                  const userId = findUserIdField(feedback);
                  console.log(`User ID for feedback ${index}:`, userId);
                  
                  const status = typeof feedback.Status === 'string' ? parseInt(feedback.Status, 10) : feedback.Status;
                  
                  const shouldShowEdit = canEditFeedback(status, userId);
                  const shouldShowDelete = canDeleteFeedback(status, userId);
                  
                  return (
                    <tr key={feedback.ApplicationId} className="hover:bg-gray-50">
                      <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">{index + 1}</td>
                      {isAdmin && (
                        <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                          {feedback.Username || 'Хэрэглэгч'}
                        </td>
                      )}
                      <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                        {feedbackTypeNames[feedback.Type] || 'Тодорхойгүй'}
                      </td>
                      <td className="px-2 md:px-6 py-2 md:py-4 text-xs md:text-sm text-gray-900">
                        <div className="max-w-xs overflow-hidden text-ellipsis">
                          {feedback.Description}
                        </div>
                      </td>
                      <td className="px-2 md:px-6 py-2 md:py-4 text-xs md:text-sm text-gray-900">
                        <div className="max-w-xs overflow-hidden text-ellipsis">
                          {feedback.admin_response || '-'}
                        </div>
                      </td>
                      <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(status)}`}>
                          {statusNames[status] || 'Тодорхойгүй'}
                        </span>
                      </td>
                      <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                        {formatDate(feedback.created_at)}
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
  );
}

export default Feedback;