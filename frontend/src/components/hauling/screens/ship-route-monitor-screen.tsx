"use client";

import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Fuel,
  Gauge,
  Ship,
  Timer,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  SHIP_BUNKER_HISTORY,
  SHIP_DATA,
  shipHealthLevel,
  shipHealthTone,
  shipStatusClass,
  shipStatusLabel,
  type ShipRow,
} from "@/data/ship-data";

type ShipLensTab = "overview" | "eta" | "bunker";

const BASELINE_BUNKER_LPH = 42; // typical cruising consumption

function healthBarClass(score: number): string {
  if (score >= 85) return "[&>div]:bg-[var(--success-600)]";
  if (score >= 70) return "[&>div]:bg-[var(--warning-600)]";
  return "[&>div]:bg-[var(--danger-600)]";
}

function bunkerStatus(lph: number): { label: string; badge: string; text: string } {
  if (lph === 0) return { label: "Sandar", badge: "bg-muted text-muted-foreground", text: "text-muted-foreground" };
  if (lph > BASELINE_BUNKER_LPH * 1.4) return { label: "Kritis", badge: "bg-[var(--danger-50)] text-[var(--danger-700)]", text: "text-[var(--danger-700)]" };
  if (lph > BASELINE_BUNKER_LPH * 1.15) return { label: "Tinggi", badge: "bg-[var(--warning-50)] text-[var(--warning-700)]", text: "text-[var(--warning-700)]" };
  return { label: "Normal", badge: "bg-[var(--success-50)] text-[var(--success-700)]", text: "text-[var(--success-700)]" };
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

function ShipTableRow({
  ship,
  selected,
  onSelect,
  extra,
}: {
  ship: ShipRow;
  selected: boolean;
  onSelect: (id: string) => void;
  extra: React.ReactNode;
}) {
  const level = shipHealthLevel(ship.healthScore);
  const tone = shipHealthTone(level);
  return (
    <TableRow
      className={`cursor-pointer ${selected ? "bg-primary/5" : "hover:bg-muted/40"}`}
      onClick={() => onSelect(ship.id)}
    >
      <TableCell>
        <div className="flex items-center gap-2.5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-sky-50">
            <Ship className="size-5 text-sky-600" />
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
      {extra}
      <TableCell>
        <div className="min-w-[120px] space-y-1">
          <span className={`text-sm font-semibold ${tone.text}`}>{ship.healthScore}</span>
          <Progress value={ship.healthScore} className={`h-2 ${healthBarClass(ship.healthScore)}`} />
        </div>
      </TableCell>
      <TableCell className="text-right">
        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onSelect(ship.id); }}>
          <Eye className="size-4" />
          Detail
        </Button>
      </TableCell>
    </TableRow>
  );
}

function OverviewLensShip({ ships, selectedId, onSelect }: { ships: ShipRow[]; selectedId: string | null; onSelect: (id: string) => void }) {
  const berlayar = ships.filter((s) => s.status === "berlayar").length;
  const onTime = ships.filter((s) => s.healthScore >= 70).length;
  const highBunker = ships.filter((s) => s.bunkerLph > BASELINE_BUNKER_LPH * 1.15).length;
  const avgHealth = Math.round(ships.reduce((sum, s) => sum + s.healthScore, 0) / ships.length);

  return (
    <div className="space-y-3">
      <section className="grid gap-3 md:grid-cols-4">
        <MetricCard icon={Ship}         label="Voyage Aktif"      value={String(berlayar)} helper="kapal sedang berlayar" />
        <MetricCard icon={CheckCircle2} label="Jadwal Normal"     value={String(onTime)}   helper="ETA voyage dalam batas" />
        <MetricCard icon={Fuel}         label="Konsumsi Tinggi"   value={String(highBunker)} helper="konsumsi di atas baseline" />
        <MetricCard icon={Activity}     label="Rata-rata Kondisi" value={String(avgHealth)} helper="rata-rata health score armada" />
      </section>
      <Card className="rounded-xl shadow-none">
        <CardHeader className="px-5 pb-3 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Ringkasan Voyage Aktif</CardTitle>
              <CardDescription>Gambungan ETA dan konsumsi bunker per kapal. Klik baris untuk detail.</CardDescription>
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
                  <TableHead>ETA</TableHead>
                  <TableHead>Progres</TableHead>
                  <TableHead>Bunker</TableHead>
                  <TableHead>Kondisi</TableHead>
                  <TableHead className="w-[104px] text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ships.map((ship) => {
                  const bs = bunkerStatus(ship.bunkerLph);
                  return (
                    <ShipTableRow
                      key={ship.id}
                      ship={ship}
                      selected={ship.id === selectedId}
                      onSelect={onSelect}
                      extra={
                        <>
                          <TableCell className="tabular-nums font-semibold">
                            {ship.etaHour != null ? `${ship.etaHour}j` : "—"}
                          </TableCell>
                          <TableCell>
                            {ship.progress != null ? (
                              <div className="min-w-[80px] space-y-1">
                                <Progress value={ship.progress} className="h-1.5" />
                                <span className="text-xs text-muted-foreground">{ship.progress}%</span>
                              </div>
                            ) : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={bs.badge}>{bs.label}</Badge>
                          </TableCell>
                        </>
                      }
                    />
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

function ETALensShip({ ships, selectedId, onSelect }: { ships: ShipRow[]; selectedId: string | null; onSelect: (id: string) => void }) {
  const berlayar = ships.filter((s) => s.status === "berlayar").length;
  const onTime = ships.filter((s) => s.status === "berlayar").length;
  const needAttention = ships.filter((s) => s.healthScore < 70).length;
  const etaHours = ships.filter((s) => s.etaHour != null).map((s) => s.etaHour!);
  const avgEta = etaHours.length > 0 ? `${Math.round(etaHours.reduce((a, b) => a + b, 0) / etaHours.length)}j` : "—";

  return (
    <div className="space-y-3">
      <section className="grid gap-3 md:grid-cols-4">
        <MetricCard icon={Ship}         label="Voyage Aktif"     value={String(berlayar)}     helper="kapal sedang berlayar" />
        <MetricCard icon={CheckCircle2} label="Sesuai Jadwal"    value={String(onTime)}       helper="ETA voyage normal" />
        <MetricCard icon={AlertTriangle} label="Perlu Perhatian" value={String(needAttention)} helper="potensi keterlambatan" />
        <MetricCard icon={Timer}         label="Rata-rata ETA"   value={avgEta}               helper="estimasi kedatangan saat ini" />
      </section>
      <Card className="rounded-xl shadow-none">
        <CardHeader className="px-5 pb-3 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Prediksi ETA per Kapal</CardTitle>
              <CardDescription>Estimasi kedatangan berdasarkan kecepatan dan progres voyage.</CardDescription>
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
                  <TableHead>ETA</TableHead>
                  <TableHead>Progres Voyage</TableHead>
                  <TableHead>Kecepatan</TableHead>
                  <TableHead>Kondisi</TableHead>
                  <TableHead className="w-[104px] text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ships.map((ship) => (
                  <ShipTableRow
                    key={ship.id}
                    ship={ship}
                    selected={ship.id === selectedId}
                    onSelect={onSelect}
                    extra={
                      <>
                        <TableCell className="tabular-nums font-semibold">
                          {ship.etaHour != null ? `${ship.etaHour} jam` : "—"}
                        </TableCell>
                        <TableCell>
                          {ship.progress != null ? (
                            <div className="min-w-[100px] space-y-1">
                              <Progress value={ship.progress} className="h-1.5" />
                              <span className="text-xs text-muted-foreground">{ship.progress}%</span>
                            </div>
                          ) : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {ship.speedKnot > 0 ? `${ship.speedKnot} kn` : "—"}
                        </TableCell>
                      </>
                    }
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BunkerLensShip({ ships, selectedId, onSelect }: { ships: ShipRow[]; selectedId: string | null; onSelect: (id: string) => void }) {
  const berlayar = ships.filter((s) => s.status === "berlayar").length;
  const normal = ships.filter((s) => bunkerStatus(s.bunkerLph).label === "Normal").length;
  const high = ships.filter((s) => ["Tinggi", "Kritis"].includes(bunkerStatus(s.bunkerLph).label)).length;
  const activeBunker = ships.filter((s) => s.bunkerLph > 0);
  const avgBunker = activeBunker.length > 0
    ? `${(activeBunker.reduce((sum, s) => sum + s.bunkerLph, 0) / activeBunker.length).toFixed(1)} L/j`
    : "—";

  return (
    <div className="space-y-3">
      <section className="grid gap-3 md:grid-cols-4">
        <MetricCard icon={Ship}         label="Voyage Aktif"       value={String(berlayar)} helper="kapal sedang berlayar" />
        <MetricCard icon={CheckCircle2} label="Konsumsi Normal"    value={String(normal)}   helper="bunker dalam batas wajar" />
        <MetricCard icon={AlertTriangle} label="Konsumsi Tinggi"   value={String(high)}     helper="di atas baseline konsumsi" />
        <MetricCard icon={Gauge}         label="Rata-rata Bunker"  value={avgBunker}        helper="rata-rata saat ini" />
      </section>
      <Card className="rounded-xl shadow-none">
        <CardHeader className="px-5 pb-3 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Konsumsi Bunker per Kapal</CardTitle>
              <CardDescription>Monitor konsumsi bahan bakar armada selama voyage berlangsung.</CardDescription>
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
                  <TableHead>Bunker Saat Ini</TableHead>
                  <TableHead>Status Bunker</TableHead>
                  <TableHead>RPM Mesin</TableHead>
                  <TableHead>Kondisi</TableHead>
                  <TableHead className="w-[104px] text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ships.map((ship) => {
                  const bs = bunkerStatus(ship.bunkerLph);
                  return (
                    <ShipTableRow
                      key={ship.id}
                      ship={ship}
                      selected={ship.id === selectedId}
                      onSelect={onSelect}
                      extra={
                        <>
                          <TableCell className={`tabular-nums font-semibold ${bs.text}`}>
                            {ship.bunkerLph > 0 ? `${ship.bunkerLph.toFixed(1)} L/j` : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={bs.badge}>{bs.label}</Badge>
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {ship.rpmEngine > 0 ? ship.rpmEngine : "—"}
                          </TableCell>
                        </>
                      }
                    />
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

function ShipDetailSheet({
  ship,
  activeTab,
}: {
  ship: ShipRow;
  activeTab: ShipLensTab;
}) {
  const level = shipHealthLevel(ship.healthScore);
  const tone = shipHealthTone(level);
  const bs = bunkerStatus(ship.bunkerLph);

  const etaDetails = ship.etaHour != null ? [
    ["Waktu voyage dasar", `${Math.round(ship.etaHour * 0.7)}j`],
    ["Penalti muatan", `+${Math.round(ship.etaHour * 0.2)}j`],
    ["Kondisi laut", `+${Math.round(ship.etaHour * 0.1)}j`],
  ] : [];

  return (
    <Card className="rounded-xl shadow-none">
      <CardHeader className="border-b px-5 pb-3 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>
              {activeTab === "eta" ? "Detail ETA" : activeTab === "bunker" ? "Detail Bunker" : "Ringkasan Voyage"}
            </CardTitle>
            <CardDescription>{ship.id} · {ship.type}</CardDescription>
          </div>
          <Badge variant="outline" className={tone.badge}>{level}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-5 py-4">
        {activeTab === "eta" && (
          <>
            <div className="rounded-xl border bg-muted/30 p-4 text-center">
              <div className={`text-5xl font-semibold tabular-nums ${ship.etaHour ? tone.text : "text-muted-foreground"}`}>
                {ship.etaHour != null ? `${ship.etaHour}j` : "—"}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">estimasi kedatangan</p>
            </div>
            {etaDetails.length > 0 && (
              <div className="overflow-hidden rounded-xl border">
                <Table>
                  <TableBody>
                    {etaDetails.map(([label, value]) => (
                      <TableRow key={label}>
                        <TableCell className="text-muted-foreground">{label}</TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">{value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
        {activeTab === "bunker" && (
          <>
            <div className="rounded-xl border bg-muted/30 p-4 text-center">
              <div className={`text-5xl font-semibold tabular-nums ${ship.bunkerLph > 0 ? bs.text : "text-muted-foreground"}`}>
                {ship.bunkerLph > 0 ? ship.bunkerLph.toFixed(1) : "—"}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">L/jam saat ini</p>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">Riwayat Bunker (5 terakhir)</p>
              <div className="overflow-hidden rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Waktu</TableHead>
                      <TableHead>Konsumsi</TableHead>
                      <TableHead>Kecepatan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {SHIP_BUNKER_HISTORY.map((h) => {
                      const hbs = bunkerStatus(h.lph);
                      return (
                        <TableRow key={h.time}>
                          <TableCell className="text-xs text-muted-foreground">{h.time}</TableCell>
                          <TableCell className={`tabular-nums font-semibold ${hbs.text}`}>{h.lph.toFixed(1)} L/j</TableCell>
                          <TableCell className="tabular-nums text-sm">{h.knot} kn</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}
        {activeTab === "overview" && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border bg-muted/30 p-3 text-center">
              <div className={`text-3xl font-semibold tabular-nums ${ship.etaHour ? tone.text : "text-muted-foreground"}`}>
                {ship.etaHour != null ? `${ship.etaHour}j` : "—"}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">ETA</p>
            </div>
            <div className="rounded-xl border bg-muted/30 p-3 text-center">
              <div className={`text-3xl font-semibold tabular-nums ${ship.bunkerLph > 0 ? bs.text : "text-muted-foreground"}`}>
                {ship.bunkerLph > 0 ? ship.bunkerLph.toFixed(0) : "—"}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">L/jam</p>
            </div>
          </div>
        )}
        <div className="rounded-xl border bg-background p-3 text-sm">
          <p className="mb-2 font-semibold">Konteks Voyage</p>
          <div className="space-y-2 text-muted-foreground">
            {[
              ["Kecepatan", ship.speedKnot > 0 ? `${ship.speedKnot} kn` : "Sandar"],
              ["Muatan", `${ship.cargoTon.toLocaleString()} ton`],
              ["RPM Mesin", ship.rpmEngine > 0 ? String(ship.rpmEngine) : "—"],
              ["Suhu Mesin", `${ship.engineTempC}°C`],
              ["Tekanan Oli", `${ship.lubOilPressureBar} bar`],
              ["Health Score", String(ship.healthScore)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span>{label}</span>
                <span className="font-medium text-foreground">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ShipRouteMonitorScreen() {
  const ships = SHIP_DATA;
  const [activeTab, setActiveTab] = useState<ShipLensTab>("overview");
  const [selectedId, setSelectedId] = useState<string | null>(ships[0]?.id ?? null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const selectedShip = ships.find((s) => s.id === selectedId) ?? null;

  function handleSelect(id: string) {
    setSelectedId(id);
    setSheetOpen(true);
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-3">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ShipLensTab)} className="gap-3">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="eta">ETA</TabsTrigger>
            <TabsTrigger value="bunker">Konsumsi Bunker</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewLensShip ships={ships} selectedId={selectedId} onSelect={handleSelect} />
          </TabsContent>
          <TabsContent value="eta">
            <ETALensShip ships={ships} selectedId={selectedId} onSelect={handleSelect} />
          </TabsContent>
          <TabsContent value="bunker">
            <BunkerLensShip ships={ships} selectedId={selectedId} onSelect={handleSelect} />
          </TabsContent>
        </Tabs>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="flex flex-col overflow-hidden p-0 sm:max-w-[480px]">
          <SheetHeader className="shrink-0 border-b p-5 pb-4">
            <SheetTitle className="text-lg">{selectedShip?.id ?? "Detail Kapal"}</SheetTitle>
            {selectedShip && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Badge variant="outline" className={shipStatusClass(selectedShip.status)}>
                  {shipStatusLabel(selectedShip.status)}
                </Badge>
                <Badge variant="outline" className={shipHealthTone(shipHealthLevel(selectedShip.healthScore)).badge}>
                  Kondisi {selectedShip.healthScore}
                </Badge>
              </div>
            )}
            {selectedShip?.progress != null && (
              <div className="space-y-1.5 pt-2">
                <p className="text-xs text-muted-foreground">{selectedShip.route}</p>
                <Progress value={selectedShip.progress} className="h-2" />
                <p className="text-right text-xs text-muted-foreground">{selectedShip.progress}% selesai</p>
              </div>
            )}
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-5">
            {selectedShip ? (
              <ShipDetailSheet ship={selectedShip} activeTab={activeTab} />
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
