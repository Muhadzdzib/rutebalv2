import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Listbox } from "@headlessui/react";
import { ChevronDownIcon } from "lucide-react";

export default function MapPage() {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const [halteAsal, setHalteAsal] = useState([]);
  const [halteTujuan, setHalteTujuan] = useState([]);
  const [asal, setAsal] = useState("");
  const [tujuan, setTujuan] = useState("");
  const [allRoutes, setAllRoutes] = useState([]);
  const polylinesRef = useRef([]);
  const markersRef = useRef([]);
  const [currentZoom, setCurrentZoom] = useState(13);
  const [showingShortestPath, setShowingShortestPath] = useState(false);

  // UI State
  const [estimasi, setEstimasi] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailSteps, setDetailSteps] = useState([]);

  // Icon
  const getIcon = (file, size = [32, 37]) =>
    L.icon({
      iconUrl: `/src/assets/img/${file}`,
      iconSize: size,
      iconAnchor: [16, 37],
      popupAnchor: [0, -30],
    });

  const getIconByJenis = (jenis) => {
    const mapping = {
      A1: "KoridorA.png",
      B1: "KoridorB.png",
      A2: "KoridorA2.png",
      B2: "KoridorB2.png",
      AB1: "KoridorAB1.png",
      AB2: "KoridorAB2.png",
      Trayek1: "Trayek1A.png",
      Trayek1B: "Trayek1B.png",
      Trayek2A: "Trayek2A.png",
      Trayek2B: "Trayek2B.png",
      Trayek3A: "Trayek3A.png",
      Trayek3B: "Trayek3B.png",
      Trayek5A: "Trayek5A.png",
      Trayek5B: "Trayek5b.png",
      Trayek6A: "Trayek6A.png",
      Trayek6: "Trayek6B.png",
      Trayek7A: "Trayek7A.png",
      Trayek7B: "Trayek7B.png",
      Trayek8A: "Trayek8A.png",
      Trayek8B: "Trayek8B.png",
      wisata: "Landscape.png",
      mall: "mall.png",
      pasar: "market.png",
      rumahsakit: "hospital.png",
      here: "Here.png",
    };
    if (!jenis || !mapping[jenis]) return null;
    return getIcon(mapping[jenis]);
  };

  const getColorByJenis = (jenisRel) => {
    if (!jenisRel) return "blue";
    if (jenisRel.includes("Rute_busA1")) return "#FFD63A";
    if (jenisRel.includes("Rute_busA2")) return "#FF823A";
    if (jenisRel.includes("Rute_busB1")) return "#3A54FF";
    if (jenisRel.includes("Rute_busB2")) return "#D43AFF";
    if (jenisRel.includes("Rute_Trayek1A")) return "#FE7743";
    if (jenisRel.includes("Rute_Trayek1B")) return "#FE7743";
    if (jenisRel.includes("Rute_Trayek2A")) return "#55ff00";
    if (jenisRel.includes("Rute_Trayek2B")) return "#55ff00";
    if (jenisRel.includes("Rute_Trayek3A")) return "#bcd3fd";
    if (jenisRel.includes("Rute_Trayek3B")) return "#bcd3fd";
    if (jenisRel.includes("Rute_Trayek5A")) return "#fdab01";
    if (jenisRel.includes("Rute_Trayek5B")) return "#fdab01";
    if (jenisRel.includes("Rute_Trayek6A")) return "#001294";
    if (jenisRel.includes("Rute_Trayek6B")) return "#001294";
    if (jenisRel.includes("Rute_Trayek7A")) return "#006308";
    if (jenisRel.includes("Rute_Trayek7B")) return "#006308";
    if (jenisRel.includes("Rute_Trayek8A")) return "#B6B095";
    if (jenisRel.includes("Rute_Trayek8B")) return "#B6B095";
    return "blue";
  };

  const renderMarkerWithPopup = (point, jenis, nama) => {
    if (!point || point.jenis === "titik") return null;
    const ico = getIconByJenis(jenis);
    const marker = L.marker(
      [point.latitude, point.longitude],
      ico ? { icon: ico } : {}
    );
    marker.bindPopup(
      `<b>${nama || point.nama || "Tanpa Nama"}</b><br/>Jenis: ${
        jenis || point.jenis || "-"
      }`
    );
    marker.addTo(leafletMap.current);
    markersRef.current.push(marker);
  };

  // === INIT MAP ===
  useEffect(() => {
    if (leafletMap.current) return;

    leafletMap.current = L.map(mapRef.current).setView([-1.2423, 116.8571], 13);

    leafletMap.current.on("zoomend", () => {
      setCurrentZoom(leafletMap.current.getZoom());
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(leafletMap.current);

    // Marker user
    const userLat = -1.2512;
    const userLng = 116.836882;
    L.marker([userLat, userLng], { icon: getIcon("Here.png", [32, 32]) })
      .addTo(leafletMap.current)
      .bindPopup("📍 Lokasi Anda Sekarang")
      .openPopup();
  }, []);

  // === FETCH data halte ===
  useEffect(() => {
    (async () => {
      try {
        const [asalRes, tujuanRes] = await Promise.all([
          fetch("http://localhost:3000/get-halte?kategori=Asal"),
          fetch("http://localhost:3000/get-halte?kategori=tujuan"),
        ]);
        setHalteAsal(await asalRes.json());
        setHalteTujuan(await tujuanRes.json());
      } catch (e) {
        console.error("Gagal memuat halte:", e);
      }
    })();
  }, []);

  // === FETCH semua rute awal ===
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://localhost:3000/get-data");
        const data = await res.json();
        setAllRoutes(data);
      } catch (e) {
        console.error("Gagal memuat rute:", e);
      }
    })();
  }, []);

  // === Utility clear map ===
  const clearMap = () => {
    polylinesRef.current.forEach((ln) => leafletMap.current.removeLayer(ln));
    markersRef.current.forEach((mk) => leafletMap.current.removeLayer(mk));
    polylinesRef.current = [];
    markersRef.current = [];
  };

  // === Render semua rute awal ===
  const renderAllRoutes = () => {
    if (!leafletMap.current || allRoutes.length === 0) return;

    clearMap();

    allRoutes.forEach((route) => {
      const jenisRel = route.relationship?.jenis;
      if (!jenisRel || jenisRel === "jalan_kaki" || jenisRel === "transisi")
        return;

      // Lazy load marker: hanya tampil jika zoom >= 14
      if (currentZoom >= 16) {
        renderMarkerWithPopup(
          route.source,
          route.source?.jenis,
          route.source?.nama
        );
        renderMarkerWithPopup(
          route.target,
          route.target?.jenis,
          route.target?.nama
        );
      }

      // Polyline tetap digambar
      const allPoints = [
        route.source,
        ...(route.filteredPath || []),
        route.target,
      ];
      const latlngs = allPoints.map((p) => [p.latitude, p.longitude]);
      const line = L.polyline(latlngs, {
        color: getColorByJenis(jenisRel),
        weight: 4,
        opacity: 0.8,
      }).addTo(leafletMap.current);

      polylinesRef.current.push(line);
    });
  };

  // Render ulang rute hanya jika tidak sedang menampilkan shortest path
  useEffect(() => {
    if (!showingShortestPath) {
      renderAllRoutes();
    }
  }, [allRoutes, currentZoom, showingShortestPath]);

  // === Shortest Path ===
  const fetchShortestPath = async () => {
    if (!asal || !tujuan) {
      alert("Pilih halte asal dan tujuan!");
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:3000/shortest-path?start=${asal}&end=${tujuan}`
      );
      if (!res.ok) throw new Error("Gagal mengambil shortest path");

      const data = await res.json();
      console.log("Shortest path:", data);

      // bersihkan semua polyline & marker lama
      clearMap();

      // gambar polyline merah
      const latlngs = data.path.map((p) => [p.latitude, p.longitude]);
      const line = L.polyline(latlngs, {
        color: "red",
        weight: 6,
        opacity: 0.9,
      }).addTo(leafletMap.current);

      polylinesRef.current.push(line);
      leafletMap.current.fitBounds(line.getBounds());

      // Tambahkan marker untuk titik awal dan akhir
      if (data.path && data.path.length > 0) {
        const first = data.path[0];
        const last = data.path[data.path.length - 1];
        renderMarkerWithPopup(first, first.jenis, first.nama);
        renderMarkerWithPopup(last, last.jenis, last.nama);
      }

      // === ✅ perhitungan estimasi sesuai rumus lama
      const jarak = data.totalCost ? data.totalCost.toFixed(2) : 0;
      const waktu = data.steps
        ? data.steps
            .reduce((acc, step) => acc + (step.waktu_tempuh || 0), 0)
            .toFixed(0)
        : 0;

      setEstimasi({ jarak, waktu });

      // set detail perjalanan
      setDetailSteps(data.steps || []);
      setShowingShortestPath(true); // Set flag agar renderAllRoutes tidak dipanggil
    } catch (e) {
      console.error("Error shortest path:", e);
    }
  };

  const resetMap = () => {
    setEstimasi(null);
    setDetailVisible(false);
    setShowingShortestPath(false); // Reset flag
    clearMap();
    renderAllRoutes();
  };

  // === Komponen Custom Select (Headless UI) ===
  const CustomSelect = ({ value, setValue, options, placeholder, icon }) => (
    <Listbox value={value} onChange={setValue}>
      <div className="relative mb-3">
        <Listbox.Button className="flex items-center w-full rounded-xl bg-[#1E1E1E]/90 text-white text-sm px-3 py-3 border border-[#0895E0]">
          <span className="mr-2 text-[#0895E0] text-lg">{icon}</span>
          <span className="truncate">
            {value
              ? options.find((o) => o.id_rute === value)?.nama
              : placeholder}
          </span>
          <ChevronDownIcon className="ml-auto text-[#0895E0]" size={18} />
        </Listbox.Button>

        <Listbox.Options className="absolute mt-2 w-full bg-[#1E1E1E] rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto border border-[#0895E0]/40">
          {options.map((h) => (
            <Listbox.Option
              key={h.id_rute}
              value={h.id_rute}
              className={({ active, selected }) =>
                `cursor-pointer px-3 py-2 text-sm ${
                  active ? "bg-[#0895E0]/40 text-white" : "text-gray-200"
                } ${selected ? "font-semibold text-[#0895E0]" : ""}`
              }
            >
              {h.nama}
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </div>
    </Listbox>
  );

  return (
    <section
      id="map-page"
      className="relative w-100% h-100% flex items-center pt-28 bg-[#212121] font-Poppins"
    >
      <div className="relative z-10 w-full flex flex-col md:flex-row mx-[10%] gap-6">
        {/* === Sidebar Kiri === */}
        <div className="w-full md:w-1/3 flex flex-col gap-6 text-white">
          {/* Title */}
          <div>
            <h2 className="text-3xl md:text-5xl text-[#0895E0] leading-tight">
              Rekomendasi
            </h2>
            <div className="h-1 w-24 bg-[#0895E0] rounded mt-3" />
          </div>

          {/* Form Pencarian */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 flex flex-col gap-4">
            <CustomSelect
              value={asal}
              setValue={setAsal}
              options={halteAsal}
              placeholder="Pilih Titik Awal"
              icon={
                <img
                  src={`${import.meta.env.BASE_URL}src/assets/img/start.png`}
                  alt="Titik Awal"
                  className="w-6 h-6 inline"
                />
              }
            />

            <CustomSelect
              value={tujuan}
              setValue={setTujuan}
              options={halteTujuan}
              placeholder="Pilih Destinasi"
              icon={
                <img
                  src={`${import.meta.env.BASE_URL}src/assets/img/finish.png`}
                  alt="Titik Awal"
                  className="w-6 h-6 inline"
                />
              }
            />

            <button
              onClick={fetchShortestPath}
              className="mt-2 bg-[#0895E0] hover:bg-white hover:text-[#067bbf] text-white py-3 px-5 rounded-xl transition"
            >
              Cari Rute !
            </button>
          </div>

          {/* Card Estimasi */}
          {estimasi && (
            <div className="bg-white/10 p-4 rounded-xl border border-white/20 shadow-lg max-w-sm w-full">
              <h3 className="text-lg text-[#067bbf] mb-2">
                Estimasi Jarak & Waktu
              </h3>
              <p>Jarak Tempuh: -+ {estimasi.jarak} km</p>
              <p>Waktu Tempuh: -+ {estimasi.waktu} menit</p>
              <div className="flex gap-3 mt-3">
                <button
                  onClick={() => setDetailVisible(true)}
                  className="bg-[#0895E0] hover:bg-[#067bbf] text-white px-4 py-2 rounded-lg"
                >
                  Detail
                </button>
                <button
                  onClick={resetMap}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
                >
                  Reset
                </button>
              </div>
            </div>
          )}

          {/* Legenda */}
          <div className="bg-white/5 p-4 rounded-xl border border-white/10 shadow-lg max-h-60 overflow-y-auto">
            <h3 className="text-lg text-[#0895E0] mb-3">Legenda</h3>
            <div className="grid grid-cols-2 gap-3">
              {/* Item-item legenda tetap sama */}
              {/* Item 1 */}
              <div className="flex items-center gap-2 border border-[#0895E0]/40 rounded-lg px-2 py-2">
                <img
                  src={`${import.meta.env.BASE_URL}src/assets/img/Trayek1A.png`}
                  alt="Angkot No 1 (A)"
                  className="w-6 h-6"
                />
                <span className="text-sm">Angkot No 1 (A)</span>
              </div>

              {/* Item 2 */}
              <div className="flex items-center gap-2 border border-[#0895E0]/40 rounded-lg px-2 py-2">
                <img
                  src={`${import.meta.env.BASE_URL}src/assets/img/Trayek1B.png`}
                  alt="Angkot No 1 (B)"
                  className="w-6 h-6"
                />
                <span className="text-sm">Angkot No 1 (B)</span>
              </div>

              {/* Item 3 */}
              <div className="flex items-center gap-2 border border-[#0895E0]/40 rounded-lg px-2 py-2">
                <img
                  src={`${import.meta.env.BASE_URL}src/assets/img/Trayek2A.png`}
                  alt="Angkot No 2 (A)"
                  className="w-6 h-6"
                />
                <span className="text-sm">Angkot No 2 (A)</span>
              </div>

              {/* Item 4 */}
              <div className="flex items-center gap-2 border border-[#0895E0]/40 rounded-lg px-2 py-2">
                <img
                  src={`${import.meta.env.BASE_URL}src/assets/img/Trayek2B.png`}
                  alt="Angkot No 2 (B)"
                  className="w-6 h-6"
                />
                <span className="text-sm">Angkot No 2 (B)</span>
              </div>

              {/* Item 5 */}
              <div className="flex items-center gap-2 border border-[#0895E0]/40 rounded-lg px-2 py-2">
                <img
                  src={`${import.meta.env.BASE_URL}src/assets/img/Trayek3A.png`}
                  alt="Angkot No 3 (A)"
                  className="w-6 h-6"
                />
                <span className="text-sm">Angkot No 3 (A)</span>
              </div>

              {/* Item 6 */}
              <div className="flex items-center gap-2 border border-[#0895E0]/40 rounded-lg px-2 py-2">
                <img
                  src={`${import.meta.env.BASE_URL}src/assets/img/Trayek3B.png`}
                  alt="Angkot No 3 (B)"
                  className="w-6 h-6"
                />
                <span className="text-sm">Angkot No 3 (B)</span>
              </div>

              {/* Item 7 */}
              <div className="flex items-center gap-2 border border-[#0895E0]/40 rounded-lg px-2 py-2">
                <img
                  src={`${import.meta.env.BASE_URL}src/assets/img/Trayek5A.png`}
                  alt="Angkot No 5 (A)"
                  className="w-6 h-6"
                />
                <span className="text-sm">Angkot No 5 (A)</span>
              </div>

              {/* Item 8 */}
              <div className="flex items-center gap-2 border border-[#0895E0]/40 rounded-lg px-2 py-2">
                <img
                  src={`${import.meta.env.BASE_URL}src/assets/img/Trayek5B.png`}
                  alt="Angkot No 5 (B)"
                  className="w-6 h-6"
                />
                <span className="text-sm">Angkot No 5 (B)</span>
              </div>

              {/* Item 9 */}
              <div className="flex items-center gap-2 border border-[#0895E0]/40 rounded-lg px-2 py-2">
                <img
                  src={`${import.meta.env.BASE_URL}src/assets/img/Trayek6A.png`}
                  alt="Angkot No 6 (A)"
                  className="w-6 h-6"
                />
                <span className="text-sm">Angkot No 6 (A)</span>
              </div>

              {/* Item 10 */}
              <div className="flex items-center gap-2 border border-[#0895E0]/40 rounded-lg px-2 py-2">
                <img
                  src={`${import.meta.env.BASE_URL}src/assets/img/Trayek6B.png`}
                  alt="Angkot No 6 (B)"
                  className="w-6 h-6"
                />
                <span className="text-sm">Angkot No 6 (B)</span>
              </div>

              {/* Item 11 */}
              <div className="flex items-center gap-2 border border-[#0895E0]/40 rounded-lg px-2 py-2">
                <img
                  src={`${import.meta.env.BASE_URL}src/assets/img/Trayek7A.png`}
                  alt="Angkot No 7 (A)"
                  className="w-6 h-6"
                />
                <span className="text-sm">Angkot No 7 (A)</span>
              </div>

              {/* Item 12 */}
              <div className="flex items-center gap-2 border border-[#0895E0]/40 rounded-lg px-2 py-2">
                <img
                  src={`${import.meta.env.BASE_URL}src/assets/img/Trayek7B.png`}
                  alt="Angkot No 7 (B)"
                  className="w-6 h-6"
                />
                <span className="text-sm">Angkot No 7 (B)</span>
              </div>

              {/* Item 11 */}
              <div className="flex items-center gap-2 border border-[#0895E0]/40 rounded-lg px-2 py-2">
                <img
                  src={`${import.meta.env.BASE_URL}src/assets/img/Trayek8A.png`}
                  alt="Angkot No 8 (A)"
                  className="w-6 h-6"
                />
                <span className="text-sm">Angkot No 8 (A)</span>
              </div>

              {/* Item 12 */}
              <div className="flex items-center gap-2 border border-[#0895E0]/40 rounded-lg px-2 py-2">
                <img
                  src={`${import.meta.env.BASE_URL}src/assets/img/Trayek8B.png`}
                  alt="Angkot No 8 (B)"
                  className="w-6 h-6"
                />
                <span className="text-sm">Angkot No 8 (B)</span>
              </div>

              {/* Item 13 */}
              <div className="flex items-center gap-2 border border-[#0895E0]/40 rounded-lg px-2 py-2">
                <img
                  src={`${import.meta.env.BASE_URL}src/assets/img/KoridorA.png`}
                  alt="Koridor A 1"
                  className="w-6 h-6"
                />
                <span className="text-sm">Koridor A 1</span>
              </div>

              {/* Item  14 */}
              <div className="flex items-center gap-2 border border-[#0895E0]/40 rounded-lg px-2 py-2">
                <img
                  src={`${
                    import.meta.env.BASE_URL
                  }src/assets/img/KoridorA2.png`}
                  alt="Koridor A 2"
                  className="w-6 h-6"
                />
                <span className="text-sm">Koridor A 2</span>
              </div>

              {/* Item 15 */}
              <div className="flex items-center gap-2 border border-[#0895E0]/40 rounded-lg px-2 py-2">
                <img
                  src={`${import.meta.env.BASE_URL}src/assets/img/KoridorB.png`}
                  alt="Koridor B 1"
                  className="w-6 h-6"
                />
                <span className="text-sm">Koridor B 1</span>
              </div>

              {/* Item  16 */}
              <div className="flex items-center gap-2 border border-[#0895E0]/40 rounded-lg px-2 py-2">
                <img
                  src={`${
                    import.meta.env.BASE_URL
                  }src/assets/img/KoridorB2.png`}
                  alt="Koridor B 2"
                  className="w-6 h-6"
                />
                <span className="text-sm">Koridor B 2</span>
              </div>

              {/* Item 17 */}
              <div className="flex items-center gap-2 border border-[#0895E0]/40 rounded-lg px-2 py-2">
                <img
                  src={`${
                    import.meta.env.BASE_URL
                  }src/assets/img/KoridorAB1.png`}
                  alt="Koridor AB 1"
                  className="w-6 h-6"
                />
                <span className="text-sm">Koridor AB 1</span>
              </div>

              {/* Item  18 */}
              <div className="flex items-center gap-2 border border-[#0895E0]/40 rounded-lg px-2 py-2">
                <img
                  src={`${
                    import.meta.env.BASE_URL
                  }src/assets/img/KoridorAB2.png`}
                  alt="Koridor AB 2"
                  className="w-6 h-6"
                />
                <span className="text-sm">Koridor AB 2</span>
              </div>

              {/* Item 19 */}
              <div className="flex items-center gap-2 border border-[#0895E0]/40 rounded-lg px-2 py-2">
                <img
                  src={`${import.meta.env.BASE_URL}src/assets/img/mall.png`}
                  alt="Mall"
                  className="w-6 h-6"
                />
                <span className="text-sm">Mall</span>
              </div>

              {/* Item  20 */}
              <div className="flex items-center gap-2 border border-[#0895E0]/40 rounded-lg px-2 py-2">
                <img
                  src={`${
                    import.meta.env.BASE_URL
                  }src/assets/img/landscape.png`}
                  alt="Landscape"
                  className="w-6 h-6"
                />
                <span className="text-sm">Wisata Alam</span>
              </div>

              {/* Item 21 */}
              <div className="flex items-center gap-2 border border-[#0895E0]/40 rounded-lg px-2 py-2">
                <img
                  src={`${import.meta.env.BASE_URL}src/assets/img/market.png`}
                  alt="Pasar"
                  className="w-6 h-6"
                />
                <span className="text-sm">Pasar</span>
              </div>

              {/* Item  22 */}
              <div className="flex items-center gap-2 border border-[#0895E0]/40 rounded-lg px-2 py-2">
                <img
                  src={`${import.meta.env.BASE_URL}src/assets/img/hospital.png`}
                  alt="Rumah Sakit"
                  className="w-6 h-6"
                />
                <span className="text-sm">Rumah Sakit</span>
              </div>
            </div>
          </div>
        </div>

        {/* === Map Kanan === */}
        <div className="w-full md:w-2/3 relative">
          <div className="w-full h-[520px] md:h-[600px] bg-white/10 backdrop-blur-lg rounded-2xl shadow-lg overflow-hidden border border-white/20">
            <div ref={mapRef} id="map" className="w-full h-full" />
          </div>

          {/* Card Detail Perjalanan */}
          {detailVisible && (
            <div className="absolute top-4 right-4 w-80 bg-white/5 backdrop-blur-lg border border-white/30 p-4 rounded-xl shadow-xl text-black max-h-[90%] overflow-y-auto">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg text-[#0895E0] font-semibold">
                  Detail Perjalanan
                </h3>
                <button
                  onClick={() => setDetailVisible(false)}
                  className="text-red-500 font-bold"
                >
                  ✕
                </button>
              </div>
              {detailSteps.length === 0 ? (
                <p>Tidak ada detail perjalanan.</p>
              ) : (
                <ol className="space-y-3 list-decimal list-inside">
                  {detailSteps.map((s, i) => (
                    <li key={i} className="text-sm">
                      <strong>
                        Rute dari {s.start} ke {s.end}
                      </strong>
                      <br />
                      <span className="text-[#0895E0] text-xs">
                        Jarak: {s.jarak_tempuh?.toFixed(2)} km, Waktu:{" "}
                        {s.waktu_tempuh?.toFixed(0)} ± menit
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
