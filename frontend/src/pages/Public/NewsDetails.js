import React, { useState, useEffect } from 'react';
import api from "../../utils/api";
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Edit, Trash2, Pencil, X } from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const NewsDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const mode = queryParams.get('mode');

  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [csrfToken, setCsrfToken] = useState(null);
  const [user, setUser] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    coverImage: null,
  });
  const [previewUrl, setPreviewUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const navigate = useNavigate();
  const API_URL = api.defaults.baseURL;

  useEffect(() => {
    fetchCsrfToken();
    fetchNewsDetail();

    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (userData && token) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser({ ...parsedUser, token });
      } catch (err) {
        // ignore
      }
    }
  }, [id]);

  useEffect(() => {
    if (news && mode === 'edit') {
      setIsEditing(true);
      setFormData({
        title: news.Title,
        description: news.NewsDescription,
        coverImage: null,
      });
      setPreviewUrl(`${API_URL}/news/${id}/image`);
    } else {
      setIsEditing(false);
    }
  }, [news, mode, id, API_URL]);

  const fetchCsrfToken = async () => {
    try {
      const response = await api.get('/csrf-token');
      setCsrfToken(response.data.csrfToken);
      api.defaults.headers.common['X-CSRF-Token'] = response.data.csrfToken;
    } catch (err) {
      setError('Failed to fetch CSRF token. Please reload the page.');
    }
  };

  const fetchNewsDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/news/${id}`);
      setNews(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch news details');
      setLoading(false);
    }
  };

  const isUserAdmin = () => {
    return user && (user.isAdmin === true || user.AdminRight === 1);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        coverImage: file,
      });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!csrfToken) {
      alert('CSRF token is missing. Please reload the page.');
      fetchCsrfToken();
      return;
    }
    try {
      const formPayload = new FormData();
      formPayload.append('title', formData.title);
      formPayload.append('description', formData.description);
      if (formData.coverImage) {
        formPayload.append('coverImage', formData.coverImage);
      }
      api.defaults.headers.common['X-CSRF-Token'] = csrfToken;
      await api.put(`/news/${id}`, formPayload);
      setIsEditing(false);
      fetchNewsDetail();
      alert('Амжилттай хадгаллаа');
      navigate(`/news/${id}`);
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.message?.includes('CSRF')) {
        alert('CSRF token is invalid. Please reload the page.');
        fetchCsrfToken();
        return;
      }
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to save news';
      alert(errorMessage);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this news item?')) {
      return;
    }
    if (!csrfToken) {
      alert('CSRF token is missing. Please reload the page.');
      fetchCsrfToken();
      return;
    }
    try {
      api.defaults.headers.common['X-CSRF-Token'] = csrfToken;
      await api.delete(`/news/${id}`);
      navigate('/news');
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.message?.includes('CSRF')) {
        alert('CSRF token is invalid. Please reload the page.');
        fetchCsrfToken();
        return;
      }
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to delete news';
      alert(errorMessage);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="px-1 sm:px-1 pt-4">
          <div className="max-w-5xl mx-auto pt-4">
            <Breadcrumb />
          </div>
        </div>
        <LoadingSpinner />
        <div className="flex justify-end p-4">
          <div style={{ width: 24, height: 24, background: "#2D6B9F" }}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <div className="px-1 sm:px-2 pt-4">
          <div className="max-w-5xl mx-auto pt-4">
            <Breadcrumb />
          </div>
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
        <div className="flex justify-end p-4">
          <div style={{ width: 24, height: 24, background: "#2D6B9F" }}></div>
        </div>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="min-h-screen bg-white">
        <div className="px-1 sm:px-1 pt-2">
          <div className="max-w-5xl mx-auto pt-4">
            <Breadcrumb />
          </div>
        </div>
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold text-gray-700">News not found</h2>
          <button
            onClick={() => navigate('/news')}
            className="mt-4 flex items-center mx-auto px-4 py-2 bg-[#2D6B9F]/90 text-white rounded-md hover:bg-[#2D6B9F]"
          >
            <ChevronLeft size={16} className="mr-1" />
          </button>
        </div>
        <div className="flex justify-end p-4">
          <div style={{ width: 24, height: 24, background: "#2D6B9F" }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="px-4 sm:px-8 py-3">
        <div className="flex mb-4 justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/news')}
              className="flex items-center px-2 py-1"
              style={{ color: "#2D6B9F" }}
              title="Буцах"
            >
              <ChevronLeft size={25} />
            </button>
            <span className="text-2xl font-bold text-[#2D6B9F] ml-3 select-none">Мэдээ мэдээлэл</span>
          </div>
        </div>
        <div className="px-4 pt-2 sm:px-0">
          <Breadcrumb />
        </div>

        <div className="w-full flex flex-col md:flex-row bg-white rounded-lg shadow-sm p-4 md:p-6 mt-2">
          <div className="md:w-2/5 pr-0 md:pr-8 pb-4 md:pb-0 flex flex-col items-center md:items-start pt-2 md:pt-4 pl-1 md:pl-6 min-w-[320px] max-w-[600px]">
            {isEditing ? (
              <>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="text-xl font-bold text-[#2D6B9F] mb-2 text-center md:text-left w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-[#2D6B9F] focus:border-[#2D6B9F]"
                  required
                  style={{ fontSize: "1.25rem" }}
                />
                <div className="w-full mt-2 flex flex-col gap-2">
                  <div className="p-1 bg-white rounded-lg shadow-md border border-gray-100 w-full">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="mb-2"
                    />
                    <img
                      src={
                        previewUrl ||
                        `${API_URL}/news/${news.NewsId || news.id || news._id || news.Id || news.id}/image`
                      }
                      alt="Preview"
                      className="w-full max-h-[420px] min-h-[220px] object-contain rounded"
                      style={{
                        objectFit: "contain",
                        background: "#fff"
                      }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-xl font-bold text-[#2D6B9F] mb-2 text-center md:text-left">{news.Title}</h1>
                <div className="flex items-center text-sm text-gray-500 mb-1">
                  <span>Нийтэлсэн: {news.Username}</span>
                  <span className="mx-2">•</span>
                  <span>{formatDate(news.CreatedDate)}</span>
                </div>
                {news.UpdatedDate && news.UpdatedDate !== news.CreatedDate && (
                  <div className="text-xs text-gray-500 mb-1">
                    Сүүлд засварласан: {formatDate(news.UpdatedDate)}
                  </div>
                )}
                <div className="w-full mt-2 flex flex-col gap-2">
                  {Array.isArray(news.Images) && news.Images.length > 0 ? (
                    news.Images.map((imgUrl, idx) => (
                      <div key={idx} className="p-1 bg-white rounded-lg shadow-md border border-gray-100 w-full">
                        <img
                          src={imgUrl}
                          alt={news.Title}
                          className="w-full max-h-[420px] min-h-[220px] object-contain rounded"
                          style={{
                            objectFit: "contain",
                            background: "#fff"
                          }}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/1200x600?text=No+Image';
                          }}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="p-1 bg-white rounded-lg shadow-md border border-gray-100 w-full">
                      <img
                        src={`${API_URL}/news/${news.NewsId || news.id || news._id || news.Id || news.id}/image`}
                        alt={news.Title}
                        className="w-full max-h-[420px] min-h-[220px] object-contain rounded"
                        style={{
                          objectFit: "contain",
                          background: "#fff"
                        }}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/1200x600?text=No+Image';
                        }}
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="hidden md:block w-px bg-gray-300 mx-0"></div>
          <div className="flex-1 flex flex-col h-full p-2 md:p-4 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-semibold text-[#2D6B9F]">Дэлгэрэнгүй</h3>
            </div>
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#2D6B9F] focus:border-[#2D6B9F] h-32"
                    required
                  />
                </div>
                <div className="flex flex-col sm:flex-row justify-end mt-6 gap-2">
                  <button
                    type="button"
                    onClick={() => { setIsEditing(false); navigate(`/news/${id}`); }}
                    className="flex items-center px-2 py-1 border rounded text-xs font-medium hover:bg-blue-50/50"
                    style={{ borderColor: "#2D6B9F", color: "#2D6B9F", minWidth: "70px", fontSize: "12px" }}
                  >
                    <X size={13} className="mr-1" />
                    Болих
                  </button>
                  <button
                    type="submit"
                    className="flex items-center px-2 py-1 border rounded text-xs font-medium hover:bg-[#2D6B9F] bg-[#2D6B9F]/90"
                    style={{ borderColor: "#2D6B9F", color: 'white', minWidth: "70px", fontSize: "12px" }}
                  >
                    <Pencil size={13} className="mr-1" />
                    Шинэчлэх
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div
                  className="text-gray-800 flex-grow overflow-y-auto break-all whitespace-normal border rounded p-3 h-64 md:h-80 bg-white flex flex-col"
                  style={{ minHeight: "120px" }}
                >
                  <div className="text-gray-700 break-words whitespace-normal leading-relaxed flex-grow">
                    {news.NewsDescription}
                  </div>
                </div>
                {isUserAdmin() && (
                  <div className="flex justify-end mt-4">
                    <button
                      onClick={() => navigate(`/news/${id}?mode=edit`)}
                      className="flex items-center px-2 py-1 border rounded text-xs font-medium hover:bg-blue-50/50 mr-2"
                      style={{ borderColor: "#2D6B9F", color: "#2D6B9F", minWidth: "70px", fontSize: "12px" }}
                    >
                      <Edit size={13} className="mr-1" />
                      Засах
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex items-center px-2 py-1 border rounded text-xs font-medium hover:bg-red-50/50"
                      style={{ borderColor: "#ef4444", color: "#ef4444", minWidth: "70px", fontSize: "12px" }}
                    >
                      <Trash2 size={13} className="mr-1" />
                      Устгах
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsDetails;