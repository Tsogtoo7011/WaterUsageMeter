import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  X, 
  ArrowRight, 
  Clock, 
  UserCircle, 
  Newspaper, 
  CreditCard, 
  MessageCircle, 
  HelpCircle, 
  Home, 
  Settings, 
  FileText, 
  ClipboardList, 
  Building, 
  Droplet,
  Info
} from 'lucide-react';

const SearchBar = ({ routes, isAdmin }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Get icon component based on the path
  const getIconForRoute = (path) => {
    if (path.includes('home')) return Home;
    if (path.includes('profile')) return UserCircle;
    if (path.includes('news')) return Newspaper;
    if (path.includes('payment')) return CreditCard;
    if (path.includes('feedback')) return MessageCircle;
    if (path.includes('service')) return HelpCircle;
    if (path.includes('settings')) return Settings;
    if (path.includes('report')) return FileText;
    if (path.includes('user') && path.includes('admin')) return ClipboardList;
    if (path.includes('tarif')) return CreditCard;
    if (path.includes('apartment')) return Building;
    if (path.includes('metercounter')) return Droplet;
    if (path.includes('about-us')) return Info;
    // Default fallback icon
    return FileText;
  };

  useEffect(() => {
    // Load recent searches from localStorage
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches).slice(0, 5));
    }
  }, []);

  useEffect(() => {
    // Perform search when query changes
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }

    const filteredRoutes = routes.filter(route => 
      route.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      route.component.toLowerCase().includes(searchQuery.toLowerCase()) ||
      route.path.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setSearchResults(filteredRoutes);
    setSelectedIndex(-1);
  }, [searchQuery, routes]);

  useEffect(() => {
    // Handle click outside to close search
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchFocused(false);
        if (searchQuery.trim() === '') {
          setShowSearch(false);
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchQuery]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < searchResults.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      navigateToRoute(searchResults[selectedIndex].path);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsSearchFocused(false);
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  const saveToRecentSearches = (query, path) => {
    if (!query.trim()) return;
    
    const newSearch = { query, path, timestamp: Date.now() };
    const updatedSearches = [
      newSearch,
      ...recentSearches.filter(item => item.query !== query)
    ].slice(0, 5);
    
    setRecentSearches(updatedSearches);
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const navigateToRoute = (path) => {
    saveToRecentSearches(searchQuery, path);
    navigate(path);
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchFocused(false);
    setShowSearch(false);
  };

  const toggleSearch = () => {
    setShowSearch(prev => !prev);
    setIsSearchFocused(true);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  // Mobile search display
  const renderMobileSearch = () => {
    if (!showSearch) {
      return (
        <button 
          onClick={toggleSearch}
          className="md:hidden p-2 rounded-md text-gray-500 hover:bg-blue-50/50 transition-colors duration-200"
        >
          <Search className="w-5 h-5" />
        </button>
      );
    }

    return (
      <div className="fixed inset-0 bg-white z-50 p-4">
        <div className="flex items-center mb-4">
          <button 
            onClick={() => {
              setShowSearch(false);
              setSearchQuery('');
            }}
            className="p-2 mr-2"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              placeholder="Хайх..."
              style={{ color: '#2D6B9F' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className={`w-full p-2 pl-10 rounded-lg focus:outline-none focus:ring-2 ${
                searchQuery ? 'ring-2 ring-[#2D6B9F]' : ''
              }`}
              autoFocus
            />
            <Search className="absolute left-3 top-3 w-4 h-4" style={{ color: '#2D6B9F' }} />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>
        
        {renderSearchResults()}
        
        {!searchQuery && recentSearches.length > 0 && renderRecentSearches()}
      </div>
    );
  };

  // Desktop search display
  const renderDesktopSearch = () => (
    <div ref={searchRef} className="hidden md:block relative max-w-md w-full mx-4">
      <div className="relative">
        <Search className="w-5 h-5 absolute left-3 top-2.5" style={{ color: '#2D6B9F' }} />
        <input 
          ref={inputRef}
          type="text" 
          placeholder="Хайх..." 
          style={{ color: '#2D6B9F' }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          onKeyDown={handleKeyDown}
          className={`pl-10 pr-10 py-2 w-full rounded-lg focus:outline-none focus:ring-2 ${
            searchQuery ? 'ring-2 ring-[#2D6B9F]' : ''
          }`}
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-2.5"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>
      
      {isSearchFocused && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
          {searchResults.length > 0 ? renderSearchResults() : (
            (!searchQuery && recentSearches.length > 0) ? renderRecentSearches() :
            <div className="p-4 text-gray-500 text-center">
              {searchQuery ? 'Хайлтын илэрц олдсонгүй' : 'Хайх хэсэгт бичнэ үү'}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderSearchResults = () => (
    <div className="divide-y divide-gray-100">
      {searchResults.map((route, index) => {
        const IconComponent = getIconForRoute(route.path);
        return (
          <div 
            key={route.path}
            onClick={() => navigateToRoute(route.path)}
            className={`p-3 hover:bg-blue-50/50 cursor-pointer transition-colors ${
              index === selectedIndex ? 'bg-blue-50' : ''
            }`}
          >
            <div className="flex items-center">
              <div className="mr-3 text-gray-400">
                <IconComponent className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-800">{route.label}</div>
                <div className="text-sm text-gray-500">{route.path}</div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderRecentSearches = () => (
    <div>
      <div className="flex items-center justify-between p-3 bg-gray-50">
        <div className="text-sm font-medium text-gray-500">Сүүлийн хайлтууд</div>
        {recentSearches.length > 0 && (
          <button 
            onClick={clearRecentSearches}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Цэвэрлэх
          </button>
        )}
      </div>
      <div className="divide-y divide-gray-100">
        {recentSearches.map((item, index) => {
          const IconComponent = getIconForRoute(item.path);
          return (
            <div 
              key={index}
              onClick={() => navigateToRoute(item.path)}
              className="p-3 hover:bg-blue-50/50 cursor-pointer transition-colors flex items-center"
            >
              <Clock className="w-4 h-4 text-gray-400 mr-3" />
              <div className="flex-1">
                <div className="font-medium text-gray-800">{item.query}</div>
                <div className="text-sm text-gray-500">{item.path}</div>
              </div>
              <div className="ml-3 text-gray-400">
                <IconComponent className="w-4 h-4" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      {renderMobileSearch()}
      {renderDesktopSearch()}
    </>
  );
};

export default SearchBar;