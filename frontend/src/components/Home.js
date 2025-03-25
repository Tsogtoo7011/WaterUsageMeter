import React from 'react';

function Home() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center">
      <div className="bg-white p-8 rounded-xl shadow-md w-96 text-center">
        <h1 className="text-3xl font-bold mb-4 text-gray-800">Welcome Home</h1>
        <p className="text-gray-600 mb-6">You've successfully logged in!</p>      
      </div>
    </div>
  );
}

export default Home;