import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import api from "../../utils/api"; 
import VerificationReminder from "../../components/common/verificationReminder";
import Breadcrumb from '../../components/common/Breadcrumb';

export function Profile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [userData, setUserData] = useState({
    Username: "",
    Email: "",
    Firstname: "",
    Lastname: "",
    Phonenumber: "",
    AdminRight: 0,
    IsVerified: false
  });
  const [loading, setLoading] = useState(true);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUserData(prev => ({
            ...prev,
            ...parsedUser,
            AdminRight: parsedUser.AdminRight ?? prev.AdminRight,
            IsVerified: parsedUser.IsVerified ?? false
          }));
        }

        const response = await api.get("/user/profile");

        if (response.data) {
          setUserData(prev => ({
            ...prev,
            ...response.data,
            AdminRight: response.data.AdminRight ?? prev.AdminRight,
            IsVerified: response.data.IsVerified ?? false
          }));
          localStorage.setItem('user', JSON.stringify(response.data));
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        if (error.response && error.response.status === 401) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear previous messages when typing
    setPasswordError("");
    setPasswordSuccess("");
  };

  const togglePasswordVisibility = (field) => {
    switch (field) {
      case 'current':
        setShowCurrentPassword(!showCurrentPassword);
        break;
      case 'new':
        setShowNewPassword(!showNewPassword);
        break;
      case 'confirm':
        setShowConfirmPassword(!showConfirmPassword);
        break;
      default:
        break;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put("/user/profile", userData);
      
      if (response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
        alert("Хэрэглэгчийн мэдээлэл амжилттай хадгалагдлаа");
      }
    } catch (error) {
      console.error("Error updating user data:", error);
      alert("Хэрэглэгчийн мэдээлэл хадгалах явцад алдаа гарлаа");
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    // Client-side validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError("Бүх талбарыг бөглөнө үү");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("Шинэ нууц үг таарахгүй байна");
      return;
    }

    // Password strength validation
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/;
    if (!passwordRegex.test(passwordData.newPassword)) {
      setPasswordError("Нууц үг доод тал нь 8 тэмдэгт байх ба 1 онцгой тэмдэг, 1 тоо агуулсан байх ёстой");
      return;
    }

    try {
      const response = await api.post("/password/change", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      if (response.data) {
        setPasswordSuccess("Нууц үг амжилттай шинэчлэгдлээ");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
      }
    } catch (error) {
      console.error("Error updating password:", error);
      setPasswordError(error.response?.data?.message || "Нууц үг шинэчлэх явцад алдаа гарлаа");
    }
  };

  const handleVerifySuccess = () => {
    setUserData(prev => ({
      ...prev,
      IsVerified: true
    }));
    
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    localStorage.setItem('user', JSON.stringify({
      ...storedUser,
      IsVerified: true
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="px-4 sm:px-8 pt-4"> 
          <div className="max-w-7xl mx-auto pt-4"> {/* Increased top padding */}
            <h1 className="text-2xl font-bold mb-4 text-gray-600">Хэрэглэгчийн булан</h1>
            <Breadcrumb />
          </div>
          <div className="w-full max-w-4xl mx-auto mt-10 p-6 text-center">Ачааллаж байна...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="px-4 sm:px-8 pt-4"> 
        {/* Header section */}
        <div className="max-w-7xl mx-auto pt-4"> {/* Increased top padding */}
          <h1 className="text-2xl font-bold mb-4 text-[#2D6B9F]">Хэрэглэгчийн булан</h1>
          <Breadcrumb />
        </div>

        {/* Tabs navigation */}
        <div className="border-b mt-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex">
              <div className="flex">
                <button
                  className={`mr-4 pb-2 px-4 ${activeTab === "profile" ? "border-b-2" : "text-gray-600"}`}
                  style={{ color: activeTab === "profile" ? "#2D6B9F" : undefined, borderColor: activeTab === "profile" ? "#2D6B9F" : undefined }}
                  onClick={() => setActiveTab("profile")}
                >
                  <span className="flex items-center font-medium hover:text-[#2D6B9F]">
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="currentColor"/>
                      <path d="M12 14C7.58172 14 4 17.5817 4 22H20C20 17.5817 16.4183 14 12 14Z" fill="currentColor"/>
                    </svg>
                    Профайл
                  </span>
                </button>
                <button
                  className={`pb-2 px-4 ${activeTab === "security" ? "border-b-2" : "text-gray-600"}`}
                  style={{ color: activeTab === "security" ? "#2D6B9F" : undefined, borderColor: activeTab === "security" ? "#2D6B9F" : undefined }}
                  onClick={() => setActiveTab("security")}
                >
                  <span className="flex items-center font-medium hover:text-[#2D6B9F]">
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 11H5V21H19V11Z" fill="currentColor"/>
                      <path d="M17 11V7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7V11" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Нууцлал
                  </span>
                </button>
              </div>
            </div>
            {userData.AdminRight == 0 && (
              <div>
                <button
                  className={`pb-2 px-4 ${activeTab === "apartment" ? "border-b-2" : "text-gray-600"}`}
                  style={{ color: activeTab === "apartment" ? "#2D6B9F" : undefined, borderColor: activeTab === "apartment" ? "#2D6B9F" : undefined }}
                  onClick={() => {
                    setActiveTab("apartment");
                    navigate('/Profile/Apartment');
                  }}
                >
                  <span className="flex items-center font-medium hover:text-[#2D6B9F]">
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 10L12 3L21 10V21H3V10Z" fill="currentColor"/>
                    </svg>
                    Орон сууц
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto py-8">
          {!userData.IsVerified && <VerificationReminder user={userData} onVerify={handleVerifySuccess} />}

          {/* Profile tab content - centered with proper alignment */}
          {activeTab === "profile" && (
            <div className="flex justify-center">
              <div className="w-full max-w-4xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: "#2D6B9F" }}>Хэрэглэгчийн нэр</label>
                    <div className="relative">
                      <input
                        type="text"
                        name="Username"
                        value={userData.Username || ""}
                        disabled
                        className="w-full border border-gray-300 rounded-md p-2 bg-gray-50"
                      />
                      {userData.IsVerified && (
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center" style={{ color: "#2D6B9F" }}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Баталгаажсан
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: "#2D6B9F" }}>Овог</label>
                    <input
                      type="text"
                      name="Lastname"
                      value={userData.Lastname || ""}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: "#2D6B9F" }}>Нэр</label>
                    <input
                      type="text"
                      name="Firstname"
                      value={userData.Firstname || ""}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: "#2D6B9F" }}>Имэйл хаяг</label>
                    <input
                      type="email"
                      name="Email"
                      value={userData.Email || ""}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: "#2D6B9F" }}>Утасны дугаар</label>
                    <input
                      type="text"
                      name="Phonenumber"
                      value={userData.Phonenumber || ""}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md p-2"
                    />
                  </div>
                  <div className="md:col-span-2 flex justify-end mt-4">
                    <button
                      type="button"
                      onClick={handleSubmit}
                      className="text-white px-8 py-2 rounded-md hover:bg-blue-50/50"
                      style={{ backgroundColor: "#2D6B9F" }}
                    >
                      Хадгалах
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security tab content - centered */}
          {activeTab === "security" && (
            <div className="flex justify-center w-full">
              <div className="w-full max-w-md">
                <h2 className="text-xl font-semibold mb-4 text-center" style={{ color: "#2D6B9F" }}>Нууц үг шинэчлэх</h2>
                
                {passwordError && (
                  <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                    {passwordError}
                  </div>
                )}
                
                {passwordSuccess && (
                  <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
                    {passwordSuccess}
                  </div>
                )}
                
                <form onSubmit={handlePasswordSubmit}>
                  <div className="mb-4">
                    <label className="block text-sm mb-1" style={{ color: "#2D6B9F" }}>Одоогийн нууц үг</label>
                    <div className="relative">
                      <input 
                        type={showCurrentPassword ? "text" : "password"} 
                        name="currentPassword"
                        value={passwordData.currentPassword} 
                        onChange={handlePasswordInputChange}
                        className="w-full border p-2 rounded-md" 
                        required
                      />
                      <button 
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => togglePasswordVisibility('current')}
                      >
                        <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          {showCurrentPassword ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543-7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          )}
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm mb-1" style={{ color: "#2D6B9F" }}>Шинэ нууц үг</label>
                    <div className="relative">
                      <input 
                        type={showNewPassword ? "text" : "password"} 
                        name="newPassword"
                        value={passwordData.newPassword} 
                        onChange={handlePasswordInputChange}
                        className="w-full border p-2 rounded-md" 
                        required
                      />
                      <button 
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => togglePasswordVisibility('new')}
                      >
                        <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          {showNewPassword ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543-7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          )}
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Нууц үг доод тал нь 8 тэмдэгт байх ба 1 онцгой тэмдэг (!@#$%^&*), 1 тоо агуулсан байх ёстой
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm mb-1" style={{ color: "#2D6B9F" }}>Шинэ нууц үг баталгаажуулах</label>
                    <div className="relative">
                      <input 
                        type={showConfirmPassword ? "text" : "password"} 
                        name="confirmPassword"
                        value={passwordData.confirmPassword} 
                        onChange={handlePasswordInputChange}
                        className="w-full border p-2 rounded-md" 
                        required
                      />
                      <button 
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => togglePasswordVisibility('confirm')}
                      >
                        <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          {showConfirmPassword ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543-7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          )}
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex justify-center mt-6">
                    <button 
                      type="submit"
                      className="px-8 py-2 text-white rounded-md hover:bg-blue-50/50"
                      style={{ backgroundColor: "#2D6B9F" }}
                    >
                      Нууц үг шинэчлэх
                    </button>
                  </div>
                </form>       
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;