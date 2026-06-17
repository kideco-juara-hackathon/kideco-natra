"use client";

import { AlertTriangle, CheckCircle2, Eye, Timer, Truck } from "lucide-react";

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
  delayTone,
  healthBarClass,
  healthText,
  healthTier,
  MetricCard,
  n,
  riskOrder,
  statusLabel,
  type VehicleRow,
} from "./shared";

export function ETALens({
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
  const needAction = vehicles.filter((v) => {
    const d = deriveDelay(v.telemetry);
    return d === "Terlambat" || d === "Monitor";
  }).length;

  const etaMins = vehicles
    .map((v) => deriveEtaMin(v.telemetry))
    .filter((m): m is number => m !== null);
  const avgEta = etaMins.length > 0
    ? `${Math.round(etaMins.reduce((a, b) => a + b, 0) / etaMins.length)}m`
    : "—";

  return (
    <div className="space-y-3">
      <section className="grid gap-3 md:grid-cols-4">
        <MetricCard icon={Truck}         label="Trip Aktif"       value={String(activeCount)} helper="unit sedang berjalan" />
        <MetricCard icon={CheckCircle2}  label="Sesuai Jadwal"     value={String(onSchedule)}  helper="ETA normal" />
        <MetricCard icon={AlertTriangle} label="Perlu Perhatian"  value={String(needAction)}  helper="potensi terlambat" />
        <MetricCard icon={Timer}         label="Rata-rata ETA"    value={avgEta}              helper="estimasi saat ini" />
      </section>

      <Card className="rounded-xl shadow-none">
        <CardHeader className="px-5 pb-3 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Prediksi ETA per Unit</CardTitle>
              <CardDescription>
                Diurutkan dari unit paling berisiko. Klik baris untuk lihat detail.
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
                  <TableHead>Kecepatan</TableHead>
                  <TableHead>Kesehatan</TableHead>
                  <TableHead className="w-[104px] text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((v) => {
                  const etaMin = deriveEtaMin(v.telemetry);
                  const delay = deriveDelay(v.telemetry);
                  const tone = delayTone(delay);
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
                        <Badge className={tone.badge} variant="outline">{delay}</Badge>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {v.telemetry ? `${n(v.telemetry.speedKmh).toFixed(0)} km/h` : "—"}
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
