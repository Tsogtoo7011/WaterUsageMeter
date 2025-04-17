import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VerificationReminder from '../../components/verificationReminder';
import api from "../../utils/api";

function Home() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/');
          return;
        }
        
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        }

        const response = await api.get("/user/profile");
        
        if (response.data) {
          setUser(response.data);
          localStorage.setItem('user', JSON.stringify(response.data));
        }
      } catch (err) {
        setError('Хэрэглэгчийн мэдээлэл авахад алдаа гарлаа');
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [navigate]);
  
  const handleVerificationSuccess = () => {
    setUser(prev => ({
      ...prev,
      IsVerified: true
    }));
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  const isAdmin = user?.AdminRight === 1;
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {user && !user.IsVerified && (
          <VerificationReminder user={user} onVerify={handleVerificationSuccess} />
        )}
        
        <div className="px-4 py-6 sm:px-0">
          {isAdmin ? (
            // Admin content
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
                <div className="mt-4">
                  <p>Welcome, {user.Username}! You have administrative privileges.</p>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-xl font-medium text-gray-900">Admin Functions</h3>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="bg-gray-50 p-4 rounded-md cursor-pointer hover:bg-gray-100">
                      <h4 className="font-medium">User Management</h4>
                      <p className="text-sm text-gray-500">Manage system users</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-md cursor-pointer hover:bg-gray-100">
                      <h4 className="font-medium">System Settings</h4>
                      <p className="text-sm text-gray-500">Configure application settings</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-md cursor-pointer hover:bg-gray-100">
                      <h4 className="font-medium">Reports</h4>
                      <p className="text-sm text-gray-500">View system reports and analytics</p>
                    </div>
                    <div 
                      className="bg-gray-50 p-4 rounded-md cursor-pointer hover:bg-gray-100"
                      onClick={() => navigate('/user/Profile')}
                    >
                      <h4 className="font-medium">Admin Profile</h4>
                      <p className="text-sm text-gray-500">Manage your admin account</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // User content
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h1 className="text-2xl font-semibold text-gray-900">Хэрэглэгчийн хэсэг</h1>
                <div className="mt-4">
                  <p>Сайн байна уу, {user?.Username}!</p>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-xl font-medium text-gray-900">Хэрэглэгчийн үйлдлүүд</h3>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div 
                      className="bg-gray-50 p-4 rounded-md cursor-pointer hover:bg-gray-100" 
                      onClick={() => navigate('/user/Profile')}
                    >
                      <h4 className="font-medium">Хувийн мэдээлэл</h4>
                      <p className="text-sm text-gray-500">Өөрийн мэдээллийг хянах</p>
                    </div>
                    <div 
                      className="bg-gray-50 p-4 rounded-md cursor-pointer hover:bg-gray-100" 
                      onClick={() => navigate('/user/Profile/Apartment')}
                    >
                      <h4 className="font-medium">Орон сууц</h4>
                      <p className="text-sm text-gray-500">Орон сууц нэмэх</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;