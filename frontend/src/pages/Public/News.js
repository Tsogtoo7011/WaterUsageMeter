import React, { useState, useEffect } from 'react';
import api from "../../utils/api"; 
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

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
  
  // Fetch CSRF token
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
  
  // Check if user is admin - This should align with what the JWT token has
  const isUserAdmin = () => {
    // Check if user has the isAdmin property (from JWT)
    return user && (user.isAdmin === true || user.AdminRight === 1);
  };
  
  const handleOpenModal = (mode, newsItem = null) => {
    // Check if user is admin
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
      
      // Create preview URL
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
      
      // Include CSRF token in the headers
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
      
      // Check if it's a CSRF error
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
      // Include CSRF token in the headers
      api.defaults.headers.common['X-CSRF-Token'] = csrfToken;
      
      await api.delete(`/news/${newsId}`);
      fetchNews();
    } catch (err) {
      console.error('Error deleting news:', err);
      
      // Check if it's a CSRF error
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
  
  // Pagination logic
  const indexOfLastNews = currentPage * newsPerPage;
  const indexOfFirstNews = indexOfLastNews - newsPerPage;
  const currentNews = news.slice(indexOfFirstNews, indexOfLastNews);
  const totalPages = Math.ceil(news.length / newsPerPage);
  
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  // Get the API base URL for image paths
  const API_URL = api.defaults.baseURL;
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-6" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 bg-red-200 hover:bg-red-300 px-4 py-2 rounded"
        >
          Reload Page
        </button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">News</h1>
        {isUserAdmin() && (
          <button
            onClick={() => handleOpenModal('create')}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            <PlusCircle size={20} />
            <span>Add News</span>
          </button>
        )}
      </div>
      
      {/* News Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentNews.map((item) => (
          <div
            key={item.NewsId}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="relative h-48 overflow-hidden">
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
                    className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                  >
                    <Edit size={16} className="text-blue-500" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.NewsId);
                    }}
                    className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                </div>
              )}
            </div>
            <div className="p-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">{item.Title}</h2>
              <p className="text-gray-600 mb-3 line-clamp-3">{item.NewsDescription}</p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">By {item.Username}</span>
                <button
                  onClick={() => handleViewDetails(item.NewsId)}
                  className="text-blue-500 hover:text-blue-700 font-medium text-sm"
                >
                  Read More
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <nav className="flex items-center gap-1">
            <button
              onClick={() => paginate(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-md ${
                currentPage === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-blue-500 hover:bg-blue-50'
              }`}
            >
              <ChevronLeft size={20} />
            </button>
            
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => paginate(index + 1)}
                className={`w-10 h-10 rounded-md ${
                  currentPage === index + 1
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-700 hover:bg-blue-50'
                }`}
              >
                {index + 1}
              </button>
            ))}
            
            <button
              onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-md ${
                currentPage === totalPages
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-blue-500 hover:bg-blue-50'
              }`}
            >
              <ChevronRight size={20} />
            </button>
          </nav>
        </div>
      )}
      
      {/* Modal for Create/Edit/View */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-90vh overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {formMode === 'create'
                    ? 'Add New News'
                    : formMode === 'edit'
                    ? 'Edit News'
                    : 'News Details'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  &times;
                </button>
              </div>
              
              {formMode === 'view' ? (
                <div>
                  <div className="mb-6">
                    <img
                      src={`${API_URL}/news/${selectedNews.NewsId}/image`}
                      alt={selectedNews.Title}
                      className="w-full h-64 object-cover rounded-lg"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/800x400?text=No+Image';
                      }}
                    />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{selectedNews.Title}</h3>
                  <p className="text-gray-600 mb-4">{selectedNews.NewsDescription}</p>
                  <div className="text-sm text-gray-500">
                    Posted by: {selectedNews.Username}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Cover Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          className="w-full h-40 object-cover rounded-md"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end gap-2 mt-6">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                      {formMode === 'create' ? 'Create' : 'Update'}
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
};

export default News;