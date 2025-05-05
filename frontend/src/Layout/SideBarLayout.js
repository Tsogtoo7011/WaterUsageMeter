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
  Bell,
  Droplet,
  Settings,
  ClipboardList,
  FileText
} from 'lucide-react';
import SearchBar from '../components/common/searchBar'; 

const SidebarLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollOpacity, setScrollOpacity] = useState(1);
  const dropdownRef = useRef(null);
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
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const maxScroll = 200; // Adjust this value as needed
      const scrollY = window.scrollY;
      const opacity = Math.max(1 - scrollY / maxScroll, 0.5); // Minimum opacity of 0.5
      setScrollOpacity(opacity);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const routes = isAdmin ? [
    { path: `/home`, label: 'Нүүр хуудас', component: 'Home' },
    { path: `/admin/report`, label: 'Тайлан', component: 'AdminReport' },
    { path: `/admin/tarif`, label: 'Төлбөрийн тариф', component: 'AdminTarif' },
    { path: `/admin/user`, label: 'Хэрэглэгчийн хүснэгт', component: 'AdminUser' },
    { path: `/news`, label: 'Мэдээ мэдээлэл', component: 'News' },
    { path: `/feedback`, label: 'Санал хүсэлт', component: 'Feedback' },
    { path: `/service`, label: 'Үйлчилгээ', component: 'Services' },
    { path: `/profile`, label: 'Профайл', component: 'Profile' },
    { path: `/settings`, label: 'Тохиргоо', component: 'Settings' }
  ] : [
    { path: `/home`, label: 'Нүүр хуудас', component: 'Home' },
    { path: `/user/profile/apartment`, label: 'Орон сууц', component: 'Apartment' },
    { path: `/user/metercounter/details`, label: 'Тоолуурын дэлгэрэнгүй', component: 'MeterCounterDetail' },
    { path: `/user/metercounter/import`, label: 'Тоолуур импортлох', component: 'MeterCounterImport' },
    { path: `/user/about-us`, label: 'Бидний тухай', component: 'AboutUs' },
    { path: `/user/metercounter`, label: 'Тоолуурын заалт', component: 'MeterCounter' },
    { path: `/user/payment-info`, label: 'Төлбөрийн мэдээлэл', component: 'PaymentInfo' },
    { path: `/user/payment/:id`, label: 'Төлбөрийн дэлгэрэнгүй', component: 'PaymentDetails' },
    { path: `/user/services`, label: 'Үйлчилгээ', component: 'Services' },
    { path: `/profile`, label: 'Профайл', component: 'Profile' },
    { path: `/settings`, label: 'Тохиргоо', component: 'Settings' },
    { path: `/news`, label: 'Мэдээ мэдээлэл', component: 'News' },
    { path: `/feedback`, label: 'Санал хүсэлт', component: 'Feedback' },
    { path: `/feedback/create`, label: 'Санал хүсэлт явуулах', component: 'FeedbackCreate' },
    { path: `/feedback/:id`, label: 'Санал дэлгэрэнгүй', component: 'FeedbackDetail' },
    { path: `/feedback/edit/:id`, label: 'Санал засварлах', component: 'FeedbackEdit' }
  ];

  const adminMenuItems = [
    { icon: HomeIcon, label: 'Нүүр хуудас', path: `/home` },
    { icon: ClipboardList, label: 'Хэрэглэгчийн хүснэгт', path: `/admin/user` },
    { icon: FileText, label: 'Тайлан', path: `/admin/report` },
    { icon: Newspaper, label: 'Мэдээ мэдээлэл', path: `/news` },
    { icon: Clock, label: 'Төлбөрийн тариф', path: `/admin/tarif` },
    { icon: MessageCircle, label: 'Санал хүсэлт', path: `/feedback` },
    { icon: HelpCircle, label: 'Үйлчилгээ', path: `/service` }
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
    setIsDropdownOpen(false);
  };

  const navigateToSettings = () => {
    navigate('/settings');
    setIsDropdownOpen(false);
  };
  
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };
  
  // Get first letter of username for the avatar
  const getFirstLetter = () => {
    if (user && user.Username) {
      return user.Username.charAt(0).toUpperCase();
    }
    return 'Ц';
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <div 
        className={`hidden md:flex flex-col ${isSidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-[#2D6B9F] shadow-sm fixed h-full transition-all duration-300 ease-in-out z-20`}
      >
        <div className="flex flex-col h-full p-4">  
          {/* Logo */}
          <div className="p-4 mb-6 flex items-center justify-center cursor-pointer" onClick={toggleSidebar}>
            {isSidebarOpen ? (
              <h2 className="text-xl font-bold text-[#2D6B9F] whitespace-nowrap">
                {isAdmin ? 'Админ' : 'Диплом'}
              </h2>
            ) : (
              <div className="flex items-center justify-center">
                <Droplet className="w-8 h-8 text-[#2D6B9F]" />
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
                      ? 'bg-blue-50 text-[#2D6B9F] font-medium' 
                      : 'hover:bg-blue-50/50 text-gray-600'
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
        className={`md:hidden fixed top-0 left-0 h-full bg-white border-r border-[#2D6B9F] shadow-sm transform transition-transform duration-300 ease-in-out z-40 ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } w-64`}
      >
        <div className="flex flex-col h-full p-4">
          <div className="p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center cursor-pointer" onClick={toggleMobileSidebar}>
              <Droplet className="w-6 h-6 text-[#2D6B9F] mr-2" />
              <h2 className="text-xl font-bold text-[#2D6B9F]">
                {isAdmin ? 'Админ' : 'Диплом'}
              </h2>
            </div>
            <button 
              onClick={toggleMobileSidebar}
              className="p-1 rounded-md hover:bg-blue-50/50 text-gray-600 transition-colors duration-200"
            >
              <X className="w-5 h-5 text-gray-600" />
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
                      ? 'bg-blue-50 text-[#2D6B9F] font-medium' 
                      : 'hover:bg-blue-50/50 text-gray-600'
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
            className="mt-auto p-3 rounded-lg hover:bg-blue-50/50 text-gray-600 flex items-center transition-all duration-200 ease-in-out"
          >
            <LogOut className="w-5 h-5 text-gray-600" />
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
        <header 
          className="h-16 flex items-center px-4 sticky top-0 z-10 transition-colors duration-300"
          style={{
            backgroundColor: `rgba(255, 255, 255, ${scrollOpacity})`,
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid #2D6B9F'
          }}
        >
          <div className="flex items-center justify-between w-full">
            {/* Mobile menu button */}
            <button 
              onClick={toggleMobileSidebar}
              className="md:hidden p-2 rounded-md text-gray-600 hover:bg-blue-50/50 transition-colors duration-200"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>

            {/* SearchBar */}
            <SearchBar routes={routes} isAdmin={isAdmin} />
            <div className="flex-1 md:hidden"></div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 rounded-full hover:bg-blue-50/50 transition-colors duration-200">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              {/* Profile Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={toggleDropdown}
                  className={`flex items-center justify-center w-10 h-10 rounded-full border border-[#2D6B9F] text-[#2D6B9F] ${
                    isDropdownOpen ? 'bg-blue-50' : 'bg-transparent'
                  } hover:bg-blue-50/50 hover:text-[#2D6B9F] transition-colors duration-200`}
                  aria-expanded={isDropdownOpen}
                  aria-haspopup="true"
                >
                  {getFirstLetter()}
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">{user?.Username || 'Хэрэглэгч'}</p>
                      <p className="text-sm text-gray-500 truncate">{user?.Email || 'email@example.com'}</p>
                    </div>
                    
                    <div className="py-1">
                      <button
                        onClick={navigateToProfile}
                        className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-blue-50/50 flex items-center"
                      >
                        <UserCircle className="w-4 h-4 mr-3 text-gray-600" />
                        Профайл
                      </button>
                      
                      <button
                        onClick={navigateToSettings}
                        className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-blue-50/50 flex items-center"
                      >
                        <Settings className="w-4 h-4 mr-3 text-gray-600" />
                        Тохиргоо
                      </button>
                      
                      <hr className="my-1 border-gray-200" />
                      
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-blue-50/50 flex items-center"
                      >
                        <LogOut className="w-4 h-4 mr-3 text-gray-600" />
                        Гарах
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-y-auto p-0 bg-white border-x-0 border-t-0 border-b-0 border-r border-[#2D6B9F]">
          {children}
        </main>
      </div>
    </div>
  );
};

export default SidebarLayout;