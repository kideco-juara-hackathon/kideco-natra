import type { ScreenKey } from "./types";

export const screenMeta: Record<ScreenKey, { eyebrow: string; title: string }> = {
  overview: { eyebrow: "Global", title: "Overview" },
  "hauling-overview": { eyebrow: "Hauling Darat", title: "Overview" },
  "hauling-command-center": { eyebrow: "Route Intelligence", title: "Command Center" },
  "hauling-route-plan": { eyebrow: "Route Intelligence", title: "Rencana Rute" },
  "hauling-route-monitor": { eyebrow: "Route Intelligence", title: "Route Monitor" },
  "hauling-maintenance": { eyebrow: "Hauling Darat", title: "Maintenance" },
  "marine-overview": { eyebrow: "Operasi Kapal", title: "Overview" },
  "marine-command-center": { eyebrow: "Route Intelligence Kapal", title: "Command Center" },
  "marine-route-monitor": { eyebrow: "Route Intelligence Kapal", title: "Route Monitor" },
  "marine-maintenance": { eyebrow: "Operasi Kapal", title: "Maintenance" },
};

export function normalizeScreen(key: string): ScreenKey {
  if (key === "hauling-route-intelligence") return "hauling-command-center";
  if (key === "marine-route-intelligence") return "marine-command-center";
  if (key === "hauling-eta" || key === "hauling-fuel") return "hauling-route-monitor";
  if (key in screenMeta) return key as ScreenKey;
  return "overview";
}

