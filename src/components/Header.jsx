import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="w-full font-Poppins bg-white shadow-md z-50">
      <div className="w-full px-[10%] py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-[#0895E0]">
          Rutebal
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex space-x-6 font-medium text-gray-700">
          <Link to="/panduan" className="hover:text-[#0895E0]">
            Panduan
          </Link>
          <Link to="/informasi" className="hover:text-[#0895E0]">
            Informasi
          </Link>
          <Link to="/map" className="hover:text-[#0895E0]">
            Peta Rute
          </Link>
        </nav>

        {/* Burger mobile */}
        <button
          className="md:hidden text-gray-700"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Dropdown mobile */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 text-gray-700 px-6 py-4 space-y-4">
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
