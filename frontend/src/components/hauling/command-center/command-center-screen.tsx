"use client";

import { useMemo } from "react";
import { MapPinned, Play, SlidersHorizontal, Target, Truck } from "lucide-react";

import { RebasedRouteMapShell } from "@/components/route/rebased-route-map-shell";
import { Button } from "@/components/ui/button";
import { useCommandCenter } from "@/lib/command-center/use-command-center";

import { DispatchPanel } from "../components/dispatch-panel";
import { CriticalAlertModal } from "./critical-alert-modal";
import { FleetRail } from "./fleet-rail";
import { NotificationToasts } from "./notification-feed";
import { ShiftHud } from "./shift-hud";

function StartShiftOverlay({
  idleCount,
  shiftTargetTon,
  dumpPoint,
  objective,
  onStart,
}: {
  idleCount: number;
  shiftTargetTon: number;
  dumpPoint: string;
  objective: string;
  onStart: () => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[560] grid place-items-center px-6 bg-black/10">
      <section className="pointer-events-auto w-full max-w-[420px] rounded-3xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-8 shadow-[var(--shadow-xl)] flex flex-col items-center text-center">
        {/* Center top icon */}
        <div className="flex size-14 items-center justify-center rounded-full bg-red-50 text-[var(--kideco-red-500)] mb-4">
          <Truck className="size-6 fill-[var(--kideco-red-500)] text-[var(--kideco-red-500)]" />
        </div>

        {/* Header text */}
        <p className="text-[12px] font-bold uppercase tracking-wider text-[var(--kideco-red-500)]">
          Awal Shift
        </p>
        <h2 className="mt-2 text-xl font-bold text-[var(--text-default)]">
          Shift belum dimulai
        </h2>
        <p className="mt-2 text-body-sm text-[var(--text-muted)] leading-relaxed">
          Semua unit masih standby di Dispatch Point.
          <br />
          Pergerakan realtime baru berjalan setelah shift dimulai.
        </p>

        {/* 3-column Grid */}
        <div className="mt-6 w-full border-t border-[var(--border-subtle)] pt-5 grid grid-cols-3 gap-2 text-left">
          <div>
            <p className="text-[11px] font-semibold text-[var(--text-muted)] leading-none">Target Shift</p>
            <p className="mt-1.5 text-[12px] font-bold text-[var(--text-default)] truncate">
              {shiftTargetTon.toLocaleString("id-ID")} ton
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[var(--text-muted)] leading-none">Dump Point</p>
            <p className="mt-1.5 text-[12px] font-bold text-[var(--text-default)] truncate" title={dumpPoint}>
              {dumpPoint}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[var(--text-muted)] leading-none">Objective</p>
            <p className="mt-1.5 text-[12px] font-bold text-[var(--text-default)] truncate">
              {objective}
            </p>
          </div>
        </div>

        {/* Start button */}
        <button
          className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--kideco-red-500)] py-3 px-4 text-body-sm font-semibold text-white transition hover:bg-[var(--kideco-red-600)] active:scale-[0.98] cursor-pointer"
          onClick={onStart}
          type="button"
        >
          <Play className="size-4 fill-white text-white" />
          Mulai Shift
        </button>
      </section>
    </div>
  );
}

export function CommandCenterScreen({ onOpenOverview }: { onOpenOverview?: () => void }) {
  const cc = useCommandCenter();
  const isShiftActive = cc.shiftStatus === "active";

  // Active assignments + the in-progress draft so the map can preview the route.
  const mapAssignments = useMemo(
    () => [...cc.assignments, ...cc.draftAssignments],
    [cc.assignments, cc.draftAssignments],
  );

  const dispatchOpen = isShiftActive && cc.selectedTruck?.status === "idle";
  const selectTruck = isShiftActive ? cc.selectTruck : () => undefined;

  return (
    <div className="flex h-full w-full gap-4 bg-[var(--bg-app-frame)] p-4 text-[var(--text-default)]">
      {/* Left Column: Fleet Status Roster */}
      <FleetRail
        assignments={cc.assignments}
        onSelect={selectTruck}
        selectedTruckId={cc.selectedTruckId}
        trucks={cc.trucks}
      />

      {/* Right Column: HUD + Map Area Card */}
      <div className="flex flex-1 flex-col gap-4 min-w-0 h-full">
        {/* Top: Shift HUD */}
        <ShiftHud
          activeCount={cc.activeTrucks.length}
          hauledTon={cc.hauledTon}
          idleCount={cc.idleTrucks.length}
          onShiftTarget={cc.onShiftTarget}
          shiftStatus={cc.shiftStatus}
          shiftTargetTon={cc.shiftTargetTon}
        />

        {/* Bottom: Map + Dispatch Panel side-by-side */}
        <div className="flex flex-1 min-h-0 gap-4">
          {/* Map — never covered by the panel */}
          <div className="relative flex-1 min-w-0 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-sm)] overflow-hidden">
            <RebasedRouteMapShell
              assignments={mapAssignments}
              mode="operational"
              onTruckSelect={selectTruck}
              selectedTruckId={cc.selectedTruckId}
              showInfoLabel={false}
              trucks={cc.trucks}
              shiftControlsLeft={false}
            />

            {/* Bottom Center Info Banner (Visible during Standby) */}
            {!isShiftActive && (
              <div className="absolute bottom-4 left-1/2 z-[500] -translate-x-1/2 flex items-start gap-3 w-[calc(100%-2rem)] max-w-[620px] rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-3.5 shadow-[var(--shadow-md)]">
                <span className="flex size-6 shrink-0 place-items-center justify-center rounded-full bg-[#111827] text-white">
                  <span className="text-[12px] font-bold">i</span>
                </span>
                <p className="text-body-sm text-[var(--text-default)] leading-normal font-medium">
                  Semua dump truck dalam status <strong className="font-bold text-[var(--text-default)]">Idle / Ready</strong>. Menunggu perintah dispatch. Tidak ada pergerakan aktif.
                </p>
              </div>
            )}

            {/* Start Shift Overlay floats centered over the map */}
            {!isShiftActive && (
              <StartShiftOverlay
                dumpPoint={cc.shiftDumpPoint}
                idleCount={cc.idleTrucks.length}
                objective={cc.shiftObjective}
                onStart={cc.startShift}
                shiftTargetTon={cc.shiftTargetTon}
              />
            )}
          </div>

          {/* Dispatch Panel — proper column beside the map */}
          {dispatchOpen && cc.selectedTruck && (
            <DispatchPanel
              dispatchStage={cc.dispatchStage}
              lastDispatchedTrip={cc.lastDispatchedTrip}
              manualLoadingPointId={cc.manualLoadingPointId}
              onAssignRoute={cc.assignRoute}
              onBack={cc.back}
              onClose={cc.closeDispatch}
              onDispatch={cc.dispatch}
              onManualLoadingPointChange={cc.changeManualLoadingPoint}
              onOpenOverview={onOpenOverview ?? cc.closeDispatch}
              onReview={cc.review}
              onRouteSelect={cc.selectRoute}
              selectedRoute={cc.selectedRoute}
              selectedTruck={cc.selectedTruck}
            />
          )}
        </div>
      </div>

      <NotificationToasts />
      <CriticalAlertModal />
    </div>
  );
}
