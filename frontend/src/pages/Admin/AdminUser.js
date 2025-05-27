import { useState, useEffect } from 'react';
import { Search, User, Users, Shield, Edit, Trash2, Eye, ChevronLeft, ChevronRight, PlusCircle, X, Check } from 'lucide-react';
import api from "../../utils/api";
import Breadcrumb from '../../components/common/Breadcrumb';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function AdminUser() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [selectedUser, setSelectedUser] = useState(null);
  const [csrfToken, setCsrfToken] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    firstname: '',
    lastname: '',
    phonenumber: '',
    email: '',
    adminRight: 0,
  });
  const [adminFilter, setAdminFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const usersPerPage = 8;

  useEffect(() => {
    fetchCsrfToken();
    fetchUsers();
  }, []);

  const fetchCsrfToken = async () => {
    try {
      const response = await api.get('/csrf-token');
      setCsrfToken(response.data.csrfToken);
      api.defaults.headers.common['X-CSRF-Token'] = response.data.csrfToken;
    } catch (err) {
      setError('Failed to fetch CSRF token. Please reload the page.');
      console.error('CSRF token fetch error:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/AdminUser');
      setUsers(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      console.error('User fetch error:', err);
      setLoading(false);
    }
  };

  const handleOpenModal = (mode, user = null) => {
    setFormMode(mode);
    if (mode === 'edit' && user) {
      setFormData({
        username: user.Username,
        firstname: user.Firstname,
        lastname: user.Lastname,
        phonenumber: user.Phonenumber || '',
        email: user.Email,
        adminRight: user.AdminRight,
      });
      setSelectedUser(user);
    } else {
      setFormData({
        username: '',
        firstname: '',
        lastname: '',
        phonenumber: '',
        email: '',
        adminRight: 0,
      });
      setSelectedUser(null);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      username: '',
      firstname: '',
      lastname: '',
      phonenumber: '',
      email: '',
      adminRight: 0,
    });
    setSelectedUser(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value,
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
      api.defaults.headers.common['X-CSRF-Token'] = csrfToken;
      if (formMode === 'create') {
        await api.post('/AdminUser', formData);
      } else if (formMode === 'edit' && selectedUser) {
        await api.put(`/AdminUser/${selectedUser.UserId}`, formData);
      }
      handleCloseModal();
      fetchUsers();
    } catch (err) {
      console.error('Save user error:', err);
      alert(err.response?.data?.message || 'Failed to save user');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    if (!csrfToken) {
      alert('CSRF token is missing. Please reload the page.');
      fetchCsrfToken();
      return;
    }
    try {
      api.defaults.headers.common['X-CSRF-Token'] = csrfToken;
      await api.delete(`/AdminUser/${userId}`);
      fetchUsers();
    } catch (err) {
      console.error('Delete user error:', err);
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleToggleAdmin = async (user) => {
    if (!csrfToken) {
      alert('CSRF token is missing. Please reload the page.');
      fetchCsrfToken();
      return;
    }
    
    const newAdminRight = user.AdminRight === 1 ? 0 : 1;
    
    try {
      api.defaults.headers.common['X-CSRF-Token'] = csrfToken;
      const response = await api.put(`/AdminUser/${user.UserId}/admin-rights`, { 
        adminRight: newAdminRight
      });
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.UserId === user.UserId ? {...u, AdminRight: newAdminRight} : u
        )
      );
      fetchUsers();
    } catch (err) {
      console.error('Admin rights update error:', err);
      alert(err.response?.data?.message || 'Failed to update admin rights');
    }
  };

  const handleAdminFilterChange = (e) => {
    setAdminFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const renderSortArrow = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      user.Username.toLowerCase().includes(searchLower) ||
      user.Email.toLowerCase().includes(searchLower) ||
      `${user.Firstname} ${user.Lastname}`.toLowerCase().includes(searchLower);

    const matchesAdmin =
      adminFilter === 'all' ||
      (adminFilter === 'admin' && user.AdminRight === 1) ||
      (adminFilter === 'normal' && user.AdminRight !== 1);

    return matchesSearch && matchesAdmin;
  });

  const sortedUsers = (() => {
    let sortable = [...filteredUsers];
    if (sortConfig.key) {
      sortable.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortable;
  })();

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = sortedUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 pt-2 sm:px-0">
          <Breadcrumb />
        </div>
        <LoadingSpinner />
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
        {/* Page Header */}
        <div className="max-w-7xl mx-auto pt-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#2D6B9F]">Хэрэглэгчийн жагсаалт</h1>
            <div className="px-4 pt-2 sm:px-0">
              <Breadcrumb />
            </div>
            <p className="text-gray-600 mt-2">Системийн бүх хэрэглэгчийн бүртгэлийн жагсаалт</p>
          </div>
          <button
            onClick={() => handleOpenModal('create')}
            className="flex items-center px-3 py-1.5 border rounded text-sm font-medium hover:bg-blue-50/50"
            style={{ borderColor: "#2D6B9F", color: "#2D6B9F", minWidth: "110px", fontSize: "14px" }}
          >
            <PlusCircle size={15} className="mr-1" />
            Хэрэглэгч нэмэх
          </button>
        </div>
        <div className="max-w-7xl mx-auto py-6 px-0 sm:px-0 lg:px-0">
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Хэрэглэгч хайх..."
                className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2D6B9F]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-auto">
              <select
                value={adminFilter}
                onChange={handleAdminFilterChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2D6B9F] text-sm"
              >
                <option value="all">Бүгд</option>
                <option value="admin">Админ</option>
                <option value="normal">Энгийн</option>
              </select>
            </div>
          </div>
          {/* Responsive Table */}
          <div className="overflow-x-auto">
            <div className="align-middle inline-block min-w-full shadow overflow-hidden rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      className="px-4 py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider cursor-pointer select-none"
                      onClick={() => handleSort('Username')}
                    >
                      Username{renderSortArrow('Username')}
                    </th>
                    <th
                      className="px-4 py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider cursor-pointer select-none"
                      onClick={() => handleSort('Email')}
                    >
                      И-мэйл{renderSortArrow('Email')}
                    </th>
                    <th
                      className="px-4 py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider cursor-pointer select-none"
                      onClick={() => handleSort('Phonenumber')}
                    >
                      Утас{renderSortArrow('Phonenumber')}
                    </th>
                    <th
                      className="px-4 py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider cursor-pointer select-none"
                      onClick={() => handleSort('AdminRight')}
                    >
                      Админ{renderSortArrow('AdminRight')}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider sticky right-0 bg-gray-50 z-10">
                      Үйлдэл
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentUsers.length > 0 ? currentUsers.map((user) => (
                    <tr key={user.UserId} className="hover:bg-blue-50 transition group">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-center text-gray-900">
                        {user.Username} <br />
                        <span className="text-xs text-gray-500">{user.Firstname} {user.Lastname}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{user.Email}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{user.Phonenumber || '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleToggleAdmin(user)}
                          className={`px-2 py-1 rounded text-xs font-semibold ${user.AdminRight === 1 ? 'bg-green-100 text-green-800 hover:bg-gray-200' : 'bg-gray-100 text-gray-800 hover:bg-green-200'} `}
                        >
                          {user.AdminRight === 1 ? 'Админ' : 'Энгийн'}
                        </button>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium sticky right-0 bg-white z-10 border-l border-gray-100 group-hover:bg-blue-50 transition">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => handleOpenModal('edit', user)}
                            className="text-[#2D6B9F] hover:text-[#2D6B9F] w-8 h-8 flex items-center justify-center"
                            title="Засах"
                          >
                            <Edit size={16} className="mr-0.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.UserId)}
                            className="text-red-600 hover:text-red-900 w-8 h-8 flex items-center justify-center"
                            title="Устгах"
                          >
                            <Trash2 size={16} className="mr-0.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        Хэрэглэгч олдсонгүй
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-4 items-center space-x-2">
              <button
                onClick={() => paginate(Math.max(1, currentPage - 1))}
                className={`w-8 h-8 flex items-center justify-center rounded-full border ${
                  currentPage === 1
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "border-[#2D6B9F] text-[#2D6B9F] hover:bg-blue-50"
                } transition font-bold text-sm`}
                title="Өмнөх"
                disabled={currentPage === 1}
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
                  <span key={page}>
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
                  </span>
                ))}
              <button
                onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                className={`w-8 h-8 flex items-center justify-center rounded-full border ${
                  currentPage === totalPages
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "border-[#2D6B9F] text-[#2D6B9F] hover:bg-blue-50"
                } transition font-bold text-sm`}
                title="Дараах"
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
          {/* End Pagination */}
        </div>
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200 z-[110]">
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-[#2D6B9F]">
                    {formMode === 'create' ? 'Хэрэглэгч нэмэх' : 'Хэрэглэгч засах'}
                  </h2>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-[#2D6B9F]"
                  >
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#2D6B9F] text-sm font-medium mb-2">
                        Username <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#2D6B9F] focus:border-[#2D6B9F]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[#2D6B9F] text-sm font-medium mb-2">
                        Email <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#2D6B9F] focus:border-[#2D6B9F]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[#2D6B9F] text-sm font-medium mb-2">
                        First name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        name="firstname"
                        value={formData.firstname}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#2D6B9F] focus:border-[#2D6B9F]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[#2D6B9F] text-sm font-medium mb-2">
                        Last name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        name="lastname"
                        value={formData.lastname}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#2D6B9F] focus:border-[#2D6B9F]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[#2D6B9F] text-sm font-medium mb-2">
                        Phone number
                      </label>
                      <input
                        type="text"
                        name="phonenumber"
                        value={formData.phonenumber}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#2D6B9F] focus:border-[#2D6B9F]"
                      />
                    </div>
                    <div className="flex items-center mt-6">
                      <input
                        type="checkbox"
                        name="adminRight"
                        checked={formData.adminRight === 1}
                        onChange={handleInputChange}
                        className="mr-2"
                        id="adminRight"
                      />
                      <label htmlFor="adminRight" className="text-[#2D6B9F] text-sm font-medium">
                        Админ эрхтэй
                      </label>
                    </div>
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
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}