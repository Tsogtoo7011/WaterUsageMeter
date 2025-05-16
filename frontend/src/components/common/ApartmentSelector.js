import React from 'react';
import { Home } from 'lucide-react';

const ApartmentSelector = ({ apartments, selectedApartment, onChange }) => {
  if (!apartments || apartments.length === 0) {
    return (
      <div className="flex justify-center items-center w-full">
        <div className="text-yellow-600">
          No apartments available for selection.
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    const selectedId = e.target.value;
    onChange(selectedId);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="w-full max-w-3xl">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Home size={16} className="text-[#2D6B9F]" />
          </div>
          <select
            id="apartment-select"
            className="w-full pl-10 pr-3 py-2 border border-[#2D6B9F] text-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6B9F] focus:border-[#2D6B9F] bg-white text-sm shadow-sm transition-all"
            value={selectedApartment || ''}
            onChange={handleChange}
            required
          >
            <option value="" disabled>-- Байр сонгох --</option>
            {apartments.map((apartment) => (
              <option key={apartment.id} value={apartment.id}>
                {apartment.displayName || apartment.ApartmentName || `Apartment #${apartment.id}`}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default ApartmentSelector;