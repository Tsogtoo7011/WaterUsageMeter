import React, { useState } from 'react';
import { Eye } from 'lucide-react';

export default function AdminReportTable({
  activeTab,
  reportData,
  getTabLabel,
  currentPage,
  setCurrentPage,
  rowsPerPage,
  setSelectedItem,
  downloadExcel 
}) {
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const columnsConfig = {
    payments: [
      { key: 'PaymentId', label: 'ID' },
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

  if (!reportData || reportData.length === 0 || !Array.isArray(reportData)) {
    return (
      <div className="bg-white rounded-lg p-6 text-center">
        <p className="text-gray-500">Энэ тайланд мэдээлэл олдсонгүй.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <span className="text-lg font-bold text-[#2D6B9F] mb-2 md:mb-0">
          {getTabLabel ? getTabLabel(activeTab) : ''}
        </span>
        <button
          onClick={downloadExcel}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#2D6B9F]/90 hover:bg-[#2D6B9F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full md:w-auto"
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
        <div className="align-middle inline-block min-w-full shadow overflow-hidden rounded-lg">
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
                <th className="px-4 py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider sticky right-0 bg-gray-50 z-10">
                  Үйлдэл
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.length > 0 ? paginatedData.map((item, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="hover:bg-blue-50 transition group"
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
                      } else if (col.key === 'amount' && typeof value === 'number') {
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
                  <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium sticky right-0 bg-white z-10 border-l border-gray-100 group-hover:bg-blue-50 transition align-middle">
                    <div className="flex justify-center items-center">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="text-[#2D6B9F] hover:text-[#2D6B9F] w-8 h-8 flex items-center justify-center"
                        title="Дэлгэрэнгүй"
                      >
                        <Eye size={16} className="mr-0.5" />
                        <span className="sr-only">Дэлгэрэнгүй</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )) : totalRows === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-6 py-4 text-center text-gray-500">
                    Мэдээлэл олдсонгүй
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={columns.length + 1} className="px-6 py-4 text-center text-gray-500">
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
        Нийт {totalRows} бичлэг.
      </div>
    </div>
  );
}
