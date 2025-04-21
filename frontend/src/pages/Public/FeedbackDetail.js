import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from "../../utils/api";

export function FeedbackDetails() {
  const { id } = useParams();
  const [feedback, setFeedback] = useState(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [status, setStatus] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
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
          navigate('/', { state: { from: `/user/feedback/${id}` } });
          return;
        }
        
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setIsAdmin(parsedUser.AdminRight === 1);
        } else {
          try {
            const { data } = await api.get('/users/profile');
            if (data.success && data.user) {
              setUser(data.user);
              setIsAdmin(data.user.AdminRight === 1);
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
  }, [navigate, id]);

  useEffect(() => {
    const fetchFeedbackDetails = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        // Use the correct endpoint based on user role
        const endpoint = isAdmin ? `/feedback/admin/${id}` : `/feedback/${id}`;
        const { data } = await api.get(endpoint);
        
        if (data.success) {
          setFeedback(data.feedback);
          setAdminResponse(data.feedback.admin_response || '');
          setStatus(data.feedback.Status);
        } else {
          setError('Санал хүсэлтийн мэдээллийг авахад алдаа гарлаа');
        }
      } catch (err) {
        console.error('Error fetching feedback details:', err);
        setError(err.response?.data?.message || 'Санал хүсэлтийн мэдээллийг авахад алдаа гарлаа');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchFeedbackDetails();
    }
  }, [user, id, isAdmin]);

  const handleEditFeedback = () => {
    navigate(`/user/feedback/edit/${id}`);
  };

  const handleDeleteFeedback = async () => {
    if (window.confirm('Энэ санал хүсэлтийг устгахдаа итгэлтэй байна уу?')) {
      try {
        const { data } = await api.delete(`/feedback/${id}`);
        
        if (data.success) {
          navigate('/user/feedback');
        } else {
          setError('Санал хүсэлтийг устгахад алдаа гарлаа');
        }
      } catch (err) {
        console.error('Error deleting feedback:', err);
        setError(err.response?.data?.message || 'Санал хүсэлтийг устгахад алдаа гарлаа');
      }
    }
  };

  const handleAdminResponseSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAdmin) {
      setError('Энэ үйлдлийг хийх эрх хүрэлцэхгүй байна.');
      return;
    }
    
    try {
      const { data } = await api.put(`/feedback/admin/${id}`, {
        status,
        adminResponse
      });
      
      if (data.success) {
        setSuccessMessage('Хариу амжилттай хадгалагдлаа.');
        // Update the feedback object with new data
        setFeedback({
          ...feedback,
          admin_response: adminResponse,
          Status: status
        });
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } else {
        setError(data.message || 'Хариу хадгалахад алдаа гарлаа');
      }
    } catch (err) {
      console.error('Error submitting admin response:', err);
      setError(err.response?.data?.message || 'Хариу хадгалахад алдаа гарлаа');
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
    switch (parseInt(status)) {
      case 0: return 'bg-yellow-100 text-yellow-800';
      case 1: return 'bg-blue-100 text-blue-800';
      case 2: return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Fixed function to correctly check if user can edit/delete feedback
  const canModifyFeedback = () => {
    if (!feedback || !user) return false;
    if (isAdmin) return false;
    
    // Regular users can only modify their own pending feedback
    return parseInt(feedback.Status) === 0 && user.UserAdminId === feedback.UserAdminUserId;
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-4xl p-6 bg-white rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">
            Санал хүсэлтийн дэлгэрэнгүй
          </h1>
          <button
            onClick={() => navigate('/user/feedback')}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-3 md:px-4 rounded-lg text-sm md:text-base transition duration-200"
          >
            Буцах
          </button>
        </div>

        {error && (
          <div className="p-4 mb-6 bg-red-100 text-red-700 rounded-lg">
            <p>{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="p-4 mb-6 bg-green-100 text-green-700 rounded-lg">
            <p>{successMessage}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : feedback ? (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 md:p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Санал хүсэлтийн мэдээлэл</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-gray-700">Төрөл:</span> 
                  <span className="ml-2">{feedbackTypeNames[feedback.Type] || 'Тодорхойгүй'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Төлөв:</span> 
                  <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(feedback.Status)}`}>
                    {statusNames[feedback.Status] || 'Тодорхойгүй'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Огноо:</span> 
                  <span className="ml-2">{formatDate(feedback.created_at)}</span>
                </div>
                {feedback.updated_at !== feedback.created_at && (
                  <div>
                    <span className="font-medium text-gray-700">Шинэчилсэн:</span> 
                    <span className="ml-2">{formatDate(feedback.updated_at)}</span>
                  </div>
                )}
                {isAdmin && feedback.Username && (
                  <div>
                    <span className="font-medium text-gray-700">Хэрэглэгч:</span> 
                    <span className="ml-2">{feedback.Username}</span>
                  </div>
                )}
              </div>
              
              {canModifyFeedback() && (
                <div className="flex justify-end mt-4 space-x-2">
                  <button 
                    onClick={handleEditFeedback}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-3 md:px-4 rounded-lg text-sm md:text-base transition duration-200"
                  >
                    Засах
                  </button>
                  <button 
                    onClick={handleDeleteFeedback}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-3 md:px-4 rounded-lg text-sm md:text-base transition duration-200"
                  >
                    Устгах
                  </button>
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-4 md:p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Тайлбар</h3>
              <div className="p-4 bg-white rounded border border-gray-200 whitespace-pre-wrap">
                {feedback.Description}
              </div>
            </div>

            <div className="bg-gray-50 p-4 md:p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Хариу</h3>
              {isAdmin ? (
                <form onSubmit={handleAdminResponseSubmit}>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="adminResponse">
                      Хариу мэдэгдэл
                    </label>
                    <textarea
                      id="adminResponse"
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      rows="4"
                      value={adminResponse}
                      onChange={(e) => setAdminResponse(e.target.value)}
                      placeholder="Энд хариу бичнэ үү..."
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="status">
                      Төлөв
                    </label>
                    <select
                      id="status"
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      value={status}
                      onChange={(e) => setStatus(parseInt(e.target.value))}
                    >
                      <option value={0}>Хүлээгдэж буй</option>
                      <option value={1}>Хянагдаж байгаа</option>
                      <option value={2}>Шийдвэрлэсэн</option>
                    </select>
                  </div>
                  <div className="flex justify-end">
                    <button 
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 md:px-4 rounded-lg text-sm md:text-base transition duration-200"
                    >
                      Хадгалах
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-4 bg-white rounded border border-gray-200 whitespace-pre-wrap">
                  {feedback.admin_response || 'Одоогоор хариу ирээгүй байна.'}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-gray-100 p-8 rounded-lg text-center">
            <p className="text-lg text-gray-600">Санал хүсэлт олдсонгүй.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default FeedbackDetails;