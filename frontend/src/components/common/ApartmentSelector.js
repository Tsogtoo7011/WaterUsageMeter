import React from 'react';

const ApartmentSelector = ({ apartments, selectedApartmentId, onChange }) => {
  if (!apartments || apartments.length === 0) {
    return null;
  }
  
  return (
    <div className="w-full max-w-xs">
      <label htmlFor="apartment-select" className="block text-sm font-medium text-gray-700 mb-1">
        Select Apartment
      </label>
      <select
        id="apartment-select"
        value={selectedApartmentId || ''}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
      >
        {apartments.map((apartment) => (
          <option key={apartment.id} value={apartment.id}>
            {apartment.displayName}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ApartmentSelector;