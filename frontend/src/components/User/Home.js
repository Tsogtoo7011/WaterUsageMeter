import React from "react";

function Home() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Greeting Card */}
        <div className="bg-blue-100 p-6 rounded-xl shadow-md w-96 text-left flex items-center">
          <div>
            <h2 className="text-x2 font-bold text-blue-900">Өдрийн мэнд 👋</h2>
            <p className="text-gray-700 mt-2">
            </p>
          </div>
        </div>       
      </div>
    </div>
  );
}

export default Home;
