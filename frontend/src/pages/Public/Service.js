import React, { useState, useEffect } from 'react';
import api from "../../utils/api";
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Edit, Trash2, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

const Service = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedService, setSelectedService] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [csrfToken, setCsrfToken] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const [formData, setFormData] = useState({
    description: '',
    respond: '',
    status: 'pending',
    amount: '',
  });
  
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  
  const servicesPerPage = 6;
  
  // Fetch services and CSRF token on component mount
  useEffect(() => {
    fetchCsrfToken();
    
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userData && token) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser({ ...parsedUser, token });
        console.log("User loaded:", parsedUser);
        
        // Fetch appropriate services based on user role
        if (parsedUser.isAdmin === true || parsedUser.AdminRight === 1) {
          fetchAllServices();
        } else {
          fetchUserServices();
        }
      } catch (err) {
        console.error("Error parsing user data:", err);
      }
    } else {
      // Redirect to login if not logged in
      navigate('/login');
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
  
  const fetchAllServices = async () => {
    try {
      setLoading(true);
      let endpoint = '/services/admin/all';
      
      if (statusFilter !== 'all') {
        endpoint = `/services/admin/status/${statusFilter}`;
      }
      
      const response = await api.get(endpoint);
      setServices(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch services');
      setLoading(false);
      console.error('Error fetching services:', err);
    }
  };
  
  const fetchUserServices = async () => {
    try {
      setLoading(true);
      const response = await api.get('/services/my-services');
      setServices(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch your service requests');
      setLoading(false);
      console.error('Error fetching services:', err);
    }
  };
  
  // Check if user is admin - This should align with what the JWT token has
  const isUserAdmin = () => {
    // Check if user has the isAdmin property (from JWT)
    return user && (user.isAdmin === true || user.AdminRight === 1);
  };
  
  const handleOpenModal = (mode, serviceItem = null) => {
    setFormMode(mode);
    
    if (mode === 'edit' && serviceItem) {
      setFormData({
        description: serviceItem.Description,
        respond: serviceItem.Respond || '',
        status: serviceItem.Status,
        amount: '',  // Don't pre-fill amount
      });
      setSelectedService(serviceItem);
    } else if (mode === 'create') {
      setFormData({
        description: '',
        respond: '',
        status: 'pending',
        amount: '',
      });
      setSelectedService(null);
    } else if (mode === 'view' && serviceItem) {
      setSelectedService(serviceItem);
    }
    
    setShowModal(true);
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      description: '',
      respond: '',
      status: 'pending',
      amount: '',
    });
    setSelectedService(null);
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
      // Include CSRF token in the headers
      api.defaults.headers.common['X-CSRF-Token'] = csrfToken;
      
      if (formMode === 'create') {
        const response = await api.post('/services', {
          description: formData.description
        });
        console.log('Create response:', response.data);
      } else if (formMode === 'edit') {
        const response = await api.put(`/services/admin/${selectedService.ServiceId}`, {
          respond: formData.respond,
          status: formData.status,
          amount: formData.amount ? parseFloat(formData.amount) : undefined
        });
        console.log('Update response:', response.data);
      }
      
      handleCloseModal();
      
      // Refresh the appropriate list based on user role
      if (isUserAdmin()) {
        fetchAllServices();
      } else {
        fetchUserServices();
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      
      // Check if it's a CSRF error
      if (err.response?.status === 403 && err.response?.data?.message?.includes('CSRF')) {
        alert('CSRF token is invalid. Please reload the page.');
        fetchCsrfToken();
        return;
      }
      
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to save service request';
      alert(errorMessage);
    }
  };
  
  const handleDelete = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service request?')) {
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
      
      await api.delete(`/services/admin/${serviceId}`);
      
      // Refresh the appropriate list based on user role
      if (isUserAdmin()) {
        fetchAllServices();
      } else {
        fetchUserServices();
      }
    } catch (err) {
      console.error('Error deleting service:', err);
      
      // Check if it's a CSRF error
      if (err.response?.status === 403 && err.response?.data?.message?.includes('CSRF')) {
        alert('CSRF token is invalid. Please reload the page.');
        fetchCsrfToken();
        return;
      }
      
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to delete service request';
      alert(errorMessage);
    }
  };
  
  const handleViewDetails = async (serviceId) => {
    try {
      let endpoint = isUserAdmin() 
        ? `/services/admin/${serviceId}`
        : `/services/${serviceId}`;
        
      const response = await api.get(endpoint);
      setSelectedService(response.data);
      setShowModal(true);
      setFormMode('view');
    } catch (err) {
      console.error('Error fetching service details:', err);
      alert('Failed to fetch service details');
    }
  };
  
  const handleStatusFilterChange = (e) => {
    const newStatus = e.target.value;
    setStatusFilter(newStatus);
    
    // Only admins can filter by status
    if (isUserAdmin()) {
      if (newStatus === 'all') {
        fetchAllServices();
      } else {
        // Update URL and fetch filtered services
        const endpoint = `/services/admin/status/${newStatus}`;
        
        setLoading(true);
        api.get(endpoint)
          .then(response => {
            setServices(response.data);
            setLoading(false);
          })
          .catch(err => {
            console.error('Error fetching filtered services:', err);
            setError('Failed to fetch services');
            setLoading(false);
          });
      }
    }
  };
  
  // Get status badge color
  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Format status display
  const formatStatus = (status) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };
  
  // Pagination logic
  const indexOfLastService = currentPage * servicesPerPage;
  const indexOfFirstService = indexOfLastService - servicesPerPage;
  const currentServices = services.slice(indexOfFirstService, indexOfLastService);
  const totalPages = Math.ceil(services.length / servicesPerPage);
  
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
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
        <h1 className="text-3xl font-bold text-gray-800">Service Requests</h1>
        <div className="flex items-center gap-4">
          {isUserAdmin() && (
            <div>
              <select 
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}
          <button
            onClick={() => handleOpenModal('create')}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            <PlusCircle size={20} />
            <span>New Request</span>
          </button>
        </div>
      </div>
      
      {/* Services Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              {isUserAdmin() && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Username
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentServices.length > 0 ? (
              currentServices.map((service) => (
                <tr key={service.ServiceId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {service.ServiceId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs">
                    {service.Description}
                  </td>
                  {isUserAdmin() && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {service.Username}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(service.Status)}`}>
                      {formatStatus(service.Status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleViewDetails(service.ServiceId)}
                        className="text-blue-500 hover:text-blue-700"
                        title="View details"
                      >
                        <Eye size={16} />
                      </button>
                      {isUserAdmin() && (
                        <>
                          <button
                            onClick={() => handleOpenModal('edit', service)}
                            className="text-green-500 hover:text-green-700"
                            title="Edit service"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(service.ServiceId)}
                            className="text-red-500 hover:text-red-700"
                            title="Delete service"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={isUserAdmin() ? 5 : 4} className="px-6 py-4 text-center text-gray-500">
                  No service requests found
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
                    ? 'New Service Request'
                    : formMode === 'edit'
                    ? 'Respond to Service Request'
                    : 'Service Request Details'}
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
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-1">Description</h3>
                    <p className="text-gray-700">{selectedService.Description}</p>
                  </div>
                  
                  {selectedService.Respond && (
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-1">Response</h3>
                      <p className="text-gray-700">{selectedService.Respond}</p>
                    </div>
                  )}

                  {/* Payment Amount Section */}
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-1">Payment Amount</h3>
                    <p className="text-gray-700">
                      {selectedService.Amount ? `$${parseFloat(selectedService.Amount).toFixed(2)}` : '-'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <h3 className="text-sm font-semibold mb-1">Status</h3>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(selectedService.Status)}`}>
                        {formatStatus(selectedService.Status)}
                      </span>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-semibold mb-1">Request Date</h3>
                      <p className="text-gray-700">{new Date(selectedService.RequestDate).toLocaleString()}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-semibold mb-1">Last Updated</h3>
                      <p className="text-gray-700">
                        {selectedService.SubmitDate ? new Date(selectedService.SubmitDate).toLocaleString() : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {formMode === 'create' ? (
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                        placeholder="Describe your service request..."
                        required
                      />
                    </div>
                  ) : (
                    <>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          User's Request
                        </label>
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                          {selectedService.Description}
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          Your Response
                        </label>
                        <textarea
                          name="respond"
                          value={formData.respond}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                          placeholder="Respond to the service request..."
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="mb-4">
                          <label className="block text-gray-700 text-sm font-bold mb-2">
                            Status
                          </label>
                          <select
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            <option value="pending">Pending</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                        
                        <div className="mb-4">
                          <label className="block text-gray-700 text-sm font-bold mb-2">
                            Amount (optional)
                          </label>
                          <input
                            type="number"
                            name="amount"
                            value={formData.amount}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                          />
                        </div>
                      </div>
                    </>
                  )}
                  
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
                      {formMode === 'create' ? 'Submit Request' : 'Update'}
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

export default Service;