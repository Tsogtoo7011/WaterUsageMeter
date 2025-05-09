import React from 'react';
import { Home } from 'lucide-react';

const ApartmentSelector = ({ apartments, selectedApartment, onChange }) => {
  if (!apartments || apartments.length === 0) {
    return (
      <div className="text-yellow-600">
        No apartments available for selection.
      </div>
    );
  }

  const handleChange = (e) => {
    const selectedId = e.target.value;
    onChange(selectedId);
  };

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Home size={16} className="text-gray-500" />
      </div>
      <select
        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={selectedApartment || ''}
        onChange={handleChange}
        required
      >
        <option value=""disabled>-- Select an apartment --</option>
        {apartments.map((apartment) => (
          <option key={apartment.id} value={apartment.id}>
            {apartment.displayName || apartment.ApartmentName || `Apartment #${apartment.id}`}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ApartmentSelector;