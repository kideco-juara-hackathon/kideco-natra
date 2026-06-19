import type { RouteAssignment, Truck } from "@/data/hauling-screens";
import type { RecommendationResponse, TelemetryResponse } from "@/lib/api";

function numericId(id: string) {
  return Number(id.replace(/\D/g, "")) || 1;
}

function healthRisk(score: number): TelemetryResponse["riskLevel"] {
  if (score < 60) return "high";
  if (score < 78) return "medium";
  return "low";
}

function routeSpeedKmh(truck: Truck, assignment?: RouteAssignment) {
  if (truck.status !== "active") return 0;
  const idFactor = numericId(truck.id) % 5;
  const progressFactor = assignment ? Math.sin((assignment.progress / 100) * Math.PI) * 4 : 0;
  const healthPenalty = Math.max(0, 82 - truck.healthScore) * 0.12;
  return Math.max(8, Math.round(24 + idFactor * 2 + progressFactor - healthPenalty));
}

export function buildSyntheticTelemetry(
  truck: Truck,
  assignment?: RouteAssignment,
  recordedAt: Date = new Date(),
): TelemetryResponse {
  const idNumber = numericId(truck.id);
  const healthPenalty = Math.max(0, 100 - truck.healthScore);
  const loaded = truck.loadState === "loaded" || truck.currentPayloadTon > 0;
  const speedKmh = routeSpeedKmh(truck, assignment);
  const baseFuelRate = truck.status === "active" ? (loaded ? 31 : 22) : 6;
  const engineTempC = Math.round(74 + healthPenalty * 0.32 + (truck.status === "active" ? 6 : 1) + idNumber * 0.4);
  const vibrationLevel = Number((0.16 + healthPenalty * 0.006 + idNumber * 0.008).toFixed(2));
  const oilPressureBar = Number(Math.max(2.4, 4.4 - healthPenalty * 0.018).toFixed(1));

  return {
    id: `synthetic-${truck.id}`,
    vehicleId: truck.id,
    timestamp: recordedAt.toISOString(),
    lat: truck.position.lat,
    lng: truck.position.lng,
    speedKmh,
    loadState: loaded ? "Full" : "Empty",
    engineTempC,
    oilPressureBar,
    vibrationLevel,
    fuelRateLph: Number((baseFuelRate + healthPenalty * 0.14 + idNumber * 0.35).toFixed(1)),
    // Mirrors the backend seed derivation (800h base, lower health = more hours) so
    // "Jam Operasi" stays plausible when no real telemetry is available yet.
    engineHour: Math.round(800 + healthPenalty * 20),
    healthScore: truck.healthScore,
    riskLevel: healthRisk(truck.healthScore),
    recommendations: [],
  };
}

export function syntheticTelemetryHistory(
  truck: Truck,
  assignment?: RouteAssignment,
  limit = 5,
) {
  const base = buildSyntheticTelemetry(truck, assignment);
  const idFactor = numericId(truck.id) % 4;
  return Array.from({ length: limit }, (_, index) => {
    const wave = Math.sin(index * 1.1 + idFactor);
    const recordedAt = new Date(Date.now() - index * 4 * 60_000);
    return {
      ...base,
      id: `${base.id}-${index}`,
      timestamp: recordedAt.toISOString(),
      speedKmh: base.speedKmh == null ? null : Math.max(0, Math.round(base.speedKmh + wave * 3)),
      fuelRateLph: base.fuelRateLph == null ? null : Number(Math.max(0, base.fuelRateLph + wave * 2.4).toFixed(1)),
      engineTempC: base.engineTempC == null ? null : Math.round(base.engineTempC + wave * 2),
      vibrationLevel: base.vibrationLevel == null ? null : Number(Math.max(0.05, base.vibrationLevel + wave * 0.03).toFixed(2)),
    };
  });
}

export function telemetryForTruck(
  telemetry: Record<string, TelemetryResponse>,
  truck: Truck,
  assignments: RouteAssignment[] = [],
) {
  return telemetry[truck.id] ?? buildSyntheticTelemetry(
    truck,
    assignments.find((assignment) => assignment.truckId === truck.id),
  );
}

export function telemetryByTruck(
  telemetry: Record<string, TelemetryResponse>,
  trucks: Truck[],
  assignments: RouteAssignment[] = [],
) {
  return Object.fromEntries(
    trucks.map((truck) => [truck.id, telemetryForTruck(telemetry, truck, assignments)]),
  );
}

export function recommendationsForTruck(
  recommendations: RecommendationResponse[],
  truckId: string,
) {
  return recommendations.filter((recommendation) =>
    recommendation.assetCode === truckId || recommendation.assetId === truckId
  );
}

export function recommendationsForFleet(
  recommendations: RecommendationResponse[],
  trucks: Truck[],
) {
  const truckIds = new Set(trucks.map((truck) => truck.id));
  return recommendations.filter((recommendation) =>
    (recommendation.assetCode && truckIds.has(recommendation.assetCode)) ||
    truckIds.has(recommendation.assetId)
  );
}
