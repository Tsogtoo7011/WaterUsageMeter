import React from 'react';

export function Feedback() {
  return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-4">Санал хүсэлт гомдол</h1>
        <form className="max-w-lg">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
              Таны нэр
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
              id="name"
              type="text"
              placeholder="Таны нэр"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="message">
              Таны санал хүсэлт
            </label>
            <textarea
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
              id="message"
              rows="4"
              placeholder="Таны санал хүсэлт эсвэл гомдлыг энд бичнэ үү"
            ></textarea>
          </div>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            type="submit"
          >
            Илгээх
          </button>
        </form>
      </div>
  );
}

export default Feedback;