import {
  dispatchSeedEdges,
  dispatchSeedNodes,
  dumpPointSeeds,
  initialAssignmentSeeds,
  loadingPointSeeds,
  routeScenarioSeeds,
  truckSeeds,
} from "./generated/hauling-seeds";

export type TruckStatus = "idle" | "active";
export type LoadState = "empty" | "loading" | "loaded" | "dumping";
export type NodeType = "dispatch" | "pit" | "loading_point" | "dump_point" | "checkpoint";
export type RoadCondition = "good" | "medium" | "rough";
export type RiskLevel = "low" | "medium" | "high";

export type Truck = {
  id: string;
  code: string;
  sourceHaulerId?: string;
  capacityTon: number;
  currentPayloadTon: number;
  currentNodeId: string;
  fuelLevelPercent: number;
  healthScore: number;
  lastSeenAt: string;
  loadState: LoadState;
  status: TruckStatus;
  position: { lat: number; lng: number };
  datasetRows?: number;
};

export type DispatchNode = {
  id: string;
  code: string;
  name: string;
  type: NodeType;
  visualLat: number;
  visualLng: number;
  sourceWaypointId: string;
  sourceLoaderId?: string;
};

export type DispatchEdge = {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  distanceMeter: number;
  avgSpeedKmh: number;
  historicalEtaSec: number;
  roadCondition: RoadCondition;
  gradePercent?: number;
  sourceSegmentId: string;
  sampleCount?: number;
  sourceEdges?: string[];
};

export type LoadingPoint = {
  id: string;
  nodeId: string;
  name: string;
  pitId: string;
  pitName: string;
  sourceLoaderId?: string;
  sourceWaypointId?: string;
  availableCoalTon: number;
  queueCount: number;
  estimatedLoadingTimeMin: number;
  status: "active" | "limited" | "closed";
  riskLevel: RiskLevel;
  datasetRows?: number;
};

export type DumpPoint = {
  id: string;
  nodeId: string;
  name: string;
  type: "stockpile" | "rom" | "crusher";
  capacityTon: number;
  currentStockTon: number;
  sourceWaypointId?: string;
  status: "active" | "limited" | "closed";
};

export type RouteLeg = {
  routeNodes: string[];
  etaMin: number;
  fuelLiter: number;
  distanceMeter?: number;
  sourceEdgeIds?: string[];
};

export type RouteRecommendation = {
  id: string;
  label: string;
  originNodeId: string;
  loadingPointId: string;
  dumpPointId: string;
  emptyRoute: RouteLeg;
  loadedRoute: RouteLeg;
  loadingTimeMin: number;
  routeNodes: string[];
  etaMin: number;
  fuelLiter: number;
  coalTon: number;
  fulfillment: number;
  score: number;
  reason: string;
  riskLevel: RiskLevel;
};

export type RouteOption = RouteRecommendation;

export type TripAssignmentStatus = "active" | "loading" | "loaded_travel" | "dumping" | "completed";

export type RouteAssignment = {
  tripId: string;
  truckId: string;
  originNodeId: string;
  loadingPointId: string;
  dumpPointId: string;
  routeOptionId: string;
  routeLabel: string;
  selectionMode: "recommended" | "manual";
  emptyRoute: RouteLeg;
  loadedRoute: RouteLeg;
  routeNodes: string[];
  etaMin: number;
  fuelLiter: number;
  coalTon: number;
  status: TripAssignmentStatus;
  progress: number;
  startedAt?: string;
  completedAt?: string;
};

type LoadingPointView = LoadingPoint & {
  pit: string;
  stockTon: number;
  queue: number;
  emptyRouteNodes: string[];
  loadedRouteNodes: string[];
  routeNodes: string[];
  etaEmptyMin: number;
  etaLoadedMin: number;
  etaMin: number;
  fuelEmptyLiter: number;
  fuelLoadedLiter: number;
  fuelLiter: number;
  risk: RiskLevel;
};

type RouteScenarioSeed = (typeof routeScenarioSeeds)[number];
type RouteLegSeed = {
  readonly routeNodes: readonly string[];
  readonly etaMin: number;
  readonly fuelLiter: number;
  readonly distanceMeter?: number;
  readonly sourceEdgeIds?: readonly string[];
};

export const dispatchNodes: DispatchNode[] = dispatchSeedNodes.map((node) => ({
  id: node.id,
  code: node.code,
  name: node.name,
  type: node.type,
  visualLat: node.visualLat,
  visualLng: node.visualLng,
  sourceWaypointId: node.sourceWaypointId,
  sourceLoaderId: "sourceLoaderId" in node ? node.sourceLoaderId : undefined,
}));

export const dispatchEdges: DispatchEdge[] = dispatchSeedEdges.map((edge) => ({
  id: edge.id,
  fromNodeId: edge.fromNodeId,
  toNodeId: edge.toNodeId,
  distanceMeter: edge.distanceMeter,
  avgSpeedKmh: edge.avgSpeedKmh,
  historicalEtaSec: edge.historicalEtaSec,
  roadCondition: edge.roadCondition,
  sourceSegmentId: edge.sourceSegmentId,
  sampleCount: edge.sampleCount,
  sourceEdges: [...edge.sourceEdges],
}));

export const initialTrucks: Truck[] = truckSeeds.map((truck) => ({
  id: truck.id,
  code: truck.code,
  sourceHaulerId: truck.sourceHaulerId,
  capacityTon: truck.capacityTon,
  currentPayloadTon: truck.currentPayloadTon,
  currentNodeId: truck.currentNodeId,
  fuelLevelPercent: truck.fuelLevelPercent,
  healthScore: truck.healthScore,
  lastSeenAt: truck.lastSeenAt,
  loadState: truck.loadState,
  status: truck.status,
  position: { ...truck.position },
  datasetRows: truck.datasetRows,
}));

function findScenarioByLoadingPoint(loadingPointId: string) {
  return routeScenarioSeeds.find((scenario) => scenario.loadingPointId === loadingPointId) ?? routeScenarioSeeds[0];
}

export const loadingPoints = loadingPointSeeds.map((point) => {
  const scenario = findScenarioByLoadingPoint(point.id);

  return {
    id: point.id,
    nodeId: point.nodeId,
    name: point.name,
    pitId: point.pitId,
    pitName: point.pitName,
    pit: point.pitName,
    sourceLoaderId: point.sourceLoaderId,
    sourceWaypointId: point.sourceWaypointId,
    availableCoalTon: point.availableCoalTon,
    stockTon: point.availableCoalTon,
    queueCount: point.queueCount,
    queue: point.queueCount,
    estimatedLoadingTimeMin: point.estimatedLoadingTimeMin,
    status: point.status,
    emptyRouteNodes: [...scenario.emptyRoute.routeNodes],
    loadedRouteNodes: [...scenario.loadedRoute.routeNodes],
    routeNodes: [...scenario.routeNodes],
    etaEmptyMin: scenario.emptyRoute.etaMin,
    etaLoadedMin: scenario.loadedRoute.etaMin,
    etaMin: scenario.etaMin,
    fuelEmptyLiter: scenario.emptyRoute.fuelLiter,
    fuelLoadedLiter: scenario.loadedRoute.fuelLiter,
    fuelLiter: scenario.fuelLiter,
    riskLevel: point.riskLevel,
    risk: point.riskLevel,
    datasetRows: point.datasetRows,
  };
}) satisfies LoadingPointView[];

export const dumpPoints: DumpPoint[] = dumpPointSeeds.map((point) => ({
  id: point.id,
  nodeId: point.nodeId,
  name: point.name,
  type: point.type,
  capacityTon: point.capacityTon,
  currentStockTon: point.currentStockTon,
  sourceWaypointId: point.sourceWaypointId,
  status: point.status,
}));

const defaultDumpPoint = dumpPoints[0];

function toRouteLeg(seedLeg: RouteLegSeed): RouteLeg {
  return {
    routeNodes: [...seedLeg.routeNodes],
    etaMin: seedLeg.etaMin,
    fuelLiter: seedLeg.fuelLiter,
    distanceMeter: seedLeg.distanceMeter,
    sourceEdgeIds: seedLeg.sourceEdgeIds ? [...seedLeg.sourceEdgeIds] : undefined,
  };
}

function buildRecommendation({
  scenario,
  truck,
  manual = false,
}: {
  scenario: RouteScenarioSeed;
  truck: Truck;
  manual?: boolean;
}): RouteRecommendation {
  const coalTon = Math.min(truck.capacityTon, scenario.coalTon);
  const manualQueuePenalty = manual ? loadingPoints.find((point) => point.id === scenario.loadingPointId)?.queue ?? 0 : 0;

  return {
    id: manual ? `MANUAL-${scenario.loadingPointId}` : scenario.id,
    label: manual
      ? `Manual - ${loadingPoints.find((point) => point.id === scenario.loadingPointId)?.name ?? scenario.loadingPointId}`
      : scenario.label,
    originNodeId: truck.currentNodeId,
    loadingPointId: scenario.loadingPointId,
    dumpPointId: defaultDumpPoint.id,
    emptyRoute: toRouteLeg(scenario.emptyRoute),
    loadedRoute: toRouteLeg(scenario.loadedRoute),
    loadingTimeMin: scenario.loadingTimeMin,
    routeNodes: [...scenario.routeNodes],
    etaMin: scenario.etaMin + manualQueuePenalty * 2,
    fuelLiter: scenario.fuelLiter,
    coalTon,
    fulfillment: Math.round((coalTon / truck.capacityTon) * 100),
    score: manual ? Math.max(60, scenario.score - manualQueuePenalty * 2) : scenario.score,
    reason: manual
      ? `Dispatcher memilih ${scenario.loadingPointId}; jalur terbaik tetap dihitung dari seed graph dataset.`
      : scenario.reason,
    riskLevel: scenario.riskLevel,
  };
}

export function getRouteOptions(truck: Truck): RouteOption[] {
  return routeScenarioSeeds.map((scenario) => buildRecommendation({ scenario, truck }));
}

export function getManualRouteOption(truck: Truck, loadingPointId: string): RouteOption {
  const scenario = findScenarioByLoadingPoint(loadingPointId);
  return buildRecommendation({ scenario, truck, manual: true });
}

export function createRouteAssignment({
  route,
  tripId,
  truckId,
}: {
  route: RouteRecommendation;
  tripId: string;
  truckId: string;
}): RouteAssignment {
  return {
    tripId,
    truckId,
    originNodeId: route.originNodeId,
    loadingPointId: route.loadingPointId,
    dumpPointId: route.dumpPointId,
    routeOptionId: route.id,
    routeLabel: route.label,
    selectionMode: route.id.startsWith("MANUAL") ? "manual" : "recommended",
    emptyRoute: route.emptyRoute,
    loadedRoute: route.loadedRoute,
    routeNodes: route.routeNodes,
    etaMin: route.etaMin,
    fuelLiter: route.fuelLiter,
    coalTon: route.coalTon,
    status: "active",
    progress: 0,
    startedAt: new Date().toISOString(),
  };
}

export const initialAssignments: RouteAssignment[] = initialAssignmentSeeds.map((assignment) => ({
  tripId: assignment.tripId,
  truckId: assignment.truckId,
  originNodeId: assignment.originNodeId,
  loadingPointId: assignment.loadingPointId,
  dumpPointId: assignment.dumpPointId,
  routeOptionId: assignment.routeOptionId,
  routeLabel: assignment.routeLabel,
  selectionMode: assignment.selectionMode,
  emptyRoute: toRouteLeg(assignment.emptyRoute),
  loadedRoute: toRouteLeg(assignment.loadedRoute),
  routeNodes: [...assignment.routeNodes],
  etaMin: assignment.etaMin,
  fuelLiter: assignment.fuelLiter,
  coalTon: assignment.coalTon,
  status: assignment.status,
  progress: assignment.progress,
}));
