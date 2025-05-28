import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Breadcrumb = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const pathnames = location.pathname.split('/').filter(x => x);

  const nameMap = {
    'home': 'Home',
    'profile': 'Profile',
    'admin': 'Admin Panel',
    'user': 'User Dashboard',
    'tarif': 'Tariff Management',
    'report': 'Reports',
    'metercounter': 'Meter Counter',
    'details': 'Details',
    'import': 'Import',
    'apartment': 'Apartment',
    'payment-info': 'Payment',
    'payment': 'Payment',
    'about-us': 'About Us',
    'feedback': 'Feedback',
    'edit': 'Edit',
    'news': 'News',
    'service': 'Services',
    'settings': 'Settings'
  };

  const getDisplayName = (segment, idx) => {
    if (segment.match(/^\d+$/)) {
      const prev = pathnames[idx - 1];
      if (prev === 'payment') return 'Payment Details';
      if (
        prev === 'details' ||
        prev === 'news' ||
        prev === 'feedback' ||
        prev === 'services'
      ) return 'Details';
      return null;
    }
    return nameMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  const getBreadcrumbUrl = (index) => {
    const segments = pathnames.slice(0, index + 1);
    return `/${segments.join('/')}`;
  };

  const handleBreadcrumbClick = (url, e) => {
    e.preventDefault();
    navigate(url);
  };

  return (
    <nav className="bg-white px-4 py-2 rounded-md mb-4">
      <ol className="flex flex-wrap text-sm">
        <li className="flex items-center">
          <Link 
            to="/home" 
            className="text-[#2D6B9F] hover:text-[#2D6B9F] font-medium"
            onClick={(e) => handleBreadcrumbClick("/home", e)}
          >
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
        
        {pathnames.filter(name => name !== 'home').map((name, index) => {
          const url = getBreadcrumbUrl(index);
          const realIdx = location.pathname.split('/').filter(x => x).indexOf(name);
          const isLast = index === pathnames.filter(n => n !== 'home').length - 1;
          const displayName = getDisplayName(name, realIdx);

          if (displayName === null) return null;
          if ((name === 'admin' || name === 'user') && pathnames.length > 1) {
            return null;
          }
          const isPayment = name === 'payment-info' || (name === 'payment' && displayName === 'Payment');
          const paymentUrl = '/user/payment-info';

          return (
            <li key={index} className="flex items-center">
              {isLast ? (
                <span className="text-gray-500 font-medium">{displayName}</span>
              ) : (
                <>
                  <Link 
                    to={isPayment ? paymentUrl : url}
                    className="text-[#2D6B9F] hover:text-[#2D6B9F] font-medium"
                    onClick={(e) => handleBreadcrumbClick(isPayment ? paymentUrl : url, e)}
                  >
                    {displayName}
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