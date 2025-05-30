import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, MessageSquare, Heart, Mail, CheckCircle, AlertCircle, Info, CreditCard, Newspaper, DollarSign, Gift } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const getNotificationColor = (type) => {
  switch (type?.toLowerCase()) {
    case 'news': return 'text-indigo-600';
    case 'waterpayment': return 'text-[#2D6B9F]';
    case 'servicepayment': return 'text-green-600';
    case 'service': return 'text-orange-600';
    case 'general': return 'text-gray-600';
    default: return 'text-gray-600';
  }
};

const getNotificationIcon = (type) => {
  switch (type?.toLowerCase()) {
    case 'news': return Newspaper;
    case 'waterpayment': return CreditCard;
    case 'servicepayment': return DollarSign;
    case 'service': return Gift;
    case 'general': return Info;
    default: return Info;
  }
};

const Notification = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const navigate = useNavigate();

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userId = JSON.parse(localStorage.getItem('user'))?.UserId; 

  useEffect(() => {
    if (!userId) return;

    api.get(`/notifications/all?userId=${userId}`)
      .then(res => {
        const notifications = res.data.notifications
          ? res.data.notifications.map(n => ({
              ...n,
              icon: getNotificationIcon(n.type),
            }))
          : [];
        setNotifications(notifications.sort((a, b) => new Date(b.time) - new Date(a.time)));
      })
      .catch(() => {});
  }, [userId]);

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(notification =>
      notification.id === id ? { ...notification, read: true } : notification
    ));
    api.post('/notifications/mark-as-read', { notificationId: id }).catch(() => {});
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
    api.post('/notifications/mark-all-as-read', { userId }).catch(() => {});
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
    api.post('/notifications/remove', { notificationId: id }).catch(() => {});
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    if (
      notification.type === 'news' &&
      (notification.newsId || notification.NewsId)
    ) {
      navigate(`/news/${notification.newsId || notification.NewsId}`);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        className="relative flex items-center justify-center w-8 h-8 rounded-full text-[#2D6B9F] bg-transparent hover:bg-[#2D6B9F]/10 transition-colors duration-200"
        aria-label="Notifications"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50"
        >
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="font-semibold text-[#2D6B9F] text-base">Мэдэгдэл</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-[#2D6B9F] hover:text-[#2D6B9F]/80 font-medium"
              >
                Бүгдийг уншсан болгох
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                <Bell className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p>Мэдэгдэл байхгүй байна</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const IconComponent = notification.icon;
                return (
                  <div
                    key={notification.id}
                    className={`relative px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notification.read ? 'bg-[#2D6B9F]/10' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                            </p>
                            <p className={`text-xs mt-1 ${!notification.read ? 'text-gray-700' : 'text-gray-500'}`}>
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {notification.time}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2 ml-3">
                            {!notification.read && (
                              <div className="w-2 h-2 bg-[#2D6B9F] rounded-full"></div>
                            )}
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                removeNotification(notification.id);
                              }}
                              className="text-gray-400 hover:text-gray-600 p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {notifications.length > 0 && (
            <div className="px-4 py-2 bg-gray-50 rounded-b-xl text-center">
              <button
                onClick={() => setIsOpen(false)}
                className="text-xs text-gray-600 hover:text-gray-800 font-medium"
              >
                Бүх мэдэгдлийг харах
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Notification;