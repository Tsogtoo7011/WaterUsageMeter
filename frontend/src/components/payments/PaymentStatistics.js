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
    yearlyStatusData: [] // Add this to store the yearly status data from backend
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
          // Log the data to help with debugging
          console.log('Statistics data:', response.data);

          // Ensure all required fields exist on each monthly stat
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
            yearlyStatusData: response.data.yearlyStatusData || [] // Store the yearly status data
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

  const getMonthAbbreviation = (monthName) => {
    if (!monthName) return '';
    return monthName.substring(0, 3);
  };

  // Calculate monthly average by dividing yearly total by 12
  const calculateMonthlyAverage = () => {
    return statistics.yearlyTotal / 12;
  };

  // Get status styles - consistent with PaymentsList
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
        return 'bg-blue-100 text-blue-800';
    }
  };

  // Format status text - consistent with PaymentsList
  const getFormattedStatus = (status) => {
    if (!status) return 'Unknown';
    
    // Convert to title case (first letter uppercase, rest lowercase)
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  // Render payment status badges consistent with PaymentsList
  const renderStatusBadges = (month) => {
    const badges = [];
    const hasAnyStatus = (month.paidCount > 0 || month.pendingCount > 0 || month.overdueCount > 0);
    
    // If there's no status data but there is an amount, show a generic badge
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
        <p className="text-gray-500">Please select an apartment to view statistics.</p>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 text-center">
        <p className="text-gray-500">No payment statistics available for this apartment.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Payment Statistics</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('chart')}
            className={`px-4 py-2 rounded ${viewMode === 'chart' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Chart
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-4 py-2 rounded ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Table
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
          <p className="text-sm text-blue-700 font-medium">Total Yearly Payments</p>
          <p className="text-2xl font-bold">${statistics.yearlyTotal.toFixed(2)}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow-sm">
          <p className="text-sm text-green-700 font-medium">Monthly Average</p>
          <p className="text-2xl font-bold">${calculateMonthlyAverage().toFixed(2)}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg shadow-sm">
          <p className="text-sm text-purple-700 font-medium">Status Overview</p>
          <div className="flex gap-2 mt-1">
            {statistics.yearlyStatusData.length > 0 ? (
              statistics.yearlyStatusData.map(status => (
                <span 
                  key={status.name} 
                  className={`px-2 py-1 text-xs rounded-full ${getStatusStyles(status.name)}`}
                >
                  {status.name}: {status.value}
                </span>
              ))
            ) : (
              <span className="text-gray-500">No payment status data</span>
            )}
          </div>
        </div>
      </div>

      {viewMode === 'chart' ? (
        <div className="space-y-6">
          {/* Monthly Amount Bar Chart */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium mb-4">Monthly Payment Amounts</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={statistics.monthlyStats}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="monthName" tickFormatter={getMonthAbbreviation} />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                  <Legend />
                  <Bar dataKey="totalAmount" name="Payment Amount" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment Status Pie Chart */}
          {statistics.yearlyStatusData.length > 0 && (
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium mb-4">Payment Status Distribution</h3>
              <div className="h-64 flex justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statistics.yearlyStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {statistics.yearlyStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {statistics.monthlyStats.map((month) => (
                <tr key={month.month} className={month.totalAmount > 0 ? '' : 'opacity-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">{month.monthName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {month.totalAmount > 0 ? `$${month.totalAmount.toFixed(2)}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderStatusBadges(month)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap font-medium">Total</td>
                <td className="px-6 py-4 whitespace-nowrap font-medium">${statistics.yearlyTotal.toFixed(2)}</td>
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