import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section
      id="home"
      className="relative w-full h-screen flex items-center bg-black font-Poppins"
    >
      {/* Background image */}
      <img
        src="/src/assets/img/bg-balikpapan.png"
        alt="Balikpapan"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Overlay biar teks lebih jelas */}
      <div className="absolute inset-0 bg-black/40"></div>

      <div className="relative z-10 max-w-3xl mx-[10%] text-left">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-[#0895E0] mb-6">
          Rutebal
        </h1>
        <p className="text-base md:text-lg lg:text-xl text-white leading-relaxed mb-8 text-justify">
          Sistem rekomendasi berbasis website yang dirancang untuk membantu
          calon penumpang transportasi umum di Kota Balikpapan mencapai tujuan
          perjalanan dengan rute terpendek.
        </p>

        {/* Tombol pakai Link */}
        <Link
          to="/map"
          className="inline-block px-6 py-3 text-base md:text-lg font-semibold text-[#0895E0] 
            bg-white/5 backdrop-blur-md border border-white/20 
            rounded-xl shadow-lg hover:bg-white/10 transition"
        >
          Cari Rute !
        </Link>
      </div>
    </section>
  );
}
