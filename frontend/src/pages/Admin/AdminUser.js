import { useState, useEffect } from 'react';
import { Search, User, Users, Shield, Edit, Trash2, Eye, ArrowLeft, X, Check, RefreshCw } from 'lucide-react';
import api from "../../utils/api"; 
import Breadcrumb from '../../components/common/Breadcrumb'; // Add Breadcrumb import

export default function AdminUser() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState('list'); 
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/AdminUser');
      setUsers(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }
    
    try {
      await api.delete(`/AdminUser/${userId}`);
      
      showNotification('User deleted successfully');
      fetchUsers();
      if (selectedUser && selectedUser.UserId === userId) {
        setSelectedUser(null);
        setView('list');
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to delete user', 'error');
    }
  };

  const toggleAdminRights = async (userId, currentAdminRight) => {
    try {
      const newAdminRight = currentAdminRight === 1 ? 0 : 1;
      
      await api.put(`/AdminUser/${userId}/admin-rights`, { adminRight: newAdminRight });
      
      showNotification('Admin rights updated successfully');

      // Update users list and selected user if applicable
      fetchUsers();
      if (selectedUser && selectedUser.UserId === userId) {
        setSelectedUser({...selectedUser, AdminRight: newAdminRight});
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to update admin rights', 'error');
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.Username.toLowerCase().includes(searchLower) ||
      user.Email.toLowerCase().includes(searchLower) ||
      `${user.Firstname} ${user.Lastname}`.toLowerCase().includes(searchLower)
    );
  });

  // State for password change
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  const openPasswordModal = (userId) => {
    setCurrentUserId(userId);
    setPasswordModalOpen(true);
  };

  const closePasswordModal = () => {
    setPasswordModalOpen(false);
    setCurrentUserId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb navigation */}
      <div className="max-w-7xl mx-auto px-4 pt-2 sm:px-0">
        <Breadcrumb />
      </div>
      
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-md ${
          notification.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
        }`}>
          <div className="flex items-center">
            {notification.type === 'error' ? <X className="w-5 h-5 mr-2" /> : <Check className="w-5 h-5 mr-2" />}
            <span>{notification.message}</span>
          </div>
        </div>
      )}
      
      {/* Password Change Modal */}
      {passwordModalOpen && (
        <PasswordChangeModal 
          userId={currentUserId}
          onClose={closePasswordModal}
          showNotification={showNotification}
        />
      )}

      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <button 
            onClick={fetchUsers}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {view === 'list' && (
          <div>
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md h-12"
                  placeholder="Search users by name, username or email"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Users List */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
                  <p className="mt-4 text-gray-500">Loading users...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                    <X className="h-6 w-6 text-red-600" />
                  </div>
                  <p className="mt-4 text-red-500">{error}</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-4 text-gray-500">No users found</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <li key={user.UserId}>
                      <div className="px-6 py-4 flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-6 w-6 text-gray-500" />
                          </div>
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="text-sm font-medium text-gray-900">{user.Username}</div>
                          <div className="text-sm text-gray-500">{user.Email}</div>
                          <div className="text-sm text-gray-500">{user.Firstname} {user.Lastname}</div>
                        </div>
                        <div className="ml-4 flex-shrink-0 flex space-x-2">
                          {user.AdminRight === 1 && (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                              Admin
                            </span>
                          )}
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setView('view');
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setView('edit');
                            }}
                            className="text-yellow-600 hover:text-yellow-900"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.UserId)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {view === 'view' && selectedUser && (
          <UserView 
            user={selectedUser} 
            onBack={() => setView('list')} 
            onEdit={() => setView('edit')} 
            onDelete={() => handleDelete(selectedUser.UserId)}
            onToggleAdmin={() => toggleAdminRights(selectedUser.UserId, selectedUser.AdminRight)}
          />
        )}

        {view === 'edit' && selectedUser && (
          <UserEdit 
            user={selectedUser} 
            onBack={() => setView('view')} 
            onSave={(updatedUser) => {
              setSelectedUser(updatedUser);
              setView('view');
              fetchUsers();
            }}
            showNotification={showNotification}
          />
        )}
      </main>
    </div>
  );
}

// Component to view a user's details
// Password Change Modal Component
function PasswordChangeModal({ userId, onClose, showNotification }) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear errors when typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      await api.put(`/AdminUser/${userId}`, {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      
      showNotification('Password changed successfully');
      onClose();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.currentPassword ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.currentPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
            )}
          </div>
          
          <div className="mb-4">
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.newPassword ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.newPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
            )}
          </div>
          
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UserView({ user, onBack, onEdit, onDelete, onToggleAdmin }) {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">User Information</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and account info.</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onBack}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </button>
          <button
            onClick={onEdit}
            className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </button>
          <button
            onClick={onDelete}
            className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </button>
        </div>
      </div>
      <div className="border-t border-gray-200">
        <dl>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Username</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.Username}</dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Full name</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{`${user.Firstname} ${user.Lastname}`}</dd>
          </div>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Email address</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.Email}</dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Phone number</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.Phonenumber || 'Not provided'}</dd>
          </div>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Admin status</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex items-center">
              {user.AdminRight === 1 ? (
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 mr-2">
                  Admin
                </span>
              ) : (
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 mr-2">
                  Regular User
                </span>
              )}
              <button
                onClick={onToggleAdmin}
                className="inline-flex items-center px-2 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Shield className="h-3 w-3 mr-1" />
                {user.AdminRight === 1 ? 'Remove Admin' : 'Make Admin'}
              </button>
            </dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Verification status</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {user.IsVerified === 1 ? (
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  Verified
                </span>
              ) : (
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                  Not Verified
                </span>
              )}
            </dd>
          </div>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Created at</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {new Date(user.CreatedAt).toLocaleString()}
            </dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Last updated</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {new Date(user.UpdatedAt).toLocaleString()}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

// Component to edit a user's details
function UserEdit({ user, onBack, onSave, showNotification }) {
  const [formData, setFormData] = useState({
    username: user.Username,
    firstname: user.Firstname,
    lastname: user.Lastname,
    phonenumber: user.Phonenumber || '',
    email: user.Email
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Update user data
      await api.put(`/AdminUser/${user.UserId}`, formData);
      
      // Get updated user data
      const userResponse = await api.get(`/AdminUser/${user.UserId}`);
      const updatedUser = userResponse.data;
      
      showNotification('User updated successfully');
      onSave(updatedUser);
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to update user', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">Edit User</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Update user information.</p>
        </div>
        <button
          onClick={onBack}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </button>
      </div>
      <div className="border-t border-gray-200">
        <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-6 gap-6">
            <div className="col-span-6 sm:col-span-3">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                type="text"
                name="username"
                id="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>

            <div className="col-span-6 sm:col-span-3">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>

            <div className="col-span-6 sm:col-span-3">
              <label htmlFor="firstname" className="block text-sm font-medium text-gray-700">
                First name
              </label>
              <input
                type="text"
                name="firstname"
                id="firstname"
                value={formData.firstname}
                onChange={handleChange}
                required
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>

            <div className="col-span-6 sm:col-span-3">
              <label htmlFor="lastname" className="block text-sm font-medium text-gray-700">
                Last name
              </label>
              <input
                type="text"
                name="lastname"
                id="lastname"
                value={formData.lastname}
                onChange={handleChange}
                required
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>

            <div className="col-span-6">
              <label htmlFor="phonenumber" className="block text-sm font-medium text-gray-700">
                Phone number
              </label>
              <input
                type="text"
                name="phonenumber"
                id="phonenumber"
                value={formData.phonenumber}
                onChange={handleChange}
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onBack}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}