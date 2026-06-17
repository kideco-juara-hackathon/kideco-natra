"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { CommandEvent } from "./events";

type ActHandler = (event: CommandEvent) => void;

type NotificationsValue = {
  events: CommandEvent[];
  unreadCount: number;
  push: (event: CommandEvent) => void;
  markAllRead: () => void;
  dismiss: (eventId: string) => void;
  act: (event: CommandEvent) => void;
  /** The active screen registers how a notification action should be handled. */
  setActHandler: (handler: ActHandler | null) => void;
};

const FALLBACK: NotificationsValue = {
  events: [],
  unreadCount: 0,
  push: () => undefined,
  markAllRead: () => undefined,
  dismiss: () => undefined,
  act: () => undefined,
  setActHandler: () => undefined,
};

const NotificationsContext = createContext<NotificationsValue | null>(null);

export function NotificationsProvider({
  children,
  initialEvents = [],
}: {
  children: ReactNode;
  initialEvents?: CommandEvent[];
}) {
  const [events, setEvents] = useState<CommandEvent[]>(initialEvents);
  const actRef = useRef<ActHandler | null>(null);

  const push = useCallback((event: CommandEvent) => {
    setEvents((current) => [event, ...current].slice(0, 24));
  }, []);

  const markAllRead = useCallback(() => {
    setEvents((current) => current.map((event) => ({ ...event, read: true })));
  }, []);

  const dismiss = useCallback((eventId: string) => {
    setEvents((current) => current.filter((event) => event.id !== eventId));
  }, []);

  const setActHandler = useCallback((handler: ActHandler | null) => {
    actRef.current = handler;
  }, []);

  const act = useCallback((event: CommandEvent) => {
    setEvents((current) =>
      current.map((item) => (item.id === event.id ? { ...item, read: true } : item)),
    );
    actRef.current?.(event);
  }, []);

  const unreadCount = useMemo(() => events.filter((event) => !event.read).length, [events]);

  const value = useMemo<NotificationsValue>(
    () => ({ events, unreadCount, push, markAllRead, dismiss, act, setActHandler }),
    [events, unreadCount, push, markAllRead, dismiss, act, setActHandler],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

/** Null-safe: screens rendered outside the provider get an inert fallback. */
export function useNotifications(): NotificationsValue {
  return useContext(NotificationsContext) ?? FALLBACK;
}
