import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; 

export function Profile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [userData, setUserData] = useState({
    Username: "",
    Email: "",
    Firstname: "",
    Lastname: "",
    Phonenumber: ""
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found");
        }

        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUserData(JSON.parse(storedUser));
        }

        const response = await axios.get("http://localhost:5000/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setUserData(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

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
      const token = localStorage.getItem("token");
      await axios.put(
        "http://localhost:5000/api/user/profile", 
        userData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      localStorage.setItem('user', JSON.stringify(userData));
      alert("Хэрэглэгчийн мэдээлэл амжилттай хадгалагдлаа");
    } catch (error) {
      console.error("Error updating user data:", error);
      alert("Хэрэглэгчийн мэдээлэл хадгалах явцад алдаа гарлаа");
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
        <button 
          onClick={() => navigate('/user/Profile/Apartment')} 
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
        >
          Орон сууц солих
        </button>
      </div>

      {activeTab === "profile" && (
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
      )}

      {activeTab === "security" && (
        <div className="text-center text-gray-500">Нууцлалын тохиргоо хараахан бэлэн болоогүй байна.</div>
      )}
    </div>
  );
}

export default Profile;