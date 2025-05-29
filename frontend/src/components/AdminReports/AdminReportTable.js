import React, { useState, useEffect } from 'react';
import { Eye, X, Trash2, Pencil } from 'lucide-react'; 
import api from '../../utils/api';

export default function AdminReportTable({
  activeTab,
  reportData,
  getTabLabel,
  currentPage,
  setCurrentPage,
  rowsPerPage,
  setSelectedItem,
  downloadExcel,
  selectedItem 
}) {
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);

  const [apartmentUsers, setApartmentUsers] = useState([]);
  const [isViewingUsers, setIsViewingUsers] = useState(false);
  const [selectedApartment, setSelectedApartment] = useState(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);
  const [addUserEmail, setAddUserEmail] = useState('');
  const [addUserType, setAddUserType] = useState('түрээслэгч');
  const [addUserError, setAddUserError] = useState(null);

  const columnsConfig = {
    payments: [
      { key: 'PaymentId', label: 'ID' },
      { key: 'PaymentType', label: 'Төрөл' },
      { key: 'ApartmentCode', label: 'Орон сууцны код' },
      { key: 'Amount', label: 'Дүн' },
      { key: 'Status', label: 'Төлөв' },
      { key: 'PayDate', label: 'Огноо' }
    ],
    waterMeters: [
      { key: 'WaterMeterId', label: 'ID' },
      { key: 'ApartmentCode', label: 'Орон сууцны код' },
      { key: 'WaterType', label: 'Төрөл' },
      { key: 'Indication', label: 'Уншилт' },
      { key: 'WaterMeterDate', label: 'Огноо' }
    ],
    waterConsumption: [
      { key: 'ApartmentCode', label: 'Орон сууцны код' },
      { key: 'TypeName', label: 'Төрөл' },
      { key: 'Location', label: 'Байршил' },
      { key: 'Consumption', label: 'Хэрэглээ' },
      { key: 'FirstReading', label: 'Эхний заалт' },
      { key: 'LastReading', label: 'Сүүлийн заалт' }
    ],
    services: [
      { key: 'ServiceId', label: 'ID' },
      { key: 'ApartmentCode', label: 'Орон сууцны код' },
      { key: 'Description', label: 'Тайлбар' },
      { key: 'ServiceAmount', label: 'Дүн' }, 
      { key: 'Status', label: 'Төлөв' },
      { key: 'RequestDate', label: 'Огноо' }
    ],
    feedback: [
      { key: 'ApplicationId', label: 'ID' },
      { key: 'UserName', label: 'Хэрэглэгч' },
      { key: 'Type', label: 'Төрөл' },
      { key: 'Status', label: 'Төлөв' },
      { key: 'CreatedAt', label: 'Огноо' }
    ],
    users: [
      { key: 'UserId', label: 'ID' },
      { key: 'Firstname', label: 'Овог' },
      { key: 'Lastname', label: 'Нэр' },
      { key: 'Email', label: 'Имэйл' },
      { key: 'Phonenumber', label: 'Утас' },
      { key: 'IsVerified', label: 'Баталгаажсан' },
      { key: 'AdminRight', label: 'Админ' },
      { key: 'ApartmentCount', label: 'Орон сууцны тоо' }
    ],
    apartments: [
      { key: 'ApartmentId', label: 'ID' },
      { key: 'ApartmentCode', label: 'Код' },
      { key: 'CityName', label: 'Хот' },
      { key: 'DistrictName', label: 'Дүүрэг' },
      { key: 'ApartmentName', label: 'Хороолол' },
      { key: 'BlockNumber', label: 'Байр' },
      { key: 'UnitNumber', label: 'Тоот' },
      { key: 'UserCount', label: 'Хэрэглэгчийн тоо' }
    ]
  };

  const columns = columnsConfig[activeTab] ||
    (reportData.length > 0
      ? Object.keys(reportData[0]).slice(0, 5).map(key => ({ key, label: key }))
      : []);

  const filteredData = reportData.filter(item =>
    columns.some(col => {
      const value = item[col.key];
      return value !== undefined && value !== null && String(value).toLowerCase().includes(search.toLowerCase());
    })
  );

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) return 0;
    let aValue = a[sortConfig.key] ?? '';
    let bValue = b[sortConfig.key] ?? '';
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const totalRows = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage)); 
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const paginatedData = sortedData.slice(
    (safeCurrentPage - 1) * rowsPerPage,
    safeCurrentPage * rowsPerPage
  );

  const renderSortArrow = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
  };

  const handleSort = (key) => {
    setSortConfig(prev =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    );
  };

  const handleRowClick = (item) => {
    setSelectedItem(item);
  };

  // Handler for opening delete modal
  const handleDeleteClick = (item, type) => {
    setDeleteModal({ type, item });
    setDeleteError(null);
  };

  // Handler for confirming delete
  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      if (deleteModal.type === 'payment') {
        await api.delete('/AdminReport/payment-amount', {
          data: {
            paymentType: deleteModal.item.PaymentType === 'Усны төлбөр' ? 'water' : 'service',
            paymentId: deleteModal.item.PaymentId
          }
        });
      } else if (deleteModal.type === 'waterMeter') {
        await api.delete('/AdminReport/water-meter-indication', {
          data: {
            waterMeterId: deleteModal.item.WaterMeterId
          }
        });
      }
      setDeleteModal(null);
      window.location.reload();
    } catch (err) {
      setDeleteError('Устгах үед алдаа гарлаа');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handler for edit click
  const handleEditClick = (item, type) => {
    if (type === 'payments') {
      setEditModal({ type: 'payment', item });
      setEditValue(item.Amount ?? '');
    } else if (type === 'waterMeters') {
      setEditModal({ type: 'waterMeter', item });
      setEditValue(item.Indication ?? '');
    } else if (type === 'services') {
      setEditModal({ type: 'service', item });
      setEditValue(item.ServiceAmount ?? '');
    }
    setEditError(null);
  };

  // Handler for confirming edit
  const handleEditConfirm = async () => {
    setEditLoading(true);
    setEditError(null);
    try {
      if (editModal.type === 'payment') {
        await api.put('/AdminReport/payment-amount', {
          paymentType: editModal.item.PaymentType === 'Усны төлбөр' ? 'water' : 'service',
          paymentId: editModal.item.PaymentId,
          amount: editValue
        });
      } else if (editModal.type === 'waterMeter') {
        await api.put('/AdminReport/water-meter-indication', {
          waterMeterId: editModal.item.WaterMeterId,
          indication: editValue
        });
      } else if (editModal.type === 'service') {
        await api.put('/AdminReport/payment-amount', {
          paymentType: 'service',
          paymentId: editModal.item.ServiceId,
          amount: editValue
        });
      }
      setEditModal(null);
      window.location.reload();
    } catch (err) {
      setEditError('Засах үед алдаа гарлаа');
    } finally {
      setEditLoading(false);
    }
  };

  // --- Fetch users for an apartment ---
  const fetchApartmentUsers = async (apartmentId) => {
    setUsersLoading(true);
    setUsersError(null);
    setSelectedApartment(apartmentId);
    try {
      const res = await api.get(`/AdminReport/apartment/${apartmentId}/users`);
      setApartmentUsers(res.data);
      setIsViewingUsers(true);
    } catch (err) {
      setUsersError('Хэрэглэгчдийн мэдээлэл авахад алдаа гарлаа');
    } finally {
      setUsersLoading(false);
    }
  };

  // --- Remove user from apartment ---
  const handleRemoveUser = async (userId) => {
    if (!window.confirm('Та энэ хэрэглэгчийг устгахдаа итгэлтэй байна уу?')) return;
    setUsersLoading(true);
    setUsersError(null);
    try {
      await api.delete(`/AdminReport/apartment/${selectedApartment}/users/${userId}`);
      setApartmentUsers(apartmentUsers.filter(u => u.UserId !== userId));
    } catch (err) {
      setUsersError('Устгах үед алдаа гарлаа');
    } finally {
      setUsersLoading(false);
    }
  };

  // --- Add user to apartment ---
  const handleAddUser = async (e) => {
    e.preventDefault();
    setUsersLoading(true);
    setAddUserError(null);
    try {
      await api.post(`/AdminReport/apartment/${selectedApartment}/users`, {
        email: addUserEmail,
        userType: addUserType
      });
      // Refresh user list
      await fetchApartmentUsers(selectedApartment);
      setAddUserEmail('');
      setAddUserType('түрээслэгч');
    } catch (err) {
      setAddUserError('Нэмэх үед алдаа гарлаа');
    } finally {
      setUsersLoading(false);
    }
  };

  // --- Close users modal ---
  const handleCloseUsersModal = () => {
    setIsViewingUsers(false);
    setApartmentUsers([]);
    setSelectedApartment(null);
    setAddUserEmail('');
    setAddUserType('түрээслэгч');
    setAddUserError(null);
    setUsersError(null);
  };

  if (!reportData || reportData.length === 0 || !Array.isArray(reportData)) {
    return (
      <div className="bg-white rounded-lg p-6 text-center">
        <p className="text-gray-500">Энэ тайланд мэдээлэл олдсонгүй.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <span className="text-lg font-bold text-[#2D6B9F] mb-2 md:mb-0">
          {getTabLabel ? getTabLabel(activeTab) : ''}
        </span>
        <button
          onClick={downloadExcel}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#2D6B9F]/90 hover:bg-[#2D6B9F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full md:w-auto"
        >
          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M16 16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1-2 2v2" />
            <polyline points="15 10 20 15 15 20" />
            <line x1="20" y1="15" x2="9" y2="15" />
          </svg>
          Excel татах
        </button>
      </div>
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
        <div className="relative flex-grow w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Хайх..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2D6B9F] text-sm"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="align-middle inline-block min-w-full overflow-hidden rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((col, idx) => (
                  <th
                    key={col.key}
                    className="px-4 py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider cursor-pointer select-none"
                    onClick={() => handleSort(col.key)}
                  >
                    {col.label}{renderSortArrow(col.key)}
                  </th>
                ))}
                {(activeTab !== 'waterConsumption' && activeTab !== 'users' && activeTab !== 'feedback') && (
                  <th className="px-4 py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider sticky right-0 bg-gray-50 z-10">
                    Үйлдэл
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.length > 0 ? paginatedData.map((item, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="hover:bg-blue-50 transition group cursor-pointer"
                  onClick={() => handleRowClick(item)}
                >
                  {columns.map((col, colIndex) => {
                    let displayValue = '-';
                    const value = item[col.key];
                    if (value !== undefined && value !== null) {
                      if (typeof value === 'boolean') {
                        displayValue = value ? 'Тийм' : 'Үгүй';
                      } else if (col.key.toLowerCase().includes('date') && typeof value === 'string') {
                        try {
                          const date = new Date(value);
                          displayValue = date.toLocaleDateString('mn-MN');
                        } catch (e) {
                          displayValue = value;
                        }
                      } else if (
                        (col.key === 'amount' || col.key === 'ServiceAmount') &&
                        typeof value === 'number'
                      ) {
                        displayValue = '₮' + value.toLocaleString();
                      } else {
                        displayValue = String(value);
                      }
                    }
                    return (
                      <td
                        key={`${rowIndex}-${colIndex}`}
                        className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-center align-middle"
                      >
                        <div className="max-w-[200px] truncate mx-auto">{displayValue}</div>
                      </td>
                    );
                  })}
                  {(activeTab !== 'waterConsumption' && activeTab !== 'users' && activeTab !== 'feedback') && (
                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium sticky right-0 bg-white z-10 border-l border-gray-100 group-hover:bg-blue-50 transition align-middle">
                      <div className="flex justify-center items-center space-x-2">
                        {/* Edit button */}
                        {activeTab !== 'apartments' && (
                          <button
                            onClick={e => { e.stopPropagation(); handleEditClick(item, activeTab); }}
                            className="text-[#2D6B9F]/90 hover:text-[#2D6B9F] w-8 h-8 flex items-center justify-center"
                            title="Засах"
                          >
                            <Pencil size={16} />
                          </button>
                        )}
                        {activeTab === 'payments' && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              if (window.confirm('Та энэ төлбөрийн бичлэгийг устгахдаа итгэлтэй байна уу?')) {
                                handleDeleteClick(item, 'payment');
                              }
                            }}
                            className="text-red-600 hover:text-red-800 w-8 h-8 flex items-center justify-center"
                            title="Устгах"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                        {/* Delete button for water meters */}
                        {activeTab === 'waterMeters' && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              if (window.confirm('Та энэ тоолуурын бичлэгийг устгахдаа итгэлтэй байна уу?')) {
                                handleDeleteClick(item, 'waterMeter');
                              }
                            }}
                            className="text-red-600 hover:text-red-800 w-8 h-8 flex items-center justify-center"
                            title="Устгах"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                        {/* Delete button for apartments */}
                        {activeTab === 'apartments' && (
                          <>
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                if (window.confirm('Та энэ орон сууцын мэдээллийг устгахдаа итгэлтэй байна уу?')) {
                                  handleDeleteClick(item, 'apartment');
                                }
                              }}
                              className="text-red-600 hover:text-red-800 w-8 h-8 flex items-center justify-center"
                              title="Устгах"
                            >
                              <Trash2 size={16} />
                            </button>
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                fetchApartmentUsers(item.ApartmentId);
                              }}
                              className="text-green-600 hover:text-green-800 w-8 h-8 flex items-center justify-center"
                              title="Хэрэглэгчид"
                            >
                              <Eye size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              )) : totalRows === 0 ? (
                <tr>
                  <td colSpan={columns.length + (activeTab !== 'waterConsumption' ? 1 : 0)} className="px-6 py-4 text-center text-gray-500">
                    Мэдээлэл олдсонгүй
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={columns.length + (activeTab !== 'waterConsumption' ? 1 : 0)} className="px-6 py-4 text-center text-gray-500">
                    Энэ хуудсанд мэдээлэл алга
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center mt-4 items-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            className={`w-8 h-8 flex items-center justify-center rounded-full border ${
              safeCurrentPage === 1
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "border-[#2D6B9F] text-[#2D6B9F] hover:bg-blue-50"
            } transition font-bold text-sm`}
            title="Өмнөх"
            disabled={safeCurrentPage === 1}
          >
            &lt;
          </button>
          {(() => {
            const pages = [];
            for (let page = 1; page <= totalPages; page++) {
              if (
                page === 1 ||
                page === 2 ||
                page === totalPages - 1 ||
                page === totalPages ||
                (page >= safeCurrentPage - 1 && page <= safeCurrentPage + 1)
              ) {
                pages.push(page);
              }
            }
            let lastPage = 0;
            return pages.map((page, idx) => {
              const showDots = page - lastPage > 1;
              lastPage = page;
              return (
                <React.Fragment key={page}>
                  {showDots && <span className="text-gray-500 px-1">...</span>}
                  <button
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 flex items-center justify-center rounded-full text-sm ${
                      safeCurrentPage === page
                        ? "bg-[#2D6B9F] text-white"
                        : "border border-[#2D6B9F] text-[#2D6B9F] hover:bg-blue-50"
                    } transition`}
                  >
                    {page}
                  </button>
                </React.Fragment>
              );
            });
          })()}
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            className={`w-8 h-8 flex items-center justify-center rounded-full border ${
              safeCurrentPage === totalPages
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "border-[#2D6B9F] text-[#2D6B9F] hover:bg-blue-50"
            } transition font-bold text-sm`}
            title="Дараах"
            disabled={safeCurrentPage === totalPages}
          >
            &gt;
          </button>
        </div>
      )}
      <div className="mt-4 text-sm text-gray-500 text-center">
        Нийт {totalRows} мөр.
      </div>
      {/* Edit Modal */}
      {editModal && (
        <div className="fixed z-50 inset-0 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black bg-opacity-40"
            onClick={() => setEditModal(null)}
          />
          {/* Modal content */}
          <div
            className="relative bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 z-10"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-6 pt-6 pb-2 border-b">
              <h3 className="text-lg font-bold text-[#2D6B9F]">
                {editModal.type === 'payment'
                  ? 'Төлбөрийн дүн засах'
                  : editModal.type === 'service'
                  ? 'Үйлчилгээний дүн засах'
                  : 'Тоолуурын уншилт засах'}
              </h3>
              <button onClick={() => setEditModal(null)} className="text-gray-400 hover:text-[#2D6B9F]">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-4">
              <div className="mb-4 text-gray-700">
                {editModal.type === 'payment'
                  ? 'Шинэ дүн оруулна уу:'
                  : editModal.type === 'service'
                  ? 'Шинэ үйлчилгээний дүн оруулна уу:'
                  : 'Шинэ уншилтын утга оруулна уу:'}
              </div>
              <input
                type="number"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 mb-2"
                disabled={editLoading}
              />
              {editError && <div className="text-red-600 mb-2">{editError}</div>}
            </div>
            <div className="bg-gray-50 px-6 py-3 flex justify-end">
              <button
                onClick={handleEditConfirm}
                className="px-4 py-2 rounded-md bg-[#2D6B9F] text-white flex items-center ml-2"
                disabled={editLoading}
              >
                Засах
              </button>
            </div>
          </div>
        </div>
      )}
      {/* View Modal */}
      {selectedItem && (
        <div className="fixed z-50 inset-0 flex items-center justify-center">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="flex justify-between items-center px-6 pt-6 pb-2 border-b">
              <h2 className="text-lg font-bold text-[#2D6B9F]">
                Дэлгэрэнгүй мэдээлэл
              </h2>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-gray-400 hover:text-[#2D6B9F]"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-4">
              <div className="overflow-auto max-h-[60vh]">
                <table className="min-w-full divide-y divide-gray-200">
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(selectedItem).map(([key, value]) => {
                      let displayValue = value;
                      if (value === null || value === undefined) {
                        displayValue = '-';
                      } else if (typeof value === 'boolean') {
                        displayValue = value ? 'Тийм' : 'Үгүй';
                      } else if (key.toLowerCase().includes('date')) {
                        try {
                          const date = new Date(value);
                          if (!isNaN(date)) {
                            displayValue = date.toLocaleString('mn-MN');
                          }
                        } catch (e) {}
                      } else if (typeof value === 'object') {
                        displayValue = JSON.stringify(value);
                      }
                      return (
                        <tr key={key}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-700 bg-gray-50 w-1/3">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                            {displayValue}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-3 flex justify-end">
            </div>
          </div>
        </div>
      )}
      {isViewingUsers && (
        <div className="fixed z-50 inset-0 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-40" onClick={handleCloseUsersModal} />
          <div className="relative bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 z-10" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 pt-6 pb-2 border-b">
              <h3 className="text-lg font-bold text-[#2D6B9F]">Орон сууцны хэрэглэгчид</h3>
              <button onClick={handleCloseUsersModal} className="text-gray-400 hover:text-[#2D6B9F]">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-4">
              {usersError && <div className="text-red-600 mb-2">{usersError}</div>}
              {usersLoading ? (
                <div>Уншиж байна...</div>
              ) : (
                <>
                  <table className="min-w-full divide-y divide-gray-200 mb-4">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Нэр</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Имэйл</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Төрөл</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Үйлдэл</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apartmentUsers.length > 0 ? apartmentUsers.map(user => (
                        <tr key={user.UserId}>
                          <td className="px-4 py-2">{user.Username}</td>
                          <td className="px-4 py-2">{user.Email}</td>
                          <td className="px-4 py-2">{user.UserType}</td>
                          <td className="px-4 py-2 text-center">
                            <button
                              onClick={() => handleRemoveUser(user.UserId)}
                              className="text-red-600 hover:text-red-800 w-8 h-8 flex items-center justify-center"
                              title="Устгах"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={4} className="text-center text-gray-500 py-4">Хэрэглэгч олдсонгүй</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {/* Add user form */}
                  <form onSubmit={handleAddUser} className="flex flex-col md:flex-row gap-2 items-center mb-2">
                    <input
                      type="email"
                      value={addUserEmail}
                      onChange={e => setAddUserEmail(e.target.value)}
                      placeholder="Имэйл"
                      className="border border-gray-300 rounded-md p-2 flex-1"
                      required
                    />
                    <select
                      value={addUserType}
                      onChange={e => setAddUserType(e.target.value)}
                      className="border border-gray-300 rounded-md p-2"
                    >
                      <option value="эзэмшигч">Эзэмшигч</option>
                      <option value="түрээслэгч">Түрээслэгч</option>
                    </select>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-md bg-[#2D6B9F] text-white"
                      disabled={usersLoading}
                    >
                      Нэмэх
                    </button>
                  </form>
                  {addUserError && <div className="text-red-600 mb-2">{addUserError}</div>}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
