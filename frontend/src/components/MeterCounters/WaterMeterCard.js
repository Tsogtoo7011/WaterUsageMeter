import React from 'react';

const WaterMeterCard = ({ year, month, hot, cold, meters, apartmentId }) => {
  const monthKey = `${year}-${month}`;

  // If no readings for this month, show a special card
  if (!meters || meters.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col items-center justify-center p-8 min-h-[220px]">
        <div className="mb-3 text-blue-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="text-lg font-semibold text-gray-700 mb-2">{year}-{month} сар</div>
        <div className="text-gray-500 mb-4">Тоолуурын заалтаа өгнө үү</div>
        <a 
          href={`/user/metercounter/details?apartmentId=${apartmentId}&month=${monthKey}`}
          className="block w-full bg-blue-500 text-white py-2 rounded text-sm text-center"
        >
          Заалт өгөх
        </a>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition group">
      <div className="flex justify-between items-center border-b border-gray-100 px-4 py-3">
        <div className="flex items-center">
          <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div className="text-sm text-gray-800">{year}-{month} сар</div>
        </div>
        <div className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
          Дууссан
        </div>
      </div>
      <div className="p-3">
        <div className="text-sm text-gray-800 mb-3">
          Халуун ус: {hot} м³&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Хүйтэн ус: {cold} м³
        </div>
        {/* Show all meter readings for this month */}
        <div className="mb-3">
          <table className="min-w-full text-xs">
            <thead>
              <tr>
                <th className="px-2 py-1 text-left">Байршил</th>
                <th className="px-2 py-1 text-left">Төрөл</th>
                <th className="px-2 py-1 text-left">Заалт</th>
              </tr>
            </thead>
            <tbody>
              {meters && meters.map((meter) => (
                <tr key={meter.id}>
                  <td className="px-2 py-1">{meter.location}</td>
                  <td className="px-2 py-1">{meter.type === 1 ? 'Халуун ус' : 'Хүйтэн ус'}</td>
                  <td className="px-2 py-1">{meter.indication}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <a 
          href={`/user/metercounter/details?apartmentId=${apartmentId}&month=${monthKey}`}
          className="block w-full bg-blue-500 text-white py-2 rounded text-sm text-center"
        >
          Дэлгэрэнгүй
        </a>
      </div>
    </div>
  );
};

export default WaterMeterCard;
