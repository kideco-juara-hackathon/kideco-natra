"use client";

import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Gauge,
  LogOut,
  Moon,
  Route,
  Search,
  Ship,
  Sun,
  Truck,
  Wrench,
} from "lucide-react";

export type SearchResult = {
  id: string;
  icon: LucideIcon;
  label: string;
  sublabel?: string;
  badge?: string;
  badgeClass?: string;
};

import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { NotificationFeed } from "@/components/hauling/command-center/notification-feed";
import { useNotifications } from "@/lib/command-center/notifications-context";
import { cn } from "@/lib/utils";

type NavChild = {
  key: string;
  label: string;
};

type NavItem = {
  key: string;
  icon: LucideIcon;
  label: string;
  children?: NavChild[];
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    title: "Global",
    items: [{ key: "overview", icon: Gauge, label: "Overview" }],
  },
  {
    title: "Hauling Darat",
    items: [
      { key: "hauling-overview", icon: Truck, label: "Overview" },
      {
        key: "hauling-route-intelligence",
        icon: Route,
        label: "Route Intelligence",
        children: [
          { key: "hauling-command-center", label: "Command Center" },
          { key: "hauling-route-monitor", label: "Route Monitor" },
        ],
      },
      { key: "hauling-maintenance", icon: Wrench, label: "Maintenance" },
    ],
  },
  {
    title: "Operasi Kapal",
    items: [
      { key: "marine-overview", icon: Ship, label: "Overview" },
      {
        key: "marine-route-intelligence",
        icon: Route,
        label: "Route Intelligence",
        children: [
          { key: "marine-command-center", label: "Command Center" },
          { key: "marine-route-monitor", label: "Route Monitor" },
        ],
      },
      { key: "marine-maintenance", icon: Wrench, label: "Maintenance" },
    ],
  },
];

const COLOR_SCHEME_STORAGE_KEY = "kideco-color-scheme";
const COLOR_SCHEME_EVENT = "kideco-color-scheme-change";

function getPreferredDarkMode() {
  if (typeof window === "undefined") {
    return false;
  }

  const storedScheme = window.localStorage.getItem(COLOR_SCHEME_STORAGE_KEY);
  if (storedScheme) {
    return storedScheme === "dark";
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

function subscribeToColorScheme(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const mediaQuery = window.matchMedia?.("(prefers-color-scheme: dark)");

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(COLOR_SCHEME_EVENT, onStoreChange);
  mediaQuery?.addEventListener("change", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(COLOR_SCHEME_EVENT, onStoreChange);
    mediaQuery?.removeEventListener("change", onStoreChange);
  };
}

function isNavItemActive(item: NavItem, activeKey: string) {
  return (
    item.key === activeKey ||
    item.children?.some((child) => child.key === activeKey)
  );
}

function Sidebar({
  activeKey,
  collapsed,
  onLogout,
  onNavigate,
  onToggleCollapsed,
}: {
  activeKey: string;
  collapsed: boolean;
  onLogout?: () => void;
  onNavigate?: (key: string) => void;
  onToggleCollapsed: () => void;
}) {
  return (
    <aside
      className={cn(
        "sticky top-0 z-30 hidden h-screen shrink-0 overflow-visible border-r border-border bg-sidebar-bg py-4 transition-[width] duration-200 lg:flex lg:flex-col",
        collapsed ? "w-[84px] px-3" : "w-[var(--sidebar-width)] px-4",
      )}
    >
      <div
        className={cn(
          "mb-6 shrink-0",
          collapsed
            ? "flex flex-col items-center gap-4"
            : "flex items-start justify-between gap-3 px-2",
        )}
      >
        <div
          className={cn(
            "min-w-0",
            collapsed ? "grid w-full place-items-center" : "flex-1",
          )}
        >
          <Image
            alt="NATRA"
            className={cn("h-auto", collapsed ? "w-[56px]" : "w-[172px]")}
            height={48}
            priority
            src="/natralogo.png"
            width={172}
          />
        </div>

        <button
          aria-label={collapsed ? "Perbesar sidebar" : "Perkecil sidebar"}
          className={cn(
            "shrink-0 transition text-text-subtle hover:text-foreground",
            collapsed
              ? "flex h-10 w-full items-center justify-center rounded-lg hover:bg-card"
              : "mt-[11px] grid size-8 place-items-center rounded-lg hover:bg-muted/50"
          )}
          onClick={onToggleCollapsed}
          title={collapsed ? "Perbesar sidebar" : "Perkecil sidebar"}
          type="button"
        >
          {collapsed ? (
            <ChevronsRight className="size-[18px]" />
          ) : (
            <ChevronsLeft className="size-5" />
          )}
        </button>
      </div>

      <nav
        className={cn(
          "min-h-0 flex-1 overflow-hidden",
          collapsed ? "space-y-3" : "space-y-5",
        )}
      >
        {navSections.map((section) => (
          <div key={section.title}>
            {!collapsed ? (
              <div className="mb-2 px-3 text-[11px] font-medium uppercase text-text-muted">
                {section.title}
              </div>
            ) : null}
            <div className={collapsed ? "space-y-1.5" : "space-y-1.5"}>
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isNavItemActive(item, activeKey);

                return (
                  <div key={`${section.title}-${item.key}`}>
                    <button
                      className={cn(
                        "flex h-10 w-full items-center rounded-lg text-[14px] transition",
                        collapsed ? "justify-center px-0" : "gap-4 px-3",
                        active
                          ? "bg-card text-primary shadow-sm ring-1 ring-border"
                          : "text-text-subtle hover:bg-card hover:text-foreground",
                      )}
                      onClick={() => onNavigate?.(item.key)}
                      title={collapsed ? item.label : undefined}
                      type="button"
                    >
                      <Icon className="size-[18px]" />
                      {!collapsed ? (
                        <span className="truncate">{item.label}</span>
                      ) : null}
                    </button>
                    {!collapsed && item.children ? (
                      <div className="ml-[34px] mt-1.5 space-y-1 border-l border-border pl-4">
                        {item.children.map((child) => (
                          <button
                            className={cn(
                              "flex h-7 w-full items-center rounded-md px-2 text-left text-[12px] transition",
                              child.key === activeKey
                                ? "bg-card text-primary"
                                : "text-text-muted hover:bg-card hover:text-foreground",
                            )}
                            key={child.key}
                            onClick={() => onNavigate?.(child.key)}
                            type="button"
                          >
                            <span className="truncate">{child.label}</span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div
        className={cn(
          "mt-4 shrink-0 rounded-xl border border-border bg-card shadow-sm",
          collapsed ? "grid place-items-center p-2" : "p-3",
        )}
      >
        <div
          className={cn(
            "flex items-center",
            collapsed ? "justify-center" : "gap-3",
          )}
        >
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-bg-inverse text-[12px] font-semibold text-text-inverse">
            D1
          </div>
          {!collapsed ? (
            <>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-semibold text-foreground">
                  Dispatcher 01
                </div>
                <div className="truncate text-[12px] text-text-muted">
                  Fleet Dispatcher
                </div>
              </div>
              <Button
                aria-label="Keluar dari dashboard"
                onClick={onLogout}
                size="icon-sm"
                title="Keluar"
                variant="ghost"
              >
                <LogOut className="size-4" />
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

export function AppFrame({
  title,
  eyebrow,
  activeKey = "overview",
  actions,
  onLogout,
  onNavigate,
  onBack,
  onForward,
  canGoBack,
  canGoForward,
  children,
  contentClassName = "space-y-4 p-4",
  searchQuery = "",
  onSearchChange,
  searchResults = [],
  onSearchSelect,
}: {
  title: string;
  eyebrow?: string;
  activeKey?: string;
  actions?: ReactNode;
  onLogout?: () => void;
  onNavigate?: (key: string) => void;
  onBack?: () => void;
  onForward?: () => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
  children: ReactNode;
  contentClassName?: string;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  searchResults?: SearchResult[];
  onSearchSelect?: (id: string) => void;
}) {
  const darkMode = useSyncExternalStore(
    subscribeToColorScheme,
    getPreferredDarkMode,
    () => false,
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchBlurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { unreadCount } = useNotifications();

  const showDropdown = searchFocused && searchQuery.trim().length > 0 && searchResults.length > 0;

  function handleSearchBlur() {
    searchBlurTimer.current = setTimeout(() => setSearchFocused(false), 150);
  }

  function handleResultClick(id: string) {
    if (searchBlurTimer.current) clearTimeout(searchBlurTimer.current);
    onSearchSelect?.(id);
    onSearchChange?.("");
    setSearchFocused(false);
  }

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    document.documentElement.style.colorScheme = darkMode ? "dark" : "light";
  }, [darkMode]);

  function toggleDarkMode() {
    window.localStorage.setItem(
      COLOR_SCHEME_STORAGE_KEY,
      darkMode ? "light" : "dark",
    );
    window.dispatchEvent(new Event(COLOR_SCHEME_EVENT));
  }

  return (
    <div className="h-screen overflow-hidden bg-app-frame text-foreground">
      <div className="flex h-full w-full bg-card">
        <Sidebar
          activeKey={activeKey}
          collapsed={sidebarCollapsed}
          onLogout={onLogout}
          onNavigate={onNavigate}
          onToggleCollapsed={() => setSidebarCollapsed((current) => !current)}
        />

        <main className="min-w-0 flex-1 h-full overflow-y-auto overflow-x-hidden">
          <header className="flex min-h-[72px] items-center justify-between gap-4 border-b border-border bg-card px-5 py-3 lg:px-7 sticky top-0 z-20">
            <div className="flex min-w-0 items-center gap-3">
              <div className="hidden shrink-0 items-center gap-1 sm:flex">
                <button
                  aria-label="Kembali"
                  className="grid size-10 place-items-center rounded-lg border border-border bg-card text-text-subtle transition hover:border-border/80 hover:text-foreground disabled:opacity-50 disabled:pointer-events-none"
                  disabled={!canGoBack}
                  onClick={onBack}
                  type="button"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  aria-label="Maju"
                  className="grid size-10 place-items-center rounded-lg border border-border bg-card text-text-subtle transition hover:border-border/80 hover:text-foreground disabled:opacity-50 disabled:pointer-events-none"
                  disabled={!canGoForward}
                  onClick={onForward}
                  type="button"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>

              <div className="flex h-10 min-w-0 items-center gap-2 text-m leading-none">
                {eyebrow ? (
                  <>
                    <span className="flex min-w-0 items-center truncate font-medium leading-none text-primary">
                      {eyebrow}
                    </span>
                    <span className="flex items-center leading-none text-text-muted">/</span>
                  </>
                ) : null}
                <h1 className="flex min-w-0 items-center truncate text-m font-medium leading-none text-text-muted">
                  {title}
                </h1>
              </div>
            </div>

            <div className="flex min-w-0 items-center gap-2">
              {actions ? (
                <div className="flex min-w-0 items-center gap-2">{actions}</div>
              ) : null}

              <div className="relative hidden w-[260px] md:block">
                <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground pointer-events-none z-10" />
                <input
                  className="h-10 w-full rounded-xl border border-border bg-muted/50 pl-9 pr-3 text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Cari unit, rute, lokasi..."
                  type="search"
                  value={searchQuery}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={handleSearchBlur}
                />
                {showDropdown && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-[1900] overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-lg)]">
                    {searchResults.map((result, idx) => {
                      const Icon = result.icon;
                      return (
                        <button
                          key={result.id}
                          type="button"
                          className={cn(
                            "flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-muted/60",
                            idx > 0 && "border-t border-border/60",
                          )}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleResultClick(result.id)}
                        >
                          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-muted text-text-subtle">
                            <Icon className="size-3.5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-medium text-foreground">
                              {result.label}
                            </span>
                            {result.sublabel && (
                              <span className="block truncate text-[11px] text-muted-foreground">
                                {result.sublabel}
                              </span>
                            )}
                          </span>
                          {result.badge && (
                            <span className={cn("shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold", result.badgeClass ?? "bg-muted text-muted-foreground")}>
                              {result.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                aria-label={
                  darkMode ? "Gunakan mode terang" : "Gunakan mode gelap"
                }
                className="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-card text-text-subtle transition hover:border-border/80 hover:text-foreground"
                onClick={toggleDarkMode}
                title={darkMode ? "Mode terang" : "Mode gelap"}
                type="button"
              >
                {darkMode ? (
                  <Sun className="size-4" />
                ) : (
                  <Moon className="size-4" />
                )}
              </button>
              <div className="relative">
                <button
                  aria-label="Notifikasi"
                  className={cn(
                    "relative grid size-10 shrink-0 place-items-center rounded-lg border bg-card transition hover:border-border/80 hover:text-foreground",
                    notifOpen
                      ? "border-primary/40 text-foreground"
                      : "border-border text-text-subtle",
                  )}
                  onClick={() => setNotifOpen((current) => !current)}
                  type="button"
                >
                  <Bell className="size-4" />
                  {unreadCount > 0 ? (
                    <span className="absolute -right-1 -top-1 grid size-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-white ring-2 ring-card">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  ) : null}
                </button>
                {notifOpen && typeof document !== "undefined"
                  ? createPortal(
                      <>
                        <div
                          className="fixed inset-0 z-[1900]"
                          onClick={() => setNotifOpen(false)}
                        />
                        <div className="fixed right-4 top-[72px] z-[1950]">
                          <NotificationFeed onClose={() => setNotifOpen(false)} />
                        </div>
                      </>,
                      document.body,
                    )
                  : null}
              </div>

            </div>
          </header>

          <div
            className={cn(
              "min-h-[calc(100vh-var(--topbar-height))]",
              contentClassName,
            )}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
