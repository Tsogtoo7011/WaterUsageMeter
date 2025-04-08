import React, { useState, useEffect, useRef } from 'react';
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
  Search,
  Bell,
  Droplet,
  Users,
  Settings,
} from 'lucide-react';

const SidebarLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Determine if the user is in admin context based on URL path
  useEffect(() => {
    setIsAdmin(location.pathname.startsWith('/admin'));
  }, [location.pathname]);

  const basePath = isAdmin ? '/admin' : '/user';

  // Add shared routes to both admin and user routes
  const routes = isAdmin ? [
    { path: `${basePath}/`, label: 'Нүүр хуудас', component: 'AdminHome' },
    { path: `${basePath}/payment`, label: 'Төлбөрийн мэдээлэл', component: 'AdminPayment' },
    { path: `${basePath}/metercounter`, label: 'Тоолуурын заалт', component: 'AdminMeterCounter' },
    { path: `${basePath}/feedback`, label: 'Санал хүсэлт', component: 'AdminFeedback' },
    { path: `${basePath}/service`, label: 'Үйлчилгээ', component: 'AdminService' },
    { path: `${basePath}/news`, label: 'Мэдээ мэдээлэл', component: 'AdminNews' },
    // Shared routes
    { path: `/profile`, label: 'Профайл (Shared)', component: 'Profile' },
    { path: `/settings`, label: 'Тохиргоо (Shared)', component: 'Settings' }
  ] : [
    { path: `${basePath}/`, label: 'Нүүр хуудас', component: 'Home' },
    { path: `${basePath}/profile/apartment`, label: 'Орон сууц', component: 'Apartment' },
    { path: `${basePath}/metercounter/details`, label: 'Тоолуурын дэлгэрэнгүй', component: 'MeterCounterDetail' },
    { path: `${basePath}/metercounter/import`, label: 'Тоолуур импортлох', component: 'MeterCounterImport' },
    { path: `${basePath}/about-us`, label: 'Бидний тухай', component: 'AboutUs' },
    { path: `${basePath}/news`, label: 'Мэдээ мэдээлэл', component: 'News' },
    { path: `${basePath}/metercounter`, label: 'Тоолуурын заалт', component: 'MeterCounter' },
    { path: `${basePath}/payment-info`, label: 'Төлбөрийн мэдээлэл', component: 'PaymentInfo' },
    { path: `${basePath}/feedback`, label: 'Санал хүсэлт', component: 'Feedback' },
    { path: `${basePath}/services`, label: 'Үйлчилгээ', component: 'Services' },
    // Shared routes
    { path: `/profile`, label: 'Профайл (Shared)', component: 'Profile' },
    { path: `/settings`, label: 'Тохиргоо (Shared)', component: 'Settings' }
  ];

  const adminMenuItems = [
    { icon: HomeIcon, label: 'Нүүр хуудас', path: `${basePath}/` },
    { icon: CreditCard, label: 'Төлбөрийн мэдээлэл', path: `${basePath}/payment` },
    { icon: Clock, label: 'Тоолуурын заалт', path: `${basePath}/metercounter` },
    { icon: MessageCircle, label: 'Санал хүсэлт', path: `${basePath}/feedback` },
    { icon: HelpCircle, label: 'Үйлчилгээ', path: `${basePath}/service` },
    { icon: Newspaper, label: 'Мэдээ мэдээлэл', path: `${basePath}/news` }
  ];

  const userMenuItems = [
    { icon: HomeIcon, label: 'Нүүр хуудас', path: `${basePath}/` },
    { icon: UserCircle, label: 'Бидний тухай', path: `${basePath}/about-us` },
    { icon: Newspaper, label: 'Мэдээ мэдээлэл', path: `${basePath}/news` },
    { icon: Clock, label: 'Тоолуурын заалт', path: `${basePath}/metercounter` },
    { icon: CreditCard, label: 'Төлбөрийн мэдээлэл', path: `${basePath}/payment-info` },
    { icon: MessageCircle, label: 'Санал хүсэлт', path: `${basePath}/feedback` },
    { icon: HelpCircle, label: 'Үйлчилгээ', path: `${basePath}/services` }
  ];

  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === '') {
      setSearchResults([]);
      return;
    }

    const filteredRoutes = routes.filter(route => 
      route.label.toLowerCase().includes(query.toLowerCase()) ||
      route.component.toLowerCase().includes(query.toLowerCase()) ||
      route.path.toLowerCase().includes(query.toLowerCase())
    );

    setSearchResults(filteredRoutes);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    navigate('/');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const navigateToRoute = (path) => {
    navigate(path);
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchFocused(false);
  };

  // Modified function to handle profile navigation using shared route
  const navigateToProfile = () => {
    // We can use the shared route for profile
    navigate('/profile');
  };

  // New function to handle settings navigation using shared route
  const navigateToSettings = () => {
    navigate('/settings');
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <div 
        className={`hidden md:flex flex-col ${isSidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 shadow-sm fixed h-full transition-all duration-300 ease-in-out z-20`}
      >
        <div className="flex flex-col h-full p-4">  
          {/* Logo - Now clickable to toggle sidebar */}
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
                end={item.path === `${basePath}/`} // This ensures the home route only matches exactly
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
                end={item.path === `${basePath}/`} // Same fix for mobile menu
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
            {/* Mobile menu button - only shown on mobile */}
            <button 
              onClick={toggleMobileSidebar}
              className="md:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 transition-colors duration-200"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Search Bar with Dropdown Results */}
            <div ref={searchRef} className="hidden md:block relative max-w-md w-full mx-4">
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                <input 
                  type="text" 
                  placeholder="Хайх..." 
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => setIsSearchFocused(true)}
                  className="pl-10 pr-4 py-2 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Search Results Dropdown */}
              {isSearchFocused && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-sm max-h-64 overflow-y-auto z-50">
                  {searchResults.map((route) => (
                    <div 
                      key={route.path}
                      onClick={() => navigateToRoute(route.path)}
                      className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-800">{route.label}</div>
                      <div className="text-sm text-gray-500">{route.path}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Empty div to push profile section to the right on mobile */}
            <div className="flex-1 md:hidden"></div>

            {/* Notification, Settings, and Profile */}
            <div className="flex items-center space-x-4">
              {/* Notification */}
              <button className="relative p-2 rounded-full hover:bg-gray-100 transition-colors duration-200">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              {/* Settings - Now using the shared route */}
              <button 
                onClick={navigateToSettings} 
                className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
              
              {/* Profile - Now using the shared route */}
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