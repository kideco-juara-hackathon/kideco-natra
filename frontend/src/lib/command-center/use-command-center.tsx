"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { DispatchStage } from "@/components/hauling/types";
import {
  createRouteAssignment,
  dispatchNodes,
  getManualRouteOption,
  initialTrucks,
  loadingPoints,
  type RouteAssignment,
  type RouteOption,
  type Truck,
} from "@/data/hauling-screens";
import { api, type DispatchResponse, type OperationStateResponse, type TruckResponse } from "@/lib/api";

import {
  dispatchedEvent,
  makeEvent,
  truckReadyEvent,
  type CommandEvent,
} from "./events";
import { useNotifications } from "./notifications-context";

const TICK_MS = 1500;
const PROGRESS_PER_TICK = 4;
const SHIFT_TARGET_TON = 2500;
const SHIFT_DUMP_POINT = "OPD SP20 / Stockpile";
const SHIFT_OBJECTIVE = "balanced";
const SHIFT_OBJECTIVE_LABEL = "Balanced";
const DEFAULT_DUMP_POINT_ID = "DUMP-STOCKPILE-01";
const DISPATCH_NODE_ID = "DISPATCH-01";
const STOCKPILE_NODE_ID = "STOCKPILE-01";
const STORAGE_KEY = "kideco-command-center-state-v1";

export type ShiftStatus = "not_started" | "active";

type PersistedCommandCenterState = {
  shiftStatus: ShiftStatus;
  trucks: Truck[];
  assignments: RouteAssignment[];
  hauledTon: number;
};

// Staging slots around the dispatch point so initial idle trucks fan out instead
// of stacking on a single marker.
const dispatchAnchor = { lat: -1.8907, lng: 115.8721 };
const STAGING_SLOTS: Array<{ lat: number; lng: number }> = [
  { lat: dispatchAnchor.lat + 0.006, lng: dispatchAnchor.lng - 0.0072 },
  { lat: dispatchAnchor.lat + 0.004, lng: dispatchAnchor.lng + 0.0072 },
  { lat: dispatchAnchor.lat - 0.0056, lng: dispatchAnchor.lng - 0.0056 },
  { lat: dispatchAnchor.lat - 0.0048, lng: dispatchAnchor.lng + 0.0064 },
  { lat: dispatchAnchor.lat + 0.0072, lng: dispatchAnchor.lng + 0.0008 },
];

function nodePosition(nodeId: string) {
  const node = dispatchNodes.find((item) => item.id === nodeId);
  if (!node) return dispatchAnchor;
  return { lat: node.visualLat, lng: node.visualLng };
}

function createStartOfShiftTrucks(): Truck[] {
  return initialTrucks.map((truck, index) => ({
    ...truck,
    currentNodeId: DISPATCH_NODE_ID,
    currentPayloadTon: 0,
    loadState: "empty",
    position: STAGING_SLOTS[index % STAGING_SLOTS.length],
    status: "idle",
  }));
}

function persistState(state: PersistedCommandCenterState) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Prototype persistence should never break the dispatcher flow.
  }
}

function createAssignment({
  route,
  tripId,
  truckId,
}: {
  route: RouteOption;
  tripId: string;
  truckId: string;
}): RouteAssignment {
  return createRouteAssignment({ route, tripId, truckId });
}

function loadingPointLabel(loadingPointId: string) {
  return loadingPoints.find((point) => point.id === loadingPointId)?.name ?? loadingPointId;
}

function toTruck(response: TruckResponse): Truck {
  return {
    ...response,
    sourceHaulerId: response.sourceHaulerId ?? undefined,
    datasetRows: response.datasetRows ?? undefined,
    loadState: response.loadState === "loaded" ? "loaded" : "empty",
    status: response.status === "active" ? "active" : "idle",
  };
}

function toAssignment(response: DispatchResponse): RouteAssignment {
  return {
    ...response,
    selectionMode: response.selectionMode === "manual" ? "manual" : "recommended",
  };
}

function toPersistedState(response: OperationStateResponse): PersistedCommandCenterState {
  return {
    shiftStatus: response.shift.status,
    trucks: response.trucks.map(toTruck),
    assignments: response.activeTrips.map(toAssignment),
    hauledTon: response.shift.hauledTon,
  };
}

function useCommandCenterState() {
  const { push, setActHandler } = useNotifications();
  const [shiftStatus, setShiftStatus] = useState<ShiftStatus>("not_started");
  const [trucks, setTrucks] = useState<Truck[]>(() => createStartOfShiftTrucks());
  const [assignments, setAssignments] = useState<RouteAssignment[]>([]);

  // Dispatch flow (mirrors the legacy workspace, kept self-contained here).
  const [selectedTruckId, setSelectedTruckId] = useState<string | null>(null);
  const [dispatchStage, setDispatchStage] = useState<DispatchStage>("truck");
  const [selectedRoute, setSelectedRoute] = useState<RouteOption | null>(null);
  const [manualLoadingPointId, setManualLoadingPointId] = useState<string>(loadingPoints[0].id);
  const [lastDispatchedTrip, setLastDispatchedTrip] = useState<RouteAssignment | null>(null);

  // Shift accounting.
  const [hauledTon, setHauledTon] = useState(0);

  // Refs mirror state so the interval reads the latest without re-subscribing.
  const trucksRef = useRef(trucks);
  const assignmentsRef = useRef(assignments);

  useEffect(() => {
    trucksRef.current = trucks;
  }, [trucks]);

  useEffect(() => {
    assignmentsRef.current = assignments;
  }, [assignments]);

  useEffect(() => {
    persistState({ shiftStatus, trucks, assignments, hauledTon });
  }, [assignments, hauledTon, shiftStatus, trucks]);

  const applyOperationState = useCallback((state: PersistedCommandCenterState) => {
    setShiftStatus(state.shiftStatus);
    setTrucks(state.trucks);
    setAssignments(state.assignments);
    setHauledTon(state.hauledTon);
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .getOperationState()
      .then((response) => {
        if (cancelled) return;
        applyOperationState(toPersistedState(response));
      })
      .catch(() => {
        // Keep local/session state if the backend is unavailable during prototyping.
      });
    return () => {
      cancelled = true;
    };
  }, [applyOperationState]);

  // Keep the first screen quiet. Operational events only begin after the
  // dispatcher explicitly starts the shift.
  const seededRef = useRef(false);
  useEffect(() => {
    if (shiftStatus !== "active") return;
    if (seededRef.current) return;
    seededRef.current = true;
    push(
      makeEvent({
        kind: "weather",
        title: "Shift dimulai - BMKG",
        detail: "Tidak ada peringatan hujan di area tambang. Operasi siap berjalan.",
        tone: "info",
        read: false,
        createdAt: Date.now(),
      }),
    );
  }, [push, shiftStatus]);

  // Simulation loop: advance active trucks, complete cycles, fire ready events.
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (shiftStatus !== "active") return;

      const currentAssignments = assignmentsRef.current;
      if (currentAssignments.length === 0) return;

      const completed: RouteAssignment[] = [];
      const stillRunning: RouteAssignment[] = [];

      for (const assignment of currentAssignments) {
        const nextProgress = assignment.progress + PROGRESS_PER_TICK;
        void api
          .updateTripProgress(assignment.tripId, Math.min(100, nextProgress))
          .catch(() => undefined);
        if (nextProgress >= 100) {
          completed.push({ ...assignment, progress: 100 });
        } else {
          stillRunning.push({ ...assignment, progress: nextProgress });
        }
      }

      if (completed.length === 0) {
        setAssignments(stillRunning);
        return;
      }

      // Completed trucks become available at the dump/stockpile. They do not
      // return to dispatch until the end-of-shift flow exists.
      const completedTruckIds = new Set(completed.map((assignment) => assignment.truckId));
      const destinationByTruck = new Map(
        completed.map((assignment) => [
          assignment.truckId,
          assignment.loadedRoute.routeNodes.at(-1) ?? STOCKPILE_NODE_ID,
        ]),
      );

      setTrucks((current) =>
        current.map((truck) => {
          if (!completedTruckIds.has(truck.id)) return truck;
          const destinationNodeId = destinationByTruck.get(truck.id) ?? STOCKPILE_NODE_ID;
          return {
            ...truck,
            currentNodeId: destinationNodeId,
            currentPayloadTon: 0,
            loadState: "empty",
            position: nodePosition(destinationNodeId),
            status: "idle",
          };
        }),
      );
      setAssignments(stillRunning);
      setHauledTon((current) =>
        current + completed.reduce((sum, assignment) => sum + assignment.coalTon, 0),
      );
      for (const assignment of completed) {
        push(truckReadyEvent(assignment.truckId));
      }
    }, TICK_MS);

    return () => window.clearInterval(interval);
  }, [push, shiftStatus]);

  const idleTrucks = useMemo(() => trucks.filter((truck) => truck.status === "idle"), [trucks]);
  const activeTrucks = useMemo(() => trucks.filter((truck) => truck.status === "active"), [trucks]);
  const selectedTruck = useMemo(
    () => trucks.find((truck) => truck.id === selectedTruckId) ?? null,
    [trucks, selectedTruckId],
  );

  const draftAssignments = useMemo<RouteAssignment[]>(() => {
    if (!selectedTruck || selectedTruck.status !== "idle" || !selectedRoute || dispatchStage === "done") {
      return [];
    }
    return [createAssignment({ route: selectedRoute, tripId: "DRAFT", truckId: selectedTruck.id })];
  }, [dispatchStage, selectedTruck, selectedRoute]);

  const onShiftTarget = Math.min(100, Math.round((hauledTon / SHIFT_TARGET_TON) * 100));

  // --- Actions -------------------------------------------------------------

  const startShift = useCallback(() => {
    seededRef.current = false;
    const localState: PersistedCommandCenterState = {
      shiftStatus: "active",
      trucks: createStartOfShiftTrucks(),
      assignments: [],
      hauledTon: 0,
    };
    applyOperationState(localState);
    setSelectedTruckId(null);
    setDispatchStage("truck");
    setSelectedRoute(null);
    setLastDispatchedTrip(null);
    void api
      .startShift({
        targetTon: SHIFT_TARGET_TON,
        dumpPointId: DEFAULT_DUMP_POINT_ID,
        objective: SHIFT_OBJECTIVE,
      })
      .then(() => api.getOperationState())
      .then((response) => applyOperationState(toPersistedState(response)))
      .catch(() => undefined);
  }, [applyOperationState]);

  const selectTruck = useCallback(
    (truckId: string) => {
      if (shiftStatus !== "active") return;
      setSelectedTruckId(truckId);
      setDispatchStage("truck");
      setSelectedRoute(null);
      setLastDispatchedTrip(null);
    },
    [shiftStatus],
  );

  const closeDispatch = useCallback(() => {
    setSelectedTruckId(null);
    setSelectedRoute(null);
    setDispatchStage("truck");
    setLastDispatchedTrip(null);
  }, []);

  const assignRoute = useCallback(() => setDispatchStage("routes"), []);

  const selectRoute = useCallback((route: RouteOption) => setSelectedRoute(route), []);

  const review = useCallback(() => setDispatchStage("review"), []);

  const back = useCallback(() => {
    setDispatchStage((stage) => {
      if (stage === "review") return "routes";
      if (stage === "routes") {
        setSelectedRoute(null);
        return "truck";
      }
      return stage;
    });
  }, []);

  const changeManualLoadingPoint = useCallback(
    (loadingPointId: string) => {
      setManualLoadingPointId(loadingPointId);
      const truck = trucksRef.current.find((item) => item.id === selectedTruckId);
      if (truck) setSelectedRoute(getManualRouteOption(truck, loadingPointId));
    },
    [selectedTruckId],
  );

  const dispatch = useCallback(() => {
    const truck = trucksRef.current.find((item) => item.id === selectedTruckId);
    if (!truck || !selectedRoute) return;

    const localAssignment = createAssignment({
      route: selectedRoute,
      tripId: `TRIP-${Date.now().toString().slice(-6)}`,
      truckId: truck.id,
    });

    const applyAssignment = (assignment: RouteAssignment) => {
      setAssignments((current) => [...current, assignment]);
      setTrucks((current) =>
        current.map((item) =>
          item.id === truck.id
            ? {
                ...item,
                currentPayloadTon: assignment.coalTon,
                loadState: "loaded",
                status: "active",
              }
            : item,
        ),
      );
      setLastDispatchedTrip(assignment);
      setDispatchStage("done");
      push(dispatchedEvent(truck.id, loadingPointLabel(assignment.loadingPointId), assignment.etaMin));
    };

    api
      .dispatchTruck({
        truckId: truck.id,
        routeOptionId: selectedRoute.id,
        loadingPointId: selectedRoute.loadingPointId,
        originNodeId: selectedRoute.originNodeId,
        dumpPointId: selectedRoute.dumpPointId,
        selectionMode: selectedRoute.id.startsWith("MANUAL") ? "manual" : "recommended",
      })
      .then((response) => applyAssignment(toAssignment(response)))
      .catch(() => applyAssignment(localAssignment));
  }, [push, selectedRoute, selectedTruckId]);

  // Clicking a notification's action: ready/maintenance focus the truck + open dispatch.
  // Read-state + the click plumbing live in the notifications context; this only
  // performs the screen-specific side effect (select the truck).
  const actOnEvent = useCallback(
    (event: CommandEvent) => {
      if (event.truckId) {
        const truck = trucksRef.current.find((item) => item.id === event.truckId);
        if (truck && truck.status === "idle") selectTruck(truck.id);
      }
    },
    [selectTruck],
  );

  useEffect(() => {
    setActHandler(actOnEvent);
    return () => setActHandler(null);
  }, [actOnEvent, setActHandler]);

  return {
    // data
    shiftStatus,
    trucks,
    idleTrucks,
    activeTrucks,
    assignments,
    draftAssignments,
    hauledTon,
    shiftTargetTon: SHIFT_TARGET_TON,
    shiftDumpPoint: SHIFT_DUMP_POINT,
    shiftObjective: SHIFT_OBJECTIVE_LABEL,
    onShiftTarget,
    // dispatch flow
    selectedTruck,
    selectedTruckId,
    dispatchStage,
    selectedRoute,
    manualLoadingPointId,
    lastDispatchedTrip,
    // actions
    startShift,
    selectTruck,
    closeDispatch,
    assignRoute,
    selectRoute,
    review,
    back,
    changeManualLoadingPoint,
    dispatch,
  };
}

type CommandCenterValue = ReturnType<typeof useCommandCenterState>;

const CommandCenterContext = createContext<CommandCenterValue | null>(null);

export function CommandCenterProvider({ children }: { children: ReactNode }) {
  const value = useCommandCenterState();
  return <CommandCenterContext.Provider value={value}>{children}</CommandCenterContext.Provider>;
}

export function useCommandCenter(): CommandCenterValue {
  const value = useContext(CommandCenterContext);
  if (!value) {
    throw new Error("useCommandCenter must be used inside CommandCenterProvider.");
  }
  return value;
}
