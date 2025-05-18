import { useState, useEffect, useMemo, useRef } from 'react';
import api from "../../utils/api";
import Breadcrumb from '../../components/common/Breadcrumb';
import { ChevronLeft, ChevronRight, Search, FileText, History as HistoryIcon } from 'lucide-react';

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

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const tariffsPerPage = 3; 
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const calendarBtnRef = useRef(null);

  useEffect(() => {
    fetchTariffData();
    fetchTariffHistory();
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
        EffectiveFrom: new Date().toISOString().split('T')[0]
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

  const handleTariffInput = (e) => {
    const { name, value } = e.target;
    if (/^[0-9]*\.?[0-9]*$/.test(value)) {
      setEditedTariff({
        ...editedTariff,
        [name]: value
      });
    }
  };

  const handleDateChange = (e) => {
    setEditedTariff({
      ...editedTariff,
      EffectiveFrom: e.target.value
    });
    setShowDatePicker(false);
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

      if (showHistory) {
        await fetchTariffHistory(); 
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

  const handleCloseModal = () => {
    setIsEditing(false);
    setEditedTariff({
      ColdWaterTariff: tariff.ColdWaterTariff,
      HeatWaterTariff: tariff.HeatWaterTariff,
      DirtyWaterTariff: tariff.DirtyWaterTariff,
      EffectiveFrom: new Date().toISOString().split('T')[0]
    });
  };

  const formatCurrency = (value) => {
    return `${Number(value).toLocaleString('mn-MN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MNT`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Тодорхойгүй';

    return new Date(dateString).toLocaleDateString('mn-MN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const filteredTariffHistory = useMemo(() => {
    if (!searchQuery) return tariffHistory;
    return tariffHistory.filter(item =>
      [item.ColdWaterTariff, item.HeatWaterTariff, item.DirtyWaterTariff]
        .some(val => val?.toString().includes(searchQuery)) ||
      (item.EffectiveFrom && formatDate(item.EffectiveFrom).includes(searchQuery)) ||
      (item.EffectiveTo && formatDate(item.EffectiveTo).includes(searchQuery)) ||
      (item.IsActive ? 'Идэвхтэй' : 'Идэвхгүй').includes(searchQuery)
    );
  }, [tariffHistory, searchQuery, formatDate]);

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const sortedTariffHistory = useMemo(() => {
    let sortable = [...filteredTariffHistory];
    if (sortConfig.key) {
      sortable.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortable;
  }, [filteredTariffHistory, sortConfig]);

  const totalPages = Math.ceil(sortedTariffHistory.length / tariffsPerPage);
  const indexOfLast = currentPage * tariffsPerPage;
  const indexOfFirst = indexOfLast - tariffsPerPage;
  const currentTariffs = sortedTariffHistory.slice(indexOfFirst, indexOfLast);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const renderSortArrow = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="px-4 sm:px-8 py-6">
        {/* Header */}
        <div className="max-w-7xl mx-auto pt-4 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#2D6B9F]">Усны тарифын удирдлага</h1>
            <div className="px-4 pt-2 sm:px-0">
              <Breadcrumb />
            </div>
            <p className="text-gray-600 mt-2">Тарифын мэдээлэл болон түүхийн удирдлага</p>
          </div>
          <div className="flex items-center mt-4 md:mt-0 gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center px-3 py-1.5 border rounded text-sm font-medium hover:bg-blue-50/50"
              style={{ borderColor: "#2D6B9F", color: "#2D6B9F", minWidth: "110px", fontSize: "14px" }}
            >
              <span className="mr-1">+</span>
              Шинэ тариф
            </button>
          </div>
        </div>
        {/* Main Content */}
        <div className="w-full flex flex-col md:flex-row p-6 bg-white rounded-lg shadow-sm">
          {/* Left: current tariff meta */}
          <div className="md:flex-[3_3_0%] pr-4 pb-6">
            <h2 className="text-xl font-bold text-[#2D6B9F] mb-4">Одоогийн тарифын мэдээлэл</h2>
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-[#2D6B9F] mb-1">Хэрэгжиж эхэлсэн огноо</h3>
              <p className="text-gray-700">{formatDate(tariff.EffectiveFrom)}</p>
            </div>
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-[#2D6B9F] mb-1">Дуусах огноо</h3>
              <p className="text-gray-700">{tariff.EffectiveTo ? formatDate(tariff.EffectiveTo) : 'Тодорхойгүй'}</p>
            </div>
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-[#2D6B9F] mb-1">Төлөв</h3>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${tariff.IsActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {tariff.IsActive ? 'Идэвхтэй' : 'Идэвхгүй'}
              </span>
            </div>
          </div>
          <div className="hidden md:block w-px bg-gray-300 mx-1"></div>
          {/* Right: tabbed content with icon toggle */}
          <div className="md:flex-[7_7_0%] md:pl-4 flex flex-col h-full gap-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-[#2D6B9F]">
                {showHistory ? "Тарифын түүх" : "Тарифын мэдээлэл"}
              </h3>
              <button
                onClick={() => setShowHistory((prev) => !prev)}
                className="flex items-center justify-center rounded-full p-2 border border-gray-200 bg-gray-50 hover:bg-blue-100 transition"
                title={showHistory ? "Тарифын мэдээлэл" : "Тарифын түүх"}
              >
                {showHistory ? (
                  <FileText size={22} className="text-[#2D6B9F]" />
                ) : (
                  <HistoryIcon size={22} className="text-[#2D6B9F]" />
                )}
              </button>
            </div>
            {!showHistory ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between bg-blue-50 rounded px-4 py-3">
                  <span className="font-semibold text-blue-700">Хүйтэн ус : {formatCurrency(tariff.ColdWaterTariff)}</span>
                  <span className="text-gray-600 text-sm ml-4">м³ тутамд</span>
                </div>
                <div className="flex items-center justify-between bg-red-50 rounded px-4 py-3">
                  <span className="font-semibold text-red-700">Халуун ус : {formatCurrency(tariff.HeatWaterTariff)}</span>
                  <span className="text-gray-600 text-sm ml-4">м³ тутамд</span>
                </div>
                <div className="flex items-center justify-between bg-gray-50 rounded px-4 py-3">
                  <span className="font-semibold text-gray-700">Бохир ус : {formatCurrency(tariff.DirtyWaterTariff)}</span>
                  <span className="text-gray-600 text-sm ml-4">м³ тутамд</span>
                </div>
              </div>
            ) : (
              <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                {/* Responsive Table */}
                <div className="overflow-x-auto">
                  <div className="align-middle inline-block min-w-full shadow overflow-hidden rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          <th
                            className="px-4 py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider cursor-pointer select-none"
                            onClick={() => handleSort('TariffId')}
                          >
                            #
                            {renderSortArrow('TariffId')}
                          </th>
                          <th
                            className="px-4 py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider cursor-pointer select-none"
                            onClick={() => handleSort('ColdWaterTariff')}
                          >
                            Хүйтэн ус
                            {renderSortArrow('ColdWaterTariff')}
                          </th>
                          <th
                            className="px-4 py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider cursor-pointer select-none"
                            onClick={() => handleSort('HeatWaterTariff')}
                          >
                            Халуун ус
                            {renderSortArrow('HeatWaterTariff')}
                          </th>
                          <th
                            className="px-4 py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider cursor-pointer select-none"
                            onClick={() => handleSort('DirtyWaterTariff')}
                          >
                            Бохир ус
                            {renderSortArrow('DirtyWaterTariff')}
                          </th>
                          <th
                            className="px-4 py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider cursor-pointer select-none"
                            onClick={() => handleSort('EffectiveFrom')}
                          >
                            Эхэлсэн
                            {renderSortArrow('EffectiveFrom')}
                          </th>
                          <th
                            className="px-4 py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider cursor-pointer select-none"
                            onClick={() => handleSort('EffectiveTo')}
                          >
                            Дууссан
                            {renderSortArrow('EffectiveTo')}
                          </th>
                          <th
                            className="px-4 py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider cursor-pointer select-none"
                            onClick={() => handleSort('IsActive')}
                          >
                            Төлөв
                            {renderSortArrow('IsActive')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentTariffs.length > 0 ? currentTariffs.map((item) => (
                          <tr key={item.TariffId} className="hover:bg-blue-50 transition group">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-center text-gray-900">{item.TariffId}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-blue-500 text-center">{formatCurrency(item.ColdWaterTariff)}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-red-500 text-center">{formatCurrency(item.HeatWaterTariff)}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 text-center">{formatCurrency(item.DirtyWaterTariff)}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{formatDate(item.EffectiveFrom)}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{item.EffectiveTo ? formatDate(item.EffectiveTo) : 'Тодорхойгүй'}</td>
                            <td
                              className="px-4 py-4 whitespace-nowrap text-center cursor-pointer"
                              onClick={() => {
                                if (!item.IsActive) toggleTariffStatus(item.TariffId, 1);
                              }}
                              title={!item.IsActive ? "Идэвхжүүлэх" : ""}
                            >
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                item.IsActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800 hover:bg-green-200 hover:text-green-900'
                              }`}>
                                {item.IsActive ? 'Идэвхтэй' : 'Идэвхгүй'}
                              </span>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                              Түүх олдсонгүй
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination moved here, directly under the table */}
                  {totalPages > 1 && (
                    <div className="flex justify-center mt-4 mb-6 items-center space-x-2">
                      <button
                        onClick={() => paginate(Math.max(1, currentPage - 1))}
                        className={`w-8 h-8 flex items-center justify-center rounded-full border ${
                          currentPage === 1
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "border-[#2D6B9F] text-[#2D6B9F] hover:bg-blue-50"
                        } transition font-bold text-sm`}
                        title="Өмнөх"
                        disabled={currentPage === 1}
                      >
                        &lt;
                      </button>
                      {Array.from({ length: totalPages }, (_, index) => index + 1)
                        .map((page) => (
                          <button
                            key={page}
                            onClick={() => paginate(page)}
                            className={`w-8 h-8 flex items-center justify-center rounded-full text-sm ${
                              currentPage === page
                                ? "bg-[#2D6B9F] text-white"
                                : "border border-[#2D6B9F] text-[#2D6B9F] hover:bg-blue-50"
                            } transition`}
                          >
                            {page}
                          </button>
                        ))}
                      <button
                        onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                        className={`w-8 h-8 flex items-center justify-center rounded-full border ${
                          currentPage === totalPages
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "border-[#2D6B9F] text-[#2D6B9F] hover:bg-blue-50"
                        } transition font-bold text-sm`}
                        title="Дараах"
                        disabled={currentPage === totalPages}
                      >
                        &gt;
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Info Section */}
        <div className="mt-8 bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Тарифын тухай</h3>
          <p className="text-gray-700">
            Энэхүү тариф нь усны хэрэглээний нэгж үнийг харуулж байна. Шинэ тариф нэмэх үед өмнөх тариф
            автоматаар идэвхгүй болно. Тарифын түүхээс хуучин тарифуудыг харах болон дахин идэвхжүүлэх боломжтой.
          </p>
        </div>
      </div>
      {/* Modal for new tariff */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200 z-[110]">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-[#2D6B9F]">Шинэ тариф нэмэх</h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-[#2D6B9F]"
                >
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="ColdWaterTariff" className="block text-sm font-medium text-gray-700">
                      Хүйтэн усны тариф (₮)
                    </label>
                    <input
                      type="text"
                      id="ColdWaterTariff"
                      name="ColdWaterTariff"
                      value={editedTariff.ColdWaterTariff}
                      onChange={handleTariffInput}
                      inputMode="decimal"
                      pattern="[0-9]*\.?[0-9]*"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                      autoComplete="off"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="HeatWaterTariff" className="block text-sm font-medium text-gray-700">
                      Халуун усны тариф (₮)
                    </label>
                    <input
                      type="text"
                      id="HeatWaterTariff"
                      name="HeatWaterTariff"
                      value={editedTariff.HeatWaterTariff}
                      onChange={handleTariffInput}
                      inputMode="decimal"
                      pattern="[0-9]*\.?[0-9]*"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                      autoComplete="off"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="DirtyWaterTariff" className="block text-sm font-medium text-gray-700">
                      Бохир усны тариф (₮)
                    </label>
                    <input
                      type="text"
                      id="DirtyWaterTariff"
                      name="DirtyWaterTariff"
                      value={editedTariff.DirtyWaterTariff}
                      onChange={handleTariffInput}
                      inputMode="decimal"
                      pattern="[0-9]*\.?[0-9]*"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                      autoComplete="off"
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
                <div className="flex flex-col sm:flex-row justify-end mt-6 gap-2">
                  <button
                    type="submit"
                    className="flex items-center justify-center px-3 py-1.5 bg-[#2D6B9F]/90 border rounded text-sm font-medium hover:bg-[#2D6B9F]"
                    style={{ borderColor: "#2D6B9F", color: 'white', minWidth: "110px", fontSize: "14px" }}
                  >
                    Хадгалах
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex items-center justify-center px-3 py-1.5 border rounded text-sm font-medium hover:bg-blue-50/50"
                    style={{ borderColor: "#2D6B9F", color: "#2D6B9F", minWidth: "110px", fontSize: "14px" }}
                  >
                    Болих
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}