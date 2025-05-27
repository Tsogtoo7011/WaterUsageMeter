import React from 'react';

const WaterMeterCard = ({ year, month, hot, cold, meters, apartmentId, status, prevMeters, hotDiff: backendHotDiff, coldDiff: backendColdDiff }) => {
  const monthKey = `${year}-${month}`;

  let hotDiff = backendHotDiff !== undefined ? backendHotDiff : "-";
  let coldDiff = backendColdDiff !== undefined ? backendColdDiff : "-";

  if ((hotDiff === undefined || hotDiff === "-") && meters && Array.isArray(meters) && prevMeters && Array.isArray(prevMeters)) {
    let hotTotal = 0, coldTotal = 0;
    let prevHotTotal = 0, prevColdTotal = 0;

    meters.forEach(m => {
      if (m.type === 1) hotTotal += Number(m.indication);
      else coldTotal += Number(m.indication);
    });

    prevMeters.forEach(m => {
      if (m.type === 1) prevHotTotal += Number(m.indication);
      else prevColdTotal += Number(m.indication);
    });

    if (meters.length === 0) {
      hotDiff = "-";
      coldDiff = "-";
    } else if (prevMeters.length === 0) {
      hotDiff = Math.round(hotTotal).toString();
      coldDiff = Math.round(coldTotal).toString();
    } else {
      hotDiff = Math.round(hotTotal - prevHotTotal).toString();
      coldDiff = Math.round(coldTotal - prevColdTotal).toString();
    }
  }

  if (status === "not_done" ) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition group">
        <div className="flex justify-between items-center border-b border-gray-100 px-4 py-3">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#2D6B9F] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="text-sm text-gray-800">{year}-{month} сар</div>
          </div>
          <div className="text-xs bg-blue-100 text-[#2D6B9F] px-2 py-0.5 rounded-full">
            Өгнө үү
          </div>
        </div>
        <div className="p-3">
          <div className="text-sm text-gray-500 mb-3 flex flex-row gap-6 justify-center">
            <span>Халуун ус: - м³</span>
            <span>Хүйтэн ус: - м³</span>
          </div>
          <a 
            href={`/user/metercounter/details?apartmentId=${apartmentId}&month=${monthKey}`}
            className="block w-full bg-[#2D6B9F] font-medium text-white py-2 rounded text-sm text-center"
          >
            Заалт өгөх
          </a>
        </div>
      </div>
    );
  }

  if (status === "missing") {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition group">
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
        <div className="p-3 flex flex-col items-center">
          <div className="text-sm text-gray-800 mb-3 flex flex-row gap-6 justify-center">
            <span>Халуун ус: - м³</span>
            <span>Хүйтэн ус: - м³</span>
          </div>
          <div className="w-full text-center bg-[#2D6B9F] text-white text-sm rounded font-medium py-2">
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
        <div className="text-sm text-gray-800 mb-3 flex flex-row gap-6 justify-center">
          <span>Халуун ус: {hotDiff} м³</span>
          <span>Хүйтэн ус: {coldDiff} м³</span>
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
