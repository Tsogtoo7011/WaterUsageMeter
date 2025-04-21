import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';

function FeedbackEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null);
  
  const [feedbackType, setFeedbackType] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    const fetchFeedbackDetail = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/feedback/${id}`);
        
        if (data.success) {
          setFeedback(data.feedback);
          setFeedbackType(data.feedback.Type?.toString() || '');
          setDescription(data.feedback.Description || '');

          if (data.feedback && Number(data.feedback.Status) !== 0) {
            setError('Энэ санал хүсэлтийг засах боломжгүй байна');
            setTimeout(() => {
              navigate(`/user/feedback/${id}`);
            }, 2000);
          }
        } else {
          setError('Санал хүсэлтийн мэдээллийг авахад алдаа гарлаа');
        }
      } catch (err) {
        console.error('Error fetching feedback details:', err);
        console.error('Response data:', err.response?.data);
        setError(err.response?.data?.message || 'Санал хүсэлтийн мэдээллийг авахад алдаа гарлаа');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchFeedbackDetail();
    }
  }, [id, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!feedbackType || !description.trim()) {
      setError('Бүх талбарыг бөглөнө үү');
      return;
    }
    
    try {
      setSubmitting(true);
      
      console.log('Sending to API:', { feedbackType, description });
      
      const { data } = await api.put(`/feedback/${id}`, {
        feedbackType,
        description
      });
      
      if (data.success) {
        navigate(`/user/feedback/${id}`);
      } else {
        setError(data.message || 'Санал хүсэлтийг шинэчлэхэд алдаа гарлаа');
      }
    } catch (err) {
      console.error('Error updating feedback:', err);
      console.error('Response data:', err.response?.data);
      setError(err.response?.data?.message || 'Санал хүсэлтийг шинэчлэхэд алдаа гарлаа');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-2xl p-8 bg-white rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Санал хүсэлт засах</h1>
          <button
            onClick={() => navigate(`/user/feedback/${id}`)}
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
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="feedbackType" className="block text-sm font-medium text-gray-700 mb-1">
                Төрөл
              </label>
              <select
                id="feedbackType"
                value={feedbackType}
                onChange={(e) => setFeedbackType(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="" disabled>Төрлөө сонгоно уу</option>
                <option value="1">Санал</option>
                <option value="2">Хүсэлт</option>
                <option value="3">Гомдол</option>
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Дэлгэрэнгүй
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Санал хүсэлтийн дэлгэрэнгүй мэдээллийг бичнэ үү"
                required
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || (feedback && Number(feedback.Status) !== 0)}
                className={`py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  (submitting || (feedback && Number(feedback.Status) !== 0)) ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {submitting ? 'Хадгалж байна...' : 'Хадгалах'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default FeedbackEdit;