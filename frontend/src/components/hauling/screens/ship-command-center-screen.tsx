"use client";

import { useState } from "react";
import {
  Anchor,
  BarChart3,
  ChevronRight,
  Clock,
  Info,
  Play,
  Ship,
  Sun,
  Target,
  Wrench,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  SHIP_DATA,
  shipHealthTone,
  shipHealthLevel,
  shipStatusLabel,
  type ShipRow,
} from "@/data/ship-data";
import { ShipMapShell } from "./ship-map-shell";

// ── Shift HUD ─────────────────────────────────────────────

function HudCell({
  icon,
  label,
  primary,
  secondary,
}: {
  icon: React.ReactNode;
  label: string;
  primary: string;
  secondary: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-subtle)]">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          {label}
        </p>
        <p className="text-[13px] font-bold text-[var(--text-default)] mt-0.5 leading-none">
          {primary}
        </p>
        <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-none">{secondary}</p>
      </div>
    </div>
  );
}

function ShiftHud({
  ships,
  voyageTarget,
  voyageActive,
}: {
  ships: ShipRow[];
  voyageTarget: number;
  voyageActive: boolean;
}) {
  const berlayar = ships.filter((s) => s.status === "berlayar").length;
  const totalMuatan = ships.reduce((sum, s) => sum + s.cargoTon, 0);
  const achievedPct =
    voyageTarget > 0 ? Math.round((totalMuatan / voyageTarget) * 100) : 0;
  const fleetPct =
    ships.length > 0 ? Math.round((berlayar / ships.length) * 100) : 0;

  return (
    <div className="pointer-events-auto flex w-full items-center justify-between gap-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]/95 p-3 shadow-[var(--shadow-sm)] backdrop-blur-md">
      <div className="flex flex-1 items-center justify-between gap-4 px-2">
        <HudCell
          icon={<Sun className="size-[18px]" />}
          label="Shift"
          primary="Day Shift"
          secondary="06:00 - 18:00"
        />
        <div className="h-8 w-px bg-[var(--border-subtle)]" />
        <HudCell
          icon={<Target className="size-[18px]" />}
          label="Target Muatan"
          primary={`${(voyageTarget / 1000).toFixed(0)}.000 ton`}
          secondary="Target Voyage"
        />
        <div className="h-8 w-px bg-[var(--border-subtle)]" />
        <HudCell
          icon={<BarChart3 className="size-[18px]" />}
          label="Achieved"
          primary={`${(totalMuatan / 1000).toFixed(1)}k ton`}
          secondary={`${achievedPct}% dari target`}
        />
        <div className="h-8 w-px bg-[var(--border-subtle)]" />
        <HudCell
          icon={<Ship className="size-[18px]" />}
          label="Active Units"
          primary={`${berlayar} unit`}
          secondary={`${fleetPct}% dari armada`}
        />
        <div className="h-8 w-px bg-[var(--border-subtle)]" />
        <HudCell
          icon={<Clock className="size-[18px]" />}
          label="Status"
          primary={voyageActive ? "On Schedule" : "Standby"}
          secondary={voyageActive ? "Voyage berjalan" : "Voyage belum dimulai"}
        />
      </div>
      <button
        type="button"
        className="flex items-center gap-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] py-2 px-3 text-[12px] font-semibold text-[var(--text-default)] shadow-[var(--shadow-sm)] transition hover:bg-[var(--bg-subtle)] cursor-pointer"
      >
        Detail Shift
        <ChevronRight className="size-3.5" />
      </button>
    </div>
  );
}

// ── Fleet Rail ────────────────────────────────────────────

function ShipCard({
  ship,
  selected,
  onSelect,
  voyageActive,
}: {
  ship: ShipRow;
  selected: boolean;
  onSelect: (id: string) => void;
  voyageActive: boolean;
}) {
  const level = shipHealthLevel(ship.healthScore);
  const tone = shipHealthTone(level);

  const iconBg =
    ship.status === "berlayar"
      ? "bg-sky-500"
      : ship.status === "sandar"
        ? "bg-emerald-500"
        : "bg-red-500";

  const StatusIcon =
    ship.status === "sandar" ? Anchor : ship.status === "perawatan" ? Wrench : Ship;

  const statusTextClass =
    ship.status === "berlayar"
      ? "text-sky-600"
      : ship.status === "sandar"
        ? "text-emerald-600"
        : "text-red-600";

  return (
    <button
      onClick={() => voyageActive && onSelect(ship.id)}
      type="button"
      className={cn(
        "w-full rounded-xl border p-3 text-left transition flex flex-col gap-2",
        selected
          ? "border-sky-400 bg-sky-50/25 shadow-[var(--shadow-sm)]"
          : "border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-default)] hover:bg-[var(--bg-subtle)]/50",
        !voyageActive && "opacity-60 cursor-not-allowed",
      )}
    >
      {/* Identity row */}
      <div className="flex items-center justify-between gap-3 w-full">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-white shadow-sm",
              iconBg,
            )}
          >
            <StatusIcon className="size-[18px] text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-body-sm font-bold text-[var(--text-default)] leading-none">
              {ship.id}
            </span>
            <span className={cn("block text-[12px] font-semibold mt-1 leading-none", statusTextClass)}>
              {shipStatusLabel(ship.status)}
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="block text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider leading-none">
            Kesehatan
          </span>
          <span className={cn("block text-body-sm font-bold mt-1 leading-none", tone.text)}>
            {ship.healthScore}/100
          </span>
        </div>
      </div>

      {/* Detail rows */}
      {ship.status === "berlayar" && (
        <div className="w-full border-t border-[var(--border-subtle)] pt-2 space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="text-[var(--text-muted)]">Rute</span>
            <span className="font-semibold text-[var(--text-default)] truncate max-w-[145px]">
              {ship.route ?? "—"}
            </span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-[var(--text-muted)]">Kecepatan</span>
            <span className="font-semibold">{ship.speedKnot} kn</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-[var(--text-muted)]">ETA</span>
            <span className="font-semibold">
              {ship.etaHour ? `${ship.etaHour} jam` : "—"}
            </span>
          </div>
          {ship.progress != null && (
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[var(--bg-subtle)]">
              <div
                className="h-full rounded-full bg-sky-500 transition-all duration-700"
                style={{ width: `${ship.progress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {ship.status === "sandar" && (
        <div className="w-full border-t border-[var(--border-subtle)] pt-2 grid grid-cols-3 gap-1">
          <div>
            <p className="text-[9.5px] text-[var(--text-muted)]">Lokasi</p>
            <p className="text-[11px] font-semibold">Dermaga</p>
          </div>
          <div>
            <p className="text-[9.5px] text-[var(--text-muted)]">Status</p>
            <p className="text-[11px] font-semibold text-emerald-600">Siap Operasi</p>
          </div>
          <div>
            <p className="text-[9.5px] text-[var(--text-muted)]">Berthing</p>
            <p className="text-[11px] font-semibold">{ship.berth ?? 45} mnt</p>
          </div>
        </div>
      )}

      {ship.status === "perawatan" && (
        <div className="w-full border-t border-[var(--border-subtle)] pt-2 grid grid-cols-3 gap-1">
          <div>
            <p className="text-[9.5px] text-[var(--text-muted)]">Lokasi</p>
            <p className="text-[11px] font-semibold">Dockyard</p>
          </div>
          <div>
            <p className="text-[9.5px] text-[var(--text-muted)]">Status</p>
            <p className="text-[11px] font-semibold text-red-600">Perawatan</p>
          </div>
          <div>
            <p className="text-[9.5px] text-[var(--text-muted)]">Estimasi</p>
            <p className="text-[11px] font-semibold">{ship.estimasiJam ?? 6} jam</p>
          </div>
        </div>
      )}
    </button>
  );
}

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
  const readyCount = ships.filter((s) => s.status === "sandar").length;

  return (
    <aside className="pointer-events-auto flex h-full w-[280px] flex-col overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-sm)]">
      <header className="flex items-center justify-between border-b border-[var(--border-default)] px-4 py-3 shrink-0">
        <span className="text-[12px] font-bold uppercase tracking-wider text-[var(--text-default)]">
          Status Armada Kapal
        </span>
        <span className="text-caption font-medium text-[var(--text-muted)]">
          {ships.length} / {ships.length} unit
        </span>
      </header>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {ships.map((ship) => (
          <ShipCard
            key={ship.id}
            ship={ship}
            selected={ship.id === selectedId}
            onSelect={onSelect}
            voyageActive={voyageActive}
          />
        ))}
      </div>

      {voyageActive && readyCount > 0 && (
        <div className="border-t border-[var(--border-default)] p-3 shrink-0">
          <Button className="w-full gap-2 bg-red-600 hover:bg-red-700 text-white">
            <Zap className="size-4" />
            Dispatch Semua ({readyCount} Unit)
          </Button>
        </div>
      )}

      <div className="border-t border-[var(--border-default)] p-3.5 bg-[var(--bg-subtle)]/20 shrink-0">
        <div className="flex gap-2.5">
          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <div>
            <p className="text-caption font-bold text-[var(--text-default)]">
              {readyCount > 0 ? `${readyCount} unit siap beroperasi` : "Semua unit beroperasi"}
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-normal font-medium">
              {readyCount > 0
                ? "Menunggu perintah dispatch untuk memulai voyage."
                : "Monitor status armada kapal secara real-time."}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ── Voyage not-started overlay ────────────────────────────

function StartVoyageOverlay({
  ships,
  voyageTarget,
  onStart,
}: {
  ships: ShipRow[];
  voyageTarget: number;
  onStart: () => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[560] grid place-items-center px-6 bg-black/10">
      <section className="pointer-events-auto w-full max-w-[420px] rounded-3xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-8 shadow-[var(--shadow-xl)] flex flex-col items-center text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-sky-50 text-sky-600 mb-4">
          <Ship className="size-6 fill-sky-600 text-sky-600" />
        </div>
        <p className="text-[12px] font-bold uppercase tracking-wider text-sky-600">
          Awal Voyage
        </p>
        <h2 className="mt-2 text-xl font-bold text-[var(--text-default)]">
          Voyage belum dimulai
        </h2>
        <p className="mt-2 text-body-sm text-[var(--text-muted)] leading-relaxed">
          Aktifkan voyage untuk mulai dispatch kapal dan memantau posisi armada secara real-time.
        </p>
        <div className="mt-6 w-full border-t border-[var(--border-subtle)] pt-5 grid grid-cols-3 gap-2 text-left">
          {[
            ["Target Muatan", `${(voyageTarget / 1000).toFixed(0)}.000 ton`],
            ["Pelabuhan", "Tarahan"],
            ["Armada", `${ships.length} unit`],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-[11px] font-semibold text-[var(--text-muted)] leading-none">
                {label}
              </p>
              <p className="mt-1.5 text-[12px] font-bold text-[var(--text-default)]">{value}</p>
            </div>
          ))}
        </div>
        <button
          className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-sky-600 py-3 px-4 text-body-sm font-semibold text-white transition hover:bg-sky-700 active:scale-[0.98] cursor-pointer"
          onClick={onStart}
          type="button"
        >
          <Play className="size-4 fill-white text-white" />
          Mulai Voyage
        </button>
      </section>
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────

export function ShipCommandCenterScreen({
  onOpenOverview,
}: {
  onOpenOverview?: () => void;
}) {
  const ships = SHIP_DATA;
  const voyageTarget = 24000;
  const [voyageActive, setVoyageActive] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function handleSelect(id: string) {
    setSelectedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="flex h-full w-full gap-4 bg-[var(--bg-app-frame)] p-4 text-[var(--text-default)]">
      {/* Left: Fleet Rail */}
      <FleetShipRail
        ships={ships}
        selectedId={selectedId}
        onSelect={handleSelect}
        voyageActive={voyageActive}
      />

      {/* Right: HUD + Map */}
      <div className="flex flex-1 flex-col gap-4 min-w-0 h-full">
        <ShiftHud ships={ships} voyageTarget={voyageTarget} voyageActive={voyageActive} />

        <div className="flex flex-1 min-h-0">
          <div className="relative flex-1 min-w-0 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-sm)] overflow-hidden">
            {/* Route simulation notice */}
            <div className="group absolute left-3 top-3 z-[500]">
              <div className="flex cursor-help items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50/95 px-2.5 py-1.5 shadow-sm backdrop-blur-sm">
                <Info className="size-3.5 shrink-0 text-amber-500" />
                <span className="text-[11px] font-semibold text-amber-700">Rute Simulasi</span>
              </div>
              <div className="pointer-events-none absolute left-0 top-full mt-2 hidden w-[260px] group-hover:block">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 shadow-lg text-[11px] leading-snug text-amber-900">
                  <p className="font-bold mb-1">Rute & Lokasi Dianonimkan</p>
                  <p>Jalur rute dan posisi kapal merupakan simulasi berbasis pola operasional nyata. Tidak mencerminkan rute atau posisi aktual di lapangan.</p>
                </div>
              </div>
            </div>

            <ShipMapShell
              ships={ships}
              selectedShipId={selectedId}
              onShipSelect={(id) => {
                if (!voyageActive) return;
                handleSelect(id);
              }}
            />

            {/* Bottom info banner (pre-voyage) */}
            {!voyageActive && (
              <div className="absolute bottom-4 left-1/2 z-[500] -translate-x-1/2 flex items-start gap-3 w-[calc(100%-2rem)] max-w-[620px] rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-3.5 shadow-[var(--shadow-md)]">
                <span className="flex size-6 shrink-0 place-items-center justify-center rounded-full bg-[#111827] text-white">
                  <span className="text-[12px] font-bold">i</span>
                </span>
                <p className="text-body-sm text-[var(--text-default)] leading-normal font-medium">
                  Semua kapal dalam status{" "}
                  <strong className="font-bold">Sandar / Standby</strong>.
                  Menunggu perintah dispatch. Tidak ada pergerakan aktif.
                </p>
              </div>
            )}

            {/* Start-voyage overlay */}
            {!voyageActive && (
              <StartVoyageOverlay
                ships={ships}
                voyageTarget={voyageTarget}
                onStart={() => setVoyageActive(true)}
              />
            )}

            {/* Post-voyage hint when nothing selected */}
            {voyageActive && !selectedId && (
              <div className="pointer-events-none absolute bottom-4 left-1/2 z-[500] -translate-x-1/2">
                <div className="pointer-events-auto rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-2 text-xs font-medium text-muted-foreground shadow-[var(--shadow-md)]">
                  Klik kapal di peta untuk melihat detail & dispatch
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
