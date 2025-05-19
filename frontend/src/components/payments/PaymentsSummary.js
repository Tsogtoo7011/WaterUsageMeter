import React from 'react';

const PaymentsSummary = ({ summary }) => {
  
  const total = summary?.total || 0;
  const paid = summary?.paid || 0;
  const pending = summary?.pending || 0;
  const overdue = summary?.overdue || 0;
  
  const hasOverdue = overdue > 0;
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex items-center p-4">
          <div className="flex-grow">
            <p className="text-sm font-medium text-gray-500">Нийт төлбөр</p>
            <p className="text-xl font-semibold text-[#2D6B9F]">₮{total.toLocaleString()}</p>
          </div>
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="h-5 w-5 text-[#2D6B9F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex items-center p-4">
          <div className="flex-grow">
            <p className="text-sm font-medium text-gray-500">Төлөгдсөн</p>
            <p className="text-xl font-semibold text-green-600">₮{paid.toLocaleString()}</p>
          </div>
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {hasOverdue ? (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center p-4">
            <div className="flex-grow">
              <p className="text-sm font-medium text-gray-500">Хугацаа хэтэрсэн</p>
              <p className="text-xl font-semibold text-red-600">₮{overdue.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center p-4">
            <div className="flex-grow">
              <p className="text-sm font-medium text-gray-500">Хүлээгдэж буй</p>
              <p className="text-xl font-semibold text-yellow-600">₮{pending.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsSummary;