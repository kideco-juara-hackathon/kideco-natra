"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Wrench } from "lucide-react";

import { toneAccent, type CommandEvent } from "@/lib/command-center/events";
import { useNotifications } from "@/lib/command-center/notifications-context";

/**
 * Interrupts the dispatcher with a centered modal + dimmed backdrop for CRITICAL
 * events only (event.critical). Non-critical events stay in the toast layer.
 * Multiple criticals queue and are shown one at a time.
 */
export function CriticalAlertModal() {
  const { events, act } = useNotifications();
  const [queue, setQueue] = useState<CommandEvent[]>([]);
  const [mounted, setMounted] = useState(false);
  const seenRef = useRef<Set<string>>(new Set());
  const mountedAtRef = useRef<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      mountedAtRef.current = Date.now();
      setMounted(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const mountedAt = mountedAtRef.current;
    if (mountedAt === null) return;
    const fresh = events.filter(
      (event) =>
        event.critical &&
        !seenRef.current.has(event.id) &&
        event.createdAt >= mountedAt - 500,
    );
    if (fresh.length === 0) return;
    for (const event of fresh) seenRef.current.add(event.id);
    setQueue((current) => [...current, ...fresh]);
  }, [events]);

  const current = queue[0];

  function dismiss() {
    setQueue((rest) => rest.slice(1));
  }

  if (!mounted || !current) return null;

  const accent = toneAccent(current.tone);
  const remaining = queue.length - 1;

  return createPortal(
    <div className="fixed inset-0 z-[2100] grid place-items-center p-4">
      <style>{`
        @keyframes cc-modal-in {
          from { opacity: 0; transform: translateY(10px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes cc-backdrop-in { from { opacity: 0; } to { opacity: 1; } }
        .cc-critical-backdrop { animation: cc-backdrop-in 0.2s ease both; }
        .cc-critical-card { animation: cc-modal-in 0.28s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>

      {/* Dimmed backdrop */}
      <div
        className="cc-critical-backdrop absolute inset-0 bg-[rgba(8,6,5,0.62)] backdrop-blur-sm"
        onClick={dismiss}
      />

      {/* Centered card */}
      <div
        className="cc-critical-card relative w-full max-w-[420px] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-lg)]"
        role="alertdialog"
        aria-modal="true"
        style={{ boxShadow: `0 0 0 1px ${accent}, var(--shadow-lg)` }}
      >
        {/* Accent header strip */}
        <div
          className="flex items-center gap-2 px-5 py-2.5"
          style={{ backgroundColor: `color-mix(in srgb, ${accent} 14%, transparent)`, color: accent }}
        >
          <AlertTriangle className="size-4" />
          <span className="text-caption font-bold uppercase tracking-[0.14em]">Peringatan Kritis</span>
          {remaining > 0 ? (
            <span className="ml-auto text-caption font-semibold opacity-80">+{remaining} lagi</span>
          ) : null}
        </div>

        <div className="px-5 py-4">
          <div className="flex items-start gap-3">
            <span
              className="grid size-10 shrink-0 place-items-center rounded-full"
              style={{ backgroundColor: `color-mix(in srgb, ${accent} 16%, transparent)`, color: accent }}
            >
              <Wrench className="size-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-heading-md text-[var(--text-default)]">{current.title}</h2>
              {current.detail ? (
                <p className="mt-1 text-body-sm leading-relaxed text-[var(--text-muted)]">
                  {current.detail}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              className="h-10 rounded-[var(--radius-md)] border border-[var(--border-default)] px-4 text-body-sm font-medium text-[var(--text-subtle)] transition hover:bg-[var(--bg-subtle)]"
              onClick={dismiss}
              type="button"
            >
              Tutup
            </button>
            {current.actionLabel ? (
              <button
                className="h-10 rounded-[var(--radius-md)] px-4 text-body-sm font-semibold text-white transition hover:brightness-95"
                onClick={() => {
                  act(current);
                  dismiss();
                }}
                style={{ backgroundColor: accent }}
                type="button"
              >
                {current.actionLabel}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
