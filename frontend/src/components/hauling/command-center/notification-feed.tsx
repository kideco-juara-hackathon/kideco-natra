"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  CheckCircle2,
  CloudRain,
  Fuel,
  Layers,
  Send,
  Truck,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { toneAccent, type CommandEvent, type CommandEventKind } from "@/lib/command-center/events";
import { useNotifications } from "@/lib/command-center/notifications-context";

const KIND_ICON: Record<CommandEventKind, LucideIcon> = {
  "truck-ready": CheckCircle2,
  dispatched: Send,
  "low-fuel": Fuel,
  maintenance: Wrench,
  "pit-low": Layers,
  weather: CloudRain,
};

function timeAgo(createdAt: number) {
  const seconds = Math.max(0, Math.round((Date.now() - createdAt) / 1000));
  if (seconds < 10) return "baru saja";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.round(seconds / 60);
  return `${minutes}m`;
}

function EventIcon({ event }: { event: CommandEvent }) {
  const Icon = KIND_ICON[event.kind] ?? Truck;
  const accent = toneAccent(event.tone);
  return (
    <span
      className="grid size-8 shrink-0 place-items-center rounded-[var(--radius-md)]"
      style={{ backgroundColor: `color-mix(in srgb, ${accent} 14%, transparent)`, color: accent }}
    >
      <Icon className="size-4" />
    </span>
  );
}

/** Activity panel — rendered inside the top-bar bell dropdown. */
export function NotificationFeed({ onClose }: { onClose?: () => void }) {
  const { events, unreadCount, act: onAct, dismiss: onDismiss, markAllRead: onMarkAllRead } =
    useNotifications();

  return (
    <aside className="pointer-events-auto flex max-h-[min(520px,70vh)] w-[330px] flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-lg)]">
      <header className="flex items-center justify-between gap-2 border-b border-[var(--border-default)] px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-body-sm font-semibold text-[var(--text-default)]">Aktivitas Shift</span>
          {unreadCount > 0 ? (
            <span className="grid h-4 min-w-4 place-items-center rounded-full bg-[var(--kideco-red-500)] px-1 text-[9px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 ? (
            <button
              className="text-caption text-[var(--text-muted)] transition hover:text-[var(--text-default)]"
              onClick={onMarkAllRead}
              type="button"
            >
              Tandai dibaca
            </button>
          ) : null}
          {onClose ? (
            <button
              aria-label="Tutup"
              className="text-[var(--text-muted)] transition hover:text-[var(--text-default)]"
              onClick={onClose}
              type="button"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>
      </header>

      <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-2">
        {events.length === 0 ? (
          <p className="px-3 py-8 text-center text-caption text-[var(--text-muted)]">
            Belum ada aktivitas. Update operasional akan muncul di sini.
          </p>
        ) : (
          events.map((event) => (
            <article
              key={event.id}
              className={cn(
                "group relative rounded-[var(--radius-md)] border px-2.5 py-2 transition",
                event.read
                  ? "border-[var(--border-subtle)] bg-transparent"
                  : "border-[var(--border-default)] bg-[var(--bg-subtle)]/60",
              )}
              style={{ boxShadow: event.read ? undefined : `inset 3px 0 0 0 ${toneAccent(event.tone)}` }}
            >
              <div className="flex items-start gap-2.5">
                <EventIcon event={event} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-body-sm font-semibold text-[var(--text-default)]">
                      {event.title}
                    </p>
                    <span className="shrink-0 text-[10px] text-[var(--text-muted)]">
                      {timeAgo(event.createdAt)}
                    </span>
                  </div>
                  {event.detail ? (
                    <p className="mt-0.5 text-caption leading-snug text-[var(--text-muted)]">
                      {event.detail}
                    </p>
                  ) : null}
                  {event.actionLabel ? (
                    <button
                      className="mt-1.5 text-caption font-semibold text-[var(--kideco-red-600)] transition hover:text-[var(--kideco-red-700)]"
                      onClick={() => {
                        onAct(event);
                        onClose?.();
                      }}
                      type="button"
                    >
                      {event.actionLabel} →
                    </button>
                  ) : null}
                </div>
                <button
                  aria-label="Tutup notifikasi"
                  className="shrink-0 text-[var(--text-muted)] opacity-0 transition hover:text-[var(--text-default)] group-hover:opacity-100"
                  onClick={() => onDismiss(event.id)}
                  type="button"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </aside>
  );
}

type Toast = { event: CommandEvent; closing: boolean };

const TOAST_TTL_MS = 5000;
const TOAST_LEAVE_MS = 500;

/** Transient toasts: newest events slide in; auto-dismiss or close manually,
 *  animating toward the notification bell. Critical events are excluded. */
export function NotificationToasts() {
  const { events, act: onAct } = useNotifications();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);
  const seenRef = useRef<Set<string>>(new Set());
  const mountedAtRef = useRef<number>(0);

  useEffect(() => {
    mountedAtRef.current = Date.now();
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const closeToast = useCallback((id: string) => {
    setToasts((current) => {
      const target = current.find((toast) => toast.event.id === id);
      if (!target || target.closing) return current;
      return current.map((toast) =>
        toast.event.id === id ? { ...toast, closing: true } : toast,
      );
    });
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.event.id !== id));
    }, TOAST_LEAVE_MS);
  }, []);

  useEffect(() => {
    const fresh = events.filter(
      (event) =>
        !event.critical &&
        !seenRef.current.has(event.id) &&
        event.createdAt >= mountedAtRef.current - 500,
    );
    if (fresh.length === 0) return;

    for (const event of fresh) seenRef.current.add(event.id);
    setToasts((current) =>
      [...fresh.map((event) => ({ event, closing: false })), ...current].slice(0, 4),
    );

    const timers = fresh.map((event) =>
      window.setTimeout(() => closeToast(event.id), TOAST_TTL_MS),
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [events, closeToast]);

  if (!mounted || toasts.length === 0) return null;

  // Portal to <body> so no ancestor stacking context can trap the toast under the map.
  return createPortal(
    <div className="pointer-events-none fixed right-5 top-24 z-[2000] flex w-[330px] flex-col gap-2">
      <style>{`
        @keyframes cc-toast-in {
          from { opacity: 0; transform: translateX(28px) scale(0.96); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes cc-toast-to-bell {
          0%   { opacity: 1; transform: translate(0, 0) scale(1); }
          22%  { opacity: 1; transform: translate(-8px, 6px) scale(1.03); }
          100% { opacity: 0; transform: translate(70px, -96px) scale(0.06); }
        }
        .cc-toast-enter { animation: cc-toast-in 0.32s cubic-bezier(0.16,1,0.3,1) both; }
        .cc-toast-leave {
          animation: cc-toast-to-bell 0.5s cubic-bezier(0.4, 0, 0.7, 0.15) both;
          transform-origin: top right;
          pointer-events: none;
        }
      `}</style>
      {toasts.map((toast) => (
        <div
          key={toast.event.id}
          className={cn(
            "pointer-events-auto overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-lg)]",
            toast.closing ? "cc-toast-leave" : "cc-toast-enter",
          )}
          style={{ boxShadow: `inset 4px 0 0 0 ${toneAccent(toast.event.tone)}` }}
        >
          <div className="flex items-start gap-2.5 px-3 py-2.5">
            <EventIcon event={toast.event} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-body-sm font-semibold text-[var(--text-default)]">
                {toast.event.title}
              </p>
              {toast.event.detail ? (
                <p className="mt-0.5 line-clamp-2 text-caption leading-snug text-[var(--text-muted)]">
                  {toast.event.detail}
                </p>
              ) : null}
              {toast.event.actionLabel ? (
                <button
                  className="mt-1.5 text-caption font-semibold text-[var(--kideco-red-600)] transition hover:text-[var(--kideco-red-700)]"
                  onClick={() => {
                    onAct(toast.event);
                    closeToast(toast.event.id);
                  }}
                  type="button"
                >
                  {toast.event.actionLabel} →
                </button>
              ) : null}
            </div>
            <button
              aria-label="Tutup notifikasi"
              className="-mr-0.5 -mt-0.5 shrink-0 rounded text-[var(--text-muted)] transition hover:text-[var(--text-default)]"
              onClick={() => closeToast(toast.event.id)}
              type="button"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>,
    document.body,
  );
}
