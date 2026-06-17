const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export type HealthResponse = {
  status: string;
  service: string;
  environment: string;
};

export type NodeResponse = {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  stockpileTon: number;
};

export type EdgeResponse = {
  id: string;
  routeId: string;
  from: string;
  to: string;
  distanceM: number;
  speedLimitKmh: number;
  roadCondition: string;
  slopeLevel: string;
  trafficLevel: string;
  riskLevel: string;
};

export type VehicleResponse = {
  id: string;
  name: string;
  type: string;
  capacityTon: number;
  status: string;
  healthScore: number;
  currentNodeId: string | null;
  lat: number | null;
  lng: number | null;
};

export type RecommendationResponse = {
  id: string;
  assetId: string;
  assetCode: string | null;
  recommendationType: string;
  priority: string;
  title: string;
  message: string;
  recommendedAction: string;
  status: string;
  createdAt: string;
};

export type DashboardSummary = {
  totalAssets: number;
  activeAssets: number;
  idleAssets: number;
  maintenanceAssets: number;
  averageHealthScore: number;
  openRecommendations: number;
  highPriorityRecommendations: number;
  latestTelemetryCount: number;
};

export type RoutePlanRequest = {
  vehicleId: string;
  originNodeId: string;
  destinationNodeId: string;
  loadState: "Full" | "Empty";
  payloadTon?: number;
};

export type RouteAlternative = {
  path: string[];
  distanceM: number;
  etaSeconds: number;
  fuelEstimateLiter: number;
  routeScore: number;
  riskLevel: string;
  reason: string;
};

export type RoutePlanResponse = {
  routeId: string;
  vehicleId: string;
  path: string[];
  distanceM: number;
  etaSeconds: number;
  fuelEstimateLiter: number;
  routeScore: number;
  riskLevel: string;
  reason: string;
  comparisonVsDefault: {
    baselineRoute: string[];
    etaSavingSeconds: number;
    fuelSavingLiter: number;
  };
  alternatives: RouteAlternative[];
};

export type RouteLegResponse = {
  routeNodes: string[];
  distanceMeter?: number;
  etaMin: number;
  fuelLiter: number;
  sourceEdgeIds?: string[];
};

export type RouteRecommendationItem = {
  id: string;
  label: string;
  originNodeId: string;
  loadingPointId: string;
  dumpPointId: string;
  emptyRoute: RouteLegResponse;
  loadedRoute: RouteLegResponse;
  loadingTimeMin: number;
  routeNodes: string[];
  etaMin: number;
  fuelLiter: number;
  coalTon: number;
  fulfillment: number;
  score: number;
  reason: string;
  riskLevel: "low" | "medium" | "high";
};

export type RouteRecommendationRequest = {
  truckId: string;
  originNodeId?: string;
  candidateLoadingPointIds?: string[];
  dumpPointId?: string;
  targetPayloadTon?: number;
  objective?: "balanced" | "fuel" | "fastest";
};

export type RouteRecommendationResponse = {
  truckId: string;
  originNodeId: string;
  dumpPointId: string;
  modelType: string;
  recommendations: RouteRecommendationItem[];
};

export type TruckResponse = {
  id: string;
  code: string;
  sourceHaulerId?: string | null;
  capacityTon: number;
  currentPayloadTon: number;
  currentNodeId: string;
  fuelLevelPercent: number;
  healthScore: number;
  lastSeenAt: string;
  loadState: string;
  status: "idle" | "active";
  position: { lat: number; lng: number };
  datasetRows?: number | null;
};

export type DispatchResponse = {
  tripId: string;
  truckId: string;
  originNodeId: string;
  loadingPointId: string;
  dumpPointId: string;
  routeOptionId: string;
  routeLabel: string;
  selectionMode: "recommended" | "manual";
  emptyRoute: RouteLegResponse;
  loadedRoute: RouteLegResponse;
  routeNodes: string[];
  etaMin: number;
  fuelLiter: number;
  coalTon: number;
  status: "active" | "loading" | "loaded_travel" | "dumping" | "completed";
  progress: number;
};

export type DispatchRequest = {
  truckId: string;
  routeOptionId: string;
  loadingPointId: string;
  originNodeId?: string;
  dumpPointId?: string;
  selectionMode?: "recommended" | "manual";
};

export type ShiftResponse = {
  status: "not_started" | "active";
  targetTon: number;
  dumpPointId: string;
  dumpPointName: string;
  objective: "balanced" | "fuel" | "fastest" | string;
  hauledTon: number;
  startedAt?: string | null;
};

export type ShiftStartRequest = {
  targetTon?: number;
  dumpPointId?: string;
  objective?: "balanced" | "fuel" | "fastest";
};

export type OperationStateResponse = {
  shift: ShiftResponse;
  trucks: TruckResponse[];
  activeTrips: DispatchResponse[];
};

export type TelemetryEvent = {
  vehicleId: string;
  timestamp?: string;
  lat?: number;
  lng?: number;
  speedKmh?: number;
  loadState?: "Full" | "Empty";
  engineTempC?: number;
  oilPressureBar?: number;
  vibrationLevel?: number;
  fuelRateLph?: number;
  loadTon?: number;
};

export type TelemetryResponse = {
  id: string;
  vehicleId: string;
  timestamp: string;
  lat: number | null;
  lng: number | null;
  speedKmh: number | null;
  loadState: string | null;
  engineTempC: number | null;
  oilPressureBar: number | null;
  vibrationLevel: number | null;
  fuelRateLph: number | null;
  healthScore: number;
  riskLevel: string;
  recommendations?: string[];
};

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`API Error ${res.status}: ${errText || res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  getHealth: () => apiFetch<HealthResponse>("/health"),
  getNodes: () => apiFetch<NodeResponse[]>("/api/nodes"),
  getEdges: () => apiFetch<EdgeResponse[]>("/api/edges"),
  getTrucks: () => apiFetch<TruckResponse[]>("/api/trucks"),
  getShift: () => apiFetch<ShiftResponse>("/api/shift/current"),
  startShift: (payload: ShiftStartRequest = {}) =>
    apiFetch<ShiftResponse>("/api/shift/start", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getOperationState: () => apiFetch<OperationStateResponse>("/api/operation-state"),
  getActiveTrips: () => apiFetch<DispatchResponse[]>("/api/trips/active"),
  getVehicles: () => apiFetch<VehicleResponse[]>("/api/vehicles"),
  getDashboardSummary: () => apiFetch<DashboardSummary>("/api/dashboard/summary"),
  getRecommendations: (assetId?: string, status: string = "open") => {
    const query = new URLSearchParams();
    if (assetId) query.set("assetId", assetId);
    query.set("status", status);
    return apiFetch<RecommendationResponse[]>(`/api/recommendations?${query.toString()}`);
  },
  resolveRecommendation: (id: string) =>
    apiFetch<RecommendationResponse>(`/api/recommendations/${id}/resolve`, {
      method: "PATCH",
    }),
  createRoutePlan: (payload: RoutePlanRequest) =>
    apiFetch<RoutePlanResponse>("/api/route-plans", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  createRouteRecommendations: (payload: RouteRecommendationRequest) =>
    apiFetch<RouteRecommendationResponse>("/api/route-recommendations", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  dispatchTruck: (payload: DispatchRequest) =>
    apiFetch<DispatchResponse>("/api/dispatch", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateTripProgress: (tripId: string, progress: number) =>
    apiFetch<DispatchResponse>(`/api/trips/${tripId}/progress`, {
      method: "PATCH",
      body: JSON.stringify({ progress }),
    }),
  postTelemetry: (payload: TelemetryEvent) =>
    apiFetch<TelemetryResponse>("/api/telemetry", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getLatestTelemetry: (assetId?: string) => {
    const query = new URLSearchParams();
    if (assetId) query.set("assetId", assetId);
    return apiFetch<Record<string, TelemetryResponse>>(`/api/telemetry/latest?${query.toString()}`);
  },
  getTelemetryHistory: (assetId: string, limit: number = 50) =>
    apiFetch<TelemetryResponse[]>(`/api/telemetry/${assetId}/history?limit=${limit}`),
};
