import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

  // UI State
  const [estimasi, setEstimasi] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailSteps, setDetailSteps] = useState([]);

  // === Lazy Load ICON ===
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
      Trayek6B: "Trayek6B.png",
      Trayek7A: "Trayek7A.png",
      Trayek7B: "Trayek7B.png",
      Trayek8A: "Trayek8A.png",
      Trayek8B: "Trayek8B.png",
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

  // === INIT MAP ===
  useEffect(() => {
    if (leafletMap.current) return;

    leafletMap.current = L.map(mapRef.current).setView([-1.2423, 116.8571], 13);

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

      // Marker source
      if (route.source?.jenis !== "titik") {
        const ico = getIconByJenis(route.source.jenis);
        const m = L.marker(
          [route.source.latitude, route.source.longitude],
          ico ? { icon: ico } : {}
        );
        m.addTo(leafletMap.current);
        markersRef.current.push(m);
      }

      // Marker target
      if (route.target?.jenis !== "titik") {
        const ico = getIconByJenis(route.target.jenis);
        const m = L.marker(
          [route.target.latitude, route.target.longitude],
          ico ? { icon: ico } : {}
        );
        m.addTo(leafletMap.current);
        markersRef.current.push(m);
      }

      // Polyline rute
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

  useEffect(() => {
    renderAllRoutes();
  }, [allRoutes]);

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
    } catch (e) {
      console.error("Error shortest path:", e);
    }
  };

  const resetMap = () => {
    setEstimasi(null);
    setDetailVisible(false);
    clearMap();
    renderAllRoutes();
  };

  return (
    <section
      id="map-page"
      className="relative w-full h-screen flex items-center bg-[#212121] font-Poppins"
    >
      <img
        src="/src/assets/img/bg-jalan.png"
        alt="Balikpapan"
        className="absolute inset-0 w-full h-full object-cover opacity-30"
      />

      <div className="relative z-10 w-full flex flex-col md:flex-row mx-[10%] gap-6">
        {/* Kiri: Form */}
        <div className="w-full md:w-1/3 text-left text-white">
          <h2 className="text-3xl md:text-5xl font-bold text-[#0895E0] leading-tight">
            Cari Rute
            <br />
            Terpendek
          </h2>
          <div className="h-1 w-24 bg-[#0895E0] rounded mt-3 mb-6" />

          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 flex flex-col gap-4">
            {/* Asal */}
            <div>
              <label className="block text-sm mb-2">Pilih Halte Asal</label>
              <select
                value={asal}
                onChange={(e) => setAsal(e.target.value)}
                className="p-3 rounded-xl text-black text-sm w-full"
              >
                <option value="">Pilih Halte Asal</option>
                {halteAsal.map((h) => (
                  <option key={h.id_rute} value={h.id_rute}>
                    {h.nama}
                  </option>
                ))}
              </select>
            </div>

            {/* Tujuan */}
            <div>
              <label className="block text-sm mb-2">Pilih Halte Tujuan</label>
              <select
                value={tujuan}
                onChange={(e) => setTujuan(e.target.value)}
                className="p-3 rounded-xl text-black text-sm w-full"
              >
                <option value="">Pilih Halte Tujuan</option>
                {halteTujuan.map((h) => (
                  <option key={h.id_rute} value={h.id_rute}>
                    {h.nama}
                  </option>
                ))}
              </select>
            </div>

            {/* Tombol Cari */}
            <button
              onClick={fetchShortestPath}
              className="mt-4 bg-[#0895E0] hover:bg-[#067bbf] text-white py-3 px-5 rounded-xl font-semibold"
            >
              Cari Rute Terpendek
            </button>
          </div>

          {/* Card Estimasi */}
          {estimasi && (
            <div className="mt-6 bg-white/10 p-4 rounded-xl border border-white/20 shadow-lg">
              <h3 className="text-lg font-semibold mb-2">
                Estimasi Jarak & Waktu
              </h3>
              <p>Jarak Tempuh: ~ {estimasi.jarak} km</p>
              <p>Waktu Tempuh: ~ {estimasi.waktu} menit</p>
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
        </div>

        {/* Kanan: Map */}
        <div className="w-full md:w-2/3 relative">
          <div className="w-full h-[520px] md:h-[600px] bg-white/10 backdrop-blur-lg rounded-2xl shadow-lg overflow-hidden border border-white/20">
            <div ref={mapRef} id="map" className="w-full h-full" />
          </div>

          {/* Card Detail Perjalanan */}
          {detailVisible && (
            <div className="absolute top-4 right-4 w-80 bg-white/90 p-4 rounded-xl shadow-xl text-black max-h-[90%] overflow-y-auto">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold">Detail Perjalanan</h3>
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
                      </strong>{" "}
                      <br />
                      <span className="text-gray-600 text-xs">
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
