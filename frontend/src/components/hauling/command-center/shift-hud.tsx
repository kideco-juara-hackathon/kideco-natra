"use client";

import { Sun, Target, BarChart3, Truck, Clock, ChevronRight } from "lucide-react";

import type { ShiftStatus } from "@/lib/command-center/use-command-center";

export function ShiftHud({
  hauledTon,
  shiftTargetTon,
  onShiftTarget,
  activeCount,
  idleCount,
  shiftStatus,
}: {
  hauledTon: number;
  shiftTargetTon: number;
  onShiftTarget: number;
  activeCount: number;
  idleCount: number;
  shiftStatus: ShiftStatus;
}) {
  const isActive = shiftStatus === "active";
  const totalCount = activeCount + idleCount;
  const activePercent = totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0;

  return (
    <div className="pointer-events-auto flex w-full items-center justify-between gap-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]/95 p-3 shadow-[var(--shadow-sm)] backdrop-blur-md">
      <div className="flex flex-1 items-center justify-between gap-4 px-2">
        {/* SHIFT */}
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-subtle)]">
            <Sun className="size-[18px]" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Shift</p>
            <p className="text-[13px] font-bold text-[var(--text-default)] mt-0.5 leading-none">Day Shift</p>
            <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-none">06:00 - 18:00</p>
          </div>
        </div>

        <div className="h-8 w-px bg-[var(--border-subtle)]" />

        {/* TARGET HAULING */}
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-subtle)]">
            <Target className="size-[18px]" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Target Hauling</p>
            <p className="text-[13px] font-bold text-[var(--text-default)] mt-0.5 leading-none">
              {shiftTargetTon.toLocaleString("id-ID")} ton
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-none">Target Shift</p>
          </div>
        </div>

        <div className="h-8 w-px bg-[var(--border-subtle)]" />

        {/* ACHIEVED */}
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-subtle)]">
            <BarChart3 className="size-[18px]" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Achieved</p>
            <p className="text-[13px] font-bold text-[var(--text-default)] mt-0.5 leading-none">
              {hauledTon.toLocaleString("id-ID")} ton
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-none">
              {onShiftTarget}% dari target
            </p>
          </div>
        </div>

        <div className="h-8 w-px bg-[var(--border-subtle)]" />

        {/* ACTIVE UNITS */}
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-subtle)]">
            <Truck className="size-[18px]" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Active Units</p>
            <p className="text-[13px] font-bold text-[var(--text-default)] mt-0.5 leading-none">
              {activeCount} unit
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-none">
              {activePercent}% dari fleet
            </p>
          </div>
        </div>

        <div className="h-8 w-px bg-[var(--border-subtle)]" />

        {/* STATUS */}
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-subtle)]">
            <Clock className="size-[18px]" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Status</p>
            <p className="text-[13px] font-bold text-[var(--text-default)] mt-0.5 leading-none">
              {isActive ? "On schedule" : "Standby"}
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-none">
              {isActive ? "Shift berjalan" : "Shift belum dimulai"}
            </p>
          </div>
        </div>
      </div>

      {/* DETAIL SHIFT BUTTON */}
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

