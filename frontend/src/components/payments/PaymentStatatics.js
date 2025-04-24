import React, { useState, useEffect } from 'react';
import api from "../../utils/api"; 
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';

const PaymentStatistics = ({ apartmentId }) => {
  const [statistics, setStatistics] = useState({
    monthlyStats: [],
    yearlyTotal: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      if (!apartmentId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await api.get('/payments/statistics');
        setStatistics({
          monthlyStats: response.data.monthlyStats,
          yearlyTotal: response.data.yearlyTotal
        });
      } catch (err) {
        setError('Failed to load payment statistics. Please try again later.');
        console.error('Error fetching payment statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [apartmentId]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorAlert message={error} onClose={() => setError(null)} />;
  }

  const currentYear = new Date().getFullYear();

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">
          Payment Statistics for {currentYear}
        </h2>
      </div>
      
      <div className="p-6">
        <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Total spending for {currentYear}: <span className="font-bold">₮{statistics.yearlyTotal.toLocaleString()}</span>
              </p>
            </div>
          </div>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={statistics.monthlyStats}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="monthName" 
                tick={{ fontSize: 12 }}
                height={60}
                tickFormatter={(value) => value.substring(0, 3)}
              />
              <YAxis />
              <Tooltip 
                formatter={(value) => [`₮${value.toLocaleString()}`, 'Amount']}
                labelFormatter={(label) => `${label}`}
              />
              <Legend />
              <Bar 
                name="Monthly Amount" 
                dataKey="totalAmount" 
                fill="#3B82F6" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Month
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paid
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pending
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {statistics.monthlyStats.map((month) => (
                  <tr key={month.month} className={month.totalAmount === 0 ? 'text-gray-400' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {month.monthName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      ₮{month.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {month.paidCount} {month.paidCount === 1 ? 'payment' : 'payments'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {month.pendingCount} {month.pendingCount === 1 ? 'payment' : 'payments'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentStatistics;