import { useState, useEffect } from 'react';
import api from "../../utils/api"; 
import Breadcrumb from '../../components/common/Breadcrumb'; 

export default function AdminTariff() {
  const [tariff, setTariff] = useState({
    TariffId: null,
    ColdWaterTariff: 0,
    HeatWaterTariff: 0,
    DirtyWaterTariff: 0,
    EffectiveFrom: '',
    EffectiveTo: null,
    IsActive: 1
  });
  W
  const [tariffHistory, setTariffHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  
  const [editedTariff, setEditedTariff] = useState({
    ColdWaterTariff: 0,
    HeatWaterTariff: 0,
    DirtyWaterTariff: 0,
    EffectiveFrom: new Date().toISOString().split('T')[0] 
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchTariffData();
  }, []);

  const fetchTariffData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tariff');
      
      const tariffData = response.data;
      
      setTariff(tariffData);
      setEditedTariff({
        ColdWaterTariff: tariffData.ColdWaterTariff,
        HeatWaterTariff: tariffData.HeatWaterTariff,
        DirtyWaterTariff: tariffData.DirtyWaterTariff,
        EffectiveFrom: new Date().toISOString().split('T')[0] // Default to today
      });
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Тарифын мэдээлэл авахад алдаа гарлаа';
      setError(errorMessage);
      console.error('Error fetching tariff data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTariffHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await api.get('/tariff/history');
      setTariffHistory(response.data);
      setShowHistory(true);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Тарифын түүхийг авахад алдаа гарлаа';
      setError(errorMessage);
      console.error('Error fetching tariff history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const toggleTariffStatus = async (tariffId, isActive) => {
    try {
      await api.post('/tariff/toggle-status', { tariffId, isActive });
      // Refresh both current tariff and history
      fetchTariffData();
      if (showHistory) {
        fetchTariffHistory();
      }
      setMessage(isActive ? 'Тариф идэвхжүүлэгдлээ' : 'Тариф идэвхгүй болголоо');
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Тарифын төлөв өөрчлөхөд алдаа гарлаа';
      setError(errorMessage);
      console.error('Error toggling tariff status:', err);
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setEditedTariff({
      ...editedTariff,
      [name]: name === 'EffectiveFrom' ? value : (value === '' ? '' : parseFloat(value))
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const submitData = {
      ColdWaterTariff: editedTariff.ColdWaterTariff === '' ? 0 : parseFloat(editedTariff.ColdWaterTariff),
      HeatWaterTariff: editedTariff.HeatWaterTariff === '' ? 0 : parseFloat(editedTariff.HeatWaterTariff),
      DirtyWaterTariff: editedTariff.DirtyWaterTariff === '' ? 0 : parseFloat(editedTariff.DirtyWaterTariff),
      EffectiveFrom: editedTariff.EffectiveFrom
    };
    
    try {
      const response = await api.put('/tariff', submitData);
      
      const data = response.data;
      
      setTariff(data.data || data);
      setMessage('Тариф амжилттай шинэчлэгдлээ');
      setIsEditing(false);
      
      // Refresh tariff history if it's being shown
      if (showHistory) {
        fetchTariffHistory();
      }
      
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

  const formatDate = (dateString) => {
    if (!dateString) return 'Тодорхойгүй';
    
    return new Date(dateString).toLocaleDateString('mn-MN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
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
      {/* Breadcrumb navigation */}
      <div className="max-w-7xl mx-auto px-4 pt-2 sm:px-0">
        <Breadcrumb />
      </div>
      
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
        <div className="px-6 py-4 bg-blue-500 text-white flex justify-between items-center">
          <h2 className="text-xl font-bold">Одоогийн тарифын мэдээлэл</h2>
          <div className="flex items-center">
            <span className={`px-2 py-1 rounded text-xs ${tariff.IsActive ? 'bg-green-500' : 'bg-gray-500'}`}>
              {tariff.IsActive ? 'Идэвхтэй' : 'Идэвхгүй'}
            </span>
          </div>
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-sm mb-1 text-yellow-700">Хэрэгжиж эхэлсэн огноо</h3>
                  <p className="text-lg font-medium">{formatDate(tariff.EffectiveFrom)}</p>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-sm mb-1 text-orange-700">Дуусах огноо</h3>
                  <p className="text-lg font-medium">{tariff.EffectiveTo ? formatDate(tariff.EffectiveTo) : 'Тодорхойгүй'}</p>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <button 
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded-lg transition duration-200 mr-3"
                >
                  Шинэ тариф нэмэх
                </button>
                
                <button 
                  onClick={() => showHistory ? setShowHistory(false) : fetchTariffHistory()}
                  className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-6 rounded-lg transition duration-200"
                >
                  {historyLoading ? 'Ачааллаж байна...' : (showHistory ? 'Түүх хаах' : 'Тарифын түүх')}
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
              
              <div className="space-y-2">
                <label htmlFor="EffectiveFrom" className="block text-sm font-medium text-gray-700">
                  Хэрэгжиж эхлэх огноо
                </label>
                <input
                  type="date"
                  id="EffectiveFrom"
                  name="EffectiveFrom"
                  value={editedTariff.EffectiveFrom}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div className="flex justify-center space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditedTariff({
                      ColdWaterTariff: tariff.ColdWaterTariff,
                      HeatWaterTariff: tariff.HeatWaterTariff,
                      DirtyWaterTariff: tariff.DirtyWaterTariff,
                      EffectiveFrom: new Date().toISOString().split('T')[0]
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
      
      {showHistory && (
        <div className="mt-8 bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-500 text-white">
            <h2 className="text-xl font-bold">Тарифын түүх</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Хүйтэн ус
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Халуун ус
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Бохир ус
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Эхэлсэн
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дууссан
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Төлөв
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Үйлдэл
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tariffHistory.map((item) => (
                  <tr key={item.TariffId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(item.ColdWaterTariff)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(item.HeatWaterTariff)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(item.DirtyWaterTariff)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(item.EffectiveFrom)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.EffectiveTo ? formatDate(item.EffectiveTo) : 'Тодорхойгүй'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.IsActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {item.IsActive ? 'Идэвхтэй' : 'Идэвхгүй'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {!item.IsActive ? (
                        <button
                          onClick={() => toggleTariffStatus(item.TariffId, 1)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Идэвхжүүлэх
                        </button>
                      ) : (
                        <button
                          disabled
                          className="text-gray-400 cursor-not-allowed"
                        >
                          Идэвхтэй
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <div className="mt-8 bg-blue-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Тарифын тухай</h3>
        <p className="text-gray-700">
          Энэхүү тариф нь усны хэрэглээний нэгж үнийг харуулж байна. Шинэ тариф нэмэх үед өмнөх тариф
          автоматаар идэвхгүй болно. Тарифын түүхээс хуучин тарифуудыг харах болон дахин идэвхжүүлэх боломжтой.
        </p>
      </div>
    </div>
  );
}