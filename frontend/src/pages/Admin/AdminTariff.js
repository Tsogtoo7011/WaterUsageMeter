import { useState, useEffect } from 'react';
import api from "../../utils/api"; 

export default function TariffManagement() {
  const [tariff, setTariff] = useState({
    TariffId: null,
    ColdWaterTariff: 0,
    HeatWaterTariff: 0,
    DirtyWaterTariff: 0
  });
  
  const [editedTariff, setEditedTariff] = useState({
    ColdWaterTariff: 0,
    HeatWaterTariff: 0,
    DirtyWaterTariff: 0
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchTariffData();
  }, []);

  const fetchTariffData = async () => {
    try {
      setLoading(true);
      // Use the api client
      const response = await api.get('/tariff');
      
      const tariffData = response.data;
      
      setTariff(tariffData);
      setEditedTariff({
        ColdWaterTariff: tariffData.ColdWaterTariff,
        HeatWaterTariff: tariffData.HeatWaterTariff,
        DirtyWaterTariff: tariffData.DirtyWaterTariff
      });
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Тарифын мэдээлэл авахад алдаа гарлаа';
      setError(errorMessage);
      console.error('Error fetching tariff data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setEditedTariff({
      ...editedTariff,
      [name]: value === '' ? '' : parseFloat(value)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const submitData = {
      ColdWaterTariff: editedTariff.ColdWaterTariff === '' ? 0 : parseFloat(editedTariff.ColdWaterTariff),
      HeatWaterTariff: editedTariff.HeatWaterTariff === '' ? 0 : parseFloat(editedTariff.HeatWaterTariff),
      DirtyWaterTariff: editedTariff.DirtyWaterTariff === '' ? 0 : parseFloat(editedTariff.DirtyWaterTariff)
    };
    
    try {
      const response = await api.put('/tariff', submitData);
      
      const data = response.data;
      
      setTariff(data.data || data);
      setMessage('Тариф амжилттай шинэчлэгдлээ');
      setIsEditing(false);
      
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Тарифын мэдээлэл шинэчлэхэд алдаа гарлаа';
      setError(errorMessage);
      console.error('Error updating tariff:', err);
      
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('mn-MN', {
      style: 'currency',
      currency: 'MNT',
      minimumFractionDigits: 2
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Усны тарифын удирдлага</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      
      {message && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <p>{message}</p>
        </div>
      )}
      
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-blue-500 text-white">
          <h2 className="text-xl font-bold">Одоогийн тарифын мэдээлэл</h2>
        </div>
        
        <div className="p-6">
          {!isEditing ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2 text-blue-700">Хүйтэн ус</h3>
                  <p className="text-2xl font-bold">{formatCurrency(tariff.ColdWaterTariff)}</p>
                  <p className="text-gray-600 text-sm">м³ тутамд</p>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2 text-red-700">Халуун ус</h3>
                  <p className="text-2xl font-bold">{formatCurrency(tariff.HeatWaterTariff)}</p>
                  <p className="text-gray-600 text-sm">м³ тутамд</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2 text-gray-700">Бохир ус</h3>
                  <p className="text-2xl font-bold">{formatCurrency(tariff.DirtyWaterTariff)}</p>
                  <p className="text-gray-600 text-sm">м³ тутамд</p>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <button 
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded-lg transition duration-200"
                >
                  Тариф шинэчлэх
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label htmlFor="ColdWaterTariff" className="block text-sm font-medium text-gray-700">
                    Хүйтэн усны тариф (₮)
                  </label>
                  <input
                    type="number"
                    id="ColdWaterTariff"
                    name="ColdWaterTariff"
                    value={editedTariff.ColdWaterTariff}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="HeatWaterTariff" className="block text-sm font-medium text-gray-700">
                    Халуун усны тариф (₮)
                  </label>
                  <input
                    type="number"
                    id="HeatWaterTariff"
                    name="HeatWaterTariff"
                    value={editedTariff.HeatWaterTariff}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="DirtyWaterTariff" className="block text-sm font-medium text-gray-700">
                    Бохир усны тариф (₮)
                  </label>
                  <input
                    type="number"
                    id="DirtyWaterTariff"
                    name="DirtyWaterTariff"
                    value={editedTariff.DirtyWaterTariff}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-center space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditedTariff({
                      ColdWaterTariff: tariff.ColdWaterTariff,
                      HeatWaterTariff: tariff.HeatWaterTariff,
                      DirtyWaterTariff: tariff.DirtyWaterTariff
                    });
                  }}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-6 rounded-lg transition duration-200"
                >
                  Цуцлах
                </button>
                
                <button
                  type="submit"
                  className="bg-green-500 hover:bg-green-600 text-white py-2 px-6 rounded-lg transition duration-200"
                >
                  Хадгалах
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      
      <div className="mt-8 bg-blue-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Тарифын тухай</h3>
        <p className="text-gray-700">
          Энэхүү тариф нь усны хэрэглээний нэгж үнийг харуулж байна. Тарифыг шинэчлэхийн тулд 
          системд нэвтэрсэн байх шаардлагатай.
        </p>
      </div>
    </div>
  );
}