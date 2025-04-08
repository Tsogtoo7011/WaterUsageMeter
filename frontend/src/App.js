import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './components/Public/SignIn';
import SignUp from './components/Public/SignUp';
import VerifyEmail from './components/Public/VerifyEmail';
import AdminFeedback from './components/Admin/AdminFeedback';
import AdminHome from './components/Admin/AdminHome';
import AdminMeterCounter from './components/Admin/AdminMeterCounter';
import AdminNews from './components/Admin/AdminNews';
import AdminPayment from './components/Admin/AdminPayment';
import AdminService from './components/Admin/AdminService';
import AdminProfile from './components/Admin/AdminProfile';
import Home from './components/User/Home';
import AboutUs from './components/User/About';
import News from './components/User/News';
import MeterCounter from './components/User/MeterCounter'; 
import PaymentInfo from './components/User/Payment';
import Feedback from './components/User/Feedback';
import Services from './components/User/Service';
import SidebarLayout from './Layout/SideBarLayout';
import MeterCounterDetail from './components/User/MeterCounterDetails';
import MeterCounterImport from './components/User/MeterCounterImport';
import Profile from './components/User/Profile';
import Apartment from './components/User/Apartment';


// Protected Route Component
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/signin" replace />;
};

// Layout Wrapper for all authenticated routes
const MainLayout = ({ children }) => {
  return (
    <PrivateRoute>
      <SidebarLayout>
        {children}
      </SidebarLayout>
    </PrivateRoute>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/verify-email" element={<VerifyEmail/>} />

        {/* Admin Routes */}
        <Route path="/admin/" element={<MainLayout><AdminHome /></MainLayout>} />
        <Route path="/admin/payment" element={<MainLayout><AdminPayment/></MainLayout>} />
        <Route path="/admin/metercounter" element={<MainLayout><AdminMeterCounter/></MainLayout>} />
        <Route path="/admin/feedback" element={<MainLayout><AdminFeedback/></MainLayout>} />
        <Route path="/admin/service" element={<MainLayout><AdminService/></MainLayout>} />
        <Route path="/admin/news" element={<MainLayout><AdminNews/></MainLayout>} />
        <Route path="/admin/profile" element={<MainLayout><AdminProfile/></MainLayout>} />
        
        {/* User Routes */}
        <Route path="/user/" element={<MainLayout><Home /></MainLayout>} />
        <Route path="/user/profile" element={<MainLayout><Profile /></MainLayout>} />
        <Route path="/user/profile/apartment" element={<MainLayout><Apartment /></MainLayout>} />
        <Route path="/user/metercounter/details" element={<MainLayout><MeterCounterDetail /></MainLayout>} />
        <Route path="/user/metercounter/import" element={<MainLayout><MeterCounterImport /></MainLayout>} />
        <Route path="/user/about-us" element={<MainLayout><AboutUs /></MainLayout>} />
        <Route path="/user/news" element={<MainLayout><News /></MainLayout>} />
        <Route path="/user/metercounter" element={<MainLayout><MeterCounter /></MainLayout>} />
        <Route path="/user/payment-info" element={<MainLayout><PaymentInfo /></MainLayout>} />
        <Route path="/user/feedback" element={<MainLayout><Feedback /></MainLayout>} />
        <Route path="/user/services" element={<MainLayout><Services /></MainLayout>} />

        {/* Redirects */}
      </Routes>
    </Router>
  );
}

export default App;