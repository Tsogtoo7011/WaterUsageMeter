import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home as HomeIcon,
  UserCircle,
  Newspaper,
  Clock,
  CreditCard,
  MessageCircle,
  HelpCircle
} from 'lucide-react';

function SidebarLayout({ children }) {
  const [isSidebarOpen] = useState(true);
  const location = useLocation();

  const menuItems = [
    { icon: HomeIcon, label: 'Нүүр хуудас', path: '/' },
    { icon: UserCircle, label: 'Бидний тухай', path: '/about-us' },
    { icon: Newspaper, label: 'Мэдээ мэдээлэл', path: '/news' },
    { icon: Clock, label: 'Тоолуурын заалт', path: '/metercounter' },
    { icon: CreditCard, label: 'Төлбөрийн мэдээлэл', path: '/payment-info' },
    { icon: MessageCircle, label: 'Санал хүсэлт', path: '/feedback' },
    { icon: HelpCircle, label: 'Үйлчилгээ', path: '/services' }
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Fixed Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white shadow-lg fixed h-full`}>
        <div className="flex flex-col h-full p-4">
          {/* Logo/Brand */}
          <div className="p-4 mb-6">
            <h2 className="text-xl font-bold">Диплом</h2>
          </div>
          
          {/* Navigation Links */}
          <nav className="flex-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => 
                  `flex items-center p-3 mb-2 rounded-lg transition-colors ${
                    isActive ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-700'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                {isSidebarOpen && <span className="ml-3">{item.label}</span>}
              </NavLink>
            ))}
          </nav>

          {/* Logout Button */}
          <button className="mt-auto p-3 text-left rounded-lg hover:bg-gray-100 text-gray-700">
            <div className="flex items-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {isSidebarOpen && <span className="ml-3">Гарах</span>}
            </div>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 ml-64 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

export default SidebarLayout;