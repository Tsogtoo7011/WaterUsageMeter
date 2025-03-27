import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import Home from './components/Home';
import AboutUs from './components/About';
import News from './components/News';
import MeterCounter from './components/MeterCounter'; 
import PaymentInfo from './components/Payment';
import Feedback from './components/Feedback';
import Services from './components/Service';
import SidebarLayout from './Layout/SideBarLayout';
import MeterCounterDetail from './components/MeterCounterDetails';
import MeterCounterImport from './components/MeterCounterImport';
import Profile from './components/Profile';
import Apartment from './components/Apartment';

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
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Protected Routes with Sidebar Layout */}
        <Route path="/" element={<MainLayout><Home /></MainLayout>} />
        <Route path="/profile" element={<MainLayout><Profile /></MainLayout>} />
        <Route path="/profile/apartment" element={<MainLayout><Apartment /></MainLayout>} />
        <Route path="/metercounter/details" element={<MainLayout><MeterCounterDetail /></MainLayout>} />
        <Route path="/metercounter/import" element={<MainLayout><MeterCounterImport /></MainLayout>} />
        <Route path="/about-us" element={<MainLayout><AboutUs /></MainLayout>} />
        <Route path="/news" element={<MainLayout><News /></MainLayout>} />
        <Route path="/metercounter" element={<MainLayout><MeterCounter /></MainLayout>} />
        <Route path="/payment-info" element={<MainLayout><PaymentInfo /></MainLayout>} />
        <Route path="/feedback" element={<MainLayout><Feedback /></MainLayout>} />
        <Route path="/services" element={<MainLayout><Services /></MainLayout>} />

        {/* Redirects */}
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;