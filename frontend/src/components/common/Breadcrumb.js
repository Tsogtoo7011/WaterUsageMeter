import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Breadcrumb = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);
  
  const nameMap = {
    'home': 'Home',
    'profile': 'Profile',
    'admin': 'Admin',
    'user': 'User',
    'tarif': 'Tariff',
    'report': 'Reports',
    'metercounter': 'Meter Counter',
    'details': 'Details',
    'import': 'Import',
    'apartment': 'Apartment',
    'payment-info': 'Payment',
    'about-us': 'About Us',
    'feedback': 'Feedback',
    'create': 'Create',
    'edit': 'Edit',
    'news': 'News',
    'service': 'Services',
    'settings': 'Settings'
  };
  
  return (
    <nav className="bg-white px-4 py-2 rounded-md mb-4">
      <ol className="flex flex-wrap text-sm">
        <li className="flex items-center">
          <Link to="/home" className="text-[#2D6B9F] hover:text-[#2D6B9F]">
            Home
          </Link>
          {pathnames.length > 0 && (
            <svg
               className="w-4 h-4 mx-2 text-gray-400"
               fill="none"
               stroke="currentColor"
               viewBox="0 0 24 24"
               xmlns="http://www.w3.org/2000/svg"
            >
              <path
                 strokeLinecap="round"
                 strokeLinejoin="round"
                 strokeWidth="2"
                 d="M9 5l7 7-7 7"
              />
            </svg>
          )}
        </li>
        
        {pathnames.map((name, index) => {
          // For IDs in URLs (like /feedback/123), don't create a link
          if (name.match(/^\d+$/)) {
            return (
              <li key={index} className="flex items-center">
                <span className="text-gray-500">ID: {name}</span>
                {index < pathnames.length - 1 && (
                  <svg
                     className="w-4 h-4 mx-2 text-gray-400"
                     fill="none"
                     stroke="currentColor"
                     viewBox="0 0 24 24"
                     xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                       strokeLinecap="round"
                       strokeLinejoin="round"
                       strokeWidth="2"
                       d="M9 5l7 7-7 7"
                    />
                  </svg>
                )}
              </li>
            );
          } 

          const url = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          
          return (
            <li key={index} className="flex items-center">
              {isLast ? (
                <span className="text-gray-500">
                  {nameMap[name] || name.charAt(0).toUpperCase() + name.slice(1)}
                </span>
              ) : (
                <>
                  <Link to={url} className="text-[#2D6B9F] hover:text-[#2D6B9F]">
                    {nameMap[name] || name.charAt(0).toUpperCase() + name.slice(1)}
                  </Link>
                  <svg
                     className="w-4 h-4 mx-2 text-gray-400"
                     fill="none"
                     stroke="currentColor"
                     viewBox="0 0 24 24"
                     xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                       strokeLinecap="round"
                       strokeLinejoin="round"
                       strokeWidth="2"
                       d="M9 5l7 7-7 7"
                    />
                  </svg>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;