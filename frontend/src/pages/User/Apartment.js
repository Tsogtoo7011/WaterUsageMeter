import React, { useState, useEffect } from "react";
import { FaHome, FaEdit, FaTrash, FaShare, FaPlus, FaSave, FaTimes, FaSearch, FaInfoCircle } from "react-icons/fa";
import VerificationReminder from '../../components/common/verificationReminder';
import api from "../../utils/api"; 

export function Apartment() {
  const [apartmentData, setApartmentData] = useState({
    ApartmentType: "",
    ApartmentCode: "",  
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
  const [error, setError] = useState(null);
  const [editingApartment, setEditingApartment] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [shareData, setShareData] = useState({
    apartmentId: null,
    email: "",
    apartmentType: "түрээслэгч"
  });
  const [isSharing, setIsSharing] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [notification, setNotification] = useState(null);

  const API_URL = "/user/Profile/Apartment"; // Updated URL without the base

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

  // Clear notification after 3 seconds
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
    setError(null);
    try {
      // Using the API service instead of direct axios call
      const response = await api.get(API_URL);
      setUserApartments(response.data);
    } catch (error) {
      console.error("Error fetching user apartments:", error);
      setError(error.response?.data?.message || "Байрны мэдээлэл авах явцад алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  const handleApartmentInputChange = (e) => {
    const { name, value } = e.target;
    setApartmentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleShareInputChange = (e) => {
    const { name, value } = e.target;
    setShareData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApartmentSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Using the API service with params
      const response = await api.get(`${API_URL}/search`, {
        params: apartmentData
      });
      setSearchResults(response.data);
      setIsSearching(true);
    } catch (error) {
      console.error("Error searching apartments:", error);
      setError(error.response?.data?.message || "Байрны хайлтын явцад алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectApartment = async (apartment) => {
    try {
      setLoading(true);
      // Using the API service for post request
      const response = await api.post(
        `${API_URL}/add-by-code`,
        {
          apartmentId: apartment.ApartmentId,
          apartmentCode: apartment.ApartmentCode,
          apartmentType: "түрээслэгч" 
        }
      );
      
      setUserApartments([...userApartments, response.data]);
      setIsSearching(false);
      setSearchResults([]);
      resetForm();
      showNotification("Байрны мэдээлэл амжилттай нэмэгдлээ", "success");
    } catch (error) {
      console.error("Error adding apartment:", error);
      setError(error.response?.data?.message || "Байрны мэдээлэл нэмэх явцад алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  const handleApartmentSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (editingApartment) {
        // Update existing apartment using API service
        const response = await api.put(
          `${API_URL}/${editingApartment.ApartmentId}`, 
          apartmentData
        );
        
        setUserApartments(userApartments.map(apt => 
          apt.ApartmentId === editingApartment.ApartmentId ? response.data : apt
        ));
        
        setEditingApartment(null);
        showNotification("Байрны мэдээлэл амжилттай шинэчлэгдлээ", "success");
      } else {
        // Create new apartment using API service
        const response = await api.post(
          API_URL, 
          apartmentData
        );
        
        setUserApartments([...userApartments, response.data]);
        showNotification("Байрны мэдээлэл амжилттай хадгалагдлаа", "success");
      }
      
      // Reset form and hide it
      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error("Error saving apartment data:", error);
      setError(error.response?.data?.message || "Байрны мэдээлэл хадгалах явцад алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  const handleShareSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Using the API service for sharing
      await api.post(
        `${API_URL}/share`, 
        shareData
      );
      
      setIsSharing(false);
      setShareData({
        apartmentId: null,
        email: "",
        apartmentType: "түрээслэгч"
      });
      
      showNotification("Байр амжилттай хуваалцлаа", "success");
    } catch (error) {
      console.error("Error sharing apartment:", error);
      setError(error.response?.data?.message || "Байр хуваалцах явцад алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  const handleEditApartment = (apartment) => {
    setEditingApartment(apartment);
    setApartmentData({
      ApartmentType: apartment.ApartmentType,
      ApartmentCode: apartment.ApartmentCode,
      City: apartment.City,
      District: apartment.District,
      SubDistrict: apartment.SubDistrict,
      AptName: apartment.AptName,
      BlckNmbr: apartment.BlckNmbr,
      UnitNmbr: apartment.UnitNmbr || ""
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteApartment = async (apartmentId) => {
    if (!window.confirm("Та энэ байрыг устгахдаа итгэлтэй байна уу?")) {
      return;
    }
    
    try {
      setLoading(true);
      // Using API service for delete request
      await api.delete(`${API_URL}/${apartmentId}`);
      
      setUserApartments(userApartments.filter(apt => apt.ApartmentId !== apartmentId));
      showNotification("Байрны мэдээлэл амжилттай устгагдлаа", "success");
    } catch (error) {
      console.error("Error deleting apartment:", error);
      setError(error.response?.data?.message || "Байрны мэдээлэл устгах явцад алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = (apartment) => {
    setShareData({
      ...shareData,
      apartmentId: apartment.ApartmentId
    });
    setIsSharing(true);
  };

  const resetForm = () => {
    setApartmentData({
      ApartmentType: "",
      ApartmentCode: "", 
      City: "",
      District: "",
      SubDistrict: "",
      AptName: "",     
      BlckNmbr: "",     
      UnitNmbr: ""      
    });
    setEditingApartment(null);
  };

  const cancelEdit = () => {
    resetForm();
    setShowForm(false);
    setIsSearching(false);
  };

  const showNotification = (message, type = "info") => {
    setNotification({ message, type });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <FaHome className="mr-3 text-blue-600" /> Миний байрны мэдээлэл
        </h1>
        <p className="text-gray-600 mt-2">Өөрийн эзэмшиж буй эсвэл түрээслэж буй байрны мэдээллийг удирдах</p>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`mb-6 rounded-lg p-4 ${
          notification.type === 'success' ? 'bg-green-100 border-l-4 border-green-500 text-green-700' :
          notification.type === 'error' ? 'bg-red-100 border-l-4 border-red-500 text-red-700' :
          'bg-blue-100 border-l-4 border-blue-500 text-blue-700'
        }`}>
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
        <div className="mb-6">
          <VerificationReminder user={user} onVerify={handleVerificationSuccess} />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Add New Apartment Button */}
      {!showForm && !isSearching && (
        <div className="mb-6">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md font-medium"
          >
            <FaPlus className="mr-2" /> Шинэ байр нэмэх
          </button>
        </div>
      )}

      {/* Apartment Form  */}
      {(showForm || isSearching) && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8 border border-gray-200">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center border-b pb-4">
            <FaHome className="mr-2 text-blue-600" />
            {editingApartment ? "Байрны мэдээлэл засварлах" : "Байр хайх"}
          </h2>

          <form onSubmit={editingApartment ? handleApartmentSubmit : handleApartmentSearch}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Эзэмшигч / Түрээслэгч</label>
                <select
                  name="ApartmentType"
                  value={apartmentData.ApartmentType || ""}
                  onChange={handleApartmentInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
                >
                  <option value="">Сонгох</option>
                  <option value="эзэмшигч">Эзэмшигч</option>
                  <option value="түрээслэгч">Түрээслэгч</option>
                </select>
              </div>              
              <div>
                <label className="block text-gray-700 font-medium mb-2">Хот</label>
                <select
                  name="City"
                  value={apartmentData.City || ""}
                  onChange={handleApartmentInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
                >
                  <option value="">Сонгох</option>
                  <option value="Улаанбаатар">Улаанбаатар</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">Дүүрэг</label>
                <select
                  name="District"
                  value={apartmentData.District || ""}
                  onChange={handleApartmentInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
                >
                  <option value="">Сонгох</option>
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
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">Хороо</label>
                <input
                  type="text"
                  name="SubDistrict"
                  value={apartmentData.SubDistrict || ""}
                  onChange={handleApartmentInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  placeholder="Хороо"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">Хороолол</label>
                <input
                  type="text"
                  name="AptName"
                  value={apartmentData.AptName || ""}
                  onChange={handleApartmentInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  placeholder="Хороолол эсвэл хотхоны нэр"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">Байр</label>
                <input
                  type="number"
                  name="BlckNmbr"
                  value={apartmentData.BlckNmbr || ""}
                  onChange={handleApartmentInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  placeholder="Байрны дугаар"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">Тоот</label>
                <input
                  type="text"
                  name="UnitNmbr" 
                  value={apartmentData.UnitNmbr || ""}
                  onChange={handleApartmentInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  placeholder="Тоот / Орц"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end gap-4 border-t pt-4">
              <button
                type="button"
                onClick={cancelEdit}
                className="flex items-center justify-center px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium order-2 sm:order-1"
              >
                <FaTimes className="mr-2" /> Цуцлах
              </button>
              
              {editingApartment ? (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm order-1 sm:order-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Шинэчилж байна...
                    </>
                  ) : (
                    <>
                      <FaSave className="mr-2" /> Шинэчлэх
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm order-1 sm:order-2"
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
                      <FaSearch className="mr-2" /> Хайх
                    </>
                  )}
                </button>
              )}
            </div>
          </form>

          {/* Search Results */}
          {isSearching && searchResults.length > 0 && (
            <div className="mt-8">
              <h3 className="font-bold text-lg mb-3 flex items-center">
                <FaInfoCircle className="mr-2 text-blue-500" /> Хайлтын үр дүн ({searchResults.length})
              </h3>
              <div className="overflow-x-auto bg-gray-50 rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Хот</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дүүрэг</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Хороо</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Хороолол</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Байр</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Тоот</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Үйлдэл</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {searchResults.map((apartment) => (
                      <tr key={apartment.ApartmentId} className="hover:bg-blue-50 transition">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{apartment.City}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{apartment.District}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden md:table-cell">{apartment.SubDistrict}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden lg:table-cell">{apartment.AptName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{apartment.BlckNmbr}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{apartment.UnitNmbr}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => handleSelectApartment(apartment)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition shadow-sm"
                          >
                            Сонгох
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

      {/* Share Apartment Modal */}
      {isSharing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md mx-4">
            <h3 className="text-xl font-bold mb-4 flex items-center text-gray-800 border-b pb-3">
              <FaShare className="mr-2 text-blue-600" /> Байр хуваалцах
            </h3>
            
            <form onSubmit={handleShareSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">И-мэйл</label>
                <input
                  type="email"
                  name="email"
                  value={shareData.email}
                  onChange={handleShareInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Хуваалцах хэрэглэгчийн имэйл хаяг"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Эрх</label>
                <select
                  name="apartmentType"
                  value={shareData.apartmentType}
                  onChange={handleShareInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="эзэмшигч">Эзэмшигч</option>
                  <option value="түрээслэгч">Түрээслэгч</option>
                </select>
              </div>
              
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setIsSharing(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                >
                  Цуцлах
                </button>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  Хуваалцах
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
  
      {/* User's Apartments List */}
      {!showForm && !isSearching && (
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
            <FaHome className="mr-2 text-blue-600" />
            Миний байрны жагсаалт
          </h2>
  
          {loading && !userApartments.length ? (
            <div className="flex justify-center items-center py-12">
              <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Төрөл</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Код</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Хаяг</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Үйлдэл</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {userApartments.map((apartment) => (
                    <tr key={apartment.ApartmentId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          apartment.ApartmentType === 'эзэмшигч' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {apartment.ApartmentType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {apartment.ApartmentCode}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {apartment.City}, {apartment.District}, {apartment.SubDistrict}
                        </div>
                        <div className="text-sm text-gray-500">
                          {apartment.AptName} {apartment.BlckNmbr && `байр ${apartment.BlckNmbr}`} 
                          {apartment.UnitNmbr && `, ${apartment.UnitNmbr}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditApartment(apartment)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                          title="Засах"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleShare(apartment)}
                          className="text-green-600 hover:text-green-900 mr-4"
                          title="Хуваалцах"
                        >
                          <FaShare />
                        </button>
                        <button
                          onClick={() => handleDeleteApartment(apartment.ApartmentId)}
                          className="text-red-600 hover:text-red-900"
                          title="Устгах"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Apartment;