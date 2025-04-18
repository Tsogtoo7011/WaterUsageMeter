import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from "../../utils/api";

export function Feedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
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
          setUser(JSON.parse(storedUser));
        } else {
          try {
            const { data } = await api.get('/users/profile');
            if (data.success && data.user) {
              setUser(data.user);
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
      try {
        setLoading(true);
        const { data } = await api.get('/feedback');
        
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
  }, [user]);

  const handleCreateFeedback = () => {
    navigate('/user/feedback/create');
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
    navigate(`/user/feedback/${feedbackId}`);
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-4xl p-8 bg-white rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Санал хүсэлтийн жагсаалт</h1>
          <button
            onClick={handleCreateFeedback}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
          >
            Бичих
          </button>
        </div>

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
            <p className="text-lg text-gray-600">Танд одоогоор бүртгэлтэй санал хүсэлт байхгүй байна.</p>
            <button
              onClick={handleCreateFeedback}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
            >
              Санал хүсэлт үүсгэх
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">№</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Төрөл</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Тайлбар</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Хариу</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Төлөв</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Огноо</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Үйлдэл</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {feedbacks.map((feedback, index) => (
                  <tr key={feedback.ApplicationId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {feedbackTypeNames[feedback.Type] || 'Тодорхойгүй'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs overflow-hidden text-ellipsis">
                        {feedback.Description}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs overflow-hidden text-ellipsis">
                        {feedback.admin_response || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(feedback.Status)}`}>
                        {statusNames[feedback.Status] || 'Тодорхойгүй'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(feedback.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleViewDetails(feedback.ApplicationId)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Дэлгэрэнгүй
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Feedback;