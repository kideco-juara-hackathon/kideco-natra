"use client";

import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Gauge,
  Ship,
  Thermometer,
  Wrench,
} from "lucide-react";

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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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

type RiskLevel = "Aman" | "Monitor" | "Risiko" | "Kritis";

function componentRisk(ship: ShipRow): Array<{ name: string; value: string; unit: string; level: RiskLevel; note: string }> {
  const active = ship.status === "berlayar";

  let engineLevel: RiskLevel = "Aman";
  if (active) {
    if (ship.engineTempC >= 95) engineLevel = "Kritis";
    else if (ship.engineTempC >= 88) engineLevel = "Risiko";
    else if (ship.engineTempC >= 82) engineLevel = "Monitor";
  }

  let lubLevel: RiskLevel = "Aman";
  if (ship.lubOilPressureBar < 2.5) lubLevel = "Kritis";
  else if (ship.lubOilPressureBar < 3.2) lubLevel = "Risiko";
  else if (ship.lubOilPressureBar < 3.8) lubLevel = "Monitor";

  let coolantLevel: RiskLevel = "Aman";
  if (active) {
    if (ship.coolantTempC >= 90) coolantLevel = "Kritis";
    else if (ship.coolantTempC >= 85) coolantLevel = "Risiko";
    else if (ship.coolantTempC >= 78) coolantLevel = "Monitor";
  }

  let rpmLevel: RiskLevel = "Aman";
  if (ship.rpmEngine > 1300) rpmLevel = "Risiko";
  else if (ship.rpmEngine > 1200) rpmLevel = "Monitor";

  return [
    {
      name: "Mesin Utama",
      value: String(ship.engineTempC),
      unit: "°C",
      level: engineLevel,
      note: engineLevel === "Aman" ? "Suhu normal" : engineLevel === "Monitor" ? "Perlu dipantau" : "Suhu tinggi — inspeksi",
    },
    {
      name: "Sistem Pelumasan",
      value: ship.lubOilPressureBar.toFixed(1),
      unit: "bar",
      level: lubLevel,
      note: lubLevel === "Aman" ? "Tekanan normal" : lubLevel === "Monitor" ? "Sedikit rendah" : "Tekanan rendah — risiko keausan",
    },
    {
      name: "Sistem Pendingin",
      value: String(ship.coolantTempC),
      unit: "°C",
      level: coolantLevel,
      note: coolantLevel === "Aman" ? "Pendingin normal" : coolantLevel === "Monitor" ? "Mendekati batas" : "Overheating — tahan operasi",
    },
    {
      name: "RPM Mesin",
      value: ship.rpmEngine > 0 ? String(ship.rpmEngine) : "—",
      unit: ship.rpmEngine > 0 ? "rpm" : "",
      level: rpmLevel,
      note: rpmLevel === "Aman" ? "Dalam rentang normal" : rpmLevel === "Monitor" ? "RPM tinggi — monitor vibrasi" : "RPM kritis",
    },
  ];
}

function riskTone(level: RiskLevel) {
  if (level === "Aman")   return { badge: "bg-[var(--success-50)] text-[var(--success-700)]", text: "text-[var(--success-700)]" };
  if (level === "Monitor") return { badge: "bg-[var(--info-50)] text-[var(--info-700)]",       text: "text-[var(--info-700)]" };
  if (level === "Risiko")  return { badge: "bg-[var(--warning-50)] text-[var(--warning-700)]", text: "text-[var(--warning-700)]" };
  return { badge: "bg-[var(--danger-50)] text-[var(--danger-700)]", text: "text-[var(--danger-700)]" };
}

function riskSort(level: RiskLevel): number {
  if (level === "Kritis") return 0;
  if (level === "Risiko") return 1;
  if (level === "Monitor") return 2;
  return 3;
}

function MetricCard({
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

function ShipDetailContent({ ship }: { ship: ShipRow }) {
  const level = shipHealthLevel(ship.healthScore);
  const tone = shipHealthTone(level);
  const components = componentRisk(ship).sort((a, b) => riskSort(a.level) - riskSort(b.level));
  const activityFeed = SHIP_ACTIVITY_FEED.filter((e) =>
    e.message.includes(ship.id) || e.message.includes(ship.name),
  );

  return (
    <div className="space-y-4">
      {/* Health summary */}
      <div className="grid gap-3 md:grid-cols-2">
        <Card className="rounded-xl shadow-none">
          <CardContent className="flex items-center gap-5 px-5 py-4">
            <div className="relative flex size-20 shrink-0 items-center justify-center">
              <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.9155"
                  fill="none"
                  strokeWidth="3"
                  stroke={ship.healthScore >= 85 ? "var(--success-500)" : ship.healthScore >= 70 ? "var(--warning-500)" : "var(--danger-500)"}
                  strokeDasharray={`${ship.healthScore} ${100 - ship.healthScore}`}
                  strokeLinecap="round"
                />
              </svg>
              <span className={`text-xl font-bold tabular-nums ${tone.text}`}>{ship.healthScore}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">Health Score</p>
              <Badge variant="outline" className={`mt-1 ${tone.badge}`}>{level}</Badge>
              <p className="mt-2 text-xs text-muted-foreground">{shipNextAction(ship)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-none">
          <CardHeader className="px-5 pb-2 pt-4">
            <CardTitle className="text-sm">Detail Unit</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4 space-y-1.5 text-sm">
            {[
              ["Nama Kapal", ship.name],
              ["Tongkang", ship.barge],
              ["Tipe", ship.type],
              ["Kapasitas", `${ship.capacityTon.toLocaleString()} ton`],
              ["Status", shipStatusLabel(ship.status)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Component risk table */}
      <Card className="rounded-xl shadow-none">
        <CardHeader className="px-5 pb-3 pt-4">
          <CardTitle>Analisis Komponen</CardTitle>
          <CardDescription>Status sensor dan kondisi sistem kritis kapal</CardDescription>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Komponen</TableHead>
                  <TableHead>Nilai</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Keterangan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {components.map((c) => {
                  const t = riskTone(c.level);
                  return (
                    <TableRow key={c.name}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className={`tabular-nums font-semibold ${t.text}`}>
                        {c.value}{c.unit ? ` ${c.unit}` : ""}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={t.badge}>{c.level}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.note}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Activity events for this ship */}
      {activityFeed.length > 0 && (
        <Card className="rounded-xl shadow-none">
          <CardHeader className="px-5 pb-3 pt-4">
            <CardTitle>Aktivitas Kapal</CardTitle>
            <CardDescription>Log kejadian terkait unit ini</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-3">
            {activityFeed.map((ev) => (
              <div key={ev.id} className="flex items-start gap-3">
                <span className={`mt-1.5 size-2 shrink-0 rounded-full ${
                  ev.type === "danger" ? "bg-red-500" :
                  ev.type === "success" ? "bg-emerald-500" :
                  ev.type === "warning" ? "bg-amber-500" : "bg-sky-500"
                }`} />
                <div>
                  <p className="text-sm leading-snug">{ev.message}</p>
                  <p className="text-xs text-muted-foreground">{ev.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function ShipMaintenanceScreen({
  initialSelectedId,
}: {
  initialSelectedId?: string | null;
}) {
  const ships = SHIP_DATA;
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSelectedId ?? ships[0]?.id ?? null,
  );
  const [sheetOpen, setSheetOpen] = useState(false);

  const selectedShip = ships.find((s) => s.id === selectedId) ?? null;

  const avgHealth = Math.round(ships.reduce((sum, s) => sum + s.healthScore, 0) / ships.length);
  const atRisk = ships.filter((s) => s.healthScore < 70).length;
  const inMaintenance = ships.filter((s) => s.status === "perawatan").length;
  const safe = ships.filter((s) => shipHealthLevel(s.healthScore) === "Aman").length;

  function handleSelect(id: string) {
    setSelectedId(id);
    setSheetOpen(true);
  }

  return (
    <>
      <div className="space-y-4">
        {/* KPI */}
        <section className="grid gap-3 md:grid-cols-4">
          <MetricCard icon={Activity}      label="Rata-rata Kondisi" value={String(avgHealth)}    helper="health score rata-rata armada" />
          <MetricCard icon={CheckCircle2}  label="Kapal Aman"        value={String(safe)}          helper="kondisi optimal untuk berlayar" />
          <MetricCard icon={AlertTriangle} label="Perlu Perhatian"   value={String(atRisk)}        helper="health score di bawah 70" />
          <MetricCard icon={Wrench}        label="Dalam Perawatan"   value={String(inMaintenance)} helper="unit sedang di-service" />
        </section>

        {/* Fleet table */}
        <Card className="rounded-xl shadow-none">
          <CardHeader className="px-5 pb-3 pt-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Status Kondisi Armada</CardTitle>
                <CardDescription>
                  Klik baris atau tombol Detail untuk melihat analisis komponen per kapal.
                </CardDescription>
              </div>
              <Badge variant="outline">{ships.length} unit</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Health Score</TableHead>
                    <TableHead>Suhu Mesin</TableHead>
                    <TableHead>Oli Pelumas</TableHead>
                    <TableHead>Rekomendasi</TableHead>
                    <TableHead className="w-[104px] text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...ships]
                    .sort((a, b) => a.healthScore - b.healthScore)
                    .map((ship) => {
                      const level = shipHealthLevel(ship.healthScore);
                      const tone = shipHealthTone(level);
                      const selected = ship.id === selectedId;
                      return (
                        <TableRow
                          key={ship.id}
                          className={`cursor-pointer ${selected ? "bg-primary/5" : "hover:bg-muted/40"}`}
                          onClick={() => handleSelect(ship.id)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg border ${
                                ship.status === "berlayar" ? "bg-sky-50" :
                                ship.status === "sandar" ? "bg-emerald-50" : "bg-red-50"
                              }`}>
                                <Ship className={`size-5 ${
                                  ship.status === "berlayar" ? "text-sky-600" :
                                  ship.status === "sandar" ? "text-emerald-600" : "text-red-500"
                                }`} />
                              </div>
                              <div>
                                <div className="font-semibold">{ship.id}</div>
                                <div className="text-xs text-muted-foreground">{ship.type}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={shipStatusClass(ship.status)}>
                              {shipStatusLabel(ship.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="min-w-[120px] space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-semibold tabular-nums ${tone.text}`}>{ship.healthScore}</span>
                                <Badge variant="outline" className={`text-[10px] py-0 px-1.5 h-4 ${tone.badge}`}>{level}</Badge>
                              </div>
                              <Progress
                                value={ship.healthScore}
                                className={`h-1.5 ${
                                  ship.healthScore >= 85 ? "[&>div]:bg-[var(--success-500)]" :
                                  ship.healthScore >= 70 ? "[&>div]:bg-[var(--warning-500)]" :
                                  "[&>div]:bg-[var(--danger-500)]"
                                }`}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {ship.status !== "sandar" ? `${ship.engineTempC}°C` : "—"}
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {ship.lubOilPressureBar.toFixed(1)} bar
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            <p className="truncate text-xs text-muted-foreground">{shipNextAction(ship)}</p>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => { e.stopPropagation(); handleSelect(ship.id); }}
                            >
                              <Gauge className="size-4" />
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

        {/* Fleet health overview */}
        <Card className="rounded-xl shadow-none">
          <CardHeader className="px-5 pb-3 pt-4">
            <CardTitle>Kondisi Armada Sekilas</CardTitle>
            <CardDescription>Progress bar kondisi seluruh kapal</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-4">
            {[...ships]
              .sort((a, b) => a.healthScore - b.healthScore)
              .map((ship) => {
                const level = shipHealthLevel(ship.healthScore);
                const tone = shipHealthTone(level);
                return (
                  <div
                    key={ship.id}
                    className="cursor-pointer space-y-1.5 rounded-xl p-2 hover:bg-muted/40"
                    onClick={() => handleSelect(ship.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Ship className="size-3.5 text-sky-600" />
                        <span className="text-sm font-semibold">{ship.id}</span>
                        <Badge variant="outline" className={`text-[10px] py-0 px-1.5 h-4 ${shipStatusClass(ship.status)}`}>
                          {shipStatusLabel(ship.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={tone.badge}>{level}</Badge>
                        <span className={`text-sm font-bold tabular-nums ${tone.text}`}>{ship.healthScore}</span>
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </div>
                    </div>
                    <Progress
                      value={ship.healthScore}
                      className={`h-2 ${
                        ship.healthScore >= 85 ? "[&>div]:bg-[var(--success-500)]" :
                        ship.healthScore >= 70 ? "[&>div]:bg-[var(--warning-500)]" :
                        "[&>div]:bg-[var(--danger-500)]"
                      }`}
                    />
                    <p className="text-xs text-muted-foreground">{shipNextAction(ship)}</p>
                  </div>
                );
              })}
          </CardContent>
        </Card>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="flex flex-col overflow-hidden p-0 sm:max-w-[420px]">
          <SheetHeader className="shrink-0 border-b p-5 pb-4">
            <SheetTitle className="text-lg">{selectedShip?.id ?? "Detail Kapal"}</SheetTitle>
            {selectedShip && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Badge variant="outline" className={shipStatusClass(selectedShip.status)}>
                  {shipStatusLabel(selectedShip.status)}
                </Badge>
                <Badge
                  variant="outline"
                  className={shipHealthTone(shipHealthLevel(selectedShip.healthScore)).badge}
                >
                  {shipHealthLevel(selectedShip.healthScore)}
                </Badge>
              </div>
            )}
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-5">
            {selectedShip ? (
              <ShipDetailContent ship={selectedShip} />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
                <Ship className="size-8" />
                <p className="text-sm">Pilih kapal dari tabel untuk melihat detail.</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
