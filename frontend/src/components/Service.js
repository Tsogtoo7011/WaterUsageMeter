import React from 'react';

export function Services() {
  return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-4">Үйлчилгээ</h1>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-2">Төлбөр төлөх</h2>
            <p>Та онлайнаар төлбөрөө төлөх боломжтой.</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-2">Асуулт хариулт</h2>
            <p>Түгээмэл асуулт болон хариултууд.</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-2">Бидэнтэй холбогдох</h2>
            <p>Холбоо барих утас: 1800-1234</p>
          </div>
        </div>
      </div>
  );
}

export default Services;