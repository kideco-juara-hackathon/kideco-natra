# API Contract

## Health

`GET /health`

Returns service status.

## Seed Data

`GET /api/nodes`

Returns simulation map nodes.

`GET /api/edges`

Returns simulation graph edges.

`GET /api/trucks`

Returns the current in-memory operational truck state for the 5 demo hauling
trucks used by the route dispatch MVP.

`GET /api/vehicles`

Returns legacy database-backed vehicles.

## Operational State

`GET /api/shift/current`

Returns current shift status, target tonnage, dump point, objective, and hauled
tonnage.

`POST /api/shift/start`

Starts or resets the current in-memory shift state. This resets all demo trucks
to idle at Dispatch Point and clears active trips.

Request:

```json
{
  "targetTon": 2500,
  "dumpPointId": "DUMP-STOCKPILE-01",
  "objective": "balanced"
}
```

`GET /api/operation-state`

Returns the current shift, trucks, and active trips in one payload. Frontend
Command Center uses this as the primary hydration endpoint.

`GET /api/trips/active`

Returns active dispatch assignments.

`PATCH /api/trips/{tripId}/progress`

Updates active trip progress. When progress reaches `100`, the trip is removed
from active trips, the truck becomes idle at the stockpile/dump point, and
hauled tonnage is incremented.

## Route Plans

`POST /api/route-plans`

Legacy route plan endpoint backed by database seed data.

Request:

```json
{
  "vehicleId": "DT-01",
  "originNodeId": "DISPATCH-01",
  "destinationNodeId": "LP-ROTO-S-01",
  "loadState": "Empty"
}
```

Response:

```json
{
  "routeId": "ROUTE-001",
  "vehicleId": "DT-01",
  "path": ["DISPATCH-01", "CP-ROTO-01", "LP-ROTO-S-01"],
  "distanceM": 4200,
  "etaSeconds": 510,
  "fuelEstimateLiter": 6.4,
  "riskLevel": "low"
}
```

## Route Recommendations

`POST /api/route-recommendations`

Main route dispatch endpoint for the MVP. The backend reads `data/seeds/nodes.json`,
`data/seeds/edges.json`, `data/seeds/trucks.json`, and `data/seeds/route_scenarios.json`,
then ranks candidate loading points using Dijkstra over the seed graph.

Request:

```json
{
  "truckId": "DT-01",
  "originNodeId": "DISPATCH-01",
  "candidateLoadingPointIds": ["LP-A1", "LP-B1", "LP-C1"],
  "dumpPointId": "DUMP-STOCKPILE-01",
  "targetPayloadTon": 60,
  "objective": "balanced"
}
```

Response:

```json
{
  "truckId": "DT-01",
  "originNodeId": "DISPATCH-01",
  "dumpPointId": "DUMP-STOCKPILE-01",
  "modelType": "dijkstra_seed_v1",
  "recommendations": [
    {
      "id": "REKOMENDASI-OPTIMAL-LP-A1",
      "label": "Rekomendasi Optimal",
      "loadingPointId": "LP-A1",
      "etaMin": 23,
      "fuelLiter": 15,
      "coalTon": 60,
      "fulfillment": 100,
      "score": 82,
      "riskLevel": "medium"
    }
  ]
}
```

## Dispatch

`POST /api/dispatch`

Creates an active dispatch assignment in backend in-memory operational state.
The shift must already be active, and the selected truck must be idle.

Request:

```json
{
  "truckId": "DT-01",
  "routeOptionId": "REKOMENDASI-OPTIMAL-LP-A1",
  "loadingPointId": "LP-A1",
  "originNodeId": "DISPATCH-01",
  "dumpPointId": "DUMP-STOCKPILE-01",
  "selectionMode": "recommended"
}
```

Response includes `tripId`, empty route, loaded route, ETA, fuel, coal payload, and route nodes.

## Telemetry

`POST /api/telemetry`

Receives simulated telemetry event.

`GET /api/telemetry/latest`

Returns latest telemetry by vehicle.

Optional query:

```text
?assetId=DT-01
```

`GET /api/telemetry/{assetId}/history`

Returns telemetry history for one vehicle.

## Load Plans

`POST /api/load-plans`

Request:

```json
{
  "vehicleId": "DT-01",
  "originNodeId": "DISPATCH-01",
  "candidatePitNodeIds": ["PIT-A-01", "PIT-B-01"],
  "destinationNodeId": "JETTY-01",
  "targetPayloadTon": 32
}
```

Response includes recommended pickup stops and an attached route plan.

## Predictions

`POST /api/predictions/eta`

`POST /api/predictions/fuel`

`POST /api/predictions/health`

All MVP prediction responses include:

```json
{
  "modelType": "rule_based_v0"
}
```

## Dashboard

`GET /api/dashboard/summary`

Returns asset status counts, average health score, latest telemetry count, and open recommendations.

## Recommendations

`GET /api/recommendations`

Optional query:

```text
?assetId=DT-01&status=open
```

`PATCH /api/recommendations/{recommendationId}/resolve`

Marks a recommendation as resolved.
