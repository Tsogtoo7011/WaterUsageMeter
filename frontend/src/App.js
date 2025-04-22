import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { 
  SignIn, SignUp, Settings, Profile, News, Home, Feedback, FeedbackCreate, 
  FeedbackDetail, FeedbackEdit, AdminTarif, AdminReport, AboutUs, MeterCounterDetail,
  MeterCounterImport, Apartment, MeterCounter, PaymentInfo, Services 
} from './pages';
import SidebarLayout from './Layout/SideBarLayout';

const PrivateRoute = ({ children }) => localStorage.getItem('token') ? children : <Navigate to="/" replace />;
const checkIsAdmin = () => JSON.parse(localStorage.getItem('user'))?.AdminRight === 1;
const AdminRoute = ({ children }) => !localStorage.getItem('token') ? <Navigate to="/" replace /> 
  : !checkIsAdmin() ? <Navigate to="/home" replace /> : <SidebarLayout>{children}</SidebarLayout>;
const UserRoute = ({ children }) => !localStorage.getItem('token') ? <Navigate to="/" replace /> 
  : <SidebarLayout>{children}</SidebarLayout>;
const SharedLayout = ({ children }) => !localStorage.getItem('token') ? <Navigate to="/" replace /> 
  : <SidebarLayout>{children}</SidebarLayout>;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  
  useEffect(() => {
    const checkAuth = () => setIsAuthenticated(!!localStorage.getItem('token'));
    checkAuth();
    window.addEventListener('authChange', checkAuth);
    window.addEventListener('storage', (e) => e.key === 'token' && checkAuth());
    return () => {
      window.removeEventListener('authChange', checkAuth);
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/home" replace /> : <SignIn />} />
        <Route path="/signup" element={isAuthenticated ? <Navigate to="/home" replace /> : <SignUp />} />
        <Route path="/forgot-password" element={isAuthenticated ? <Navigate to="/home" replace /> : <SignIn />} />
        
        <Route path="/home" element={<SharedLayout><Home /></SharedLayout>} />
        <Route path="/settings" element={<SharedLayout><Settings /></SharedLayout>} />
        <Route path="/profile" element={<SharedLayout><Profile /></SharedLayout>} />
        <Route path="/news" element={<SharedLayout><News /></SharedLayout>} />
        <Route path="/feedback" element={<SharedLayout><Feedback /></SharedLayout>} />
        <Route path="/feedback/create" element={<SharedLayout><FeedbackCreate /></SharedLayout>} />
        <Route path="/feedback/:id" element={<SharedLayout><FeedbackDetail /></SharedLayout>} />
        <Route path="/feedback/edit/:id" element={<SharedLayout><FeedbackEdit /></SharedLayout>} />
        <Route path="/service" element={<SharedLayout><Services /></SharedLayout>} />
        
        <Route path="/admin" element={<Navigate to="/home" replace />} />
        <Route path="/admin/tarif" element={<AdminRoute><AdminTarif /></AdminRoute>} />
        <Route path="/admin/report" element={<AdminRoute><AdminReport /></AdminRoute>} />
        
        <Route path="/user" element={<Navigate to="/home" replace />} />
        <Route path="/user/profile/apartment" element={<UserRoute><Apartment /></UserRoute>} />
        <Route path="/user/metercounter/details" element={<UserRoute><MeterCounterDetail /></UserRoute>} />
        <Route path="/user/metercounter/import" element={<UserRoute><MeterCounterImport /></UserRoute>} />
        <Route path="/user/about-us" element={<UserRoute><AboutUs /></UserRoute>} />
        <Route path="/user/metercounter" element={<UserRoute><MeterCounter /></UserRoute>} />
        <Route path="/user/payment-info" element={<UserRoute><PaymentInfo /></UserRoute>} />
        <Route path="/user/services" element={<UserRoute><Services /></UserRoute>} />
        
        <Route path="*" element={<PrivateRoute><Navigate to="/home" replace /></PrivateRoute>} />
      </Routes>
    </Router>
  );
}

export default App;