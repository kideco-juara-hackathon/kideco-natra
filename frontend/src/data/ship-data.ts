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
  type: "dermaga" | "muara" | "pelabuhan";
};

export const SHIP_NODES: ShipNode[] = [
  { id: "DERMAGA-01", label: "Dermaga Muat Kideco", lat: -0.502, lng: 117.163, type: "dermaga" },
  { id: "MUARA",      label: "Muara Sungai Mahakam", lat: -0.948, lng: 117.498, type: "muara" },
  { id: "PLBN-TARAHAN", label: "Pelabuhan Tarahan, Lampung", lat: -5.481, lng: 105.283, type: "pelabuhan" },
];

export const SHIP_ROUTES = [
  { id: "R-TARAHAN", label: "Kideco → Tarahan", from: "DERMAGA-01", to: "PLBN-TARAHAN", distanceNm: 820, etaHour: 48 },
  { id: "R-BUATAN",  label: "Kideco → Buatan",  from: "DERMAGA-01", to: "MUARA",        distanceNm: 120, etaHour: 10 },
];

export const SHIP_DATA: ShipRow[] = [
  {
    id: "TB-01/BG-01",
    name: "TB-01",
    barge: "BG-01",
    type: "Tongkang",
    capacityTon: 8000,
    status: "berlayar",
    healthScore: 88,
    currentNodeId: "MUARA",
    lat: -0.948,
    lng: 117.498,
    progress: 62,
    etaHour: 18,
    route: "DERMAGA-01 → MUARA → PLBN-TARAHAN",
    cargoTon: 7850,
    speedKnot: 7.2,
    engineTempC: 82,
    lubOilPressureBar: 4.1,
    coolantTempC: 78,
    rpmEngine: 1250,
    bunkerLph: 45.5,
  },
  {
    id: "TB-02/BG-02",
    name: "TB-02",
    barge: "BG-02",
    type: "Tongkang",
    capacityTon: 8000,
    status: "sandar",
    healthScore: 92,
    currentNodeId: "DERMAGA-01",
    lat: -0.502,
    lng: 117.163,
    cargoTon: 0,
    speedKnot: 0,
    engineTempC: 45,
    lubOilPressureBar: 4.5,
    coolantTempC: 42,
    rpmEngine: 0,
    bunkerLph: 0,
  },
  {
    id: "TB-03/BG-03",
    name: "TB-03",
    barge: "BG-03",
    type: "Tongkang",
    capacityTon: 8000,
    status: "perawatan",
    healthScore: 43,
    currentNodeId: "DERMAGA-01",
    lat: -0.510,
    lng: 117.160,
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
