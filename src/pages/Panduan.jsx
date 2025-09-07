import { useState } from "react";
import { ChevronDown } from "lucide-react";

const steps = [
  {
    id: 1,
    title: "Tentukan titik awal terdekat",
    content:
      "Click icon/gambar untuk melihat nama titik (Scroll untuk menampilkan icon)",
  },
  {
    id: 2,
    title: "Masukan titik awal dan titik tujuan",
    content: "Input titik awal dan tujuan pada form yang tersedia",
  },
  {
    id: 3,
    title: "Tekan tombol cari rute !",
    content: "Click button cari rute untuk menemukan rekomendasi rute.",
  },
  {
    id: 4,
    title: "Lihat visualisasi rekomendasi rute pada maps",
    content:
      "Sistem akan menampilkan visualisasi rute, card rekomendasi dan perjalanan detail pada maps",
  },
  {
    id: 5,
    title: "Menampilkan estimasi jarak & waktu tempuh pada card yang muncul",
    content:
      "Sistem akan menampilkan estimasi jarak & waktu tempuh pada card yang muncul",
  },
  {
    id: 6,
    title: "Menampilkan rincian rute perjalanan (titik yang akan dilewati)",
    content:
      "Untuk melihat rincian rute perjalanan, klik detail pada card estimasi",
  },
];

export default function Panduan() {
  const [open, setOpen] = useState(null);

  const toggle = (id) => {
    setOpen(open === id ? null : id);
  };

  return (
    <section
      id="home"
      className="relative w-100% h-screen pt-28 flex items-center justify-center bg-[#212121] font-Poppins"
    >
      <div className="relative z-10 max-w-3xl mx-[10%] text-left">
        <h2 className="text-4xl font-bold text-[#0895E0] mb-8">
          Panduan Penggunaan
        </h2>
        <div className="w-full space-y-4">
          {steps.map((step) => (
            <div
              key={step.id}
              className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-2xl px-6 py-3 shadow-md cursor-pointer"
              onClick={() => toggle(step.id)}
            >
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-3">
                  <span className="text-[#0895E0] font-bold text-lg">
                    {String(step.id).padStart(2, "0")}
                  </span>
                  <span className="text-gray-200">{step.title}</span>
                </span>
                <ChevronDown
                  className={`text-gray-300 transition-transform duration-300 ${
                    open === step.id ? "rotate-180" : ""
                  }`}
                />
              </div>
              {open === step.id && (
                <div className="mt-3 text-gray-400 pl-10">{step.content}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
