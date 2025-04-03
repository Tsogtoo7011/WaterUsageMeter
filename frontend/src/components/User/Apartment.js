import React, { useState, useEffect } from "react";
import axios from "axios";

export function Apartment() {
  const [apartmentData, setApartmentData] = useState({
    ApartmentType: "",
    SerialNumber: "",
    City: "",
    District: "",
    SubDistrict: "",
    Street: "",
    Number: ""
  });
  const [userApartments, setUserApartments] = useState([]);

  useEffect(() => {
    const fetchUserApartments = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        
        const response = await axios.get("http://localhost:5000/api/user/Profile/Apartment", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserApartments(response.data);
      } catch (error) {
        console.error("Error fetching user apartments:", error);
      }
    };

    fetchUserApartments();
  }, []);

  const handleApartmentInputChange = (e) => {
    const { name, value } = e.target;
    setApartmentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApartmentSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/user/Profile/Apartment", 
        apartmentData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setUserApartments([...userApartments, response.data]);
      setApartmentData({
        ApartmentType: "",
        SerialNumber: "",
        City: "",
        District: "",
        SubDistrict: "",
        Street: "",
        Number: ""
      });
      alert("Байрны мэдээлэл амжилттай хадгалагдлаа");
    } catch (error) {
      console.error("Error saving apartment data:", error);
      alert("Байрны мэдээлэл хадгалах явцад алдаа гарлаа");
    }
  };

  return (
    <div>
      <form onSubmit={handleApartmentSubmit} className="grid grid-cols-2 gap-4 mb-8">           
        <div>
          <label className="block text-gray-600">Эзэмшил</label>
          <select
            name="ApartmentType"
            value={apartmentData.ApartmentType || ""}
            onChange={handleApartmentInputChange}
            className="w-full border p-2 rounded-md"
            required
          >
            <option value="">Сонгох</option>
            <option value="эзэмшигч">Эзэмшигч</option>
            <option value="түрээслэгч">Түрээслэгч</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-600">Сериал дугаар</label>
          <input 
            type="number" 
            name="SerialNumber"
            value={apartmentData.SerialNumber || ""} 
            onChange={handleApartmentInputChange}
            className="w-full border p-2 rounded-md" 
            required
          />
        </div>
        <div>
          <label className="block text-gray-600">Хот/Аймаг</label>
          <input 
            type="text" 
            name="City"
            value={apartmentData.City || ""} 
            onChange={handleApartmentInputChange}
            className="w-full border p-2 rounded-md" 
            required
          />
        </div>
        <div>
          <label className="block text-gray-600">Дүүрэг</label>
          <input 
            type="text" 
            name="District"
            value={apartmentData.District || ""} 
            onChange={handleApartmentInputChange}
            className="w-full border p-2 rounded-md" 
            required
          />
        </div>
        <div>
          <label className="block text-gray-600">Хороо</label>
          <input 
            type="text" 
            name="SubDistrict"
            value={apartmentData.SubDistrict || ""} 
            onChange={handleApartmentInputChange}
            className="w-full border p-2 rounded-md" 
            required
          />
        </div>
        <div>
          <label className="block text-gray-600">Гудамж/Байр</label>
          <input 
            type="text" 
            name="Street"
            value={apartmentData.Street || ""} 
            onChange={handleApartmentInputChange}
            className="w-full border p-2 rounded-md" 
            required
          />
        </div>
        <div>
          <label className="block text-gray-600">Дугаар</label>
          <input 
            type="number" 
            name="Number"
            value={apartmentData.Number || ""} 
            onChange={handleApartmentInputChange}
            className="w-full border p-2 rounded-md" 
            required
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

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Миний байрнууд</h3>
        {userApartments.length > 0 ? (
          <div className="space-y-4">
            {userApartments.map(apartment => (
              <div key={apartment.ApartmentId} className="border p-4 rounded-lg">
                <p><strong>Эзэмшил:</strong> {apartment.ApartmentType === 'эзэмшигч' ? 'Эзэмшигч' : 'Түрээслэгч'}</p>
                <p><strong>Сериал дугаар:</strong> {apartment.SerialNumber}</p>
                <p><strong>Хаяг:</strong> {apartment.City}, {apartment.District}, {apartment.SubDistrict}, {apartment.Street} {apartment.Number}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Байрны мэдээлэл олдсонгүй</p>
        )}
      </div>
    </div>
  );
}

export default Apartment;