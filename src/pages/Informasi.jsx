import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function Informasi() {
  // ====== STATES & REFS ======
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const [allRoutes, setAllRoutes] = useState([]);
  const [selectedJenis, setSelectedJenis] = useState([]);
  const polylinesRef = useRef([]);
  const markersRef = useRef([]);

  // ====== ICON DEFINITIONS (pakai file di /public/img) ======
  const icons = useMemo(() => {
    const mk = (file, size = [32, 37]) =>
      L.icon({ iconUrl: `/src/assets/img/${file}`, iconSize: size, iconAnchor: [16, 37], popupAnchor: [0, -30] });

    return {
      A1: mk("KoridorA.png", [25, 25]),
      B1: mk("KoridorB.png", [25, 25]),
      A2: mk("KoridorA2.png", [25, 25]),
      B2: mk("KoridorB2.png", [25, 25]),
      AB1: mk("KoridorAB1.png", [25, 25]),
      AB2: mk("KoridorAB2.png", [25, 25]),
      Trayek1: mk("Trayek1A.png"),
      Trayek1B: mk("Trayek1B.png"),
      Trayek2A: mk("Trayek2A.png"),
      Trayek2B: mk("Trayek2B.png"),
      Trayek3A: mk("Trayek3A.png"),
      Trayek3B: mk("Trayek3B.png"),
      Trayek5A: mk("Trayek5A.png"),
      Trayek5B: mk("Trayek5b.png"),
      Trayek6A: mk("Trayek6A.png"),
      Trayek6B: mk("Trayek6B.png"),
      Trayek7A: mk("Trayek7A.png"),
      Trayek7B: mk("Trayek7B.png"),
      Trayek8A: mk("Trayek8A.png"),
      Trayek8B: mk("Trayek8B.png"),
      here: mk("Here.png", [32, 32]),
    };
  }, []);

  const getIconByJenis = (jenis) => (jenis ? icons[jenis] ?? null : null);

  const getColorByJenis = (jenisRel) => {
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

  const getPriority = (jenisRel) => {
    if (!jenisRel) return 0;
    if (jenisRel.includes("Rute_busA1")) return 180;
    if (jenisRel.includes("Rute_busA2")) return 170;
    if (jenisRel.includes("Rute_busB1")) return 160;
    if (jenisRel.includes("Rute_busB2")) return 150;
    if (jenisRel.includes("Rute_Trayek2A")) return 200;
    if (jenisRel.includes("Rute_Trayek2B")) return 200;
    if (jenisRel.includes("Rute_Trayek1A")) return 140;
    if (jenisRel.includes("Rute_Trayek1B")) return 139;
    if (jenisRel.includes("Rute_Trayek3A")) return 120;
    if (jenisRel.includes("Rute_Trayek3B")) return 119;
    if (jenisRel.includes("Rute_Trayek5A")) return 110;
    if (jenisRel.includes("Rute_Trayek5B")) return 109;
    if (jenisRel.includes("Rute_Trayek6A")) return 100;
    if (jenisRel.includes("Rute_Trayek6B")) return 99;
    if (jenisRel.includes("Rute_Trayek7A")) return 90;
    if (jenisRel.includes("Rute_Trayek7B")) return 89;
    if (jenisRel.includes("Rute_Trayek8A")) return 80;
    if (jenisRel.includes("Rute_Trayek8B")) return 79;
    return 1;
  };

  // ====== INIT MAP (sekali) ======
  useEffect(() => {
    if (leafletMap.current) return;

    leafletMap.current = L.map(mapRef.current).setView([-1.2423, 116.8571], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(
      leafletMap.current
    );

    // Lokasi user (contoh: pakai koordinat yang kamu set di proyek lama)
    const userLat = -1.2512;
    const userLng = 116.836882;
    const userMarker = L.marker([userLat, userLng], { icon: icons.here, title: "Lokasi Anda" })
      .addTo(leafletMap.current)
      .bindPopup("📍 Lokasi Anda Sekarang", { autoPanPadding: [20, 50] })
      .openPopup();

    leafletMap.current.setView([userLat - 0.002, userLng], 15);

    // kontrol visibilitas marker saat zoom
    leafletMap.current.on("zoomend", updateMarkerVisibility);
  }, [icons]);

  // ====== FETCH DATA ======
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://localhost:3000/get-data");
        const data = await res.json();
        setAllRoutes(data);

        const jenisList = data
          .map((r) => r.relationship?.jenis)
          .filter((j) => j && j !== "jalan_kaki" && j !== "transisi");

        setSelectedJenis([...new Set(jenisList)]); // default: semua aktif
      } catch (e) {
        console.error("Gagal memuat data rute:", e);
      }
    })();
  }, []);

  // ====== RENDER PETA SAAT FILTER BERUBAH ======
  useEffect(() => {
    if (!leafletMap.current || allRoutes.length === 0) return;
    renderRoutes(selectedJenis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedJenis, allRoutes]);

  // ====== UTIL ======
  const clearMap = () => {
    polylinesRef.current.forEach((ln) => leafletMap.current.removeLayer(ln));
    markersRef.current.forEach((mk) => leafletMap.current.removeLayer(mk));
    polylinesRef.current = [];
    markersRef.current = [];
  };

  const minZoomToShowMarkers = 16;
  const updateMarkerVisibility = () => {
    if (!leafletMap.current) return;
    const show = leafletMap.current.getZoom() >= minZoomToShowMarkers;
    markersRef.current.forEach((m) => {
      const has = leafletMap.current.hasLayer(m);
      if (show && !has) m.addTo(leafletMap.current);
      if (!show && has) leafletMap.current.removeLayer(m);
    });
  };

  const renderRoutes = (filtered) => {
    clearMap();

    const sortedRoutes = [...allRoutes].sort(
      (a, b) => getPriority(a.relationship?.jenis || "") - getPriority(b.relationship?.jenis || "")
    );

    sortedRoutes.forEach((route) => {
      const jenisRel = route.relationship?.jenis;
      if (!jenisRel || jenisRel === "jalan_kaki" || jenisRel === "transisi") return;

      const cocok = filtered.some((val) => {
        if (!val) return false;
        return jenisRel.toLowerCase().includes(val.toLowerCase());
      });
      if (!cocok) return;

      // markers (source/target, kecuali 'titik')
      if (route.source?.jenis !== "titik") {
        const ico = getIconByJenis(route.source.jenis);
        const m = L.marker([route.source.latitude, route.source.longitude], ico ? { icon: ico } : {});
        m.bindPopup(`<b>${route.source.nama}</b><br/>Jenis: ${route.source.jenis}`);
        markersRef.current.push(m);
      }
      if (route.target?.jenis !== "titik") {
        const ico = getIconByJenis(route.target.jenis);
        const m = L.marker([route.target.latitude, route.target.longitude], ico ? { icon: ico } : {});
        m.bindPopup(`<b>${route.target.nama}</b><br/>Jenis: ${route.target.jenis}`);
        markersRef.current.push(m);
      }

      // polyline
      const allPoints = [route.source, ...(route.filteredPath || []), route.target];
      const latlngs = allPoints.map((p) => [p.latitude, p.longitude]);
      const line = L.polyline(latlngs, {
        color: getColorByJenis(jenisRel),
        weight: 5,
        opacity: 1,
      }).addTo(leafletMap.current);

      polylinesRef.current.push(line);
    });

    updateMarkerVisibility();
  };

  // ====== UI: checkbox filter dari jenis unik ======
  const uniqueJenis = useMemo(() => {
    const list = allRoutes
      .map((r) => r.relationship?.jenis)
      .filter((j) => j && j !== "jalan_kaki" && j !== "transisi");
    return [...new Set(list)];
  }, [allRoutes]);

  const toggleJenis = (jenis) => {
    setSelectedJenis((prev) =>
      prev.includes(jenis) ? prev.filter((j) => j !== jenis) : [...prev, jenis]
    );
  };

  return (
    <section
      id="informasi"
      className="relative w-full h-screen flex items-center bg-[#212121] font-Poppins"
    >
      <img
        src="/src/assets/img/bg-jalan.png"
        alt="Balikpapan"
        className="absolute inset-0 w-full h-full object-cover opacity-30"
      />

      {/* === KONTEN === */}
      <div className="relative z-10 w-full flex flex-col md:flex-row mx-[10%] gap-6">
        {/* Kiri: Judul + Filter */}
        <div className="w-full md:w-1/3 text-left text-white">
          <h2 className="text-3xl md:text-5xl font-bold text-[#0895E0] leading-tight">
            Informasi<br />Jalur Trayek
          </h2>
          <div className="h-1 w-24 bg-[#0895E0] rounded mt-3 mb-6" />

          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 max-h-[560px] overflow-y-auto">
            <p className="text-sm text-white/80 mb-3">Filter Jenis Rute:</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2">
              {uniqueJenis.map((jenis) => (
                <label
                  key={jenis}
                  className="flex items-center gap-2 bg-black/30 border border-black/20 rounded-lg px-3 py-2 cursor-pointer hover:bg-white/10"
                >
                  <input
                    type="checkbox"
                    className="accent-[#0895E0] w-4 h-4"
                    checked={selectedJenis.includes(jenis)}
                    onChange={() => toggleJenis(jenis)}
                  />
                  <span className="text-sm">{jenis}</span>
                </label>
              ))}
              {uniqueJenis.length === 0 && (
                <span className="text-sm text-white/60">Memuat daftar rute…</span>
              )}
            </div>
          </div>
        </div>

        {/* Kanan: Peta */}
        <div className="w-full md:w-2/3">
          <div className="w-full h-[520px] md:h-[600px] bg-white/10 backdrop-blur-lg rounded-2xl shadow-lg overflow-hidden border border-white/20">
            <div ref={mapRef} id="map" className="w-full h-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
