# Data Contract

## Node

Operational point rendered on top of the map and used by the route graph.

```json
{
  "id": "DISPATCH-01",
  "name": "Dispatch Point",
  "type": "dispatch_point",
  "lat": -1.8912,
  "lng": 115.872
}
```

## Edge

Directed connection between two nodes.

```json
{
  "id": "E-001",
  "from": "DISPATCH-01",
  "to": "CP-ROTO-01",
  "distanceM": 1600,
  "speedLimitKmh": 35,
  "roadCondition": "normal",
  "slopeLevel": "medium",
  "riskLevel": "low"
}
```

## Vehicle

Mining hauling unit used in route and telemetry flows.

```json
{
  "id": "DT-01",
  "name": "Dump Truck 01",
  "type": "dump_truck",
  "capacityTon": 30,
  "status": "standby",
  "healthScore": 86,
  "currentNodeId": "DISPATCH-01"
}
```

## Telemetry Event

IoT-like event produced by the simulator.

```json
{
  "vehicleId": "DT-01",
  "timestamp": "2026-06-07T20:30:00+08:00",
  "lat": -1.8912,
  "lng": 115.872,
  "speedKmh": 31,
  "loadState": "Full",
  "engineTempC": 87,
  "oilPressureBar": 4.1,
  "vibrationLevel": 0.21,
  "fuelRateLph": 35
}
```
