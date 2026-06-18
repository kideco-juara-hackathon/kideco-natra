"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Anchor,
  ChevronRight,
  Navigation,
  Package,
  Ship,
  Waves,
  X,
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
  SHIP_DATA,
  SHIP_NODES,
  SHIP_ROUTES,
  shipHealthLevel,
  shipHealthTone,
  shipStatusClass,
  shipStatusLabel,
  type ShipRow,
} from "@/data/ship-data";

function FleetShipRail({
  ships,
  selectedId,
  onSelect,
  voyageActive,
}: {
  ships: ShipRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  voyageActive: boolean;
}) {
  return (
    <aside className="flex h-full w-[240px] shrink-0 flex-col border-r bg-[var(--bg-surface)]">
      <div className="border-b px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Armada Kapal</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{ships.length} unit terdaftar</p>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {ships.map((ship) => {
          const level = shipHealthLevel(ship.healthScore);
          const tone = shipHealthTone(level);
          const selected = ship.id === selectedId;
          return (
            <button
              key={ship.id}
              onClick={() => voyageActive && onSelect(ship.id)}
              className={`w-full px-3 py-3 text-left transition-colors ${
                selected ? "bg-primary/8 border-l-2 border-primary" : "hover:bg-muted/40 border-l-2 border-transparent"
              } ${!voyageActive ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                  ship.status === "berlayar" ? "bg-sky-50" :
                  ship.status === "sandar" ? "bg-emerald-50" : "bg-red-50"
                }`}>
                  <Ship className={`size-5 ${
                    ship.status === "berlayar" ? "text-sky-600" :
                    ship.status === "sandar" ? "text-emerald-600" : "text-red-500"
                  }`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-sm font-semibold truncate">{ship.id}</span>
                    <span className={`text-[11px] font-semibold ${tone.text}`}>{ship.healthScore}</span>
                  </div>
                  <Badge variant="outline" className={`mt-0.5 text-[10px] py-0 px-1.5 h-4 ${shipStatusClass(ship.status)}`}>
                    {shipStatusLabel(ship.status)}
                  </Badge>
                </div>
              </div>
              {ship.progress != null && (
                <Progress value={ship.progress} className="mt-2 h-1 [&>div]:bg-sky-500" />
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function VoyageHud({
  ships,
  voyageTarget,
}: {
  ships: ShipRow[];
  voyageTarget: number;
}) {
  const berlayar = ships.filter((s) => s.status === "berlayar").length;
  const sandar = ships.filter((s) => s.status === "sandar").length;
  const totalMuatan = ships.reduce((sum, s) => sum + s.cargoTon, 0);
  const progress = voyageTarget > 0 ? Math.min((totalMuatan / voyageTarget) * 100, 100) : 0;

  return (
    <div className="flex shrink-0 items-center gap-4 border-b bg-[var(--bg-surface)] px-4 py-3">
      <div className="flex items-center gap-4 flex-1">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-sky-50">
            <Waves className="size-4 text-sky-600" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Kapal Berlayar</p>
            <p className="text-lg font-bold tabular-nums">{berlayar}</p>
          </div>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50">
            <Anchor className="size-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Kapal Sandar</p>
            <p className="text-lg font-bold tabular-nums">{sandar}</p>
          </div>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--info-50)]">
            <Package className="size-4 text-[var(--info-600)]" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Total Muatan</p>
            <p className="text-lg font-bold tabular-nums">{(totalMuatan / 1000).toFixed(1)}k ton</p>
          </div>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="flex-1 max-w-[200px]">
          <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
            <span>Target Voyage</span>
            <span className="font-semibold">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-[10px] text-muted-foreground mt-0.5">{totalMuatan.toLocaleString()} / {voyageTarget.toLocaleString()} ton</p>
        </div>
      </div>
    </div>
  );
}

function ShipDispatchPanel({
  ship,
  onClose,
}: {
  ship: ShipRow;
  onClose: () => void;
}) {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [stage, setStage] = useState<"route" | "review" | "done">("route");

  const level = shipHealthLevel(ship.healthScore);
  const tone = shipHealthTone(level);

  if (stage === "done") {
    return (
      <aside className="flex h-full w-[320px] shrink-0 flex-col border-l bg-[var(--bg-surface)]">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="font-semibold text-sm">Dispatch Berhasil</p>
          <button onClick={onClose}><X className="size-4 text-muted-foreground" /></button>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-emerald-50">
            <Navigation className="size-8 text-emerald-600" />
          </div>
          <div>
            <p className="font-semibold">{ship.id}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {SHIP_ROUTES.find((r) => r.id === selectedRouteId)?.label ?? "Rute dipilih"}
            </p>
            <Badge className="mt-2 bg-emerald-50 text-emerald-700">Voyage Dimulai</Badge>
          </div>
          <Button size="sm" variant="outline" className="w-full" onClick={onClose}>Tutup Panel</Button>
        </div>
      </aside>
    );
  }

  if (stage === "review") {
    const route = SHIP_ROUTES.find((r) => r.id === selectedRouteId);
    return (
      <aside className="flex h-full w-[320px] shrink-0 flex-col border-l bg-[var(--bg-surface)]">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <button onClick={() => setStage("route")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            ← Kembali
          </button>
          <button onClick={onClose}><X className="size-4 text-muted-foreground" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Konfirmasi Voyage</p>
            <Card className="rounded-xl shadow-none">
              <CardContent className="px-4 py-3 space-y-2">
                {[
                  ["Kapal", ship.id],
                  ["Rute", route?.label ?? "—"],
                  ["Jarak", route ? `${route.distanceNm} NM` : "—"],
                  ["Est. ETA", route ? `${route.etaHour} jam` : "—"],
                  ["Kondisi", `${ship.healthScore}/100`],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-semibold">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          {ship.healthScore < 70 && (
            <div className="rounded-xl border border-[var(--warning-200)] bg-[var(--warning-50)] p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-[var(--warning-600)]" />
                <p className="text-sm font-semibold text-[var(--warning-800)]">Perhatian</p>
              </div>
              <p className="mt-1 text-xs text-[var(--warning-700)]">Health score rendah. Pertimbangkan inspeksi sebelum departure.</p>
            </div>
          )}
        </div>
        <div className="border-t p-4">
          <Button className="w-full" onClick={() => setStage("done")}>
            <Navigation className="mr-2 size-4" />
            Berangkatkan Kapal
          </Button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex h-full w-[320px] shrink-0 flex-col border-l bg-[var(--bg-surface)]">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Ship className="size-4 text-sky-600" />
          <p className="font-semibold text-sm">{ship.id}</p>
          <Badge variant="outline" className={tone.badge}>{level}</Badge>
        </div>
        <button onClick={onClose}><X className="size-4 text-muted-foreground" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="rounded-xl border p-3 text-sm space-y-1.5">
          {[
            ["Kapasitas", `${ship.capacityTon.toLocaleString()} ton`],
            ["Kecepatan", `${ship.speedKnot} knot`],
            ["RPM Mesin", `${ship.rpmEngine}`],
            ["Suhu Mesin", `${ship.engineTempC}°C`],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-semibold">{value}</span>
            </div>
          ))}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Pilih Rute Voyage</p>
          <div className="space-y-2">
            {SHIP_ROUTES.map((route) => (
              <button
                key={route.id}
                onClick={() => setSelectedRouteId(route.id)}
                className={`w-full text-left rounded-xl border p-3 transition-colors ${
                  selectedRouteId === route.id
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{route.label}</p>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </div>
                <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
                  <span>{route.distanceNm} NM</span>
                  <span>ETA ~{route.etaHour}j</span>
                </div>
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Pelabuhan Tujuan</p>
          <div className="space-y-1.5">
            {SHIP_NODES.map((node) => (
              <div key={node.id} className="flex items-center gap-2 rounded-lg border px-3 py-2">
                <div className={`size-2 rounded-full shrink-0 ${
                  node.type === "dermaga" ? "bg-sky-500" :
                  node.type === "muara" ? "bg-emerald-500" : "bg-amber-500"
                }`} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">{node.label}</p>
                  <p className="text-[10px] text-muted-foreground">{node.id}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t p-4">
        <Button
          className="w-full"
          disabled={!selectedRouteId}
          onClick={() => setStage("review")}
        >
          Tinjau & Konfirmasi
          <ChevronRight className="ml-2 size-4" />
        </Button>
      </div>
    </aside>
  );
}

export function ShipCommandCenterScreen({
  onOpenOverview,
}: {
  onOpenOverview?: () => void;
}) {
  const ships = SHIP_DATA;
  const [voyageActive, setVoyageActive] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const voyageTarget = 24000; // 3 ships × 8000 ton

  const selectedShip = ships.find((s) => s.id === selectedId) ?? null;
  const dispatchOpen = voyageActive && selectedShip !== null && selectedShip.status === "sandar";

  return (
    <div className="flex h-full min-h-0 gap-0 overflow-hidden">
      {/* Left fleet rail */}
      <FleetShipRail
        ships={ships}
        selectedId={selectedId}
        onSelect={setSelectedId}
        voyageActive={voyageActive}
      />

      {/* Right column: HUD + map/content */}
      <div className="flex flex-1 min-w-0 flex-col">
        {voyageActive && (
          <VoyageHud ships={ships} voyageTarget={voyageTarget} />
        )}

        <div className="relative flex flex-1 min-h-0 gap-0">
          {/* Main content area */}
          <div className="relative flex-1 min-w-0 overflow-hidden bg-[var(--bg-app-frame)]">
            {!voyageActive ? (
              /* Start Voyage Overlay */
              <div className="flex h-full flex-col items-center justify-center gap-5 p-8 text-center">
                <div className="flex size-20 items-center justify-center rounded-2xl border-2 border-dashed border-sky-300 bg-sky-50">
                  <Ship className="size-10 text-sky-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Voyage Belum Dimulai</h3>
                  <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                    Mulai voyage untuk mengaktifkan dispatch kapal, memantau posisi real-time, dan mengelola rute armada.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm w-full max-w-xs">
                  {[
                    ["Target Muatan", `${(voyageTarget / 1000).toFixed(0)}k ton`],
                    ["Pelabuhan", "Tarahan"],
                    ["Armada", `${ships.length} unit`],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border p-3">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="font-bold text-base mt-1">{value}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Semua unit dalam status Sandar / Siap</p>
                <Button size="lg" onClick={() => setVoyageActive(true)}>
                  <Ship className="mr-2 size-5" />
                  Mulai Voyage
                </Button>
              </div>
            ) : (
              /* Active voyage: fleet overview */
              <div className="p-4 space-y-3 overflow-y-auto h-full">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Status Armada — Voyage Aktif</h3>
                  <Button size="sm" variant="outline" onClick={() => setSelectedId(null)}>
                    {selectedId ? "Batalkan Pilihan" : "Pilih Kapal untuk Dispatch"}
                  </Button>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  {ships.map((ship) => {
                    const level = shipHealthLevel(ship.healthScore);
                    const tone = shipHealthTone(level);
                    const isSelected = ship.id === selectedId;
                    return (
                      <Card
                        key={ship.id}
                        className={`rounded-xl shadow-none cursor-pointer transition-all ${
                          isSelected ? "ring-2 ring-primary" : "hover:shadow-md"
                        } ${ship.status === "perawatan" ? "opacity-60" : ""}`}
                        onClick={() => ship.status !== "perawatan" && setSelectedId(ship.id === selectedId ? null : ship.id)}
                      >
                        <CardHeader className="px-4 pb-2 pt-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`flex size-8 items-center justify-center rounded-lg ${
                                ship.status === "berlayar" ? "bg-sky-50" :
                                ship.status === "sandar" ? "bg-emerald-50" : "bg-red-50"
                              }`}>
                                <Ship className={`size-4 ${
                                  ship.status === "berlayar" ? "text-sky-600" :
                                  ship.status === "sandar" ? "text-emerald-600" : "text-red-500"
                                }`} />
                              </div>
                              <CardTitle className="text-sm">{ship.id}</CardTitle>
                            </div>
                            <Badge variant="outline" className={shipStatusClass(ship.status)}>
                              {shipStatusLabel(ship.status)}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="px-4 pb-3 space-y-2">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Kondisi</span>
                            <span className={`font-semibold ${tone.text}`}>{ship.healthScore}/100 — {level}</span>
                          </div>
                          <Progress
                            value={ship.healthScore}
                            className={`h-1.5 ${
                              ship.healthScore >= 85 ? "[&>div]:bg-emerald-500" :
                              ship.healthScore >= 70 ? "[&>div]:bg-amber-500" :
                              "[&>div]:bg-red-500"
                            }`}
                          />
                          {ship.progress != null && (
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Progres Voyage</span>
                              <span className="font-semibold">{ship.progress}%</span>
                            </div>
                          )}
                          {ship.status === "berlayar" && ship.etaHour != null && (
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">ETA</span>
                              <span className="font-semibold">{ship.etaHour}j tersisa</span>
                            </div>
                          )}
                          {ship.status === "sandar" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full mt-1 text-xs h-7"
                              onClick={(e) => { e.stopPropagation(); setSelectedId(ship.id); }}
                            >
                              <Navigation className="mr-1 size-3" />
                              Dispatch Kapal Ini
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Rute & Pelabuhan Info */}
                <Card className="rounded-xl shadow-none">
                  <CardHeader className="px-4 pb-2 pt-3">
                    <CardTitle className="text-sm">Jaringan Rute Aktif</CardTitle>
                    <CardDescription className="text-xs">Titik-titik kunci dalam operasi hauling laut</CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 pb-3">
                    <div className="grid gap-2 md:grid-cols-3">
                      {SHIP_NODES.map((node) => (
                        <div key={node.id} className="flex items-center gap-3 rounded-xl border p-3">
                          <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                            node.type === "dermaga" ? "bg-sky-50" :
                            node.type === "muara" ? "bg-emerald-50" : "bg-amber-50"
                          }`}>
                            {node.type === "dermaga" ? <Anchor className="size-5 text-sky-600" /> :
                             node.type === "muara" ? <Waves className="size-5 text-emerald-600" /> :
                             <Navigation className="size-5 text-amber-600" />}
                          </div>
                          <div>
                            <p className="text-xs font-semibold">{node.label}</p>
                            <p className="text-[10px] text-muted-foreground">{node.id}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Right dispatch panel */}
          {dispatchOpen && selectedShip && (
            <ShipDispatchPanel
              ship={selectedShip}
              onClose={() => setSelectedId(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
