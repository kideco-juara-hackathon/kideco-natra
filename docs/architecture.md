# Architecture

## MVP Architecture

```text
Frontend Dashboard
        -> FastAPI Backend
        -> Route Engine
        -> Seed Data
        -> ETA/Fuel/Health Services

Telemetry Simulator
        -> POST /api/telemetry
        -> Backend in-memory latest state
        -> Frontend polling or realtime update
```

## Design Decisions

| Decision | Current Choice |
|---|---|
| Map base layer | OpenStreetMap |
| Operational points | Custom simulation layer in `data/seeds` |
| Route algorithm | A* or Dijkstra over custom graph |
| ETA v0 | Rule-based, then ML baseline |
| Fuel v0 | Rule-based |
| IoT v0 | HTTP telemetry simulator |
| MQTT/LoRa | Roadmap, not initial dependency |

## Main Modules

- `frontend`: user-facing dispatcher workflow.
- `backend`: API contract and route recommendation engine.
- `ml`: model training and prediction utilities.
- `simulator`: telemetry events for demo scenarios.
- `data/seeds`: nodes, edges, vehicles, and rules.
