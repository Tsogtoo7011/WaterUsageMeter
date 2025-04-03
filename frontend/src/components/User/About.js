import React from 'react';
import watermeterImage from '../../figures/images/watermeter.png';

export function About() {
  return (
    <div className="bg-white min-h-screen">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center p-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-blue-700 mb-4">Бидний тухай</h1>
        <p className="text-gray-700 text-justify mb-4">
          Өмнө үеийн систем нь хэрэглэгчийн шаардлагыг хангахад, найдвартай байдал сул байсан тул
          сайжруулалт хийх шаардлагатай болсон. Хэрэглэгчийн хэрэгцээнд шаардлагыг хангахуйц систем нь зөв ашиглах, 
          үнэ төлбөргүй найдвартай байдлыг хангахад чиглэсэн бүтээлч хандлагыг нэвтрүүлэх зорилготой.
        </p>
        <p className="text-gray-700 text-justify">
          Манай хөгжүүлж буй орчин сууцны айл өрхийн усны хэрэглээг хянах боломжийг олгож, хэмнэлтийг дэмжих, 
          хэрэглээг зөв зохистой төлөвлөх, төлбөрийн мэдээллийг цаг тухайд нь хүргэх зорилготой. Энэхүү систем нь 
          зөвхөн хэрэглэгчдэд бус, нийтийн усны менежментэд ч давуу талтай.
        </p>
      </div>

      <div className="flex justify-center">
        <img
          src={watermeterImage}
          alt="Усны тоолуур"
          className="rounded-lg shadow-md max-w-full h-auto"
        />
      </div>
      
      <div className="md:col-span-2 mt-6">
        <h2 className="text-xl font-bold text-blue-700 mb-4">Зорилго</h2>
        <p className="text-gray-700 text-justify">
          Энэхүү айл өрхийн усны хэрэглээг тоолуураар заалттай бүртгэх системийн зорилго нь орон сууцанд амьдардаг айл өрхийн 
          усны хэрэглээг зөв зохистой төлөвлөх, хэмнэх боломжийг олгоход чиглэгдэнэ. Энэ нь хэрэглээний хэтрүүлгээс сэргийлэх, 
          төлбөр тооцоог үнэн зөв мэдээллээр хангах давуу талтай.
        </p>
      </div>
    </div>
  </div>
  );
}

export default About;