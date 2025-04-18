import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';

function FeedbackDetail() {
  const { id } = useParams();
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
    const fetchFeedbackDetail = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/feedback/${id}`);
        
        if (data.success) {
          setFeedback(data.feedback);
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

    if (id) {
      fetchFeedbackDetail();
    }
  }, [id]);

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 0: return 'bg-yellow-100 text-yellow-800';
      case 1: return 'bg-blue-100 text-blue-800';
      case 2: return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
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

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-2xl p-8 bg-white rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Санал хүсэлтийн дэлгэрэнгүй</h1>
          <button
            onClick={() => navigate('/feedback')}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition duration-200"
          >
            Буцах
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
        ) : feedback ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm font-medium text-gray-500">Дугаар:</span>
                <span className="ml-2">{feedback.ApplicationId}</span>
              </div>
              <div>
                <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusBadgeColor(feedback.Status)}`}>
                  {statusNames[feedback.Status] || 'Тодорхойгүй'}
                </span>
              </div>
            </div>

            <div>
              <span className="text-sm font-medium text-gray-500">Төрөл:</span>
              <span className="ml-2">{feedbackTypeNames[feedback.Type] || 'Тодорхойгүй'}</span>
            </div>

            <div>
              <span className="text-sm font-medium text-gray-500">Огноо:</span>
              <span className="ml-2">{formatDate(feedback.created_at)}</span>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Тайлбар:</h3>
              <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">{feedback.Description}</div>
            </div>

            {feedback.Status > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Хариу:</h3>
                <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">
                  {feedback.admin_response || 'Хариу оруулаагүй байна.'}
                </div>
              </div>
            )}

            {feedback.updated_at && feedback.updated_at !== feedback.created_at && (
              <div>
                <span className="text-sm font-medium text-gray-500">Сүүлд шинэчилсэн:</span>
                <span className="ml-2">{formatDate(feedback.updated_at)}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-lg text-gray-600">Санал хүсэлт олдсонгүй</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default FeedbackDetail;