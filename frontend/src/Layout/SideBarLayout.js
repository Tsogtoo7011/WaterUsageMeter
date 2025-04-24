import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home as HomeIcon,
  UserCircle,
  Newspaper,
  Clock,
  CreditCard,
  MessageCircle,
  HelpCircle,
  LogOut,
  Menu,
  X,
  Bell,
  Droplet,
  Settings,
} from 'lucide-react';
import SearchBar from '../components/common/searchBar'; 

const SidebarLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAdminStatus = () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);  
          const adminStatus = parsedUser?.AdminRight === 1;
          setIsAdmin(adminStatus);
          const isAdminRoute = location.pathname.includes('/admin/');
          if (!adminStatus && isAdminRoute) {
            navigate('/home');
          }
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        navigate('/');
      }
    };
    
    checkAdminStatus();
    const intervalId = setInterval(checkAdminStatus, 60000); 
    
    return () => clearInterval(intervalId);
  }, [navigate, location.pathname]);

  useEffect(() => {
    const savedSidebarState = localStorage.getItem('sidebarState');
    if (savedSidebarState !== null) {
      setIsSidebarOpen(savedSidebarState === 'true');
    }
  }, []);

  const routes = isAdmin ? [
    { path: `/home`, label: 'Нүүр хуудас', component: 'Home' },
    { path: `/admin/payment`, label: 'Төлбөрийн мэдээлэл', component: 'AdminPayment' },
    { path: `/admin/metercounter`, label: 'Тоолуурын заалт', component: 'AdminMeterCounter' },
    { path: `/admin/feedback`, label: 'Санал хүсэлт', component: 'AdminFeedback' },
    { path: `/admin/service`, label: 'Үйлчилгээ', component: 'AdminService' },
    { path: `/news`, label: 'Мэдээ мэдээлэл', component: 'News' },
    { path: `/profile`, label: 'Профайл', component: 'Profile' },
    { path: `/settings`, label: 'Тохиргоо', component: 'Settings' },
    { path: `/feedback`, label: 'Санал хүсэлт', component: 'Feedback' }
  ] : [
    { path: `/home`, label: 'Нүүр хуудас', component: 'Home' },
    { path: `/user/profile/apartment`, label: 'Орон сууц', component: 'Apartment' },
    { path: `/user/metercounter/details`, label: 'Тоолуурын дэлгэрэнгүй', component: 'MeterCounterDetail' },
    { path: `/user/metercounter/import`, label: 'Тоолуур импортлох', component: 'MeterCounterImport' },
    { path: `/user/about-us`, label: 'Бидний тухай', component: 'AboutUs' },
    { path: `/user/metercounter`, label: 'Тоолуурын заалт', component: 'MeterCounter' },
    { path: `/user/payment-info`, label: 'Төлбөрийн мэдээлэл', component: 'PaymentInfo' },
    { path: `/user/services`, label: 'Үйлчилгээ', component: 'Services' },
    { path: `/profile`, label: 'Профайл', component: 'Profile' },
    { path: `/settings`, label: 'Тохиргоо', component: 'Settings' },
    { path: `/news`, label: 'Мэдээ мэдээлэл', component: 'News' },
    { path: `/feedback`, label: 'Санал хүсэлт', component: 'Feedback' },
    { path: `/feedback/create`, label: 'Санал хүсэлт явуулах', component: 'FeedbackCreate' },
  ];

  const adminMenuItems = [
    { icon: HomeIcon, label: 'Нүүр хуудас', path: `/home` },
    { icon: CreditCard, label: 'Тайлан', path: `/admin/report` },
    { icon: Newspaper, label: 'Мэдээ мэдээлэл', path: `/news` },
    { icon: Clock, label: 'Төлбөрийн тариф', path: `/admin/tarif` },
    { icon: MessageCircle, label: 'Санал хүсэлт', path: `/feedback` },
    { icon: HelpCircle, label: 'Үйлчилгээ', path: `/service` },

  ];

  const userMenuItems = [
    { icon: HomeIcon, label: 'Нүүр хуудас', path: `/home` },
    { icon: UserCircle, label: 'Бидний тухай', path: `/user/about-us` },
    { icon: Newspaper, label: 'Мэдээ мэдээлэл', path: `/news` },
    { icon: Clock, label: 'Тоолуурын заалт', path: `/user/metercounter` },
    { icon: CreditCard, label: 'Төлбөрийн мэдээлэл', path: `/user/payment-info` },
    { icon: MessageCircle, label: 'Санал хүсэлт', path: `/feedback` },
    { icon: HelpCircle, label: 'Үйлчилгээ', path: `/service` }
  ];

  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/', { replace: true });
    window.location.reload();
  };

  const toggleSidebar = () => {
    const newState = !isSidebarOpen;
    setIsSidebarOpen(newState);
    localStorage.setItem('sidebarState', newState.toString());
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const navigateToProfile = () => {
    navigate('/profile');
  };

  const navigateToSettings = () => {
    navigate('/settings');
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <div 
        className={`hidden md:flex flex-col ${isSidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 shadow-sm fixed h-full transition-all duration-300 ease-in-out z-20`}
      >
        <div className="flex flex-col h-full p-4">  
          {/* Logo */}
          <div className="p-4 mb-6 flex items-center justify-center cursor-pointer" onClick={toggleSidebar}>
            {isSidebarOpen ? (
              <h2 className="text-xl font-bold text-blue-600 whitespace-nowrap">
                {isAdmin ? 'Админ' : 'Диплом'}
              </h2>
            ) : (
              <div className="flex items-center justify-center">
                <Droplet className="w-8 h-8 text-blue-600" />
              </div>
            )}
          </div>
          
          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === `/home`} 
                className={({ isActive }) => 
                  `flex items-center p-3 mb-2 rounded-lg transition-all duration-200 ease-in-out ${
                    isActive 
                      ? 'bg-blue-50 text-blue-600 font-medium' 
                      : 'hover:bg-gray-100 text-gray-700'
                  }`
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {isSidebarOpen && (
                  <span className="ml-3 whitespace-nowrap overflow-hidden overflow-ellipsis">
                    {item.label}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            className="mt-auto p-3 rounded-lg hover:bg-gray-100 text-gray-700 flex items-center transition-all duration-200 ease-in-out"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span className="ml-3 whitespace-nowrap">Гарах</span>}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden transition-opacity duration-300 ease-in-out"
          onClick={toggleMobileSidebar}
        ></div>
      )}

      {/* Mobile Sidebar */}
      <div 
        className={`md:hidden fixed top-0 left-0 h-full bg-white border-r border-gray-200 shadow-sm transform transition-transform duration-300 ease-in-out z-40 ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } w-64`}
      >
        <div className="flex flex-col h-full p-4">
          <div className="p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center cursor-pointer" onClick={toggleMobileSidebar}>
              <Droplet className="w-6 h-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-bold text-blue-600">
                {isAdmin ? 'Админ' : 'Диплом'}
              </h2>
            </div>
            <button 
              onClick={toggleMobileSidebar}
              className="p-1 rounded-md hover:bg-gray-100 text-gray-500 transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <nav className="flex-1 overflow-y-auto">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === `/home`}
                onClick={toggleMobileSidebar}
                className={({ isActive }) => 
                  `flex items-center p-3 mb-2 rounded-lg transition-all duration-200 ease-in-out ${
                    isActive 
                      ? 'bg-blue-50 text-blue-600 font-medium' 
                      : 'hover:bg-gray-100 text-gray-700'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="ml-3">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <button 
            onClick={handleLogout}
            className="mt-auto p-3 rounded-lg hover:bg-gray-100 text-gray-700 flex items-center transition-all duration-200 ease-in-out"
          >
            <LogOut className="w-5 h-5" />
            <span className="ml-3">Гарах</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div 
        className={`flex-1 flex flex-col ${
          isSidebarOpen ? 'md:ml-64' : 'md:ml-20'
        } transition-all duration-300 ease-in-out`}
      >
        {/* Top Navigation Bar */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center px-4 sticky top-0 z-10">
          <div className="flex items-center justify-between w-full">
            {/* Mobile menu button */}
            <button 
              onClick={toggleMobileSidebar}
              className="md:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 transition-colors duration-200"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* SearchBar */}
            <SearchBar routes={routes} isAdmin={isAdmin} />
            <div className="flex-1 md:hidden"></div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 rounded-full hover:bg-gray-100 transition-colors duration-200">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
      
              <button 
                onClick={navigateToSettings} 
                className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
            
              <button 
                onClick={navigateToProfile} 
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors duration-200"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center transition-colors duration-200">
                  <UserCircle className="h-5 w-5 text-blue-600" />
                </div>
                <span className="font-medium hidden sm:inline">
                  Профайл
                </span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-y-auto p-0 bg-gray-50 border-x-0 border-t-0 border-b-0 border-r border-gray-200">
          {children}
        </main>
      </div>
    </div>
  );
};

export default SidebarLayout;