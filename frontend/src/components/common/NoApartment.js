import React from 'react';

const NoApartment = ({ 
  title = "Таньд холбоотой байр байхгүй байна",
  description = "Үйлчилгээг ашиглахын тулд эхлээд байраа бүртгүүлнэ үү.",
  buttonText = "Байр нэмэх",
  buttonHref = "/profile/apartment",
  iconColor = "blue"
}) => {
  const colorClasses = {
    blue: {
      bg: "bg-white",
      border: "border-[#2D6B9F]/30",
      text: "text-[#2D6B9F]",
      button: "bg-[#2D6B9F]/90 hover:bg-[#2D6B9F] focus:ring-[#2D6B9F]"
    },
    yellow: {
      bg: "bg-yellow-50",
      border: "border-yellow-200", 
      text: "text-yellow-600",
      button: "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500"
    }
  };

  const colors = colorClasses[iconColor] || colorClasses.blue;

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className={`flex flex-col items-center justify-center w-full max-w-3xl p-8 mb-6 text-center ${colors.bg} border ${colors.border} rounded-lg shadow`}>
        <div className={`mb-4 ${colors.text}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h2 className="mb-4 text-xl font-bold text-gray-800">{title}</h2>
        <p className="mb-6 text-gray-600">{description}</p>
        <a 
          href={buttonHref}
          className={`px-6 py-3 text-white transition-all ${colors.button} rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2`}
        >
          {buttonText}
        </a>
      </div>
    </div>
  );
};

export default NoApartment;