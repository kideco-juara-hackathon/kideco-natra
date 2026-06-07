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
