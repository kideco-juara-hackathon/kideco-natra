"use client";

import { Activity, CheckCircle2, Eye, Timer, Truck } from "lucide-react";

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
  deriveDelay,
  deriveEtaMin,
  deriveFuelStatus,
  delayTone,
  fmtLph,
  fuelStatusTone,
  healthBarClass,
  healthText,
  healthTier,
  MetricCard,
  riskOrder,
  statusLabel,
  type VehicleRow,
} from "./shared";

export function OverviewLens({
  vehicles,
  selectedId,
  onSelect,
}: {
  vehicles: VehicleRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const rows = [...vehicles].sort((a, b) => riskOrder(a.telemetry) - riskOrder(b.telemetry));

  const activeCount = vehicles.filter((v) => v.status === "active").length;
  const onSchedule = vehicles.filter((v) => deriveDelay(v.telemetry) === "Normal").length;
  const borosCount = vehicles.filter((v) => {
    const s = deriveFuelStatus(v.telemetry);
    return s === "Tinggi" || s === "Kritis";
  }).length;
  const avgHealth = vehicles.length > 0
    ? Math.round(vehicles.reduce((sum, v) => sum + v.healthScore, 0) / vehicles.length)
    : 0;

  return (
    <div className="space-y-3">
      <section className="grid gap-3 md:grid-cols-4">
        <MetricCard icon={Truck}        label="Trip Aktif"  value={String(activeCount)} helper="unit sedang berjalan" />
        <MetricCard icon={CheckCircle2} label="Sesuai Jadwal" value={String(onSchedule)}  helper="ETA normal" />
        <MetricCard icon={Timer}        label="Unit Boros"  value={String(borosCount)}  helper="konsumsi di atas baseline" />
        <MetricCard icon={Activity}     label="Rata-rata Kesehatan" value={String(avgHealth)}   helper="rata-rata kondisi fleet" />
      </section>

      <Card className="rounded-xl shadow-none">
        <CardHeader className="px-5 pb-3 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Ringkasan Trip Aktif</CardTitle>
              <CardDescription>
                Tampilan gabungan ETA dan BBM per unit. Klik baris untuk detail.
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
                  <TableHead>Status</TableHead>
                  <TableHead>ETA</TableHead>
                  <TableHead>Keterlambatan</TableHead>
                  <TableHead>Konsumsi BBM</TableHead>
                  <TableHead>Kesehatan</TableHead>
                  <TableHead className="w-[104px] text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((v) => {
                  const etaMin = deriveEtaMin(v.telemetry);
                  const delay = deriveDelay(v.telemetry);
                  const dTone = delayTone(delay);
                  const fTone = fuelStatusTone(deriveFuelStatus(v.telemetry));
                  const tier = healthTier(v.healthScore);
                  const selected = v.id === selectedId;

                  return (
                    <TableRow
                      key={v.id}
                      className={`cursor-pointer ${selected ? "bg-primary/5" : "hover:bg-muted/40"}`}
                      onClick={() => onSelect(v.id)}
                    >
                      <TableCell>
                        <div className="font-semibold">{v.id}</div>
                        <div className="text-xs text-muted-foreground">{v.type}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{statusLabel(v.status)}</Badge>
                      </TableCell>
                      <TableCell className="tabular-nums font-semibold">
                        {etaMin ? `${etaMin}m` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={dTone.badge} variant="outline">{delay}</Badge>
                      </TableCell>
                      <TableCell className={`tabular-nums font-semibold ${fTone.text}`}>
                        {fmtLph(v.telemetry?.fuelRateLph ?? null)}
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
