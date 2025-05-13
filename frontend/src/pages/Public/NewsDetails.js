import React, { useState, useEffect } from 'react';
import api from "../../utils/api";
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Edit, Trash2, Pencil, X } from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';

const NewsDetails = () => {
  const { id } = useParams();
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
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

  const handleOpenModal = () => {
    if (!isUserAdmin()) {
      alert('You must be an admin to perform this action');
      return;
    }
    setIsEditing(true);
    setFormData({
      title: news.Title,
      description: news.NewsDescription,
      coverImage: null,
    });
    setPreviewUrl(`${API_URL}/news/${id}/image`);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setFormData({
      title: '',
      description: '',
      coverImage: null,
    });
    setPreviewUrl('');
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
      handleCloseModal();
      fetchNewsDetail();
      alert('Амжилттай хадгаллаа');
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
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2D6B9F]"></div>
        </div>
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
        <div className="px-1 sm:px-1 pt-4">
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
            Back to News List
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
      <div className="px-0.5 sm:px-0.5 pt-4">
        <div className="max-w-5xl mx-auto pt-4 flex justify-between items-center">
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
          {isUserAdmin() && (
            <div className="flex space-x-2">
              <button
                onClick={handleOpenModal}
                className="flex items-center px-3 py-1.5 border rounded text-sm font-medium hover:bg-blue-50/50"
                style={{ borderColor: "#2D6B9F", color: "#2D6B9F" }}
              >
                <Edit size={15} className="mr-1" />
                Засах
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center px-3 py-1.5 border border-red-500 rounded text-sm font-medium text-red-500 hover:bg-red-50/50"
              >
                <Trash2 size={15} className="mr-1" />
                Устгах
              </button>
            </div>
          )}
        </div>
        <div className="max-w-5xl mx-auto px-1 pt-2 sm:px-0">
          <Breadcrumb />
        </div>

        <div className="max-w-5xl mx-auto py-6 px-0 sm:px-0 lg:px-0">
          <div className="bg-white rounded-lg p-4 w-full">
            <h1 className="text-xl font-bold text-[#2D6B9F] mb-3">{news.Title}</h1>
            <div className="h-px bg-[#2D6B9F] w-full mb-2"></div>
            <div className="flex items-center text-sm text-gray-500 mb-4">
              <span>Нийтэлсэн: {news.Username}</span>
              <span className="mx-2">•</span>
              <span>{formatDate(news.CreatedDate)}</span>
            </div>
            {news.UpdatedDate && news.UpdatedDate !== news.CreatedDate && (
              <div className="text-xs text-gray-500 mb-2">
                Сүүлд засварласан: {formatDate(news.UpdatedDate)}
              </div>
            )}
          </div>

          <div className="mb-5">
            <div className="float-left ml-4 mr-4 mt-4 mb-4 w-full md:w-2/5">
              <div
                className="p-2 bg-white rounded-lg shadow-md"
                style={{
                  borderLeft: "4px solid #e5e7eb"
                }}
              >
                <img
                  src={`${API_URL}/news/${id}/image`}
                  alt={news.Title}
                  className="w-full h-auto rounded"
                  style={{
                    maxHeight: "300px",
                    objectFit: "contain"
                  }}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/1200x600?text=No+Image';
                  }}
                />
              </div>
            </div>
            <div
              className="hidden md:block"
              style={{
                float: "left",
                height: "185px",
                width: "1px",
                background: "#e5e7eb",
                marginTop: "40px",
                marginRight: "8px"
              }}
            ></div>
            
            <div 
              className="bg-white p-3"
              style={{
                borderLeft: "4px solid #2D6B9F",
                borderRight: "4px solid #2D6B9F",
                minHeight: "300px" 
              }}
            >
              <div className="text-gray-700 break-words whitespace-normal leading-relaxed">
                {news.NewsDescription}
              </div>
            </div>
            {/* Clearfix to handle float */}
            <div className="clear-both"></div>
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200 z-[110]">
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-[#2D6B9F]">
                    Мэдээ засах
                  </h2>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-[#2D6B9F]"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-[#2D6B9F] text-sm font-medium mb-2">
                      Гарчиг <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#2D6B9F] focus:border-[#2D6B9F]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[#2D6B9F] text-sm font-medium mb-2">
                      Тайлбар <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#2D6B9F] focus:border-[#2D6B9F] h-32"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[#2D6B9F] text-sm font-medium mb-2">
                      Зураг
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#2D6B9F] focus:border-[#2D6B9F]"
                    />
                    {(previewUrl || news) && (
                      <div className="mt-2">
                        <img
                          src={
                            previewUrl ||
                            `${API_URL}/news/${id}/image`
                          }
                          alt="Preview"
                          className="w-full h-40 object-cover rounded-md"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row justify-end mt-6 gap-2">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                    >
                      Болих
                    </button>
                    <button
                      type="submit"
                      className="flex items-center px-4 py-2 bg-[#2D6B9F]/90 text-white rounded-md hover:bg-[#2D6B9F]"
                    >
                      <Pencil size={15} className="mr-1" />
                      Шинэчлэх
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsDetails;