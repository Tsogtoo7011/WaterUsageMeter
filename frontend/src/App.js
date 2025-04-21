import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './pages/Public/SignIn';
import SignUp from './pages/Public/SignUp';
import Settings from './pages/Public/Settings';
import Profile from './pages/Public/Profile';
import News from './pages/Public/News';
import Home from './pages/Public/Home';
import Feedback from './pages/Public/Feedback';
import FeedbackCreate from './pages/Public/FeedbackCreate';
import FeedbackDetail from './pages/Public/FeedbackDetail';
import FeedbackEdit from './pages/Public/FeedbackEdit';
import AdminMeterCounter from './pages/Admin/AdminMeterCounter';
import AdminPayment from './pages/Admin/AdminPayment';
import AdminService from './pages/Admin/AdminService';
import AboutUs from './pages/User/About';
import MeterCounterDetail from './pages/User/MeterCounterDetails';
import MeterCounterImport from './pages/User/MeterCounterImport';
import Apartment from './pages/User/Apartment';
import MeterCounter from './pages/User/MeterCounter';
import PaymentInfo from './pages/User/Payment';
import Services from './pages/User/Service';
import SidebarLayout from './Layout/SideBarLayout';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/signin" replace />;
};

const checkIsAdmin = () => {
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      return parsedUser?.AdminRight === 1;
    }
    return false;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const isAdmin = checkIsAdmin();
  
  if (!token) {
    return <Navigate to="/signin" replace />;
  }
  
  if (!isAdmin) {
    return <Navigate to="/home" replace />;
  }
  
  return <SidebarLayout>{children}</SidebarLayout>;
};

const UserRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const isAdmin = checkIsAdmin();
  
  if (!token) {
    return <Navigate to="/signin" replace />;
  }
  
  if (isAdmin) {
    return <SidebarLayout>{children}</SidebarLayout>;
  }
  
  return <SidebarLayout>{children}</SidebarLayout>;
};

const SharedLayout = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/signin" replace />;
  }
  
  return <SidebarLayout>{children}</SidebarLayout>;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);

    const handleStorageChange = () => {
      const currentToken = localStorage.getItem('token');
      setIsAuthenticated(!!currentToken);
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={isAuthenticated ? <Navigate to="/home" replace /> : <SignIn />} />
        <Route path="/signin" element={isAuthenticated ? <Navigate to="/home" replace /> : <SignIn />} />
        <Route path="/signup" element={isAuthenticated ? <Navigate to="/home" replace /> : <SignUp />} />
        
        {/* Shared Routes - accessible by both admin and user */}
        <Route path="/home" element={<SharedLayout><Home /></SharedLayout>} />
        <Route path="/settings" element={<SharedLayout><Settings /></SharedLayout>} />
        <Route path="/profile" element={<SharedLayout><Profile /></SharedLayout>} />
        <Route path="/news" element={<SharedLayout><News /></SharedLayout>} />
        <Route path="/feedback" element={<SharedLayout><Feedback /></SharedLayout>} />
        <Route path="/feedback/create" element={<SharedLayout><FeedbackCreate /></SharedLayout>} />
        <Route path="/feedback/:id" element={<SharedLayout><FeedbackDetail /></SharedLayout>} />
        <Route path="/feedback/edit/:id" element={<SharedLayout><FeedbackEdit /></SharedLayout>} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<Navigate to="/home" replace />} />
        <Route path="/admin/payment" element={<AdminRoute><AdminPayment /></AdminRoute>} />
        <Route path="/admin/metercounter" element={<AdminRoute><AdminMeterCounter /></AdminRoute>} />
        <Route path="/admin/service" element={<AdminRoute><AdminService /></AdminRoute>} />
        
        {/* User Routes */}
        <Route path="/user" element={<Navigate to="/home" replace />} />
        <Route path="/user/profile/apartment" element={<UserRoute><Apartment /></UserRoute>} />
        <Route path="/user/metercounter/details" element={<UserRoute><MeterCounterDetail /></UserRoute>} />
        <Route path="/user/metercounter/import" element={<UserRoute><MeterCounterImport /></UserRoute>} />
        <Route path="/user/about-us" element={<UserRoute><AboutUs /></UserRoute>} />
        <Route path="/user/metercounter" element={<UserRoute><MeterCounter /></UserRoute>} />
        <Route path="/user/payment-info" element={<UserRoute><PaymentInfo /></UserRoute>} />
        <Route path="/user/services" element={<UserRoute><Services /></UserRoute>} />
        
        {/* Default redirect for authenticated users */}
        <Route path="*" element={
          <PrivateRoute>
            <Navigate to="/home" replace />
          </PrivateRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;