"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AppFrame } from "@/components/layout/app-frame";
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
      title={title}
    >
      {activeKey === "hauling-command-center" ? (
        <CommandCenterScreen onOpenOverview={() => setActiveKey("hauling-overview")} />
      ) : activeKey === "hauling-route-plan" ? (
        <RoutePlanScreen
          assignments={mapAssignments}
          dispatchStage={cc.dispatchStage}
          idleTrucks={cc.idleTrucks}
          lastDispatchedTrip={cc.lastDispatchedTrip}
          manualLoadingPointId={cc.manualLoadingPointId}
          onAssignRoute={cc.assignRoute}
          onBack={cc.back}
          onClose={cc.closeDispatch}
          onDispatch={cc.dispatch}
          onManualLoadingPointChange={cc.changeManualLoadingPoint}
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
      ) : (
        <PlaceholderScreen title={title} />
      )}
    </AppFrame>
  );
}

function isMapScreen(activeKey: ScreenKey) {
  return activeKey === "hauling-route-plan" || activeKey === "hauling-command-center";
}

export function HaulingWorkspace() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center">Memuat...</div>}>
      <HaulingWorkspaceContent />
    </Suspense>
  );
}
