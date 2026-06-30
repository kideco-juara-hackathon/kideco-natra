"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Anchor, Gauge, Route, Ship, Truck, Wrench } from "lucide-react";

import { AppFrame, type SearchResult } from "@/components/layout/app-frame";
import { SHIP_DATA, shipStatusLabel, shipHealthLevel } from "@/data/ship-data";
import { BrandedLoader } from "@/components/layout/branded-loader";
import {
  CommandCenterProvider,
  useCommandCenter,
} from "@/lib/command-center/use-command-center";
import { NotificationsProvider } from "@/lib/command-center/notifications-context";
import { clearPrototypeSession } from "@/lib/prototype-auth";

import { CommandCenterScreen } from "./command-center/command-center-screen";
import { normalizeScreen, screenMeta } from "./screen-config";
import { HaulingMaintenanceScreen } from "./screens/maintenance-screen";
import { HaulingOverviewScreen } from "./screens/overview-screen";
import { PlaceholderScreen } from "./screens/placeholder-screen";
import { HaulingRouteMonitorScreen } from "./screens/route-monitor-screen";
import { RoutePlanScreen } from "./screens/route-plan-screen";
import { ShipCommandCenterScreen } from "./screens/ship-command-center-screen";
import { ShipMaintenanceScreen } from "./screens/ship-maintenance-screen";
import { ShipOverviewScreen } from "./screens/ship-overview-screen";
import { ShipRouteMonitorScreen } from "./screens/ship-route-monitor-screen";
import type { ScreenKey } from "./types";

function HaulingWorkspaceContent() {
  const [history, setHistory] = useState<ScreenKey[]>(["hauling-overview"]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedMaintenanceTruckId, setSelectedMaintenanceTruckId] = useState<string | null>(null);

  const activeKey = history[currentIndex];
  const meta = screenMeta[activeKey];

  function setActiveKey(key: string) {
    const normalizedKey = normalizeScreen(key as ScreenKey);
    if (normalizedKey === activeKey) return;
    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(normalizedKey);
    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
  }

  function handleBack() {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  }

  function handleForward() {
    if (currentIndex < history.length - 1) setCurrentIndex(currentIndex + 1);
  }

  return (
    <NotificationsProvider>
      <CommandCenterProvider>
        <HaulingWorkspaceFrame
          activeKey={activeKey}
          canGoBack={currentIndex > 0}
          canGoForward={currentIndex < history.length - 1}
          eyebrow={meta.eyebrow}
          onBack={handleBack}
          onForward={handleForward}
          onNavigate={(key) => {
            setSelectedMaintenanceTruckId(null);
            setActiveKey(key);
          }}
          onOpenMaintenance={(truckId) => {
            setSelectedMaintenanceTruckId(truckId || null);
            setActiveKey("hauling-maintenance");
          }}
          selectedMaintenanceTruckId={selectedMaintenanceTruckId}
          setActiveKey={setActiveKey}
          title={meta.title}
        />
      </CommandCenterProvider>
    </NotificationsProvider>
  );
}

function HaulingWorkspaceFrame({
  activeKey,
  canGoBack,
  canGoForward,
  eyebrow,
  onBack,
  onForward,
  onNavigate,
  onOpenMaintenance,
  selectedMaintenanceTruckId,
  setActiveKey,
  title,
}: {
  activeKey: ScreenKey;
  canGoBack: boolean;
  canGoForward: boolean;
  eyebrow: string;
  onBack: () => void;
  onForward: () => void;
  onNavigate: (key: string) => void;
  onOpenMaintenance: (truckId?: string) => void;
  selectedMaintenanceTruckId: string | null;
  setActiveKey: (key: string) => void;
  title: string;
}) {
  const router = useRouter();
  const cc = useCommandCenter();
  const mapAssignments = useMemo(
    () => [...cc.assignments, ...cc.draftAssignments],
    [cc.assignments, cc.draftAssignments],
  );

  const [searchQuery, setSearchQuery] = useState("");

  const allScreens: SearchResult[] = useMemo(() => [
    { id: "screen:hauling-overview",        icon: Gauge,  label: "Overview",           sublabel: "Hauling Darat" },
    { id: "screen:hauling-command-center",  icon: Truck,  label: "Command Center",     sublabel: "Hauling Darat · Route Intelligence" },
    { id: "screen:hauling-route-monitor",   icon: Route,  label: "Route Monitor",      sublabel: "Hauling Darat · Route Intelligence" },
    { id: "screen:hauling-maintenance",     icon: Wrench, label: "Maintenance Truck",  sublabel: "Hauling Darat" },
    { id: "screen:marine-overview",         icon: Ship,   label: "Overview Kapal",     sublabel: "Operasi Kapal" },
    { id: "screen:marine-command-center",   icon: Anchor, label: "Command Center Kapal", sublabel: "Operasi Kapal · Route Intelligence" },
    { id: "screen:marine-route-monitor",    icon: Route,  label: "Route Monitor Kapal", sublabel: "Operasi Kapal · Route Intelligence" },
    { id: "screen:marine-maintenance",      icon: Wrench, label: "Maintenance Kapal",  sublabel: "Operasi Kapal" },
  ], []);

  const searchResults = useMemo((): SearchResult[] => {
    const q = searchQuery.trim().toLowerCase();

    // ── Empty query: quick-access list ──────────────────────
    if (!q) {
      const quickScreens = allScreens.slice(0, 5).map((s, i) => ({
        ...s,
        sectionLabel: i === 0 ? "Menu" : undefined,
      }));
      const quickShips: SearchResult[] = SHIP_DATA.map((ship, i) => {
        const level = shipHealthLevel(ship.healthScore);
        const badgeClass =
          level === "Aman" ? "bg-[var(--success-50)] text-[var(--success-700)]"
          : level === "Monitoring" ? "bg-sky-50 text-sky-700"
          : level === "Risiko Sedang" ? "bg-[var(--warning-50)] text-[var(--warning-700)]"
          : "bg-[var(--danger-50)] text-[var(--danger-700)]";
        return {
          id: `ship:${ship.id}`,
          icon: ship.status === "perawatan" ? Wrench : ship.status === "sandar" ? Anchor : Ship,
          label: ship.id,
          sublabel: `${shipStatusLabel(ship.status)} · ${ship.route ?? (ship.status === "sandar" ? "Dermaga" : "Dockyard")}`,
          badge: `Health ${ship.healthScore}`,
          badgeClass,
          sectionLabel: i === 0 ? "Armada Kapal" : undefined,
        };
      });
      return [...quickScreens, ...quickShips];
    }

    // ── Typed query: filter everything ──────────────────────
    const results: SearchResult[] = [];

    // Trucks
    for (const truck of cc.trucks) {
      if (truck.id.toLowerCase().includes(q) || truck.code.toLowerCase().includes(q) || "dump truck".includes(q) || "hauling".includes(q)) {
        const isActive = truck.status === "active";
        results.push({
          id: `truck:${truck.id}`,
          icon: Truck,
          label: truck.id,
          sublabel: isActive ? "Sedang beroperasi" : "Standby",
          badge: `Health ${truck.healthScore}`,
          badgeClass:
            truck.healthScore >= 85
              ? "bg-[var(--success-50)] text-[var(--success-700)]"
              : truck.healthScore >= 70
                ? "bg-[var(--warning-50)] text-[var(--warning-700)]"
                : "bg-[var(--danger-50)] text-[var(--danger-700)]",
        });
      }
    }

    // Active trips
    for (const a of cc.assignments) {
      if (
        a.truckId.toLowerCase().includes(q) ||
        a.routeLabel.toLowerCase().includes(q) ||
        "trip aktif".includes(q) ||
        "rute".includes(q)
      ) {
        results.push({
          id: `trip:${a.tripId}`,
          icon: Route,
          label: `${a.truckId} — ${a.routeLabel}`,
          sublabel: `Progress ${a.progress ?? 0}%`,
          badge: "Trip Aktif",
          badgeClass: "bg-sky-50 text-sky-700",
        });
      }
    }

    // Ships
    for (const ship of SHIP_DATA) {
      const keywords = [
        ship.id, ship.name, ship.barge, ship.type,
        shipStatusLabel(ship.status),
        ship.route ?? "",
        "kapal", "tongkang", "berlayar", "sandar", "perawatan", "marine",
      ];
      if (keywords.some((k) => k.toLowerCase().includes(q))) {
        const level = shipHealthLevel(ship.healthScore);
        const badgeClass =
          level === "Aman" ? "bg-[var(--success-50)] text-[var(--success-700)]"
          : level === "Monitoring" ? "bg-sky-50 text-sky-700"
          : level === "Risiko Sedang" ? "bg-[var(--warning-50)] text-[var(--warning-700)]"
          : "bg-[var(--danger-50)] text-[var(--danger-700)]";
        results.push({
          id: `ship:${ship.id}`,
          icon: ship.status === "perawatan" ? Wrench : ship.status === "sandar" ? Anchor : Ship,
          label: ship.id,
          sublabel: `${shipStatusLabel(ship.status)} · ${ship.route ?? (ship.status === "sandar" ? "Dermaga" : "Dockyard")}`,
          badge: `Health ${ship.healthScore}`,
          badgeClass,
        });
      }
    }

    // Screens
    for (const s of allScreens) {
      if (
        s.label.toLowerCase().includes(q) ||
        (s.sublabel ?? "").toLowerCase().includes(q) ||
        s.id.includes(q)
      ) {
        results.push(s);
      }
    }

    return results.slice(0, 8);
  }, [searchQuery, cc.trucks, cc.assignments, allScreens]);

  function handleSearchSelect(id: string) {
    if (id.startsWith("truck:")) {
      const truckId = id.slice("truck:".length);
      onOpenMaintenance(truckId);
    } else if (id.startsWith("trip:")) {
      onNavigate("hauling-route-monitor");
    } else if (id.startsWith("ship:")) {
      onNavigate("marine-command-center");
    } else if (id.startsWith("screen:")) {
      onNavigate(id.slice("screen:".length));
    }
  }

  return (
    <AppFrame
      activeKey={activeKey}
      canGoBack={canGoBack}
      canGoForward={canGoForward}
      contentClassName={
        isMapScreen(activeKey)
          ? "h-[calc(100vh-var(--topbar-height))] overflow-hidden"
          : "min-h-[calc(100vh-var(--topbar-height))] bg-[var(--bg-app-frame)] p-4"
      }
      eyebrow={eyebrow}
      onBack={onBack}
      onForward={onForward}
      onLogout={() => {
        clearPrototypeSession();
        router.replace("/login");
      }}
      onNavigate={onNavigate}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchResults={searchResults}
      onSearchSelect={handleSearchSelect}
      title={title}
    >
      {activeKey === "hauling-command-center" ? (
        <CommandCenterScreen onOpenOverview={() => setActiveKey("hauling-overview")} />
      ) : activeKey === "hauling-route-plan" ? (
        <RoutePlanScreen
          assignments={mapAssignments}
          batchPhase={cc.batchPhase}
          dispatchStage={cc.dispatchStage}
          idleTrucks={cc.idleTrucks}
          lastDispatchedTrip={cc.lastDispatchedTrip}
          manualLoadingPointId={cc.manualLoadingPointId}
          onAssignRoute={cc.assignRoute}
          onBack={cc.back}
          onClose={cc.closeDispatch}
          onCloseBatchDispatch={cc.closeBatchDispatch}
          onConfirmBatchDispatch={cc.confirmBatchDispatch}
          onDispatch={cc.dispatch}
          onManualLoadingPointChange={cc.changeManualLoadingPoint}
          onOpenBatchDispatch={cc.openBatchDispatch}
          onOpenOverview={() => setActiveKey("hauling-overview")}
          onReview={cc.review}
          onRouteSelect={cc.selectRoute}
          onTruckSelect={cc.selectTruck}
          selectedRoute={cc.selectedRoute}
          selectedTruck={cc.selectedTruck}
        />
      ) : activeKey === "hauling-overview" || activeKey === "overview" ? (
        <HaulingOverviewScreen
          onOpenMaintenance={onOpenMaintenance}
          onOpenRouteIntelligence={() => setActiveKey("hauling-command-center")}
        />
      ) : activeKey === "hauling-maintenance" ? (
        <HaulingMaintenanceScreen initialSelectedId={selectedMaintenanceTruckId} />
      ) : activeKey === "hauling-route-monitor" ? (
        <HaulingRouteMonitorScreen />
      ) : activeKey === "marine-overview" ? (
        <ShipOverviewScreen
          onOpenRouteIntelligence={() => setActiveKey("marine-command-center")}
          onOpenMaintenance={(id) => setActiveKey("marine-maintenance")}
        />
      ) : activeKey === "marine-command-center" ? (
        <ShipCommandCenterScreen onOpenOverview={() => setActiveKey("marine-overview")} />
      ) : activeKey === "marine-route-monitor" ? (
        <ShipRouteMonitorScreen />
      ) : activeKey === "marine-maintenance" ? (
        <ShipMaintenanceScreen />
      ) : (
        <PlaceholderScreen title={title} />
      )}
    </AppFrame>
  );
}

function isMapScreen(activeKey: ScreenKey) {
  return (
    activeKey === "hauling-route-plan" ||
    activeKey === "hauling-command-center" ||
    activeKey === "marine-command-center"
  );
}

export function HaulingWorkspace() {
  return (
    <Suspense fallback={<BrandedLoader />}>
      <HaulingWorkspaceContent />
    </Suspense>
  );
}
