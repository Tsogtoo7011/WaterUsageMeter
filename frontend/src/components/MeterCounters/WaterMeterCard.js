import React from 'react';

const WaterMeterCard = ({ year, month, hot, cold, meters, apartmentId, status, prevMeters }) => {
  const monthKey = `${year}-${month}`;

  let hotDiff = null, coldDiff = null;
  if (meters && Array.isArray(meters) && prevMeters && Array.isArray(prevMeters)) {
    const prevMap = {};
    prevMeters.forEach(m => {
      prevMap[`${m.location}-${m.type}`] = m.indication;
    });

    let hotSum = 0, coldSum = 0;
    let hotHasPrev = false, coldHasPrev = false;
    meters.forEach(m => {
      const prev = prevMap[`${m.location}-${m.type}`];
      if (prev !== undefined && prev !== null && m.indication !== undefined && m.indication !== null) {
        const diff = Number(m.indication) - Number(prev);
        if (m.type === 1) {
          hotSum += diff;
          hotHasPrev = true;
        } else {
          coldSum += diff;
          coldHasPrev = true;
        }
      }
    });
    hotDiff = hotHasPrev ? hotSum.toFixed(2) : "-";
    coldDiff = coldHasPrev ? coldSum.toFixed(2) : "-";
  } else {
    hotDiff = "-";
    coldDiff = "-";
  }

  if (status === "not_done" ) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col items-center justify-center p-8 min-h-[220px]">
        <div className="mb-3 text-[#2D6B9F]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="text-lg font-semibold text-gray-700 mb-2">{year}-{month} сар</div>
        <div className="text-gray-500 mb-4">Тоолуурын заалтаа өгнө үү</div>
        <a 
          href={`/user/metercounter/details?apartmentId=${apartmentId}&month=${monthKey}`}
          className="block w-full bg-[#2D6B9F]/90 hover:bg-[#2D6B9F] font-medium text-white py-2 rounded text-sm text-center"
        >
          Заалт өгөх
        </a>
      </div>
    );
  }

  if (status === "missing") {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md">
        <div className="flex justify-between items-center border-b border-gray-100 px-4 py-3">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-[#2D6B9F] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className="text-sm text-gray-800">{year}-{month} сар</div>
          </div>
          <div className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
            Өгөөгүй
          </div>
        </div>
        <div className="p-3">
          <div className="text-sm text-gray-800 mb-3">
            Халуун ус: - м³&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Хүйтэн ус: - м³
          </div>
          <div className="text-center bg-[#2D6B9F] text-white text-sm rounded font-medium py-2">
            Заалт өгөх боломжгүй!
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition group">
      <div className="flex justify-between items-center border-b border-gray-100 px-4 py-3">
        <div className="flex items-center">
          <svg className="h-5 w-5 text-[#2D6B9F] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div className="text-sm text-gray-800">{year}-{month} сар</div>
        </div>
        <div className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
          Өгсөн
        </div>
      </div>
      <div className="p-3">
        <div className="text-sm text-gray-800 mb-3">
          Халуун ус: {hotDiff} м³
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          Хүйтэн ус: {coldDiff} м³
        </div>
        <a 
          href={`/user/metercounter/details?apartmentId=${apartmentId}&month=${monthKey}`}
          className="block w-full bg-[#2D6B9F] text-white font-medium py-2 rounded text-sm text-center"
        >
          Дэлгэрэнгүй
        </a>
      </div>
    </div>
  );
};

export default WaterMeterCard;
