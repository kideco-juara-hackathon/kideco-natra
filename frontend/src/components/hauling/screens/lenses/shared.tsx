"use client";

import { CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  RecommendationResponse,
  TelemetryResponse,
} from "@/lib/api";
import type { HaulingVehicleRow } from "@/lib/hauling-vehicle-rows";

// ─── Shared types ─────────────────────────────────────────────────────────────

export type VehicleRow = HaulingVehicleRow;

export type DelayStatus = "Terlambat" | "Monitor" | "Normal" | "—";
export type FuelStatus = "Normal" | "Tinggi" | "Kritis" | "—";

// ─── Constants ────────────────────────────────────────────────────────────────

export const BASE_DISTANCE_M = 8000; // ~8 km Pit → Jetty typical corridor
export const BASELINE_FULL_LPH = 30; // L/hr expected when fully loaded
export const BASELINE_EMPTY_LPH = 20; // L/hr expected when empty

// ─── Generic helpers ──────────────────────────────────────────────────────────

export const n = (v: number | null, fallback = 0): number => v ?? fallback;

export function priorityOrder(p: string): number {
  return p === "critical" ? 0 : p === "high" ? 1 : p === "medium" ? 2 : 3;
}

export function statusLabel(status: string): string {
  if (status === "active") return "Sedang Beroperasi";
  if (status === "maintenance") return "Tahan Maintenance";
  return "Standby";
}

export function healthTier(score: number): "ready" | "monitor" | "critical" {
  if (score >= 85) return "ready";
  if (score >= 70) return "monitor";
  return "critical";
}

export function healthText(score: number): string {
  if (score >= 85) return "text-[var(--success-700)]";
  if (score >= 70) return "text-[var(--warning-700)]";
  return "text-[var(--danger-700)]";
}

export function healthBarClass(tier: "ready" | "monitor" | "critical"): string {
  if (tier === "critical") return "[&>div]:bg-[var(--danger-600)]";
  if (tier === "monitor") return "[&>div]:bg-[var(--warning-600)]";
  return "[&>div]:bg-[var(--success-600)]";
}

// ─── ETA derivations ──────────────────────────────────────────────────────────

export function deriveEtaMin(
  t: TelemetryResponse | null,
  progress?: number,
  etaMin?: number,
): number | null {
  // Prefer backend ETA scaled by remaining trip progress
  if (progress != null && etaMin != null && progress < 100) {
    return Math.max(0, Math.round(etaMin * (1 - progress / 100)));
  }
  // Fallback: speed-based estimate using average corridor distance
  if (!t) return null;
  const speedMs = n(t.speedKmh) / 3.6;
  if (speedMs < 0.5) return null;
  return Math.round(BASE_DISTANCE_M / speedMs / 60);
}

export function deriveDelay(t: TelemetryResponse | null): DelayStatus {
  if (!t) return "—";
  if (t.riskLevel === "high" || t.riskLevel === "critical") return "Terlambat";
  if (t.riskLevel === "medium") return "Monitor";
  return "Normal";
}

export function delayTone(status: DelayStatus) {
  if (status === "Terlambat") return { badge: "bg-[var(--danger-50)] text-[var(--danger-700)]", text: "text-[var(--danger-700)]" };
  if (status === "Monitor")   return { badge: "bg-[var(--warning-50)] text-[var(--warning-700)]", text: "text-[var(--warning-700)]" };
  if (status === "Normal")    return { badge: "bg-[var(--success-50)] text-[var(--success-700)]", text: "text-[var(--success-700)]" };
  return { badge: "bg-muted text-muted-foreground", text: "text-muted-foreground" };
}

export function riskOrder(t: TelemetryResponse | null): number {
  if (!t) return 3;
  if (t.riskLevel === "high" || t.riskLevel === "critical") return 0;
  if (t.riskLevel === "medium") return 1;
  return 2;
}

// ─── Fuel derivations ─────────────────────────────────────────────────────────

export function deriveEfficiency(t: TelemetryResponse | null): number | null {
  if (!t || t.fuelRateLph === null || t.speedKmh === null || t.speedKmh < 2) return null;
  return t.fuelRateLph / t.speedKmh;
}

export function deriveFuelStatus(t: TelemetryResponse | null): FuelStatus {
  if (!t || t.fuelRateLph === null) return "—";
  const baseline = t.loadState === "Full" ? BASELINE_FULL_LPH : BASELINE_EMPTY_LPH;
  if (t.fuelRateLph > baseline * 1.4)  return "Kritis";
  if (t.fuelRateLph > baseline * 1.15) return "Tinggi";
  return "Normal";
}

export function fuelStatusTone(status: FuelStatus) {
  if (status === "Kritis") return { badge: "bg-[var(--danger-50)] text-[var(--danger-700)]",  text: "text-[var(--danger-700)]" };
  if (status === "Tinggi") return { badge: "bg-[var(--warning-50)] text-[var(--warning-700)]", text: "text-[var(--warning-700)]" };
  if (status === "Normal") return { badge: "bg-[var(--success-50)] text-[var(--success-700)]", text: "text-[var(--success-700)]" };
  return { badge: "bg-muted text-muted-foreground", text: "text-muted-foreground" };
}

export function fmtLph(v: number | null): string {
  if (v === null) return "—";
  return `${v.toFixed(1)} L/j`;
}

export function fmtLpk(v: number | null): string {
  if (v === null) return "—";
  return `${v.toFixed(2)} L/km`;
}

export function fmtTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return "—";
  }
}

// ─── MetricCard ───────────────────────────────────────────────────────────────

export function MetricCard({
  icon: Icon,
  label,
  value,
  helper,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <Card className="rounded-xl shadow-none">
      <CardHeader className="px-5 pb-2 pt-4">
        <CardDescription className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Icon className="size-4 text-primary" />
          {label}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        <div className="text-3xl font-semibold tabular-nums">{value}</div>
        <p className="mt-1 text-sm text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
}

// ─── Recommendation list (shared by all detail panels) ─────────────────────────

export function RecommendationList({ recs }: { recs: RecommendationResponse[] }) {
  if (recs.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl border bg-[var(--success-50)] p-3 text-sm text-[var(--success-700)]">
        <CheckCircle2 className="size-4 shrink-0" />
        Tidak ada rekomendasi aktif untuk unit ini.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">Rekomendasi Aktif</p>
      {recs.map((rec) => {
        const urgent = rec.priority === "critical" || rec.priority === "high";
        return (
          <div
            key={rec.id}
            className="rounded-xl p-3 text-sm"
            style={{
              background: urgent ? "var(--surface-tint-danger)" : "var(--surface-tint-warning)",
              border: `1px solid ${urgent ? "var(--danger-100)" : "var(--warning-100)"}`,
              borderLeftWidth: 4,
              borderLeftColor: urgent ? "var(--danger-600)" : "var(--warning-600)",
            }}
          >
            <p className="font-semibold">{rec.title}</p>
            <p className="mt-1 text-muted-foreground">{rec.recommendedAction}</p>
          </div>
        );
      })}
    </div>
  );
}

// ─── ETA detail panel ─────────────────────────────────────────────────────────

export function ETADetailPanel({ vehicle }: { vehicle: VehicleRow }) {
  const t = vehicle.telemetry;
  const etaMin = deriveEtaMin(t, vehicle.progress, vehicle.etaMin);
  const delay = deriveDelay(t);
  const tone = delayTone(delay);

  const speedMs = n(t?.speedKmh ?? null) / 3.6;
  const baseMin = speedMs > 0.5 ? Math.round((BASE_DISTANCE_M * 0.75) / speedMs / 60) : null;
  const trafficPenalty = delay === "Terlambat" ? 8 : delay === "Monitor" ? 3 : 0;
  const payloadPenalty = t?.loadState === "Full" ? 3 : 0;

  return (
    <Card className="rounded-xl shadow-none">
      <CardHeader className="border-b px-5 pb-3 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Detail ETA</CardTitle>
            <CardDescription>{vehicle.name} / {vehicle.type}</CardDescription>
          </div>
          <Badge className={tone.badge} variant="outline">{delay}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-5 py-4">
        <div className="rounded-xl border bg-muted/30 p-4 text-center">
          <div className={`text-5xl font-semibold tabular-nums ${etaMin ? tone.text : "text-muted-foreground"}`}>
            {etaMin ? `${etaMin}m` : "—"}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">estimasi kedatangan</p>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold">Rincian ETA</p>
          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="text-muted-foreground">Waktu perjalanan dasar</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {baseMin ? `${baseMin}m` : "—"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-muted-foreground">Penalti lalu lintas</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {trafficPenalty > 0 ? `+${trafficPenalty}m` : "+0m"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-muted-foreground">Penalti muatan</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {payloadPenalty > 0 ? `+${payloadPenalty}m` : "+0m"}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="rounded-xl border bg-background p-3 text-sm">
          <p className="mb-2 font-semibold">Konteks Trip</p>
          <div className="space-y-2 text-muted-foreground">
            {[
              ["Kecepatan", t ? `${n(t.speedKmh).toFixed(0)} km/h` : "—"],
              ["Status muatan", t?.loadState ?? "—"],
              ["Skor kesehatan", String(vehicle.healthScore)],
              ["Tingkat risiko", t?.riskLevel ?? "—"],
              ["Status", statusLabel(vehicle.status)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span>{label}</span>
                <span className="font-medium text-foreground capitalize">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <RecommendationList recs={vehicle.recs} />
      </CardContent>
    </Card>
  );
}

// ─── Fuel detail panel ────────────────────────────────────────────────────────

export function FuelDetailPanel({
  vehicle,
  history,
  loadingHistory,
}: {
  vehicle: VehicleRow;
  history: TelemetryResponse[];
  loadingHistory: boolean;
}) {
  const t = vehicle.telemetry;
  const status = deriveFuelStatus(t);
  const tone = fuelStatusTone(status);
  const efficiency = deriveEfficiency(t);

  return (
    <Card className="rounded-xl shadow-none">
      <CardHeader className="border-b px-5 pb-3 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Detail BBM</CardTitle>
            <CardDescription>{vehicle.name} / {vehicle.type}</CardDescription>
          </div>
          <Badge className={tone.badge} variant="outline">{status}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-5 py-4">
        <div className="rounded-xl border bg-muted/30 p-4 text-center">
          <div className={`text-5xl font-semibold tabular-nums ${t?.fuelRateLph != null ? tone.text : "text-muted-foreground"}`}>
            {t?.fuelRateLph != null ? `${t.fuelRateLph.toFixed(1)}` : "—"}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">L/jam saat ini</p>
        </div>

        <div className="rounded-xl border bg-background p-3 text-sm">
          <p className="mb-2 font-semibold">Konteks BBM</p>
          <div className="space-y-2 text-muted-foreground">
            {[
              ["Efisiensi",    fmtLpk(efficiency)],
              ["Status muatan",  t?.loadState ?? "—"],
              ["Kecepatan",      t?.speedKmh != null ? `${n(t.speedKmh).toFixed(0)} km/h` : "—"],
              ["Skor kesehatan", String(vehicle.healthScore)],
              ["Tingkat risiko", t?.riskLevel ?? "—"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span>{label}</span>
                <span className="font-medium text-foreground capitalize">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold">Riwayat BBM (5 terakhir)</p>
          {loadingHistory ? (
            <div className="space-y-1.5">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tidak ada riwayat tersedia.</p>
          ) : (
            <div className="overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Konsumsi BBM</TableHead>
                    <TableHead>Kecepatan</TableHead>
                    <TableHead>Muatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((h) => {
                    const hTone = fuelStatusTone(deriveFuelStatus(h));
                    return (
                      <TableRow key={h.id}>
                        <TableCell className="text-xs text-muted-foreground">{fmtTime(h.timestamp)}</TableCell>
                        <TableCell className={`tabular-nums font-semibold ${hTone.text}`}>
                          {fmtLph(h.fuelRateLph)}
                        </TableCell>
                        <TableCell className="tabular-nums text-sm">
                          {h.speedKmh != null ? `${h.speedKmh.toFixed(0)} km/h` : "—"}
                        </TableCell>
                        <TableCell className="text-sm">{h.loadState ?? "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <RecommendationList recs={vehicle.recs} />
      </CardContent>
    </Card>
  );
}

// ─── Overview detail panel (combined ETA + Fuel glance) ────────────────────────

export function OverviewDetailPanel({ vehicle }: { vehicle: VehicleRow }) {
  const t = vehicle.telemetry;
  const etaMin = deriveEtaMin(t, vehicle.progress, vehicle.etaMin);
  const delay = deriveDelay(t);
  const dTone = delayTone(delay);
  const fuelStatus = deriveFuelStatus(t);
  const fTone = fuelStatusTone(fuelStatus);
  const efficiency = deriveEfficiency(t);

  return (
    <Card className="rounded-xl shadow-none">
      <CardHeader className="border-b px-5 pb-3 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Ringkasan Trip</CardTitle>
            <CardDescription>{vehicle.name} / {vehicle.type}</CardDescription>
          </div>
          <Badge variant="outline">{statusLabel(vehicle.status)}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-5 py-4">
        {/* ETA + Fuel side by side */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border bg-muted/30 p-3 text-center">
            <div className={`text-3xl font-semibold tabular-nums ${etaMin ? dTone.text : "text-muted-foreground"}`}>
              {etaMin ? `${etaMin}m` : "—"}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">ETA</p>
            <Badge className={`mt-2 ${dTone.badge}`} variant="outline">{delay}</Badge>
          </div>
          <div className="rounded-xl border bg-muted/30 p-3 text-center">
            <div className={`text-3xl font-semibold tabular-nums ${t?.fuelRateLph != null ? fTone.text : "text-muted-foreground"}`}>
              {t?.fuelRateLph != null ? t.fuelRateLph.toFixed(0) : "—"}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">L/jam</p>
            <Badge className={`mt-2 ${fTone.badge}`} variant="outline">{fuelStatus}</Badge>
          </div>
        </div>

        <div className="rounded-xl border bg-background p-3 text-sm">
          <p className="mb-2 font-semibold">Konteks</p>
          <div className="space-y-2 text-muted-foreground">
            {[
              ["Kecepatan", t?.speedKmh != null ? `${n(t.speedKmh).toFixed(0)} km/h` : "—"],
              ["Efisiensi", fmtLpk(efficiency)],
              ["Status muatan", t?.loadState ?? "—"],
              ["Skor kesehatan", String(vehicle.healthScore)],
              ["Tingkat risiko", t?.riskLevel ?? "—"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span>{label}</span>
                <span className="font-medium text-foreground capitalize">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <RecommendationList recs={vehicle.recs} />
      </CardContent>
    </Card>
  );
}
