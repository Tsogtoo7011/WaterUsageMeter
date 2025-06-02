import React, { useEffect, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './pages/Public/SignIn';
import SignUp from './pages/Public/SignUp';
import Settings from './pages/Public/Settings';
import Profile from './pages/Public/Profile';
import News from './pages/Public/News';
import NewsDetails from './pages/Public/NewsDetails';
import Home from './pages/Public/Home';
import Feedback from './pages/Public/Feedback';
import FeedbackDetails from './pages/Public/FeedbackDetails';
import Services from './pages/Public/Service';
import ServiceDetails from './pages/Public/ServiceDetails';
import ForgetPassword from './pages/Public/forgetPassword';
import AdminReport from './pages/Admin/AdminReport';
import AdminTarif from './pages/Admin/AdminTariff';
import AdminUser from './pages/Admin/AdminUser';
import AboutUs from './pages/User/About';
import MeterCounterDetail from './pages/User/MeterCounterDetails';
import Apartment from './pages/User/Apartment';
import MeterCounter from './pages/User/MeterCounter';
import PaymentInfo from './pages/User/Payment';
import PaymentDetails from './pages/User/PaymentDetails';
import SidebarLayout from './Layout/SideBarLayout';


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
    setIsLoading(false); 
  }, []);

  useEffect(() => {
    checkAuth();
    const handleAuthChange = () => checkAuth();
    const handleStorageChange = (e) => e.key === 'token' && checkAuth();
    window.addEventListener('authChange', handleAuthChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('authChange', handleAuthChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkAuth]);

  const PrivateRoute = useCallback(({ children }) => isAuthenticated ? children : <Navigate to="/" replace />, [isAuthenticated]);
  const checkIsAdmin = useCallback(() => JSON.parse(localStorage.getItem('user'))?.AdminRight === 1, []);
  const AdminRoute = useCallback(({ children }) => !isAuthenticated ? <Navigate to="/" replace /> : !checkIsAdmin() ? <Navigate to="/home" replace /> : <SidebarLayout>{children}</SidebarLayout>, [isAuthenticated, checkIsAdmin]);
  const UserRoute = useCallback(({ children }) => !isAuthenticated ? <Navigate to="/" replace /> : <SidebarLayout>{children}</SidebarLayout>, [isAuthenticated]);
  const SharedLayout = useCallback(({ children }) => !isAuthenticated ? <Navigate to="/" replace /> : <SidebarLayout>{children}</SidebarLayout>, [isAuthenticated]);

  if (isLoading) return <div className="w-full h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>;

  return (
    <Router>
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/home" replace /> : <SignIn />} />
        <Route path="/signup" element={isAuthenticated ? <Navigate to="/home" replace /> : <SignUp />} />
        <Route path="/ForgetPassword" element={isAuthenticated ? <Navigate to="/home" replace /> : <ForgetPassword />} />
        
        <Route path="/home" element={<SharedLayout><Home /></SharedLayout>} />
        <Route path="/settings" element={<SharedLayout><Settings /></SharedLayout>} />
        <Route path="/profile" element={<SharedLayout><Profile /></SharedLayout>} />
        <Route path="/news" element={<SharedLayout><News /></SharedLayout>} />
        <Route path='/news/:id' element={<SharedLayout><NewsDetails /></SharedLayout>} />
        <Route path="/feedback" element={<SharedLayout><Feedback /></SharedLayout>} />
        <Route path="/feedback/:id" element={<SharedLayout><FeedbackDetails /></SharedLayout>} />
        <Route path="/service" element={<SharedLayout><Services /></SharedLayout>} />
        <Route path="/services/:id" element={<SharedLayout><ServiceDetails /></SharedLayout>} />
        
        <Route path="/admin" element={<Navigate to="/home" replace />} />
        <Route path="/admin/tarif" element={<AdminRoute><AdminTarif /></AdminRoute>} />
        <Route path="/admin/report" element={<AdminRoute><AdminReport /></AdminRoute>} />
        <Route path="/admin/user" element={<AdminRoute><AdminUser /></AdminRoute>} />
        
        <Route path="/user" element={<Navigate to="/home" replace />} />
        <Route path="/profile/apartment" element={<UserRoute><Apartment /></UserRoute>} />
        <Route path="/user/metercounter/details" element={<UserRoute><MeterCounterDetail /></UserRoute>} />
        <Route path="/user/about-us" element={<UserRoute><AboutUs /></UserRoute>} />
        <Route path="/user/metercounter" element={<UserRoute><MeterCounter /></UserRoute>} />
        <Route path="/user/payment-info" element={<UserRoute><PaymentInfo /></UserRoute>} />
        <Route path="/user/payment/:id" element={<UserRoute><PaymentDetails /></UserRoute>} />
        <Route path="/user/services" element={<UserRoute><Services /></UserRoute>} />
        
        <Route path="*" element={<PrivateRoute><Navigate to="/home" replace /></PrivateRoute>} />
      </Routes>
    </Router>
  );
}

export default App;