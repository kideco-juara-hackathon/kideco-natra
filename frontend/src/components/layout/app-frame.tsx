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
  CirclePlay,
  ExternalLink,
  Gauge,
  GitBranch,
  Info,
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
  sectionLabel?: string;
};

export type SearchResultGroup = {
  label: string;
  results: SearchResult[];
};

import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NotificationFeed } from "@/components/hauling/command-center/notification-feed";
import { useNotifications } from "@/lib/command-center/notifications-context";
import { cn } from "@/lib/utils";

const TEAM_MEMBERS = [
  { name: "Mahardika Arka",       role: "PM / Frontend" },
  { name: "Dicha Wijaya Kusuma",  role: "Backend" },
  { name: "Raditya Yusma Nata",   role: "Machine Learning" },
  { name: "Marsa Naufal",         role: "IoT" },
];

function CreditsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[640px] p-0 overflow-hidden">
        {/* Header band */}
        <div className="bg-gradient-to-br from-[var(--kideco-red-500)] to-[var(--kideco-red-700)] px-6 py-5 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight text-white">NATRA</DialogTitle>
          </DialogHeader>
          <p className="mt-0.5 text-[13px] font-medium text-red-100">
            Navigation, Asset, Transport, Routing &amp; Analytics
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {["KIC 2026", "Kideco Innovation Challenge", "Institut Teknologi Kalimantan"].map((tag) => (
              <span key={tag} className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold text-white/90">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Team */}
          <div>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Tim Ex Machina
            </p>
            <div className="grid grid-cols-2 gap-2">
              {TEAM_MEMBERS.map((m) => (
                <div key={m.name} className="flex items-center gap-2.5 rounded-xl border border-border bg-muted/30 px-3 py-2.5">
                  <div className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--bg-inverse)] text-[11px] font-bold text-[var(--text-inverse)]">
                    {m.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-foreground">{m.name}</p>
                    <p className="text-[11px] text-muted-foreground">{m.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="flex gap-2">
            <a
              href="https://github.com/kideco-juara-hackathon/kideco-natra"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card py-2.5 text-[13px] font-semibold text-foreground transition hover:bg-muted/60"
            >
              <GitBranch className="size-4" />
              GitHub Repo
              <ExternalLink className="size-3 text-muted-foreground" />
            </a>
            <a
              href="https://www.youtube.com/watch?v=M1GgSwF6Syk"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-2.5 text-[13px] font-semibold text-red-700 transition hover:bg-red-100"
            >
              <CirclePlay className="size-4" />
              Video Demo
              <ExternalLink className="size-3 text-red-400" />
            </a>
          </div>

          <p className="text-center text-[11px] text-muted-foreground leading-relaxed">
            Dibangun sebagai prototipe untuk kompetisi KIC 2026.<br />
            Semua data bersifat simulasi dan tidak mencerminkan operasional aktual.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
  const [profileOpen, setProfileOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
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
            className={cn("h-auto dark:invert dark:hue-rotate-180", collapsed ? "w-[56px]" : "w-[172px]")}
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

      {/* Simulation notice */}
      {collapsed ? (
        <div className="mt-3 shrink-0 grid place-items-center">
          <div title="Semua data di NATRA adalah simulasi berbasis pola real-life" className="grid size-7 place-items-center rounded-full border border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-950/30 cursor-default">
            <Info className="size-3.5 text-amber-500" />
          </div>
        </div>
      ) : (
        <div className="mt-3 shrink-0 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-950/30 px-3 py-2.5">
          <Info className="mt-px size-3.5 shrink-0 text-amber-500" />
          <p className="text-[11px] leading-snug text-amber-800 dark:text-amber-300">
            <span className="font-bold">Data Simulasi.</span> Semua data merupakan simulasi berbasis pola telemetry real-life.
          </p>
        </div>
      )}

      {/* Profile card + popover */}
      <div className="relative mt-3 shrink-0">
        {/* Popover */}
        {profileOpen && (
          <>
            <div className="fixed inset-0 z-[1800]" onClick={() => setProfileOpen(false)} />
            <div className={cn(
              "absolute bottom-full z-[1850] mb-2 overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-lg)]",
              collapsed ? "left-full ml-2 w-[200px]" : "left-0 right-0 w-auto",
            )}>
              <button
                type="button"
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-muted/60"
                onClick={() => { setProfileOpen(false); setCreditsOpen(true); }}
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                  <Info className="size-4" />
                </span>
                <span>
                  <span className="block text-[13px] font-semibold text-foreground">Credits &amp; Info</span>
                  <span className="block text-[11px] text-muted-foreground">Tim, repo, dan demo</span>
                </span>
              </button>
              <div className="border-t border-border/60" />
              <button
                type="button"
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-red-50 text-red-600"
                onClick={() => { setProfileOpen(false); onLogout?.(); }}
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-red-50 text-red-500">
                  <LogOut className="size-4" />
                </span>
                <span className="text-[13px] font-semibold">Keluar</span>
              </button>
            </div>
          </>
        )}

        {/* Profile card */}
        <div className="w-full rounded-xl border border-border bg-card p-2 shadow-sm">
          {collapsed ? (
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              title="Opsi akun"
              className={cn(
                "grid size-9 place-items-center rounded-full bg-bg-inverse text-[12px] font-semibold text-text-inverse transition hover:ring-2 hover:ring-primary/40",
                profileOpen && "ring-2 ring-primary/50",
              )}
            >
              D1
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {/* Avatar — dedicated popover trigger */}
              <button
                type="button"
                onClick={() => setProfileOpen((v) => !v)}
                title="Opsi akun"
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-full bg-bg-inverse text-[12px] font-semibold text-text-inverse transition hover:ring-2 hover:ring-primary/40",
                  profileOpen && "ring-2 ring-primary/50",
                )}
              >
                D1
              </button>
              {/* Name / role — static, not a button */}
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-semibold text-foreground">Dispatcher 01</div>
                <div className="truncate text-[12px] text-text-muted">Fleet Dispatcher</div>
              </div>
              {/* Quick logout */}
              <Button
                aria-label="Keluar dari dashboard"
                onClick={onLogout}
                size="icon-sm"
                title="Keluar"
                variant="ghost"
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <CreditsDialog open={creditsOpen} onClose={() => setCreditsOpen(false)} />
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
  searchGroups,
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
  searchGroups?: SearchResultGroup[];
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
  const [activeTab, setActiveTab] = useState(0);
  const searchBlurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { unreadCount } = useNotifications();

  const isEmptyQuery = !searchQuery.trim();
  const showGroupTabs = isEmptyQuery && !!searchGroups?.length;
  const showDropdown = searchFocused && (showGroupTabs || searchResults.length > 0);

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

              <div className="relative hidden w-[340px] md:block">
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
                    {showGroupTabs && searchGroups ? (
                      <>
                        {/* Tab bar */}
                        <div className="flex items-center gap-0.5 border-b border-border/60 px-2 pt-2">
                          {searchGroups.map((group, i) => (
                            <button
                              key={group.label}
                              type="button"
                              className={cn(
                                "px-3 py-1.5 text-[11px] font-semibold rounded-t-md transition border-b-2 -mb-px",
                                activeTab === i
                                  ? "border-primary text-primary"
                                  : "border-transparent text-muted-foreground hover:text-foreground",
                              )}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => setActiveTab(i)}
                            >
                              {group.label}
                              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground">
                                {group.results.length}
                              </span>
                            </button>
                          ))}
                        </div>
                        {/* Tab content */}
                        <div className="max-h-[320px] overflow-y-auto">
                          {(searchGroups[activeTab]?.results ?? []).map((result, idx) => {
                            const Icon = result.icon;
                            const showSectionLabel = !!result.sectionLabel;
                            return (
                              <div key={result.id}>
                                {showSectionLabel && (
                                  <div className={cn("px-3 py-1.5", idx > 0 && "border-t border-border/60 mt-0.5")}>
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                      {result.sectionLabel}
                                    </span>
                                  </div>
                                )}
                                <button
                                  type="button"
                                  className={cn(
                                    "flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-muted/60",
                                    !showSectionLabel && idx > 0 && "border-t border-border/60",
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
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      /* Typed query: flat filtered results */
                      <div className="max-h-[320px] overflow-y-auto">
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
