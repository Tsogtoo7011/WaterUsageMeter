import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import api from "../../utils/api"; 

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
  const [verificationStatus, setVerificationStatus] = useState(null);

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

  const requestEmailVerification = async () => {
    try {
      setVerificationStatus('pending');
      
      const response = await api.post("/auth/verify-email-request", {});
      
      setVerificationStatus('sent');
      alert(response.data.message || "Баталгаажуулах имэйл илгээгдлээ. Та имэйлээ шалгана уу.");
    } catch (error) {
      console.error("Error requesting email verification:", error);
      setVerificationStatus('error');
      alert(error.response?.data?.message || "Баталгаажуулах имэйл илгээхэд алдаа гарлаа.");
    }
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
        {userData.AdminRight === 0 && (
          <button 
            onClick={() => navigate('/user/Profile/Apartment')} 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            Орон сууц нэмэх
          </button>
        )}
      </div>

      {activeTab === "profile" && (
        <>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-600">Хэрэглэгчийн нэр</label>
              <input 
                type="text" 
                name="Username"
                value={userData.Username || ""} 
                disabled
                className="w-full border p-2 rounded-md bg-gray-100" 
              />
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

          {/* Email Verification Status Section */}
          {!userData.IsVerified && (
            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-300 rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Таны имэйл хаяг баталгаажаагүй байна</span>
                </div>
                
                <button 
                  onClick={requestEmailVerification}
                  disabled={verificationStatus === 'pending'}
                  className={`px-4 py-2 rounded-md text-white ${
                    verificationStatus === 'pending' ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {verificationStatus === 'pending' ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Илгээж байна...
                    </span>
                  ) : verificationStatus === 'sent' ? (
                    "Дахин илгээх"
                  ) : (
                    "Баталгаажуулах"
                  )}
                </button>
              </div>
              
              {verificationStatus === 'sent' && (
                <div className="mt-3 text-sm text-gray-600">
                  <p>Таны имэйл хаяг руу баталгаажуулах холбоос илгээгдлээ. Имэйлээ шалгаад, холбоос дээр дарна уу.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === "security" && (
        <div className="text-center text-gray-500">Нууцлалын тохиргоо хараахан бэлэн болоогүй байна.</div>
      )}
    </div>
  );
}

export default Profile;