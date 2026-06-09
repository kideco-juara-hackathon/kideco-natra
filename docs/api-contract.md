# API Contract

## Health

`GET /health`

Returns service status.

## Seed Data

`GET /api/nodes`

Returns simulation map nodes.

`GET /api/edges`

Returns simulation graph edges.

`GET /api/vehicles`

Returns hauling vehicles.

## Route Plans

`POST /api/route-plans`

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
