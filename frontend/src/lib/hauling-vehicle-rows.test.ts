import assert from "node:assert/strict";
import test from "node:test";

import {
  buildHaulingVehicleRow,
  runtimeHealthScore,
} from "./hauling-vehicle-rows.ts";
import type { Truck } from "@/data/hauling-screens";
import type { TelemetryResponse } from "@/lib/api";

const truck: Truck = {
  id: "DT-01",
  code: "DT-01",
  capacityTon: 60,
  currentPayloadTon: 0,
  currentNodeId: "DISPATCH-01",
  fuelLevelPercent: 85,
  healthScore: 91,
  lastSeenAt: "2026-06-19T00:00:00.000Z",
  loadState: "empty",
  status: "idle",
  position: { lat: -1.86, lng: 115.86 },
};

const telemetry: TelemetryResponse = {
  id: "tel-1",
  vehicleId: "DT-01",
  timestamp: "2026-06-19T00:01:00.000Z",
  lat: -1.86,
  lng: 115.86,
  speedKmh: 0,
  loadState: "Empty",
  engineTempC: 99,
  oilPressureBar: 2.2,
  vibrationLevel: 0.61,
  fuelRateLph: 42,
  engineHour: 1210,
  healthScore: 18,
  riskLevel: "high",
  recommendations: [],
};

test("runtimeHealthScore prefers latest telemetry health over truck seed health", () => {
  assert.equal(runtimeHealthScore(truck, telemetry), 18);
});

test("buildHaulingVehicleRow exposes telemetry health as the row health", () => {
  const row = buildHaulingVehicleRow({
    truck,
    telemetry,
    recommendations: [],
  });

  assert.equal(row.healthScore, 18);
  assert.equal(row.telemetry?.healthScore, 18);
});

test("buildHaulingVehicleRow falls back to truck health when telemetry is absent", () => {
  const row = buildHaulingVehicleRow({
    truck,
    telemetry: null,
    recommendations: [],
  });

  assert.equal(row.healthScore, 91);
});
