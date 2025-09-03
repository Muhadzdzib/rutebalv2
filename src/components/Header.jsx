import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";

export default function Header() {
  const [show, setShow] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > lastScrollY) {
        setShow(false);
      } else {
        setShow(true);
      }
      setLastScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <header
      className={`fixed top-0 left-0 w-full font-Poppins backdrop-blur-md bg-white/10 shadow-sm z-50 transition-transform duration-500 ${
        show ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="w-full px-[10%] py-4 flex items-center justify-between">
        {/* Logo jadi link ke home */}
        <Link to="/" className="text-2xl font-bold text-[#0895E0]">
          Rutebal
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex space-x-6 font-medium text-white">
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
          className="md:hidden text-white"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Dropdown mobile */}
      {menuOpen && (
        <div className="md:hidden bg-black/70 backdrop-blur-md text-white px-6 py-4 space-y-4">
          <Link to="/panduan" className="block hover:text-[#0895E0]" onClick={() => setMenuOpen(false)}>
            Panduan
          </Link>
          <Link to="/informasi" className="block hover:text-[#0895E0]" onClick={() => setMenuOpen(false)}>
            Informasi
          </Link>
          <Link to="/map" className="block hover:text-[#0895E0]" onClick={() => setMenuOpen(false)}>
            Peta Rute
          </Link>
        </div>
      )}
    </header>
  );
}
