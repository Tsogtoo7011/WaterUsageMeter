import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home as HomeIcon,
  UserCircle,
  Newspaper,
  Clock,
  CreditCard,
  MessageCircle,
  HelpCircle,
  LogOut
} from 'lucide-react';

const SidebarLayout = ({ children }) => {
  const [isSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const menuItems = [
    { icon: HomeIcon, label: 'Нүүр хуудас', path: '/' },
    { icon: UserCircle, label: 'Бидний тухай', path: '/about-us' },
    { icon: Newspaper, label: 'Мэдээ мэдээлэл', path: '/news' },
    { icon: Clock, label: 'Тоолуурын заалт', path: '/metercounter' },
    { icon: CreditCard, label: 'Төлбөрийн мэдээлэл', path: '/payment-info' },
    { icon: MessageCircle, label: 'Санал хүсэлт', path: '/feedback' },
    { icon: HelpCircle, label: 'Үйлчилгээ', path: '/services' }
  ];

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    navigate('/signin');
    
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Fixed Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white shadow-lg fixed h-full transition-all duration-300`}>
        <div className="flex flex-col h-full p-4">
          {/* Logo*/}
          <div className="p-4 mb-6 flex items-center">
            <h2 className="text-xl font-bold text-blue-600">Диплом</h2>
          </div>
          
          {/* Navigation Links */}
          <nav className="flex-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => 
                  `flex items-center p-3 mb-2 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-blue-100 text-blue-600 font-medium' 
                      : 'hover:bg-gray-100 text-gray-700'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                {isSidebarOpen && <span className="ml-3">{item.label}</span>}
              </NavLink>
            ))}
          </nav>

          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            className="mt-auto p-3 rounded-lg hover:bg-gray-100 text-gray-700 flex items-center transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && <span className="ml-3">Гарах</span>}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 ${isSidebarOpen ? 'ml-64' : 'ml-20'} overflow-y-auto transition-all duration-300`}>
        {children}
      </div>
    </div>
  );
};

export default SidebarLayout;