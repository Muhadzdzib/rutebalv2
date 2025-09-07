import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 w-full z-50 font-Poppins">
      <div
        className="mx-[10%] my-3 flex items-center justify-between
        bg-white/10 backdrop-blur-md border border-white/20
        rounded-full px-6 py-4 shadow-lg"
      >
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-[#0895E0]">
          Rutebal
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex space-x-6 font-medium text-white">
          <Link to="/panduan" className="hover:text-[#0895E0] transition">
            Panduan
          </Link>
          <Link to="/informasi" className="hover:text-[#0895E0] transition">
            Informasi
          </Link>
          <Link to="/map" className="hover:text-[#0895E0] transition">
            Peta Rute
          </Link>
        </nav>

        {/* Burger mobile */}
        <button
          className="md:hidden text-white"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Dropdown mobile */}
      {menuOpen && (
        <div
          className="md:hidden mx-[10%] mt-2 bg-white/10 backdrop-blur-md
          border border-white/20 rounded-xl shadow-lg
          text-white px-6 py-4 space-y-4"
        >
          <Link
            to="/panduan"
            className="block hover:text-[#0895E0]"
            onClick={() => setMenuOpen(false)}
          >
            Panduan
          </Link>
          <Link
            to="/informasi"
            className="block hover:text-[#0895E0]"
            onClick={() => setMenuOpen(false)}
          >
            Informasi
          </Link>
          <Link
            to="/map"
            className="block hover:text-[#0895E0]"
            onClick={() => setMenuOpen(false)}
          >
            Peta Rute
          </Link>
        </div>
      )}
    </header>
  );
}
