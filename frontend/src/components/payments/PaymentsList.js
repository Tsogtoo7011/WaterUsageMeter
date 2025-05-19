import React, { useState, useMemo } from 'react';
import { Eye, ChevronLeft, ChevronRight, CreditCard } from 'lucide-react'; // Added CreditCard icon

const statusNames = {
  paid: 'Төлөгдсөн',
  overdue: 'Хугацаа хэтэрсэн',
  pending: 'Хүлээгдэж буй',
  cancelled: 'Цуцлагдсан'
};

const getStatusBadgeColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'paid': return 'bg-green-100 text-green-800';
    case 'overdue': return 'bg-red-100 text-red-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'cancelled': return 'bg-gray-100 text-gray-800';
    default: return 'bg-blue-100 text-blue-800';
  }
};

const PaymentsList = ({ payments = [], onViewPayment, onPayNow, loading }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('mn-MN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const renderSortArrow = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
  };

  const filteredPayments = payments.filter(payment => {
    const dateStr = formatDate(payment.payDate);
    const amountStr = payment.amount ? payment.amount.toString() : '';
    const matchesSearch =
      (dateStr && dateStr.includes(searchQuery)) ||
      (amountStr && amountStr.includes(searchQuery)) ||
      (payment.status && statusNames[payment.status?.toLowerCase()]?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (payment.id && payment.id.toString().includes(searchQuery));
    const matchesStatus = statusFilter === 'all' || payment.status?.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedPayments = useMemo(() => {
    let sortable = [...filteredPayments];
    if (sortConfig.key) {
      sortable.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        if (sortConfig.key === 'payDate') {
          aValue = a.payDate;
          bValue = b.payDate;
        }
        if (sortConfig.key === 'amount') {
          aValue = Number(a.amount);
          bValue = Number(b.amount);
        }
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
  }, [filteredPayments, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(sortedPayments.length / itemsPerPage);
  const paginatedPayments = sortedPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (!Array.isArray(payments) || payments.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 text-center">
        <p className="text-gray-500">Төлбөрийн бүртгэл олдсонгүй</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden">
      <div className="flex flex-col md:flex-row gap-4 mb-4 px-4 pt-4 justify-center items-center">
        <input
          type="text"
          placeholder="Огноо, дүн, дугаараар хайх..."
          className="pl-3 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2D6B9F]"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="w-full md:w-auto p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2D6B9F] text-sm "
        >
          <option value="all">Бүгд</option>
          <option value="pending">Хүлээгдэж буй</option>
          <option value="overdue">Хугацаа хэтэрсэн</option>
          <option value="paid">Төлөгдсөн</option>
          <option value="cancelled">Цуцлагдсан</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#2D6B9F]/50 text-center">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider cursor-pointer select-none"
                onClick={() => handleSort('id')}
              >
                Дугаар{renderSortArrow('id')}
              </th>
              <th
                className="px-6 py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider cursor-pointer select-none"
                onClick={() => handleSort('payDate')}
              >
                Огноо{renderSortArrow('payDate')}
              </th>
              <th
                className="px-6 py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider cursor-pointer select-none"
                onClick={() => handleSort('amount')}
              >
                Дүн{renderSortArrow('amount')}
              </th>
              <th
                className="px-6 py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider cursor-pointer select-none"
                onClick={() => handleSort('status')}
              >
                Төлөв{renderSortArrow('status')}
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-[#2D6B9F] uppercase tracking-wider">
                Үйлдэл
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedPayments.length > 0 ? (
              paginatedPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-blue-50 transition group text-center">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                    {payment.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                    {formatDate(payment.payDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#2D6B9F] text-center">
                    ₮{(payment.amount || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(payment.status)}`}>
                      {statusNames[payment.status?.toLowerCase()] || 'Тодорхойгүй'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => onViewPayment(payment.id)} 
                        className="text-[#2D6B9F] hover:text-[#2D6B9F] w-8 h-8 flex items-center justify-center"
                        title="Дэлгэрэнгүй"
                      >
                        <Eye size={16} />
                      </button>
                      {(payment.status?.toLowerCase() === 'pending' || payment.status?.toLowerCase() === 'overdue') && (
                        <button
                          onClick={() => onPayNow(payment.id)}
                          disabled={loading}
                          className={`w-8 h-8 flex items-center justify-center rounded text-xs font-medium ${
                            loading ? 'text-gray-400 cursor-not-allowed bg-gray-100' : 'text-green-600 hover:bg-green-100'
                          }`}
                          title="Төлөх"
                        >
                          <CreditCard size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  Төлбөр олдсонгүй
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4 items-center space-x-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            className={`w-8 h-8 flex items-center justify-center rounded-full border ${
              currentPage === 1
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "border-[#2D6B9F] text-[#2D6B9F] hover:bg-blue-50"
            } transition font-bold text-sm`}
            title="Өмнөх"
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1)
            .filter((page) => {
              return (
                page <= 2 ||
                page > totalPages - 2 ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              );
            })
            .map((page, index, pages) => (
              <React.Fragment key={page}>
                {index > 0 && page !== pages[index - 1] + 1 && (
                  <span className="text-gray-500">...</span>
                )}
                <button
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 flex items-center justify-center rounded-full text-sm ${
                    currentPage === page
                      ? "bg-[#2D6B9F] text-white"
                      : "border border-[#2D6B9F] text-[#2D6B9F] hover:bg-blue-50"
                  } transition`}
                >
                  {page}
                </button>
              </React.Fragment>
            ))}
          <button
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            className={`w-8 h-8 flex items-center justify-center rounded-full border ${
              currentPage === totalPages
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "border-[#2D6B9F] text-[#2D6B9F] hover:bg-blue-50"
            } transition font-bold text-sm`}
            title="Дараах"
            disabled={currentPage === totalPages}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentsList;