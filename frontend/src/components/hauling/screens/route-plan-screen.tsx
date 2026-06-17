import { DispatchPanel } from "@/components/hauling/components/dispatch-panel";
import type { DispatchStage } from "@/components/hauling/types";
import { RebasedRouteMapShell } from "@/components/route/rebased-route-map-shell";
import type {
  RouteAssignment,
  RouteOption,
  Truck,
} from "@/data/hauling-screens";

import { RouteCommandStrip } from "../components/route-command-strip";

export function RoutePlanScreen({
  assignments,
  dispatchStage,
  idleTrucks,
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
  onTruckSelect,
  selectedRoute,
  selectedTruck,
}: {
  assignments: RouteAssignment[];
  dispatchStage: DispatchStage;
  idleTrucks: Truck[];
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
  onTruckSelect: (truckId: string) => void;
  selectedRoute: RouteOption | null;
  selectedTruck: Truck | null;
}) {
  return (
    <div className="relative h-full w-full">
      <RebasedRouteMapShell
        assignments={assignments}
        mode="dispatch"
        onTruckSelect={onTruckSelect}
        selectedTruckId={selectedTruck?.id}
        trucks={idleTrucks}
      />

      <RouteCommandStrip
        idleTrucks={idleTrucks}
        selectedRoute={selectedRoute}
        selectedTruck={selectedTruck}
      />

      {!selectedTruck ? (
        <div className="pointer-events-none absolute bottom-5 left-1/2 z-[500] -translate-x-1/2 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-3 text-body-sm shadow-[var(--shadow-md)]">
          Pilih marker truk idle untuk melihat detail dan memberi rute.
        </div>
      ) : (
        <DispatchPanel
          dispatchStage={dispatchStage}
          lastDispatchedTrip={lastDispatchedTrip}
          manualLoadingPointId={manualLoadingPointId}
          onAssignRoute={onAssignRoute}
          onBack={onBack}
          onClose={onClose}
          onDispatch={onDispatch}
          onManualLoadingPointChange={onManualLoadingPointChange}
          onOpenOverview={onOpenOverview}
          onReview={onReview}
          onRouteSelect={onRouteSelect}
          selectedRoute={selectedRoute}
          selectedTruck={selectedTruck}
        />
      )}
    </div>
  );
}
