import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ChevronLeft, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getRouteOptions,
  loadingPoints,
  type RouteAssignment,
  type RouteOption,
  type Truck as TruckData,
} from "@/data/hauling-screens";
import { api } from "@/lib/api";

import type { DispatchStage } from "../types";
import { DispatchSuccess } from "./dispatch-success";
import { RouteReview } from "./route-review";
import { RouteSelection } from "./route-selection";
import { TruckSummary } from "./truck-summary";

export function DispatchPanel({
  dispatchStage,
  lastDispatchedTrip,
  manualLoadingPointId,
  onAssignRoute,
  onBack,
  onClose,
  onDispatch,
  onManualLoadingPointChange,
  onOpenOverview,
  onReview,
  onRouteSelect,
  selectedRoute,
  selectedTruck,
}: {
  dispatchStage: DispatchStage;
  lastDispatchedTrip: RouteAssignment | null;
  manualLoadingPointId: string;
  onAssignRoute: () => void;
  onBack: () => void;
  onClose: () => void;
  onDispatch: () => void;
  onManualLoadingPointChange: (loadingPointId: string) => void;
  onOpenOverview: () => void;
  onReview: () => void;
  onRouteSelect: (route: RouteOption) => void;
  selectedRoute: RouteOption | null;
  selectedTruck: TruckData;
}) {
  const fallbackOptions = useMemo(() => getRouteOptions(selectedTruck), [selectedTruck]);
  const [backendResult, setBackendResult] = useState<{
    truckId: string;
    options: RouteOption[];
  } | null>(null);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  const [routeError, setRouteError] = useState<{
    truckId: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (dispatchStage !== "routes") return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      setIsLoadingRoutes(true);
      setRouteError(null);

      api
        .createRouteRecommendations({
          truckId: selectedTruck.id,
          originNodeId: selectedTruck.currentNodeId,
          candidateLoadingPointIds: loadingPoints.map((point) => point.id),
          dumpPointId: "DUMP-STOCKPILE-01",
          targetPayloadTon: selectedTruck.capacityTon,
          objective: "balanced",
        })
        .then((response) => {
          if (cancelled) return;
          setBackendResult({
            truckId: selectedTruck.id,
            options: response.recommendations,
          });
        })
        .catch((error: unknown) => {
          if (cancelled) return;
          setBackendResult(null);
          setRouteError({
            truckId: selectedTruck.id,
            message: error instanceof Error ? error.message : "Gagal mengambil route recommendation.",
          });
        })
        .finally(() => {
          if (!cancelled) setIsLoadingRoutes(false);
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [dispatchStage, selectedTruck.capacityTon, selectedTruck.currentNodeId, selectedTruck.id]);

  const backendOptions = backendResult?.truckId === selectedTruck.id ? backendResult.options : null;
  const errorMessage = routeError?.truckId === selectedTruck.id ? routeError.message : null;
  const options = backendOptions ?? fallbackOptions;
  const dataSource = backendOptions ? "backend" : "fallback";

  function selectManualLoadingPoint(loadingPointId: string) {
    onManualLoadingPointChange(loadingPointId);
    const backendRoute = backendOptions?.find((option) => option.loadingPointId === loadingPointId);
    const point = loadingPoints.find((item) => item.id === loadingPointId);
    if (!backendRoute) return;
    onRouteSelect({
      ...backendRoute,
      id: `MANUAL-${loadingPointId}`,
      label: `Manual - ${point?.name ?? loadingPointId}`,
      reason: `Dispatcher memilih ${point?.name ?? loadingPointId}; jalur dihitung backend dengan Dijkstra seed graph.`,
    });
  }

  return (
    <aside className="absolute bottom-4 right-4 top-4 z-[600] flex w-[min(430px,calc(100%-32px))] flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-lg)]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border-default)] p-4">
        <div className="flex items-center gap-3">
          {dispatchStage !== "truck" && dispatchStage !== "done" ? (
            <Button
              aria-label="Kembali"
              size="icon-sm"
              variant="ghost"
              onClick={onBack}
              className="-ml-1"
            >
              <ChevronLeft className="size-4" />
            </Button>
          ) : null}
          <div>
            {dispatchStage === "truck" ? (
              <>
                <h2 className="text-lg font-bold text-[var(--text-default)]">{selectedTruck.id}</h2>
                <div className="mt-1 flex items-center gap-1.5 text-caption font-medium">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Siap / Standby</span>
                  <span className="text-[var(--text-muted)]">·</span>
                  <span className="text-[var(--text-muted)] font-medium">Siap dispatch</span>
                </div>
              </>
            ) : (
              <>
                <p className="text-caption text-text-muted">
                  {dispatchStage === "done" ? "Dispatch berhasil" : "Unit terpilih"}
                </p>
                <h2 className="text-heading-md">{selectedTruck.id}</h2>
              </>
            )}
          </div>
        </div>
        <Button aria-label="Tutup panel" size="icon-sm" variant="ghost" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {dispatchStage === "truck" ? (
          <TruckSummary truck={selectedTruck} onAssignRoute={onAssignRoute} />
        ) : dispatchStage === "routes" ? (
          <RouteSelection
            dataSource={dataSource}
            errorMessage={errorMessage}
            isLoading={isLoadingRoutes}
            manualLoadingPointId={manualLoadingPointId}
            onManualLoadingPointChange={selectManualLoadingPoint}
            onRouteSelect={onRouteSelect}
            options={options}
            selectedRoute={selectedRoute}
          />
        ) : dispatchStage === "review" && selectedRoute ? (
          <RouteReview
            onBack={onAssignRoute}
            onDispatch={onDispatch}
            route={selectedRoute}
            truck={selectedTruck}
          />
        ) : (
          <DispatchSuccess assignment={lastDispatchedTrip} onOpenOverview={onOpenOverview} />
        )}
      </div>

      {dispatchStage === "routes" && selectedRoute ? (
        <div className="border-t border-[var(--border-default)] p-4">
          <Button className="w-full" onClick={onReview}>
            Review Rute
            <ArrowRight className="size-4" />
          </Button>
        </div>
      ) : null}
    </aside>
  );
}
