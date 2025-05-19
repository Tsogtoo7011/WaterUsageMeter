import React, { useState, useEffect } from 'react';
import api from "../../utils/api"; 
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PieChart, Pie, Cell } from 'recharts';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';

const PaymentStatistics = ({ apartmentId, refreshKey = 0 }) => {
  const [statistics, setStatistics] = useState({
    monthlyStats: [],
    yearlyTotal: 0,
    yearlyStatusData: [] 
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('chart'); 
  
  useEffect(() => {
    const fetchStatistics = async () => {
      if (!apartmentId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await api.get(`/payments/statistics?apartmentId=${apartmentId}`);
        if (response && response.data) {

          const processedStats = (response.data.monthlyStats || []).map(month => ({
            ...month,
            paidCount: month.paidCount || 0,
            pendingCount: month.pendingCount || 0,
            overdueCount: month.overdueCount || 0,
            monthName: month.monthName || getMonthName(month.month)
          }));

          setStatistics({
            monthlyStats: processedStats,
            yearlyTotal: response.data.yearlyTotal || 0,
            yearlyStatusData: response.data.yearlyStatusData || [] 
          });
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        setError('Failed to load payment statistics. Please try again later.');
        console.error('Error fetching payment statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    if (apartmentId) {
      fetchStatistics();
    }
  }, [apartmentId, refreshKey]);

  const getMonthName = (monthNumber) => {
    if (!monthNumber) return 'Unknown';
    const date = new Date();
    date.setMonth(parseInt(monthNumber) - 1);
    return date.toLocaleString('default', { month: 'long' });
  };


  const calculateMonthlyAverage = () => {
    return statistics.yearlyTotal / 12;
  };

  const getStatusStyles = (status) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-[#E6F0F8] text-[#2D6B9F]'; 
    }
  };

  const getFormattedStatus = (status) => {
    if (!status) return 'Тодорхойгүй';
    switch (status.toLowerCase()) {
      case 'paid': return 'Төлөгдсөн';
      case 'pending': return 'Хүлээгдэж буй';
      case 'overdue': return 'Хоцорсон';
      case 'cancelled': return 'Цуцлагдсан';
      default: return status;
    }
  };

  const renderStatusBadges = (month) => {
    const badges = [];
    const hasAnyStatus = (month.paidCount > 0 || month.pendingCount > 0 || month.overdueCount > 0);
    
    if (!hasAnyStatus && month.totalAmount > 0) {
      return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyles('pending')}`}>
          Pending
        </span>
      );
    }
    
    // If no payment data at all, show placeholder
    if (!hasAnyStatus && month.totalAmount === 0) {
      return <span className="text-gray-400">-</span>;
    }
    
    if (month.paidCount > 0) {
      badges.push(
        <span key="paid" className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyles('paid')}`}>
          {getFormattedStatus('paid')} ({month.paidCount})
        </span>
      );
    }
    
    if (month.pendingCount > 0) {
      badges.push(
        <span key="pending" className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyles('pending')}`}>
          {getFormattedStatus('pending')} ({month.pendingCount})
        </span>
      );
    }
    
    if (month.overdueCount > 0) {
      badges.push(
        <span key="overdue" className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyles('overdue')}`}>
          {getFormattedStatus('overdue')} ({month.overdueCount})
        </span>
      );
    }
    
    return <div className="flex flex-wrap gap-2">{badges}</div>;
  };

  // Handle empty data gracefully
  const hasData = statistics.monthlyStats && statistics.monthlyStats.length > 0;
  const hasPayments = hasData && statistics.monthlyStats.some(m => m.totalAmount > 0);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorAlert message={error} onClose={() => setError(null)} />;
  }

  if (!apartmentId) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 text-center">
        <p className="text-gray-500">Статистик харахын тулд байр сонгоно уу.</p>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="bg-white  rounded-lg p-6 text-center">
        <p className="text-gray-500">Энэ байранд төлбөрийн статистик байхгүй байна.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-[#2D6B9F]">Төлбөрийн статистик</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('chart')}
            className={`px-2 py-1 text-sm rounded ${viewMode === 'chart' ? 'bg-[#2D6B9F] text-white' : 'border border-[#2D6B9F] hover:bg-blue-50 text-[#2D6B9F]'}`}
          >
            График
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-2 py-1 text-sm rounded ${viewMode === 'table' ? 'bg-[#2D6B9F] text-white' : 'border border-[#2D6B9F] hover:bg-blue-50 text-[#2D6B9F]'}`}
          >
            Хүснэгт
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="border border-blue-50 p-4 rounded-lg shadow-sm">
          <p className="text-sm text-[#2D6B9F] font-medium">Жилийн нийт төлбөр</p>
          <p className="text-2xl text-[#2D6B9F]  font-bold">${statistics.yearlyTotal.toFixed(2)}</p>
        </div>
        <div className="border border-blue-50 p-4 rounded-lg shadow-sm">
          <p className="text-sm text-[#2D6B9F] font-medium">Жилийн дундаж</p>
          <p className="text-2xl text-[#2D6B9F]  font-bold">${calculateMonthlyAverage().toFixed(2)}</p>
        </div>
        <div className="border border-purple-50 p-4 rounded-lg shadow-sm">
          <p className="text-sm text-[#2D6B9F] font-medium">Төлөвийн тойм</p>
          <div className="flex gap-2 mt-1">
            {statistics.yearlyStatusData.length > 0 ? (
              statistics.yearlyStatusData.map(status => (
                <span 
                  key={status.name} 
                  className={`px-2 py-1 text-xs rounded-full ${getStatusStyles(status.name)}`}
                >
                  {getFormattedStatus(status.name)}: {status.value}
                </span>
              ))
            ) : (
              <span className="text-gray-500">Төлбөрийн төлөвийн мэдээлэл байхгүй</span>
            )}
          </div>
        </div>
      </div>
      {viewMode === 'chart' ? (
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:flex-[7_7_0%] bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-lg text-[#2D6B9F]  font-medium mb-4">Сарын төлбөрийн дүн</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={statistics.monthlyStats}
                  margin={{ top: 5, right: 30, left: 20, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={(month) => month} 
                    label={{ value: "Сар", position: "insideBottom", offset: -5 }}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`$${value}`, 'Дүн']} 
                    labelFormatter={(label) => `${label} сар`}
                  />
                  <Legend layout="horizontal" verticalAlign="bottom" align="right" />
                  <Bar dataKey="totalAmount" name="Нийт дүн" fill="#2D6B9F" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Divider for desktop */}
          <div className="hidden md:block w-px bg-gray-200"></div>
          {/* Payment Status Pie Chart */}
          <div className="md:flex-[3_3_0%] bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-lg text-[#2D6B9F] font-medium mb-4">Төлбөрийн төлөвийн харьцаа</h3>
            <div className="h-64 flex justify-center">
              {statistics.yearlyStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart
                    margin={{ top: 5, right: 30, left: 20, bottom: 40 }}
                  >
                    <Pie
                      data={statistics.yearlyStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ percent, cx, cy, midAngle, outerRadius, index }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = outerRadius + 10;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return (
                          <text
                            x={x}
                            y={y}
                            fill="#2D6B9F"
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize={14}
                            fontWeight="bold"
                          >
                            {(percent * 100).toFixed(0)}%
                          </text>
                        );
                      }}
                    >
                      {statistics.yearlyStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [value, getFormattedStatus(name)]} 
                    />
                    <Legend 
                      formatter={(value) => getFormattedStatus(value)} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <span className="text-gray-500">Төлбөрийн төлөвийн мэдээлэл байхгүй</span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#2D6B9F]/50">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#2D6B9F] uppercase tracking-wider">Сар</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#2D6B9F] uppercase tracking-wider">Дүн</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#2D6B9F] uppercase tracking-wider">Төлөв</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {statistics.monthlyStats.map((month) => (
                <tr key={month.month} className={month.totalAmount > 0 ? '' : 'opacity-50'}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-[#2D6B9F]">{month.month ? `${month.month} сар` : month.monthName}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-[#2D6B9F]">
                    {month.totalAmount > 0 ? `$${month.totalAmount.toFixed(2)}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-[#2D6B9F]">
                    {renderStatusBadges(month)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-[#2D6B9F]">Нийт</td>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-[#2D6B9F]">${statistics.yearlyTotal.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

export default PaymentStatistics;