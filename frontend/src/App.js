import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import Home from './components/Home';
import AboutUs from './components/About';
import News from './components/News';
import MeterReadings, { MeterCounter } from './components/MeterCounter'; 
import PaymentInfo from './components/Payment';
import Feedback from './components/Feedback';
import Services from './components/Service';
import SidebarLayout from './components/SideBarLayout';

// Protected Route Component
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/signin" replace />;
};

// Layout Wrapper for all authenticated routes
const MainLayout = ({ children }) => {
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
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Protected Routes with Sidebar Layout */}
        <Route 
          path="/" 
          element={
            <PrivateRoute>
               <SidebarLayout>
               <Home />
               </SidebarLayout>
            </PrivateRoute>
          } 
        />
        <Route 
          path="/about-us" 
          element={
            <PrivateRoute>
              <SidebarLayout>
              <AboutUs />
             </SidebarLayout>
            </PrivateRoute>
          } 
        />
        <Route 
          path="/news" 
          element={
            <PrivateRoute>
              <SidebarLayout>
                <News />
              </SidebarLayout>
            </PrivateRoute>
          } 
        />
        <Route 
          path="/metercounter" 
          element={
            <PrivateRoute>
              <SidebarLayout>
                <MeterCounter />
              </SidebarLayout>
            </PrivateRoute>
          } 
        />
        <Route 
          path="/payment-info" 
          element={
            <PrivateRoute>
              <SidebarLayout>
                <PaymentInfo />
              </SidebarLayout>
            </PrivateRoute>
          } 
        />
        <Route 
          path="/feedback" 
          element={
            <PrivateRoute>
              <SidebarLayout>
                <Feedback />
              </SidebarLayout>
            </PrivateRoute>
          } 
        />
        <Route 
          path="/services" 
          element={
            <PrivateRoute>
              <SidebarLayout>
                <Services />
              </SidebarLayout>
            </PrivateRoute>
          } 
        />

        {/* Redirects */}
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;