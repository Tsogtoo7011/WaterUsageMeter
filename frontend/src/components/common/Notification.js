import React from 'react';
import { Bell } from 'lucide-react';

const Notification = ({ onClick }) => (
  <button
    type="button"
    className="flex items-center justify-center w-8 h-8 rounded-full text-[#2D6B9F] bg-transparent hover:bg-blue-50/50 transition-colors duration-200"
    aria-label="Notifications"
    onClick={onClick}
  >
    <Bell className="w-5 h-5" />
  </button>
);

export default Notification;
