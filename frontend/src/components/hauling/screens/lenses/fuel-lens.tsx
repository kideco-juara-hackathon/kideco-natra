"use client";

import Image from "next/image";
import { AlertTriangle, Eye, Fuel, Leaf, TrendingDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  BASELINE_EMPTY_LPH,
  BASELINE_FULL_LPH,
  deriveEfficiency,
  deriveFuelStatus,
  fmtLph,
  fmtLpk,
  fuelStatusTone,
  healthBarClass,
  healthText,
  healthTier,
  MetricCard,
  n,
  type VehicleRow,
} from "./shared";

export function FuelLens({
  vehicles,
  selectedId,
  onSelect,
}: {
  vehicles: VehicleRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const rows = [...vehicles].sort(
    (a, b) => n(b.telemetry?.fuelRateLph ?? null) - n(a.telemetry?.fuelRateLph ?? null),
  );

  const activeVehicles = vehicles.filter((v) => v.telemetry?.fuelRateLph != null);
  const fleetRate = activeVehicles.reduce((sum, v) => sum + n(v.telemetry?.fuelRateLph ?? null), 0);

  const efficiencies = vehicles
    .map((v) => ({ id: v.id, eff: deriveEfficiency(v.telemetry) }))
    .filter((x): x is { id: string; eff: number } => x.eff !== null);
  const bestEfficiency = efficiencies.length > 0
    ? efficiencies.reduce((best, x) => (x.eff < best.eff ? x : best))
    : null;

  const borosCount = vehicles.filter((v) => {
    const s = deriveFuelStatus(v.telemetry);
    return s === "Tinggi" || s === "Kritis";
  }).length;

  const estSavings = vehicles.reduce((sum, v) => {
    const t = v.telemetry;
    if (!t || t.fuelRateLph === null) return sum;
    const baseline = t.loadState === "Full" ? BASELINE_FULL_LPH : BASELINE_EMPTY_LPH;
    const excess = t.fuelRateLph - baseline;
    return excess > 0 ? sum + excess : sum;
  }, 0);

  return (
    <div className="space-y-3">
      <section className="grid gap-3 md:grid-cols-4">
        <MetricCard icon={Fuel}         label="Konsumsi Fleet"    value={activeVehicles.length > 0 ? `${fleetRate.toFixed(0)} L/j` : "—"} helper="konsumsi fleet saat ini" />
        <MetricCard icon={TrendingDown} label="Efisiensi Terbaik" value={bestEfficiency ? fmtLpk(bestEfficiency.eff) : "—"}             helper="unit paling hemat" />
        <MetricCard icon={AlertTriangle} label="Unit Boros"       value={String(borosCount)}                                            helper="perlu optimasi rute" />
        <MetricCard icon={Leaf}         label="Penghematan Est."  value={estSavings > 0 ? `${estSavings.toFixed(0)} L/j` : "0 L/j"}      helper="potensi hemat vs baseline" />
      </section>

      <Card className="rounded-xl shadow-none">
        <CardHeader className="px-5 pb-3 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Konsumsi BBM per Unit</CardTitle>
              <CardDescription>
                Diurutkan dari konsumsi tertinggi. Klik baris untuk detail dan riwayat.
              </CardDescription>
            </div>
            <Badge variant="outline">{vehicles.length} unit</Badge>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unit</TableHead>
                  <TableHead>Konsumsi BBM</TableHead>
                  <TableHead>Efisiensi</TableHead>
                  <TableHead>Status Muatan</TableHead>
                  <TableHead>Status BBM</TableHead>
                  <TableHead>Kesehatan</TableHead>
                  <TableHead className="w-[104px] text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((v) => {
                  const status = deriveFuelStatus(v.telemetry);
                  const tone = fuelStatusTone(status);
                  const eff = deriveEfficiency(v.telemetry);
                  const tier = healthTier(v.healthScore);
                  const selected = v.id === selectedId;

                  return (
                    <TableRow
                      key={v.id}
                      className={`cursor-pointer ${selected ? "bg-primary/5" : "hover:bg-muted/40"}`}
                      onClick={() => onSelect(v.id)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-lg border">
                            <Image
                              alt="Hauling Truck"
                              src="/hauling_truck.png"
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-semibold">{v.id}</div>
                            <div className="text-xs text-muted-foreground">{v.type}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className={`tabular-nums font-semibold ${tone.text}`}>
                        {fmtLph(v.telemetry?.fuelRateLph ?? null)}
                      </TableCell>
                      <TableCell className="tabular-nums text-sm">{fmtLpk(eff)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{v.telemetry?.loadState ?? "—"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={tone.badge} variant="outline">{status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-[120px] space-y-1">
                          <span className={`text-sm font-semibold ${healthText(v.healthScore)}`}>
                            {v.healthScore}
                          </span>
                          <Progress value={v.healthScore} className={healthBarClass(tier)} />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => { e.stopPropagation(); onSelect(v.id); }}
                        >
                          <Eye className="size-4" />
                          Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
