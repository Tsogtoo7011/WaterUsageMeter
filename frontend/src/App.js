import React from 'react';
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

const MainLayout = ({ children }) => {
  return (
    <PrivateRoute>
      <SidebarLayout>
        {children}
      </SidebarLayout>
    </PrivateRoute>
  );
};

const SharedLayout = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/signin" replace />;
  }
  
  return (
    <SidebarLayout>
      {children}
    </SidebarLayout>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/settings" element={<SharedLayout><Settings /> </SharedLayout>} />
        <Route path="/profile" element={<SharedLayout> <Profile /> </SharedLayout> } />
        <Route path="/Home" element={<SharedLayout>  <Home /> </SharedLayout>} />
        <Route path="/news" element={<SharedLayout>  <News /> </SharedLayout>} />
        <Route path="/feedback" element={<SharedLayout>  <Feedback/> </SharedLayout>} />
        <Route path="/feedback/create" element={<SharedLayout>  <FeedbackCreate/> </SharedLayout>} />
        <Route path="/feedback/:id" element={<SharedLayout>  <FeedbackDetail/> </SharedLayout>} />
        <Route path="/feedback/edit/:id" element={<SharedLayout>  <FeedbackEdit/> </SharedLayout>} />
        
        {/* Admin Routes */}
        <Route path="/admin/payment" element={<MainLayout><AdminPayment/></MainLayout>} />
        <Route path="/admin/metercounter" element={<MainLayout><AdminMeterCounter/></MainLayout>} />
        <Route path="/admin/service" element={<MainLayout><AdminService/></MainLayout>} />
        
        {/* User Routes */}
        <Route path="/user/profile/apartment" element={<MainLayout><Apartment /></MainLayout>} />
        <Route path="/user/metercounter/details" element={<MainLayout><MeterCounterDetail /></MainLayout>} />
        <Route path="/user/metercounter/import" element={<MainLayout><MeterCounterImport /></MainLayout>} />
        <Route path="/user/about-us" element={<MainLayout><AboutUs /></MainLayout>} />
        <Route path="/user/metercounter" element={<MainLayout><MeterCounter /></MainLayout>} />
        <Route path="/user/payment-info" element={<MainLayout><PaymentInfo /></MainLayout>} />
        <Route path="/user/services" element={<MainLayout><Services /></MainLayout>} />
        
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