import type { RouteAssignment, Truck } from "@/data/hauling-screens";
import type {
  RecommendationResponse,
  TelemetryResponse,
  VehicleResponse,
} from "@/lib/api";

export type HaulingVehicleRow = VehicleResponse & {
  telemetry: TelemetryResponse | null;
  recs: RecommendationResponse[];
  progress?: number;
  etaMin?: number;
};

export function runtimeHealthScore(
  truck: Pick<Truck, "healthScore">,
  telemetry: Pick<TelemetryResponse, "healthScore"> | null,
): number {
  return telemetry?.healthScore ?? truck.healthScore;
}

export function buildHaulingVehicleRow({
  truck,
  telemetry,
  recommendations,
  assignment,
}: {
  truck: Truck;
  telemetry: TelemetryResponse | null;
  recommendations: RecommendationResponse[];
  assignment?: RouteAssignment;
}): HaulingVehicleRow {
  return {
    id: truck.id,
    name: truck.code,
    type: "hauler",
    capacityTon: truck.capacityTon,
    status: truck.status,
    healthScore: runtimeHealthScore(truck, telemetry),
    currentNodeId: truck.currentNodeId,
    lat: truck.position.lat,
    lng: truck.position.lng,
    progress: assignment?.progress,
    etaMin: assignment?.etaMin,
    telemetry,
    recs: recommendations,
  };
}
