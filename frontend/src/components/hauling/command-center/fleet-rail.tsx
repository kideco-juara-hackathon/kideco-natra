"use client";

import { Truck as TruckIcon } from "lucide-react";

import type { RouteAssignment, Truck } from "@/data/hauling-screens";
import { loadingPoints } from "@/data/hauling-screens";
import { cn } from "@/lib/utils";

function loadingPointName(id: string) {
  return loadingPoints.find((point) => point.id === id)?.name ?? id;
}

function TruckCard({
  truck,
  assignment,
  selected,
  onSelect,
}: {
  truck: Truck;
  assignment: RouteAssignment | undefined;
  selected: boolean;
  onSelect: (truckId: string) => void;
}) {
  const isIdle = truck.status === "idle";

  return (
    <button
      className={cn(
        "w-full rounded-xl border p-3 text-left transition flex flex-col gap-2",
        selected
          ? "border-[var(--kideco-red-400)] bg-[var(--kideco-red-50)]/25 shadow-[var(--shadow-sm)]"
          : "border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-default)] hover:bg-[var(--bg-subtle)]/50",
      )}
      onClick={() => onSelect(truck.id)}
      type="button"
    >
      <div className="flex items-center justify-between gap-3 w-full">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Avatar Icon */}
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-subtle)]">
            <TruckIcon className="size-5" />
          </div>

          {/* Identity & Status */}
          <div className="min-w-0 flex-1">
            <span className="block text-body-sm font-bold text-[var(--text-default)] leading-none">
              {truck.id}
            </span>
            {isIdle ? (
              <span className="block text-[12px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 leading-none">
                Siap / Standby
              </span>
            ) : (
              <span className="block text-[12px] font-semibold text-teal-600 dark:text-teal-400 mt-1 leading-none">
                Aktif / Trip
              </span>
            )}
          </div>
        </div>

        {/* Health */}
        <div className="text-right shrink-0">
          <span className="block text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider leading-none">
            Kesehatan
          </span>
          <span className="block text-body-sm font-bold text-[var(--text-default)] mt-1 leading-none">
            {truck.healthScore}/100
          </span>
        </div>
      </div>

      {/* Task & Progress (only if active) */}
      {!isIdle && assignment ? (
        <div className="w-full mt-1 border-t border-[var(--border-subtle)] pt-2">
          <div className="flex items-center justify-between gap-2 text-caption">
            <span className="min-w-0 truncate text-[11px] text-[var(--text-muted)]">
              → {loadingPointName(assignment.loadingPointId)} · {assignment.etaMin}m
            </span>
            <span className="shrink-0 text-[11px] font-bold text-[var(--text-default)]">
              {Math.round(assignment.progress)}%
            </span>
          </div>
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[var(--bg-subtle)]">
            <div
              className="h-full rounded-full bg-[var(--kideco-red-500)] transition-all duration-700"
              style={{ width: `${Math.min(100, assignment.progress)}%` }}
            />
          </div>
        </div>
      ) : null}
    </button>
  );
}

export function FleetRail({
  trucks,
  assignments,
  selectedTruckId,
  onSelect,
}: {
  trucks: Truck[];
  assignments: RouteAssignment[];
  selectedTruckId: string | null;
  onSelect: (truckId: string) => void;
}) {
  const assignmentByTruck = new Map(assignments.map((assignment) => [assignment.truckId, assignment]));
  const idleCount = trucks.filter((truck) => truck.status === "idle").length;

  // Idle trucks first — they need the dispatcher's attention.
  const ordered = [...trucks].sort((a, b) => {
    if (a.status === b.status) return a.id.localeCompare(b.id);
    return a.status === "idle" ? -1 : 1;
  });

  return (
    <aside className="pointer-events-auto flex h-full w-[256px] flex-col overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-sm)]">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-[var(--border-default)] px-4 py-3 shrink-0">
        <span className="text-[12px] font-bold uppercase tracking-wider text-[var(--text-default)]">
          Status Armada
        </span>
        <span className="text-caption font-medium text-[var(--text-muted)]">
          {idleCount} / {trucks.length} unit
        </span>
      </header>

      {/* Roster list */}
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {ordered.map((truck) => (
          <TruckCard
            key={truck.id}
            assignment={assignmentByTruck.get(truck.id)}
            onSelect={onSelect}
            selected={truck.id === selectedTruckId}
            truck={truck}
          />
        ))}
      </div>

      {/* Bottom Status Card */}
      <div className="border-t border-[var(--border-default)] p-3.5 bg-[var(--bg-subtle)]/20 shrink-0">
        <div className="flex gap-2.5">
          <span className={cn(
            "mt-1.5 size-2 shrink-0 rounded-full",
            idleCount === trucks.length 
              ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
              : "bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.5)]"
          )} />
          <div>
            <p className="text-caption font-bold text-[var(--text-default)]">
              {idleCount === trucks.length ? "Semua unit siap beroperasi" : "Unit beroperasi"}
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-normal font-medium">
              {idleCount === trucks.length 
                ? "Menunggu perintah dispatch untuk memulai trip." 
                : `${trucks.length - idleCount} unit aktif, ${idleCount} unit standby.`}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

