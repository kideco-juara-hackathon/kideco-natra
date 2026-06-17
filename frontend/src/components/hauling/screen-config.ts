import type { ScreenKey } from "./types";

export const screenMeta: Record<ScreenKey, { eyebrow: string; title: string }> = {
  overview: { eyebrow: "Global", title: "Overview" },
  "hauling-overview": { eyebrow: "Hauling Darat", title: "Overview" },
  "hauling-command-center": { eyebrow: "Route Intelligence", title: "Command Center" },
  "hauling-route-plan": { eyebrow: "Route Intelligence", title: "Rencana Rute" },
  "hauling-route-monitor": { eyebrow: "Route Intelligence", title: "Route Monitor" },
  "hauling-maintenance": { eyebrow: "Hauling Darat", title: "Maintenance" },
  "marine-overview": { eyebrow: "Operasi Kapal", title: "Overview" },
  "marine-route-plan": { eyebrow: "Route Intelligence Kapal", title: "Rencana Rute" },
  "marine-eta": { eyebrow: "Route Intelligence Kapal", title: "Prediksi ETA" },
  "marine-fuel": { eyebrow: "Route Intelligence Kapal", title: "Konsumsi BBM" },
  "marine-maintenance": { eyebrow: "Operasi Kapal", title: "Maintenance" },
};

export function normalizeScreen(key: string): ScreenKey {
  if (key === "hauling-route-intelligence") return "hauling-command-center";
  if (key === "marine-route-intelligence") return "marine-route-plan";
  // Legacy keys merged into the Route Monitor lens screen.
  if (key === "hauling-eta" || key === "hauling-fuel") return "hauling-route-monitor";
  if (key in screenMeta) return key as ScreenKey;
  return "overview";
}

