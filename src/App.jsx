import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Hero from "./pages/Hero";
import Panduan from "./pages/Panduan";
import Informasi from "./pages/Informasi";
import Map from "./pages/Map";

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Hero />} />
        <Route path="/panduan" element={<Panduan />} />
        <Route path="/informasi" element={<Informasi />} />
        <Route path="/map" element={<Map />} />
      </Routes>
    </BrowserRouter>
  );
}
