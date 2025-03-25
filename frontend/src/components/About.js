import React from 'react';

export function About() {
  return (
    <div className="grid grid-cols-2 gap-4 items-center p-6"> {/* Add padding to the container */}
      {/* Зүүн талын текст */}
      <div>
        <h1 className="text-2xl font-bold text-blue-700 mb-2">Бидний тухай</h1>
        <p className="text-gray-700">
          Өмнөх үеийн систем нь хэрэглэгчийн шаардлагыг хангахад найдвартай байдал сул байсан тул
          сайжруулалт хийх шаардлагатай болсон.
        </p>
        <p className="mt-2 text-gray-700">
          Манай систем нь хэрэглэгчдэд усыг зөв зохистой хэрэглэх боломжийг олгож, 
          хэрэглээг хянахад хялбар байлгах зорилготой.
        </p>
      </div>

      {/* Баруун талын зураг */}
      <div>
        <img
          src="your-image-url-here.jpg"
          alt="Усны тоолуур"
          className="rounded-lg shadow-md"
        />
      </div>
    </div>
  );
}

export default About;
