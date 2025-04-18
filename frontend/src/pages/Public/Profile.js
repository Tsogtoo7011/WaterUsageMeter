import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import api from "../../utils/api"; 
import VerificationReminder from "../../components/verificationReminder"; 

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
        {userData.AdminRight === 0 && (
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
        <div className="text-center text-gray-500">Нууцлалын тохиргоо хараахан бэлэн болоогүй байна.</div>
      )}
    </div>
  );
}

export default Profile;