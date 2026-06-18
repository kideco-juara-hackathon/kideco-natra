"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Anchor,
  Bell,
  Bot,
  ChevronRight,
  Fuel,
  Gauge,
  HeartPulse,
  Ship,
  Target,
  Wrench,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

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
  SHIP_ACTIVITY_FEED,
  SHIP_DATA,
  shipHealthLevel,
  shipHealthTone,
  shipNextAction,
  shipStatusClass,
  shipStatusLabel,
  type ShipRow,
} from "@/data/ship-data";

function KpiCard({
  icon,
  label,
  value,
  caption,
  progress,
  progressClass,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  caption: string;
  progress?: number;
  progressClass?: string;
  badge?: { label: string; className: string };
}) {
  return (
    <Card className="gap-0 rounded-xl py-0 shadow-none">
      <CardHeader className="px-4 pb-1 pt-3">
        <CardDescription className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
          {icon}
          {label}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <div className="text-2xl font-semibold tabular-nums">{value}</div>
        <p className="text-[11px] text-muted-foreground">{caption}</p>
        {typeof progress === "number" && (
          <div className="mt-2 flex items-center justify-between gap-2">
            <Progress value={progress} className={`h-1.5 flex-1 ${progressClass ?? ""}`} />
            <span className="text-[11px] font-bold text-muted-foreground">{Math.round(progress)}%</span>
          </div>
        )}
        {badge && (
          <Badge className={`mt-2 border-transparent ${badge.className}`}>{badge.label}</Badge>
        )}
      </CardContent>
    </Card>
  );
}

function healthBadge(score: number) {
  if (score >= 80) return { label: "Baik", className: "bg-[var(--success-50)] text-[var(--success-700)]" };
  if (score >= 60) return { label: "Monitor", className: "bg-[var(--warning-50)] text-[var(--warning-700)]" };
  return { label: "Kritis", className: "bg-[var(--danger-50)] text-[var(--danger-700)]" };
}

function activityDot(type: string) {
  if (type === "danger") return "bg-red-500";
  if (type === "success") return "bg-emerald-500";
  if (type === "warning") return "bg-amber-500";
  return "bg-sky-500";
}

export function ShipOverviewScreen({
  onOpenRouteIntelligence,
  onOpenMaintenance,
}: {
  onOpenRouteIntelligence?: () => void;
  onOpenMaintenance?: (id?: string) => void;
}) {
  const ships = SHIP_DATA;

  const berlayar = ships.filter((s) => s.status === "berlayar").length;
  const sandar = ships.filter((s) => s.status === "sandar").length;
  const perawatan = ships.filter((s) => s.status === "perawatan").length;
  const totalUnits = ships.length;

  const avgHealth = Math.round(ships.reduce((sum, s) => sum + s.healthScore, 0) / totalUnits);
  const peringatanAktif = ships.filter((s) => s.healthScore < 70).length;
  const kesiapanBerlayar = Math.round(((berlayar + sandar) / totalUnits) * 100);

  const totalMuatan = ships.reduce((sum, s) => sum + s.cargoTon, 0);
  const avgSpeed = ships.filter((s) => s.speedKnot > 0).reduce((sum, s) => sum + s.speedKnot, 0) /
    Math.max(ships.filter((s) => s.speedKnot > 0).length, 1);
  const avgBunker = ships.filter((s) => s.bunkerLph > 0).reduce((sum, s) => sum + s.bunkerLph, 0) /
    Math.max(ships.filter((s) => s.bunkerLph > 0).length, 1);

  const utilisasiData = [
    { name: "Berlayar", value: berlayar, color: "#0ea5e9" },
    { name: "Sandar", value: sandar, color: "#10b981" },
    { name: "Perawatan", value: perawatan, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  const watchShip = [...ships].sort((a, b) => a.healthScore - b.healthScore)[0];

  return (
    <div className="space-y-4">
      {/* AI Recommendation Banner */}
      {watchShip && (
        <Card className="rounded-xl shadow-none border-[var(--warning-200)] bg-[var(--warning-50)]">
          <CardContent className="flex items-center gap-4 px-5 py-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--warning-100)]">
              <Bot className="size-5 text-[var(--warning-700)]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--warning-900)]">
                Perhatian sebelum voyage berikutnya — {watchShip.id}
              </p>
              <p className="text-xs text-[var(--warning-700)]">
                Health score {watchShip.healthScore}/100 · {shipNextAction(watchShip)}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 border-[var(--warning-300)] text-[var(--warning-700)] hover:bg-[var(--warning-100)]"
              onClick={() => onOpenMaintenance?.(watchShip.id)}
            >
              Lihat Detail
              <ChevronRight className="ml-1 size-3" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <section className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <KpiCard
          icon={<Ship className="size-4" />}
          label="Kapal Berlayar"
          value={berlayar}
          caption="unit aktif di laut"
          progress={(berlayar / totalUnits) * 100}
          progressClass="[&>div]:bg-sky-500"
        />
        <KpiCard
          icon={<Anchor className="size-4" />}
          label="Kapal Sandar"
          value={sandar}
          caption="unit di dermaga"
          progress={(sandar / totalUnits) * 100}
          progressClass="[&>div]:bg-emerald-500"
        />
        <KpiCard
          icon={<Wrench className="size-4" />}
          label="Kapal Perawatan"
          value={perawatan}
          caption="unit dalam perawatan"
          progress={(perawatan / totalUnits) * 100}
          progressClass="[&>div]:bg-red-500"
        />
        <KpiCard
          icon={<HeartPulse className="size-4" />}
          label="Kondisi Armada"
          value={avgHealth}
          caption="rata-rata health score"
          badge={avgHealth >= 80
            ? { label: "Baik", className: "bg-[var(--success-50)] text-[var(--success-700)]" }
            : { label: "Perlu Perhatian", className: "bg-[var(--warning-50)] text-[var(--warning-700)]" }
          }
        />
        <KpiCard
          icon={<Bell className="size-4" />}
          label="Peringatan Aktif"
          value={peringatanAktif}
          caption="kapal perlu perhatian"
          badge={peringatanAktif > 0
            ? { label: "Ada Risiko", className: "bg-[var(--danger-50)] text-[var(--danger-700)]" }
            : { label: "Aman", className: "bg-[var(--success-50)] text-[var(--success-700)]" }
          }
        />
        <KpiCard
          icon={<Target className="size-4" />}
          label="Kesiapan Berlayar"
          value={`${kesiapanBerlayar}%`}
          caption="armada siap beroperasi"
          badge={kesiapanBerlayar >= 70
            ? { label: "Siap", className: "bg-[var(--success-50)] text-[var(--success-700)]" }
            : { label: "Terbatas", className: "bg-[var(--warning-50)] text-[var(--warning-700)]" }
          }
        />
      </section>

      {/* Snapshot Cards */}
      <section className="grid gap-3 md:grid-cols-4">
        {/* Muatan Total */}
        <Card className="gap-0 rounded-xl py-0 shadow-none">
          <CardHeader className="px-4 pb-1 pt-3">
            <CardDescription className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
              <Ship className="size-4" /> Muatan Aktif
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-semibold tabular-nums">
                {(totalMuatan / 1000).toFixed(1)}
              </span>
              <span className="text-sm font-medium text-muted-foreground">ribu ton</span>
            </div>
            <p className="text-xs text-muted-foreground">total muatan di seluruh armada berlayar</p>
          </CardContent>
        </Card>

        {/* Konsumsi Bunker */}
        <Card className="gap-0 rounded-xl py-0 shadow-none">
          <CardHeader className="px-4 pb-1 pt-3">
            <CardDescription className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
              <Fuel className="size-4" /> Konsumsi Bunker
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-semibold tabular-nums">
                {avgBunker.toFixed(1)}
              </span>
              <span className="text-sm font-medium text-muted-foreground">L/jam</span>
            </div>
            <p className="text-xs text-muted-foreground">rata-rata konsumsi BBM armada berlayar</p>
          </CardContent>
        </Card>

        {/* Kecepatan */}
        <Card className="gap-0 rounded-xl py-0 shadow-none">
          <CardHeader className="px-4 pb-1 pt-3">
            <CardDescription className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
              <Gauge className="size-4" /> Kecepatan Armada
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-semibold tabular-nums">
                {avgSpeed.toFixed(1)}
              </span>
              <span className="text-sm font-medium text-muted-foreground">knot</span>
            </div>
            <p className="text-xs text-muted-foreground">rata-rata kecepatan kapal berlayar</p>
          </CardContent>
        </Card>

        {/* Utilisasi Armada */}
        <Card className="gap-0 rounded-xl py-0 shadow-none">
          <CardHeader className="px-4 pb-1 pt-3">
            <CardDescription className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
              <Target className="size-4" /> Utilisasi Armada
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={utilisasiData} dataKey="value" cx="50%" cy="50%" outerRadius={28} innerRadius={16} strokeWidth={0}>
                      {utilisasiData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1 text-[11px]">
                {utilisasiData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <span className="inline-block size-2 rounded-full shrink-0" style={{ background: d.color }} />
                    <span className="text-muted-foreground">{d.name}</span>
                    <span className="font-semibold ml-auto pl-1">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Bottom: Active Units Table + Activity Feed */}
      <section className="grid gap-3 md:grid-cols-3">
        {/* Active Units Table */}
        <div className="md:col-span-2">
          <Card className="rounded-xl shadow-none">
            <CardHeader className="flex flex-row items-center justify-between px-5 pb-3 pt-4">
              <div>
                <CardTitle>Unit Armada Aktif</CardTitle>
                <CardDescription>Status real-time armada kapal tongkang Kideco</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={onOpenRouteIntelligence}>
                Buka Command Center
                <ChevronRight className="ml-1 size-3.5" />
              </Button>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="overflow-hidden rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unit</TableHead>
                      <TableHead>Rute</TableHead>
                      <TableHead>Progres</TableHead>
                      <TableHead>ETA</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Kondisi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ships.map((ship) => {
                      const hb = healthBadge(ship.healthScore);
                      return (
                        <TableRow key={ship.id} className="cursor-pointer hover:bg-muted/40" onClick={() => onOpenMaintenance?.(ship.id)}>
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-sky-50">
                                <Ship className="size-5 text-sky-600" />
                              </div>
                              <div>
                                <div className="font-semibold text-sm">{ship.id}</div>
                                <div className="text-xs text-muted-foreground">{ship.type}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs text-muted-foreground max-w-[160px] truncate">
                              {ship.route ?? "—"}
                            </div>
                          </TableCell>
                          <TableCell>
                            {ship.progress != null ? (
                              <div className="min-w-[80px] space-y-1">
                                <Progress value={ship.progress} className="h-1.5" />
                                <span className="text-xs text-muted-foreground">{ship.progress}%</span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="tabular-nums text-sm font-semibold">
                            {ship.etaHour != null ? `${ship.etaHour}j` : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={shipStatusClass(ship.status)}>
                              {shipStatusLabel(ship.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={hb.className}>{hb.label}</Badge>
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

        {/* Activity Feed */}
        <Card className="rounded-xl shadow-none">
          <CardHeader className="px-5 pb-3 pt-4">
            <CardTitle>Aktivitas Sistem</CardTitle>
            <CardDescription>Log kejadian terbaru armada kapal</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="space-y-3">
              {SHIP_ACTIVITY_FEED.map((ev) => (
                <div key={ev.id} className="flex items-start gap-3">
                  <span className={`mt-1.5 size-2 shrink-0 rounded-full ${activityDot(ev.type)}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug">{ev.message}</p>
                    <p className="text-xs text-muted-foreground">{ev.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Maintenance Watch */}
      <section className="grid gap-3 md:grid-cols-2">
        <Card className="rounded-xl shadow-none">
          <CardHeader className="px-5 pb-3 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="size-4 text-[var(--warning-600)]" />
                  Maintenance Watch
                </CardTitle>
                <CardDescription>Kapal yang memerlukan perhatian segera</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="space-y-3">
              {ships
                .filter((s) => s.healthScore < 85)
                .sort((a, b) => a.healthScore - b.healthScore)
                .map((ship) => {
                  const level = shipHealthLevel(ship.healthScore);
                  const tone = shipHealthTone(level);
                  return (
                    <div
                      key={ship.id}
                      className="flex items-center justify-between rounded-xl border p-3 hover:bg-muted/40 cursor-pointer"
                      onClick={() => onOpenMaintenance?.(ship.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-sky-50">
                          <Ship className="size-5 text-sky-600" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold">{ship.id}</div>
                          <div className="text-xs text-muted-foreground">{shipNextAction(ship)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={tone.badge}>{level}</Badge>
                        <span className={`text-sm font-bold ${tone.text}`}>{ship.healthScore}</span>
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-none">
          <CardHeader className="px-5 pb-3 pt-4">
            <CardTitle>Ringkasan Kondisi Armada</CardTitle>
            <CardDescription>Status komponen kritis per kapal</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-4">
            {ships.map((ship) => {
              const level = shipHealthLevel(ship.healthScore);
              const tone = shipHealthTone(level);
              return (
                <div key={ship.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Ship className="size-3.5 text-sky-600" />
                      <span className="text-sm font-semibold">{ship.id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={tone.badge}>{level}</Badge>
                      <span className={`text-sm font-bold tabular-nums ${tone.text}`}>{ship.healthScore}</span>
                    </div>
                  </div>
                  <Progress
                    value={ship.healthScore}
                    className={`h-2 ${
                      ship.healthScore >= 85
                        ? "[&>div]:bg-[var(--success-500)]"
                        : ship.healthScore >= 70
                        ? "[&>div]:bg-[var(--warning-500)]"
                        : "[&>div]:bg-[var(--danger-500)]"
                    }`}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
