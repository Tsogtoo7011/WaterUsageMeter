import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import api from "../../utils/api"; 
import VerificationReminder from "../../components/common/verificationReminder"; 

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
      setPasswordError("Нууц үг доод тал нь 6 тэмдэгт байх ба 1 онцгой тэмдэг, 1 тоо агуулсан байх ёстой");
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
    return <div className="w-full max-w-4xl mx-auto mt-10 p-6 text-center">Ачааллаж байна...</div>;
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <div className="flex border-b pb-2 text-center">
          <button
            className={`mr-4 pb-2 text-lg font-semibold ${activeTab === "profile" ? "border-b-2 border-black" : "text-gray-500"}`}
            onClick={() => setActiveTab("profile")}
          >
            👤 Профайл
          </button>
          <button
            className={`pb-2 text-lg font-semibold ${activeTab === "security" ? "border-b-2 border-black" : "text-gray-500"}`}
            onClick={() => setActiveTab("security")}
          >
            🔑 Нууцлал
          </button>
        </div>
        {userData.AdminRight == 0 && (
          <button 
            onClick={() => navigate('/user/Profile/Apartment')} 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            Орон сууц нэмэх
          </button>
        )}
      </div> 
      
      {!userData.IsVerified && <VerificationReminder user={userData} onVerify={handleVerifySuccess} />}

      {activeTab === "profile" && (
        <>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-600">Хэрэглэгчийн нэр</label>
              <div className="relative">
                <input 
                  type="text" 
                  name="Username"
                  value={userData.Username || ""} 
                  disabled
                  className="w-full border p-2 rounded-md bg-gray-100" 
                />
                {userData.IsVerified && (
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-600 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Баталгаажсан
                  </span>
                )}
              </div>
            </div>
            <div>
              <label className="block text-gray-600">Овог</label>
              <input 
                type="text" 
                name="Lastname"
                value={userData.Lastname || ""} 
                onChange={handleInputChange}
                className="w-full border p-2 rounded-md" 
              />
            </div>
            <div>
              <label className="block text-gray-600">Нэр</label>
              <input 
                type="text" 
                name="Firstname"
                value={userData.Firstname || ""} 
                onChange={handleInputChange}
                className="w-full border p-2 rounded-md" 
              />
            </div>
            <div>
              <label className="block text-gray-600">Имэйл хаяг</label>
              <input 
                type="email" 
                name="Email"
                value={userData.Email || ""} 
                onChange={handleInputChange}
                className="w-full border p-2 rounded-md" 
              />
            </div>
            <div>
              <label className="block text-gray-600">Утасны дугаар</label>
              <input 
                type="text" 
                name="Phonenumber"
                value={userData.Phonenumber || ""} 
                onChange={handleInputChange}
                className="w-full border p-2 rounded-md" 
              />
            </div>
            <div className="col-span-2 flex justify-end">
              <button 
                type="submit"
                className="px-6 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700"
              >
                Хадгалах
              </button>
            </div>
          </form>
        </>
      )}

      {activeTab === "security" && (
        <div className="max-w-md mx-auto">
          <h2 className="text-xl font-semibold mb-4">Нууц үг шинэчлэх</h2>
          
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
              <label className="block text-gray-600 mb-1">Одоогийн нууц үг</label>
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    )}
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-600 mb-1">Шинэ нууц үг</label>
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    )}
                  </svg>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Нууц үг доод тал нь 6 тэмдэгт байх ба 1 онцгой тэмдэг (!@#$%^&*), 1 тоо агуулсан байх ёстой
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-600 mb-1">Шинэ нууц үг баталгаажуулах</label>
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    )}
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button 
                type="submit"
                className="px-6 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700"
              >
                Нууц үг шинэчлэх
              </button>
            </div>
          </form>       
        </div>
      )}
    </div>
  );
}

export default Profile;