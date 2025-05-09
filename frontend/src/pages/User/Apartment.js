import React, { useState, useEffect } from "react";
import { FaTrash, FaShare, FaPlus, FaTimes, FaSearch, FaInfoCircle, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import VerificationReminder from '../../components/common/verificationReminder';
import Breadcrumb from '../../components/common/Breadcrumb';
import api from "../../utils/api"; 

export function Apartment() {
  const [searchCriteria, setSearchCriteria] = useState({
    City: "",
    District: "",
    SubDistrict: "",
    AptName: "",        
    BlckNmbr: "",       
    UnitNmbr: ""        
  });
  const [userApartments, setUserApartments] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [notification, setNotification] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [apartmentSelection, setApartmentSelection] = useState({
    apartmentId: null,
    apartmentCode: "",
    apartmentType: "түрээслэгч",
  });
  const [isSelectingApartment, setIsSelectingApartment] = useState(false);
  const [apartmentSelectionError, setApartmentSelectionError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const [shareData, setShareData] = useState({
    apartmentId: null,
    email: "",
    apartmentType: "түрээслэгч",
    apartmentCode: "",
  });
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState(null);

  const [apartmentUsers, setApartmentUsers] = useState([]);
  const [isViewingUsers, setIsViewingUsers] = useState(false);
  const [selectedApartment, setSelectedApartment] = useState(null);
  const [currentUsersPage, setCurrentUsersPage] = useState(1);
  const usersPerPage = 5;

  const API_URL = "/user/Profile/Apartment"; 

  useEffect(() => {
    const fetchUserData = async () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    };

    fetchUserData();
    fetchUserApartments();
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleVerificationSuccess = () => {
    setUser(prev => ({
      ...prev,
      IsVerified: true
    }));
    fetchUserApartments();
  };

  const fetchUserApartments = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const response = await api.get(API_URL);
      setUserApartments(response.data);
    } catch (error) {
      console.error("Error fetching user apartments:", error);
      setApiError(error.response?.data?.message || "Байрны мэдээлэл авах явцад алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchCriteria(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApartmentSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setApiError(null);
    try {
      const response = await api.get(`${API_URL}/search`, {
        params: searchCriteria
      });
      setSearchResults(response.data);
      setIsSearching(true);
    } catch (err) {
      console.error("Error searching apartments:", err);
      setApiError(err.response?.data?.message || "Байрны хайлтын явцад алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectApartment = (apartment) => {
    setApartmentSelection({
      apartmentId: apartment.ApartmentId,
      apartmentCode: "",
      apartmentType: "түрээслэгч"
    });
    setIsSelectingApartment(true);
  };

  const handleApartmentSelectionSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setApartmentSelectionError(null); 

    try {
      const response = await api.post(`${API_URL}/add-by-code`, {
        apartmentId: apartmentSelection.apartmentId,
        apartmentCode: apartmentSelection.apartmentCode,
        apartmentType: apartmentSelection.apartmentType,
      });
      
      setUserApartments([...userApartments, response.data]);
      setIsSelectingApartment(false);
      setApartmentSelection({ apartmentId: null, apartmentCode: "", apartmentType: "түрээслэгч" });
      showNotification("Байр амжилттай сонгогдлоо", "success");
      
    } catch (err) {
      console.error("Error selecting apartment:", err);
      const errorMessage = err.response?.data?.message || 
                          (err.response?.data?.code === "INVALID_CODE" 
                            ? "Байрны код буруу байна. Зөв код оруулна уу." 
                            : "Байр сонгох явцад алдаа гарлаа");
      setApartmentSelectionError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteApartment = async (apartmentId) => {
    if (!window.confirm("Та энэ байрыг устгахдаа итгэлтэй байна уу?")) {
      return;
    }
    
    try {
      setLoading(true);
      await api.delete(`${API_URL}/${apartmentId}`);
      setUserApartments(userApartments.filter(apt => apt.ApartmentId !== apartmentId));
      showNotification("Байрны мэдээлэл амжилттай устгагдлаа", "success");
    } catch (err) {
      console.error("Error deleting apartment:", err);
      setApiError(err.response?.data?.message || "Байрны мэдээлэл устгах явцад алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  const fetchApartmentUsers = async (apartmentId) => {
    setLoading(true);
    setApiError(null);
    try {
      const response = await api.get(`${API_URL}/${apartmentId}/users`);
      setApartmentUsers(response.data);
      setSelectedApartment(apartmentId);
      setIsViewingUsers(true);
    } catch (err) {
      console.error("Error fetching apartment users:", err);
      setApiError(err.response?.data?.message || "Байрны хэрэглэгчдийн мэдээлэл авах явцад алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (userId) => {
    if (!window.confirm("Та энэ хэрэглэгчийг байраас хасахдаа итгэлтэй байна уу?")) {
      return;
    }

    setLoading(true);
    setApiError(null);
    try {
      await api.delete(`${API_URL}/${selectedApartment}/users/${userId}`);
      setApartmentUsers(apartmentUsers.filter(user => user.UserId !== userId));
      showNotification("Хэрэглэгч амжилттай хасагдлаа", "success");
    } catch (err) {
      console.error("Error removing user from apartment:", err);
      setApiError(err.response?.data?.message || "Хэрэглэгчийг байраас хасах явцад алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseUsersModal = () => {
    setIsViewingUsers(false);
    setApartmentUsers([]);
    setSelectedApartment(null);
  };

  const paginateUsers = (array, page, perPage) => {
    const startIndex = (page - 1) * perPage;
    return array.slice(startIndex, startIndex + perPage);
  };

  // Share functions
  const handleShare = (apartment) => {
    setShareData({
      apartmentId: apartment.ApartmentId,
      email: "",
      apartmentType: "түрээслэгч",
      apartmentCode: "",
    });
    setIsSharing(true);
  };

  const handleShareSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setShareError(null);
    setApiError(null);
    
    try {
      const response = await api.post(`${API_URL}/share`, shareData);
      setIsSharing(false);
      setShareData({
        apartmentId: null,
        email: "",
        apartmentType: "түрээслэгч",
        apartmentCode: "",
      });
      showNotification("Байр амжилттай хуваалцлаа", "success");
      
    } catch (err) {
      console.error("Error sharing apartment:", err);
      
      if (err.response?.data?.code === "INVALID_CODE") {
        setShareError("Байрны код буруу байна. Зөв код оруулна уу.");
      } else if (err.response?.data?.code === "USER_NOT_FOUND") {
        setShareError("Хэрэглэгч олдсонгүй. Имэйл хаягийг шалгана уу.");
      } else if (err.response?.data?.code === "ALREADY_SHARED") {
        setShareError("Энэ байр аль хэдийн энэ хэрэглэгчтэй хуваалцсан байна");
      } else {
        setApiError(err.response?.data?.message || "Байр хуваалцах явцад алдаа гарлаа");
      }
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = "info") => {
    setNotification({ message, type });
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleCloseModal = () => {
    setIsSelectingApartment(false);
    setIsSharing(false);
    setApartmentSelectionError(null);
    setShareError(null);
    setApiError(null);
  };

  const sortedApartments = [...userApartments].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aValue = a[sortConfig.key] || '';
    const bValue = b[sortConfig.key] || '';
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return sortConfig.direction === 'asc'
      ? aValue.toString().localeCompare(bValue.toString(), undefined, { numeric: true })
      : bValue.toString().localeCompare(aValue.toString(), undefined, { numeric: true });
  });

  const paginate = (array, page, perPage) => {
    const startIndex = (page - 1) * perPage;
    return array.slice(startIndex, startIndex + perPage);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="px-4 sm:px-8 pt-4">
        {/* Page Header */}
        <div className="max-w-7xl mx-auto pt-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#2D6B9F]">Миний байрны мэдээлэл</h1>
            <div className="px-4 pt-2 sm:px-0">
              <Breadcrumb />
            </div>
            <p className="text-gray-600 mt-2">Өөрийн эзэмшиж буй эсвэл түрээслэж буй байрны мэдээллийг удирдах</p>
          </div>
          <button
            onClick={() => setIsSearching(!isSearching)}
            className="flex items-center px-3 py-1.5 border rounded text-sm font-medium hover:bg-blue-50/50"
            style={{ borderColor: "#2D6B9F", color: "#2D6B9F", minWidth: "110px", fontSize: "14px" }} 
          >
            <FaPlus className="mr-1" size={15} />
            {isSearching ? "Байрны бүртгэл харах" : "Байр хайх"}
          </button>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`mb-6 rounded-lg p-4 ${
            notification.type === 'success' ? 'bg-green-100 border-l-4 border-green-500 text-green-700' :
            notification.type === 'error' ? 'bg-red-100 border-l-4 border-red-500 text-red-700' :
            'bg-blue-100 border-l-4 border-blue-500 text-blue-700'
          } max-w-7xl mx-auto`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {notification.type === 'success' ? (
                  <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{notification.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Verification Reminder */}
        {user && !user.IsVerified && (
          <div className="max-w-7xl mx-auto mb-6">
            <VerificationReminder user={user} onVerify={handleVerificationSuccess} />
          </div>
        )}

        {/* Error Message */}
        {apiError && !isSharing && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow max-w-7xl mx-auto">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{apiError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Search Form */}
        {isSearching && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8 border border-gray-200 max-w-7xl mx-auto mt-6">
            <h2 className="text-2xl font-bold mb-6 text-[#2D6B9F] border-b pb-4">
              Байр хайх
            </h2>

            <form onSubmit={handleApartmentSearch}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">            
                <div>
                  <label className="block text-[#2D6B9F] font-medium mb-2">Хот</label>
                  <div className="flex items-center">
                    <select
                      name="City"
                      value={searchCriteria.City}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
                    >
                      <option value="" disabled>Сонгох</option>
                      <option value="Улаанбаатар">Улаанбаатар</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setSearchCriteria(prev => ({ ...prev, City: "" }))}
                      className="ml-2 text-gray-500 hover:text-[#2D6B9F]"
                      title="Арилгах"
                    >
                      <FaTimes />
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-[#2D6B9F] font-medium mb-2">Дүүрэг</label>
                  <div className="flex items-center">
                    <select
                      name="District"
                      value={searchCriteria.District}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
                    >
                      <option value="" disabled>Сонгох</option>
                      <option value="Багануур">Багануур</option>
                      <option value="Багахангай">Багахангай</option>
                      <option value="Баянгол">Баянгол</option>
                      <option value="Баянзүрх">Баянзүрх</option>
                      <option value="Налайх">Налайх</option>
                      <option value="Сонгинохайрхан">Сонгинохайрхан</option>
                      <option value="Сүхбаатар">Сүхбаатар</option>
                      <option value="Хан-Уул">Хан-Уул</option>
                      <option value="Чингэлтэй">Чингэлтэй</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setSearchCriteria(prev => ({ ...prev, District: "" }))}
                      className="ml-2 text-gray-500 hover:text-[#2D6B9F]"
                      title="Арилгах"
                    >
                      <FaTimes />
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-[#2D6B9F] font-medium mb-2">Хороо</label>
                  <input
                    type="text"
                    name="SubDistrict"
                    value={searchCriteria.SubDistrict || ""}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    placeholder="Хороо"
                  />
                </div>
                
                <div>
                  <label className="block text-[#2D6B9F] font-medium mb-2">Хороолол</label>
                  <input
                    type="text"
                    name="AptName"
                    value={searchCriteria.AptName || ""}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    placeholder="Хороолол эсвэл хотхоны нэр"
                  />
                </div>
                
                <div>
                  <label className="block text-[#2D6B9F] font-medium mb-2">Байр</label>
                  <input
                    type="number"
                    name="BlckNmbr"
                    value={searchCriteria.BlckNmbr || ""}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    placeholder="Байрны дугаар"
                  />
                </div>
                
                <div>
                  <label className="block text-[#2D6B9F] font-medium mb-2">Тоот</label>
                  <input
                    type="text"
                    name="UnitNmbr" 
                    value={searchCriteria.UnitNmbr || ""}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    placeholder="Тоот / Орц"
                  />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-end gap-4 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setIsSearching(false)}
                  className="flex items-center justify-center px-4 py-1.5 border border-[#2D6B9F] text-[#2D6B9F] rounded hover:bg-blue-50 transition font-medium text-sm"
                  style={{ height: "34px", minWidth: "110px", fontSize: "14px" }} 
                >
                  <FaTimes className="mr-2" size={15} /> Цуцлах
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center px-5 py-1.5 bg-[#2D6B9F]/90 text-white rounded hover:bg-[#2D6B9F] transition font-medium shadow-sm order-1 sm:order-2 text-sm"
                  style={{ height: "34px", minWidth: "110px", fontSize: "14px" }} 
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Хайж байна...
                    </>
                  ) : (
                    <>
                      <FaSearch className="mr-2" size={15} /> Хайх
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Search Results */}
            {isSearching && searchResults.length > 0 && (
              <div className="mt-8">
                <h3 className="font-bold text-lg mb-3 flex items-center">
                  <FaInfoCircle className="mr-2 text-[#2D6B9F]" /> 
                  <span className="text-gray-600">Хайлтын үр дүн ({searchResults.length})</span>
                </h3>
                <div className="overflow-x-auto bg-gray-50 rounded-lg shadow">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider">
                          Хот
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider">
                          Дүүрэг
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider">
                          Хороо
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider">
                          Хороолол
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider">
                          Байр
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider">
                          Тоот
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider">
                          Үйлдэл
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginate(searchResults, currentPage, 10).map((apartment) => (
                        <tr key={apartment.ApartmentId} className="hover:bg-blue-50 transition">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">{apartment.City}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">{apartment.District}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center hidden md:table-cell">{apartment.SubDistrict}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center hidden lg:table-cell">{apartment.AptName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">{apartment.BlckNmbr}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">{apartment.UnitNmbr}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-center flex justify-center">
                            <button
                              onClick={() => handleSelectApartment(apartment)}
                              className="w-8 h-8 flex items-center justify-center rounded-full border border-[#2D6B9F] text-[#2D6B9F] hover:bg-[#2D6B9F] hover:text-white text-sm"
                              title="Сонгох"
                            >
                              <FaPlus size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination for search results */}
                <div className="flex justify-center mt-4 items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    className={`w-8 h-8 flex items-center justify-center rounded-full border ${
                      currentPage === 1
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "border-[#2D6B9F] text-[#2D6B9F] hover:bg-blue-50"
                    } transition font-bold text-sm`}
                    title="Өмнөх"
                    disabled={currentPage === 1}
                  >
                    <FaChevronLeft size={13} />
                  </button>
                  {Array.from({ length: Math.ceil(searchResults.length / 10) }, (_, index) => index + 1)
                    .filter((page) => {
                      const totalPages = Math.ceil(searchResults.length / 10);
                      return (
                        page <= 2 || 
                        page > totalPages - 2 || 
                        (page >= currentPage - 1 && page <= currentPage + 1) 
                      );
                    })
                    .map((page, index, pages) => (
                      <React.Fragment key={page}>
                        {index > 0 && page !== pages[index - 1] + 1 && (
                          <span className="text-gray-500">...</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 flex items-center justify-center rounded-full text-sm ${
                            currentPage === page
                              ? "bg-[#2D6B9F] text-white"
                              : "border border-[#2D6B9F] text-[#2D6B9F] hover:bg-blue-50"
                          } transition`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    ))}
                  <button
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    className={`w-8 h-8 flex items-center justify-center rounded-full border ${
                      currentPage * 10 >= searchResults.length
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "border-[#2D6B9F] text-[#2D6B9F] hover:bg-blue-50"
                    } transition font-bold text-sm`}
                    title="Дараах"
                    disabled={currentPage * 10 >= searchResults.length}
                  >
                    <FaChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}
            
            {isSearching && searchResults.length === 0 && !loading && (
              <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      Хайлтын илэрц олдсонгүй. Өөр параметрээр хайж үзнэ үү.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Apartment Selection Modal */}
        {isSelectingApartment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md mx-4">
              <h3 className="text-xl font-bold mb-4 flex items-center text-[#2D6B9F] border-b pb-3">
                <FaInfoCircle className="mr-2 text-[#2D6B9F]" /> Байр сонгох
              </h3>
              <form onSubmit={handleApartmentSelectionSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-600 font-medium mb-2">Байрны код</label>
                  <input
                    type="text"
                    name="apartmentCode"
                    value={apartmentSelection.apartmentCode}
                    onChange={(e) => setApartmentSelection({...apartmentSelection, apartmentCode: e.target.value})}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${
                      apartmentSelectionError ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
                    }`}
                    placeholder="Байрны код оруулна уу"
                    required
                  />
                  {apartmentSelectionError && (
                    <p className="text-red-500 text-sm mt-1">{apartmentSelectionError}</p>
                  )}
                </div>
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex items-center justify-center px-4 py-1.5 border border-[#2D6B9F] text-[#2D6B9F] rounded hover:bg-blue-50 transition font-medium text-sm"
                    style={{ height: "34px", minWidth: "110px", fontSize: "14px" }} 
                  >
                    Цуцлах
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-1.5 bg-[#2D6B9F]/90 text-white rounded hover:bg-[#2D6B9F] transition text-sm"
                    style={{ height: "34px", minWidth: "110px", fontSize: "14px" }}
                  >
                    Сонгох
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Share Modal */}
        {isSharing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md mx-4">
              <h3 className="text-xl font-bold mb-4 flex items-center text-[#2D6B9F] border-b pb-3">
                <FaShare className="mr-2 text-[#2D6B9F]" /> Байр хуваалцах
              </h3>
              <form onSubmit={handleShareSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-600 font-medium mb-2">Имэйл хаяг</label>
                  <input
                    type="email"
                    name="email"
                    value={shareData.email}
                    onChange={(e) => setShareData({ ...shareData, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Хуваалцах хэрэглэгчийн имэйл"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-600 font-medium mb-2">Байрны код</label>
                  <input
                    type="text"
                    name="apartmentCode"
                    value={shareData.apartmentCode || ""}
                    onChange={(e) => setShareData({ ...shareData, apartmentCode: e.target.value })}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${
                      shareError ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
                    }`}
                    placeholder="Байрны код оруулна уу"
                    required
                  />
                  {shareError && (
                    <p className="text-red-500 text-sm mt-1">{shareError}</p>
                  )}
                </div>
                <div className="mb-4">
                  <label className="block text-gray-600 font-medium mb-2">Төрөл</label>
                  <select
                    name="apartmentType"
                    value={shareData.apartmentType}
                    onChange={(e) => setShareData({ ...shareData, apartmentType: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="эзэмшигч">Эзэмшигч</option>
                    <option value="түрээслэгч">Түрээслэгч</option>
                  </select>
                </div>
                {apiError && (
                  <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
                    <p className="text-sm">{apiError}</p>
                  </div>
                )}
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex items-center justify-center px-4 py-1.5 border border-[#2D6B9F] text-[#2D6B9F] rounded hover:bg-blue-50 transition font-medium text-sm"
                    style={{ height: "34px", minWidth: "110px", fontSize: "14px" }}
                  >
                    Цуцлах
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center px-5 py-1.5 bg-[#2D6B9F]/90 text-white rounded hover:bg-[#2D6B9F] transition text-sm"
                    style={{ height: "34px", minWidth: "110px", fontSize: "14px" }}
                  >
                    <FaShare className="mr-2" size={15} /> Хуваалцах
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Apartment Users Modal */}
        {isViewingUsers && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-4xl mx-4"> {/* Increased max width */}
              <h3 className="text-xl font-bold mb-4 flex items-center text-[#2D6B9F] border-b pb-3">
                <FaInfoCircle className="mr-2 text-[#2D6B9F]" /> Байрны хэрэглэгчид
              </h3>
              {apartmentUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
  <thead className="bg-gray-50">
    <tr>
      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
        Хэрэглэгчийн нэр
      </th>
      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
        Имэйл
      </th>
      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
        Төрөл
      </th>
      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
        Үйлдэл
      </th>
    </tr>
  </thead>
  <tbody className="bg-white divide-y divide-gray-200">
    {paginateUsers(apartmentUsers, currentUsersPage, usersPerPage).map((user) => (
      <tr key={user.UserId}>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">{user.Username}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">{user.Email}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
          {user.UserType === 'эзэмшигч' ? 'Эзэмшигч' : 'Түрээслэгч'}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-center">
          <div className="flex justify-center w-full">
                        <button
                        onClick={() => handleRemoveUser(user.UserId)}
                        className="text-red-600 hover:text-red-900 w-8 h-8 flex items-center justify-center text-sm"
                      >
                        <FaTrash className="w-4 h-4" />
                     </button>
                   </div>
                  </td>
                </tr>
                 ))}
                </tbody>
               </table>
                  {/* Pagination Controls */}
                  <div className="flex justify-center mt-4 items-center space-x-2">
                    <button
                      onClick={() => setCurrentUsersPage((prev) => Math.max(prev - 1, 1))}
                      className={`w-8 h-8 flex items-center justify-center rounded-full border ${
                        currentUsersPage === 1
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : "border-[#2D6B9F] text-[#2D6B9F] hover:bg-blue-50"
                      } transition font-bold text-sm`}
                      title="Өмнөх"
                      disabled={currentUsersPage === 1}
                    >
                      <FaChevronLeft size={13} />
                    </button>
                    {Array.from({ length: Math.ceil(apartmentUsers.length / usersPerPage) }, (_, index) => index + 1).map(
                      (page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentUsersPage(page)}
                          className={`w-8 h-8 flex items-center justify-center rounded-full text-sm ${
                            currentUsersPage === page
                              ? "bg-[#2D6B9F] text-white"
                              : "border border-[#2D6B9F] text-[#2D6B9F] hover:bg-blue-50"
                          } transition`}
                        >
                          {page}
                        </button>
                      )
                    )}
                    <button
                      onClick={() => setCurrentUsersPage((prev) => prev + 1)}
                      className={`w-8 h-8 flex items-center justify-center rounded-full border ${
                        currentUsersPage * usersPerPage >= apartmentUsers.length
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : "border-[#2D6B9F] text-[#2D6B9F] hover:bg-blue-50"
                      } transition font-bold text-sm`}
                      title="Дараах"
                      disabled={currentUsersPage * usersPerPage >= apartmentUsers.length}
                    >
                      <FaChevronRight size={13} />
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">Хэрэглэгчид олдсонгүй.</p>
              )}
              <div className="flex justify-end gap-4 mt-4">
                <button
                  type="button"
                  onClick={handleCloseUsersModal}
                  className="flex items-center justify-center px-4 py-1.5 border border-[#2D6B9F] text-[#2D6B9F] rounded hover:bg-blue-50 transition font-medium text-sm"
                  style={{ height: "34px", minWidth: "110px", fontSize: "14px" }}
                >
                  Хаах
                </button>
              </div>
            </div>
          </div>
        )}
    
        {/* User's Apartments List */}
        {!isSearching && (
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200 max-w-7xl mx-auto mt-6">
            <h2 className="text-2xl font-bold mb-6 text-[#2D6B9F]">Байрны бүртгэл</h2>
    
            {loading && !userApartments.length ? (
              <div className="flex justify-center items-center py-12">
                <svg className="animate-spin h-8 w-8 text-[#2D6B9F]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : userApartments.length === 0 ? (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      Та одоогоор ямар ч байр бүртгээгүй байна. Шинэ байр нэмэх бол "Шинэ байр нэмэх" товчийг дарна уу.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        onClick={() => handleSort('ApartmentType')}
                        className="px-6 py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider cursor-pointer"
                      >
                        Төрөл {sortConfig.key === 'ApartmentType' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                      </th>
                      <th
                        onClick={() => handleSort('ApartmentCode')}
                        className="px-6 py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider cursor-pointer"
                      >
                        Код {sortConfig.key === 'ApartmentCode' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                      </th>
                      <th
                        onClick={() => handleSort('City')}
                        className="px-6 py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider cursor-pointer"
                      >
                        Хаяг {sortConfig.key === 'City' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider">
                        Үйлдэл
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginate(sortedApartments, currentPage, itemsPerPage).map((apartment) => (
                      <tr key={apartment.ApartmentId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`px-2 inline-flex text-xs text-center leading-5 font-semibold rounded-full ${
                            apartment.ApartmentType === 'эзэмшигч' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {apartment.ApartmentType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-600">
                          {apartment.ApartmentCode}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="text-sm text-gray-600">
                            {apartment.City}, {apartment.District}, {apartment.SubDistrict}
                          </div>
                          <div className="text-sm text-gray-500">
                            {apartment.AptName} {apartment.BlckNmbr && `байр ${apartment.BlckNmbr}`} 
                            {apartment.UnitNmbr && `, ${apartment.UnitNmbr}`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium flex items-center justify-center space-x-4">
                          {apartment.ApartmentType === 'эзэмшигч' && (
                            <>
                              <button
                                onClick={() => handleShare(apartment)}
                                className="text-green-600 hover:text-green-900 w-8 h-8 flex items-center justify-center text-sm"
                                title="Хуваалцах"
                              >
                                <FaShare size={15} />
                              </button>
                              <button
                                onClick={() => fetchApartmentUsers(apartment.ApartmentId)}
                                className="text-blue-600 hover:text-blue-900 w-8 h-8 flex items-center justify-center text-sm"
                                title="Хэрэглэгчид"
                              >
                                <FaInfoCircle size={15} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeleteApartment(apartment.ApartmentId)}
                            className="text-red-600 hover:text-red-900 w-8 h-8 flex items-center justify-center text-sm"
                            title="Устгах"
                          >
                            <FaTrash size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Pagination for user's apartments */}
                <div className="flex justify-center mt-4 items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    className={`w-8 h-8 flex items-center justify-center rounded-full border ${
                      currentPage === 1
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "border-[#2D6B9F] text-[#2D6B9F] hover:bg-blue-50"
                    } transition font-bold text-sm`}
                    title="Өмнөх"
                    disabled={currentPage === 1}
                  >
                    <FaChevronLeft size={13} />
                  </button>
                  {Array.from({ length: Math.ceil(userApartments.length / itemsPerPage) }, (_, index) => index + 1)
                    .filter((page) => {
                      const totalPages = Math.ceil(userApartments.length / itemsPerPage);
                      return (
                        page <= 2 || // Always show the first two pages
                        page > totalPages - 2 || // Always show the last two pages
                        (page >= currentPage - 1 && page <= currentPage + 1) // Pages around the current page
                      );
                    })
                    .map((page, index, pages) => (
                      <React.Fragment key={page}>
                        {index > 0 && page !== pages[index - 1] + 1 && (
                          <span className="text-gray-500">...</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 flex items-center justify-center rounded-full text-sm ${
                            currentPage === page
                              ? "bg-[#2D6B9F] text-white"
                              : "border border-[#2D6B9F] text-[#2D6B9F] hover:bg-blue-50"
                          } transition`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    ))}
                  <button
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    className={`w-8 h-8 flex items-center justify-center rounded-full border ${
                      currentPage * itemsPerPage >= userApartments.length
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "border-[#2D6B9F] text-[#2D6B9F] hover:bg-blue-50"
                    } transition font-bold text-sm`}
                    title="Дараах"
                    disabled={currentPage * itemsPerPage >= userApartments.length}
                  >
                    <FaChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Apartment;