import React, { useState } from "react";

const locations = {
  "54 - 22": { id: "16100183", address: "СХД 18 хороо 54 - 22", payment: 45206.25, hotWater: 3, coldWater: 5, other: 12000 },
  "54 - 8": { id: "16100234", address: "СХД 18 хороо 54 - 8", payment: 38500.75, hotWater: 2, coldWater: 4, other: 10000 },
  "54 - 7": { id: "16100345", address: "СХД 18 хороо 54 - 7", payment: 41020.00, hotWater: 3, coldWater: 6, other: 11000 }
};

export function Payment() {
  const [selectedLocation, setSelectedLocation] = useState("54 - 22");
  const data = locations[selectedLocation];

  return (
    <div className="p-6 w-full">
      <h1 className="text-xl font-bold mb-4">Төлбөрийн мэдээлэл</h1>
      
      <div className="flex items-center space-x-2 mb-4">
        {Object.keys(locations).map((location) => (
          <button 
            key={location} 
            className={`border px-4 py-2 rounded-md ${selectedLocation === location ? "bg-blue-600 text-white" : ""}`}
            onClick={() => setSelectedLocation(location)}
          >
            {location}
          </button>
        ))}
        <button className="border px-4 py-2 rounded-md">+</button>
      </div>
      
      <div className="flex justify-between items-center border-b pb-2 mb-4">
        <span className="text-lg font-medium">{data.id}: {data.address}</span>
      </div>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Таны төлөх ёстой төлбөр: <span className="text-blue-600">{data.payment}</span></h2>
        <p className="mt-2">Таны хэрэглээ - Халуун ус: {data.hotWater}м³, Хүйтэн ус: {data.coldWater}м³, Бусад: {data.other}</p>
      </div>
      
      <div className="flex space-x-4 mb-4">
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md">Төлөх</button>
        <button className="border px-4 py-2 rounded-md">Төлбөр дэлгэрэнгүй</button>
      </div>
      
      <div className="text-white px-4 py-2 rounded-t-md bg-blue-800">Таны төлбөрийн түүх</div>
      <div className="border rounded-b-md p-4 min-h-[150px]"></div>
      
      <div className="flex justify-end mt-4">
        <button className="border px-4 py-2 rounded-md">Түүх дэлгэрэнгүй</button>
      </div>
    </div>
  );
}

export default Payment;
