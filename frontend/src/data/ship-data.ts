export type ShipStatus = "berlayar" | "sandar" | "perawatan";

export type ShipRow = {
  id: string;
  name: string;
  barge: string;
  type: string;
  capacityTon: number;
  status: ShipStatus;
  healthScore: number;
  currentNodeId: string;
  lat: number;
  lng: number;
  progress?: number;
  etaHour?: number;
  route?: string;
  routeId?: string;
  berth?: number;
  estimasiJam?: number;
  cargoTon: number;
  speedKnot: number;
  engineTempC: number;
  lubOilPressureBar: number;
  coolantTempC: number;
  rpmEngine: number;
  bunkerLph: number;
};

export type ShipNode = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  type: "dermaga" | "muara" | "pelabuhan" | "dockyard";
};

export const SHIP_NODES: ShipNode[] = [
  // Pelabuhan Semayang — Balikpapan main port (east coast of the bay)
  { id: "DERMAGA-01",   label: "Dermaga Muat Kideco",        lat: -1.282, lng: 116.852, type: "dermaga"   },
  // Pelabuhan Tarahan — Lampung (coal unloading terminal)
  { id: "PLBN-TARAHAN", label: "Pelabuhan Tarahan, Lampung", lat: -5.481, lng: 105.283, type: "pelabuhan" },
  // Dok & Perkapalan — north Balikpapan industrial / Kariangau area (on land)
  { id: "DOCKYARD",     label: "Dockyard Balikpapan",        lat: -1.148, lng: 116.895, type: "dockyard"  },
];

// Full lat/lng waypoint paths for route polylines
export const SHIP_ROUTE_WAYPOINTS: Record<string, [number, number][]> = {
  // Balikpapan → EAST into Selat Makassar → south along strait → round tip of
  // South Kalimantan → west across Laut Jawa → Selat Sunda → Tarahan, Lampung
  "R-TARAHAN": [
    [-1.282, 116.852], // Dermaga Muat (Balikpapan port)
    [-1.600, 117.150], // Exit Teluk Balikpapan eastward into Selat Makassar
    [-2.200, 117.400], // Selat Makassar (open water, east of Paser coast)
    [-3.000, 117.200], // Selat Makassar (south section)
    [-3.800, 116.800], // Selat Makassar (east of Tanah Bumbu/Kotabaru, clear water)
    [-4.500, 116.500], // East of Pulau Laut, still in Selat Makassar
    [-5.000, 115.200], // Rounding tip of South Kalimantan → entering Laut Jawa
    [-5.500, 113.000], // Laut Jawa
    [-5.800, 111.000], // Laut Jawa (center-west)
    [-6.000, 109.000], // Near Karimunjawa
    [-6.000, 107.000], // Approaching Selat Sunda
    [-5.700, 106.000], // Selat Sunda
    [-5.481, 105.283], // Pelabuhan Tarahan, Lampung
  ],
  // Short haul north along Balikpapan coast to dockyard
  "R-DOCKYARD": [
    [-1.282, 116.852], // Dermaga Muat
    [-1.148, 116.895], // Dockyard (north Balikpapan, Kariangau — on land)
  ],
};

export const SHIP_ROUTES = [
  { id: "R-TARAHAN", label: "Kideco → Tarahan", from: "DERMAGA-01", to: "PLBN-TARAHAN", distanceNm: 820, etaHour: 48 },
  { id: "R-BUATAN",  label: "Kideco → Buatan",  from: "DERMAGA-01", to: "DOCKYARD",     distanceNm: 12,  etaHour: 1  },
];

export const SHIP_DATA: ShipRow[] = [
  {
    // Berlayar: 62% along R-TARAHAN (12 segments)
    // 62%×12=7.44 → between WP[7](-5.500,113.000) and WP[8](-5.800,111.000), t=0.44
    // lat: -5.500+0.44×(-0.300)=-5.632, lng: 113.000+0.44×(-2.000)=112.12
    id: "TB-01/BG-01",
    name: "TB-01",
    barge: "BG-01",
    type: "Tongkang",
    capacityTon: 8000,
    status: "berlayar",
    healthScore: 88,
    currentNodeId: "MUARA",
    lat: -5.632,
    lng: 112.12,
    progress: 62,
    etaHour: 18,
    route: "Dermaga Muat → Tarahan",
    routeId: "R-TARAHAN",
    cargoTon: 7850,
    speedKnot: 7.2,
    engineTempC: 82,
    lubOilPressureBar: 4.1,
    coolantTempC: 78,
    rpmEngine: 1250,
    bunkerLph: 45.5,
  },
  {
    // Sandar: at Dermaga-01 (Pelabuhan Semayang, Balikpapan)
    id: "TB-02/BG-02",
    name: "TB-02",
    barge: "BG-02",
    type: "Tongkang",
    capacityTon: 8000,
    status: "sandar",
    healthScore: 92,
    currentNodeId: "DERMAGA-01",
    lat: -1.282,
    lng: 116.852,
    berth: 45,
    cargoTon: 0,
    speedKnot: 0,
    engineTempC: 45,
    lubOilPressureBar: 4.5,
    coolantTempC: 42,
    rpmEngine: 0,
    bunkerLph: 0,
  },
  {
    // Perawatan: at Dockyard (north Balikpapan, Kariangau area — on land)
    id: "TB-03/BG-03",
    name: "TB-03",
    barge: "BG-03",
    type: "Tongkang",
    capacityTon: 8000,
    status: "perawatan",
    healthScore: 43,
    currentNodeId: "DOCKYARD",
    lat: -1.148,
    lng: 116.895,
    routeId: "R-DOCKYARD",
    estimasiJam: 6,
    cargoTon: 0,
    speedKnot: 0,
    engineTempC: 96,
    lubOilPressureBar: 2.8,
    coolantTempC: 91,
    rpmEngine: 800,
    bunkerLph: 12.1,
  },
];

export const SHIP_BUNKER_HISTORY = [
  { time: "04:00", lph: 43.2, knot: 7.1 },
  { time: "06:00", lph: 44.8, knot: 7.3 },
  { time: "08:00", lph: 45.5, knot: 7.2 },
  { time: "10:00", lph: 46.1, knot: 7.4 },
  { time: "12:00", lph: 45.5, knot: 7.2 },
];

export const SHIP_ACTIVITY_FEED: { id: string; time: string; message: string; type: "info" | "danger" | "success" | "warning" }[] = [
  { id: "1", time: "08:32", message: "TB-01/BG-01 berlayar menuju Pelabuhan Tarahan", type: "info" },
  { id: "2", time: "07:15", message: "TB-03/BG-03 masuk status perawatan — suhu mesin tinggi", type: "danger" },
  { id: "3", time: "06:45", message: "TB-02/BG-02 selesai muat, muatan 7.900 ton", type: "success" },
  { id: "4", time: "05:00", message: "TB-01/BG-01 mulai muat di Dermaga Kideco", type: "info" },
  { id: "5", time: "03:20", message: "TB-03/BG-03 kecepatan angin meningkat — monitor kondisi mesin", type: "warning" },
];

export function shipStatusLabel(status: ShipStatus): string {
  if (status === "berlayar") return "Berlayar";
  if (status === "sandar") return "Sandar";
  return "Perawatan";
}

export function shipStatusClass(status: ShipStatus): string {
  if (status === "berlayar") return "bg-sky-50 text-sky-700";
  if (status === "sandar") return "bg-emerald-50 text-emerald-700";
  return "bg-red-50 text-red-700";
}

export function shipHealthLevel(score: number): "Aman" | "Monitoring" | "Risiko Sedang" | "Risiko Tinggi" {
  if (score >= 85) return "Aman";
  if (score >= 70) return "Monitoring";
  if (score >= 50) return "Risiko Sedang";
  return "Risiko Tinggi";
}

export function shipHealthTone(level: ReturnType<typeof shipHealthLevel>) {
  if (level === "Aman") return { badge: "bg-[var(--success-50)] text-[var(--success-700)] border-[var(--success-200)]", text: "text-[var(--success-700)]" };
  if (level === "Monitoring") return { badge: "bg-[var(--info-50)] text-[var(--info-700)] border-[var(--info-200)]", text: "text-[var(--info-700)]" };
  if (level === "Risiko Sedang") return { badge: "bg-[var(--warning-50)] text-[var(--warning-700)] border-[var(--warning-200)]", text: "text-[var(--warning-700)]" };
  return { badge: "bg-[var(--danger-50)] text-[var(--danger-700)] border-[var(--danger-200)]", text: "text-[var(--danger-700)]" };
}

export function shipNextAction(ship: ShipRow): string {
  const level = shipHealthLevel(ship.healthScore);
  if (level === "Risiko Tinggi") return "Tahan dari berlayar — kirim ke drydock";
  if (level === "Risiko Sedang") return "Inspeksi setelah tiba di pelabuhan";
  if (level === "Monitoring") return "Monitor telemetri mesin pada voyage berikutnya";
  return "Layak untuk voyage berikutnya";
}
