import React, { useState, useEffect } from 'react';
import api from "../../utils/api"; 
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Edit, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';

const News = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedNews, setSelectedNews] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formMode, setFormMode] = useState('create'); 
  const [csrfToken, setCsrfToken] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    coverImage: null,
  });
  
  const [previewUrl, setPreviewUrl] = useState('');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  
  const newsPerPage = 6;

  useEffect(() => {
    fetchCsrfToken();
    fetchNews();

    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userData && token) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser({ ...parsedUser, token });
        console.log("User loaded:", parsedUser);
      } catch (err) {
        console.error("Error parsing user data:", err);
      }
    }
  }, []);
  
  const fetchCsrfToken = async () => {
    try {
      const response = await api.get('/csrf-token');
      setCsrfToken(response.data.csrfToken);
      api.defaults.headers.common['X-CSRF-Token'] = response.data.csrfToken;
      console.log("CSRF token obtained");
    } catch (err) {
      console.error('Error fetching CSRF token:', err);
      setError('Failed to fetch CSRF token. Please reload the page.');
    }
  };
  
  const fetchNews = async () => {
    try {
      setLoading(true);
      const response = await api.get('/news');
      setNews(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch news');
      setLoading(false);
      console.error('Error fetching news:', err);
    }
  };
  
  const isUserAdmin = () => {
    return user && (user.isAdmin === true || user.AdminRight === 1);
  };
  
  const handleOpenModal = (mode, newsItem = null) => {
    if (mode !== 'view' && !isUserAdmin()) {
      alert('You must be an admin to perform this action');
      return;
    }
    
    setFormMode(mode);
    
    if (mode === 'edit' && newsItem) {
      setFormData({
        title: newsItem.Title,
        description: newsItem.NewsDescription,
        coverImage: null,
      });
      setSelectedNews(newsItem);
    } else if (mode === 'create') {
      setFormData({
        title: '',
        description: '',
        coverImage: null,
      });
      setPreviewUrl('');
      setSelectedNews(null);
    } else if (mode === 'view' && newsItem) {
      setSelectedNews(newsItem);
    }
    
    setShowModal(true);
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      title: '',
      description: '',
      coverImage: null,
    });
    setPreviewUrl('');
    setSelectedNews(null);
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
      
      if (formMode === 'create') {
        const response = await api.post('/news', formPayload);
        console.log('Create response:', response.data);
      } else if (formMode === 'edit') {
        const response = await api.put(`/news/${selectedNews.NewsId}`, formPayload);
        console.log('Update response:', response.data);
      }
      
      handleCloseModal();
      fetchNews();
    } catch (err) {
      console.error('Error submitting form:', err);
      
      if (err.response?.status === 403 && err.response?.data?.message?.includes('CSRF')) {
        alert('CSRF token is invalid. Please reload the page.');
        fetchCsrfToken();
        return;
      }
      
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to save news';
      alert(errorMessage);
    }
  };
  
  const handleDelete = async (newsId) => {
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
      
      await api.delete(`/news/${newsId}`);
      fetchNews();
    } catch (err) {
      console.error('Error deleting news:', err);
      
      if (err.response?.status === 403 && err.response?.data?.message?.includes('CSRF')) {
        alert('CSRF token is invalid. Please reload the page.');
        fetchCsrfToken();
        return;
      }
      
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to delete news';
      alert(errorMessage);
    }
  };
  
  const handleViewDetails = async (newsId) => {
    try {
      const response = await api.get(`/news/${newsId}`);
      setSelectedNews(response.data);
      setShowModal(true);
      setFormMode('view');
    } catch (err) {
      console.error('Error fetching news details:', err);
      alert('Failed to fetch news details');
    }
  };
  
  const indexOfLastNews = currentPage * newsPerPage;
  const indexOfFirstNews = indexOfLastNews - newsPerPage;
  const currentNews = news.slice(indexOfFirstNews, indexOfLastNews);
  const totalPages = Math.ceil(news.length / newsPerPage);
  
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  const API_URL = api.defaults.baseURL;

  const truncateText = (text) => {
    if (!text) return '';
    return text.length > 10 ? text.slice(0, 10) + '...' : text;
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 pt-2 sm:px-0">
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
        <div className="max-w-7xl mx-auto px-4 pt-2 sm:px-0">
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

  return (
    <div className="min-h-screen bg-white">
      <div className="px-4 sm:px-8 pt-4">
        <div className="max-w-7xl mx-auto pt-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#2D6B9F]">Мэдээ мэдээлэл</h1>
            <div className="px-4 pt-2 sm:px-0">
              <Breadcrumb />
            </div>
            <p className="text-gray-600 mt-2">
              Системийн мэдээ, мэдээлэл, зарлалын жагсаалт
            </p>
          </div>
          <div className="flex space-x-2 self-end sm:self-auto">
            {isUserAdmin() && (
              <button
                onClick={() => handleOpenModal('create')}
                className="flex items-center px-3 py-1.5 border rounded text-sm font-medium hover:bg-blue-50/50"
                style={{ borderColor: "#2D6B9F", color: "#2D6B9F", minWidth: "110px", fontSize: "14px" }}
              >
                <PlusCircle size={15} className="mr-1" />
                Шинэ мэдээ
              </button>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto py-6 px-0 sm:px-0 lg:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentNews.map((item) => (
              <div
                key={item.NewsId}
                className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition group flex flex-col"
              >
                <div className="relative h-48 overflow-hidden rounded-t-lg">
                  <img
                    src={`${API_URL}/news/${item.NewsId}/image`}
                    alt={item.Title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/400x200?text=No+Image';
                    }}
                  />
                  {isUserAdmin() && (
                    <div className="absolute top-2 right-2 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenModal('edit', item);
                        }}
                        className="bg-white p-2 rounded-full shadow hover:bg-blue-50 border border-gray-200"
                        title="Засах"
                      >
                        <Edit size={16} className="text-[#2D6B9F]" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.NewsId);
                        }}
                        className="bg-white p-2 rounded-full shadow hover:bg-red-50 border border-gray-200"
                        title="Устгах"
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h2
                    className="text-lg font-semibold text-[#2D6B9F] mb-2"
                    title={item.Title}
                  >
                    {truncateText(item.Title)}
                  </h2>
                  <p
                    className="text-gray-600 mb-3"
                    title={item.NewsDescription}
                  >
                    {truncateText(item.NewsDescription)}
                  </p>
                  <div className="flex justify-between items-center mt-auto">
                    <span className="text-xs text-gray-500">By {item.Username}</span>
                    <button
                      onClick={() => handleViewDetails(item.NewsId)}
                      className="text-[#2D6B9F]/90 hover:text-[#2D6B9F] font-medium text-xs rounded px-2 py-1 transition"
                    >
                      Дэлгэрэнгүй
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center mt-8 items-center space-x-2">
              <button
                onClick={() => paginate(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`w-8 h-8 flex items-center justify-center rounded-full border ${
                  currentPage === 1
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "border-[#2D6B9F] text-[#2D6B9F] hover:bg-blue-50"
                } transition font-bold text-sm`}
                title="Өмнөх"
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
                      onClick={() => paginate(page)}
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
                onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`w-8 h-8 flex items-center justify-center rounded-full border ${
                  currentPage === totalPages
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "border-[#2D6B9F] text-[#2D6B9F] hover:bg-blue-50"
                } transition font-bold text-sm`}
                title="Дараах"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
              <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200 z-[110]">
                <div className="p-4 sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-m font-bold text-[#2D6B9F]">
                      {formMode === 'create'
                        ? 'Мэдээ нэмэх'
                        : formMode === 'edit'
                        ? 'Мэдээ засах'
                        : 'Мэдээ дэлгэрэнгүй'}
                    </h2>
                    <button
                      onClick={handleCloseModal}
                      className="text-gray-400 hover:text-[#2D6B9F]"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {formMode === 'view' ? (
                    <div>
                      <div className="mb-6">
                        <img
                          src={`${API_URL}/news/${selectedNews.NewsId}/image`}
                          alt={selectedNews.Title}
                          className="w-full h-64 object-cover rounded-lg border border-gray-200"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/800x400?text=No+Image';
                          }}
                        />
                      </div>
                      <h3 className="text-xl font-bold mb-2 text-[#2D6B9F]">{selectedNews.Title}</h3>
                      <p className="text-gray-700 mb-4">{selectedNews.NewsDescription}</p>
                      <div className="text-sm text-gray-500">
                        Нийтэлсэн: {selectedNews.Username}
                      </div>
                    </div>
                  ) : (
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
                          Зураг <span className="text-red-400">{formMode === 'create' ? '*' : ''}</span>
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#2D6B9F] focus:border-[#2D6B9F]"
                          required={formMode === 'create'}
                        />
                        {(previewUrl || (formMode === 'edit' && selectedNews)) && (
                          <div className="mt-2">
                            <img
                              src={
                                previewUrl ||
                                `${API_URL}/news/${selectedNews.NewsId}/image`
                              }
                              alt="Preview"
                              className="w-full h-40 object-cover rounded-md border border-gray-200"
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
                          className="px-4 py-2 bg-[#2D6B9F]/90 text-white rounded-md hover:bg-[#2D6B9F]"
                        >
                          {formMode === 'create' ? 'Нэмэх' : 'Шинэчлэх'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default News;