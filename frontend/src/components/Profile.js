import React, { useState } from "react";

export function Profile() {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="w-full max-w-4xl mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
      {/* Cover Image */}
      <div className="relative w-full h-60">
        <img
          src="https://source.unsplash.com/1600x600/?nature,water"
          alt="Cover"
          className="w-full h-full object-cover rounded-t-lg"
        />
        {/* Profile Image */}
        <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
          <img
            src="https://source.unsplash.com/150x150/?cartoon,avatar"
            alt="Profile"
            className="w-32 h-32 rounded-full border-4 border-white"
          />
        </div>
      </div>
      
      {/* Tab navigation */}
      <div className="mt-20 flex border-b pb-2 mb-4 text-center justify-center">
        <button
          className={`mr-4 pb-2 text-lg font-semibold ${activeTab === "profile" ? "border-b-2 border-black" : "text-gray-500"}`}
          onClick={() => setActiveTab("profile")}
        >
          👤 Профайл
        </button>
        <button
          className={`pb-2 text-lg font-semibold ${activeTab === "security" ? "border-b-2 border-black" : "text-gray-500"}`}
          onClick={() => setActiveTab("security")}
        >
          🔑 Нууцлал
        </button>
      </div>

      {activeTab === "profile" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-600">Хэрэглэгчийн код</label>
            <input type="text" value="16104647" disabled className="w-full border p-2 rounded-md bg-gray-100" />
          </div>
          <div>
            <label className="block text-gray-600">И-Баримтын код</label>
            <input type="text" value="13937320" className="w-full border p-2 rounded-md" />
          </div>
          <div>
            <label className="block text-gray-600">Овог</label>
            <input type="text" value="Цэнд-Очир" className="w-full border p-2 rounded-md" />
          </div>
          <div>
            <label className="block text-gray-600">Нэр</label>
            <input type="text" value="Цогтбаяр" className="w-full border p-2 rounded-md" />
          </div>
          <div>
            <label className="block text-gray-600">Имэйл хаяг</label>
            <input type="email" value="tsogtoo7011@gmail.com" className="w-full border p-2 rounded-md" />
          </div>
          <div>
            <label className="block text-gray-600">Утасны дугаар</label>
            <input type="text" value="95605788" className="w-full border p-2 rounded-md" />
          </div>
          <div className="col-span-2 flex justify-end">
            <button className="px-6 py-2 bg-gray-800 text-white rounded-md">Хадгалах</button>
          </div>
        </div>
      )}
      {activeTab === "security" && (
        <div className="text-center text-gray-500">Нууцлалын тохиргоо хараахан бэлэн болоогүй байна.</div>
      )}
    </div>
  );
}

export default Profile;
