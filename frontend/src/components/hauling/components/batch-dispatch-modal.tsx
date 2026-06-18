"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, Loader2, X, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { loadingPoints } from "@/data/hauling-screens";
import type { BatchDispatchEntry, BatchDispatchPhase } from "@/lib/command-center/use-command-center";
import { cn } from "@/lib/utils";

const RISK = {
  low: { label: "Rendah", cls: "text-emerald-600 dark:text-emerald-400" },
  medium: { label: "Sedang", cls: "text-amber-600 dark:text-amber-400" },
  high: { label: "Tinggi", cls: "text-red-600 dark:text-red-400" },
} as const;

function lpName(id: string) {
  return loadingPoints.find((p) => p.id === id)?.name ?? id;
}

function EntriesTable({ entries }: { entries: BatchDispatchEntry[] }) {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-[var(--border-subtle)]">
          <th className="pb-2 text-left text-caption font-medium text-[var(--text-muted)]">Unit</th>
          <th className="pb-2 text-left text-caption font-medium text-[var(--text-muted)]">Loading Point</th>
          <th className="pb-2 text-right text-caption font-medium text-[var(--text-muted)]">ETA</th>
          <th className="pb-2 text-right text-caption font-medium text-[var(--text-muted)]">Skor</th>
          <th className="pb-2 text-right text-caption font-medium text-[var(--text-muted)]">Risiko</th>
        </tr>
      </thead>
      <tbody>
        {entries.map(({ truck, recommendation: rec }) => {
          const risk = RISK[rec.riskLevel] ?? RISK.medium;
          return (
            <tr key={truck.id} className="border-b border-[var(--border-subtle)] last:border-b-0">
              <td className="py-2.5 text-body-sm font-semibold text-[var(--text-default)]">{truck.id}</td>
              <td className="py-2.5 text-body-sm text-[var(--text-subtle)]">{lpName(rec.loadingPointId)}</td>
              <td className="py-2.5 text-right text-body-sm text-[var(--text-subtle)]">{rec.etaMin} min</td>
              <td className="py-2.5 text-right text-body-sm font-semibold text-[var(--text-default)]">{rec.score}</td>
              <td className={cn("py-2.5 text-right text-body-sm font-medium", risk.cls)}>{risk.label}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function BatchDispatchModal({
  phase,
  onConfirm,
  onClose,
}: {
  phase: BatchDispatchPhase;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const isOpen = phase.kind !== "idle";
  const isDispatching = phase.kind === "dispatching";
  const entries = phase.kind === "ready" || phase.kind === "dispatching" ? phase.entries : [];

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[2000] grid place-items-center p-4">
      <style>{`
        @keyframes batch-backdrop-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes batch-modal-in {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .batch-backdrop { animation: batch-backdrop-in 0.18s ease both; }
        .batch-card { animation: batch-modal-in 0.24s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>

      {/* Backdrop */}
      <div
        className="batch-backdrop absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={!isDispatching ? onClose : undefined}
      />

      {/* Modal card */}
      <div className="batch-card relative w-full max-w-lg overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-xl)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-default)] px-5 py-4">
          <div>
            <h2 className="text-heading-md text-[var(--text-default)]">Dispatch Semua Unit</h2>
            {phase.kind !== "done" && (
              <p className="mt-0.5 text-caption text-[var(--text-muted)]">
                {phase.kind === "loading"
                  ? "Menghitung rute optimal untuk setiap unit..."
                  : `${entries.length} unit idle akan dikirim ke rute terbaik masing-masing.`}
              </p>
            )}
          </div>
          {!isDispatching && (
            <button
              className="grid size-8 place-items-center rounded-[var(--radius-md)] text-[var(--text-muted)] transition hover:bg-[var(--bg-subtle)] hover:text-[var(--text-default)]"
              onClick={onClose}
              type="button"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          {phase.kind === "loading" ? (
            <div className="flex items-center justify-center gap-3 py-10 text-[var(--text-muted)]">
              <Loader2 className="size-5 animate-spin" />
              <span className="text-body-sm">Menghitung rute...</span>
            </div>
          ) : phase.kind === "done" ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <CheckCircle2 className="size-10 text-emerald-500" />
              <p className="text-body-sm font-semibold text-[var(--text-default)]">
                {phase.count} unit berhasil didispatch
              </p>
            </div>
          ) : (
            <EntriesTable entries={entries} />
          )}
        </div>

        {/* Footer */}
        {phase.kind !== "loading" && (
          <div className="flex items-center justify-end gap-2 border-t border-[var(--border-default)] bg-[var(--bg-subtle)]/30 px-5 py-3">
            {phase.kind === "ready" && (
              <>
                <Button variant="outline" onClick={onClose}>
                  Batal
                </Button>
                <Button onClick={onConfirm}>
                  <Zap className="size-4" />
                  Dispatch {entries.length} Unit
                </Button>
              </>
            )}
            {phase.kind === "dispatching" && (
              <Button disabled>
                <Loader2 className="size-4 animate-spin" />
                Mendispatch...
              </Button>
            )}
            {phase.kind === "done" && (
              <Button onClick={onClose}>Selesai</Button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
