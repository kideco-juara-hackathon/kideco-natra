# Route Optimization

## Scope

Route optimization v0 uses a custom graph stored in `data/seeds/nodes.json` and `data/seeds/edges.json`.

OpenStreetMap is used as a visual base map only. Internal mining operational points are maintained by the application as a simulation layer.

## Algorithm

The first route engine can use Dijkstra for simplicity. A* can be added when the graph uses coordinate-based heuristic distance.

## Weight

Initial edge weight:

```text
travel_time_seconds = distance_m / speed_mps
```

Future route score:

```text
route_score = eta_weight + fuel_weight + risk_weight
```

## ETA

ETA v0:

```text
ETA = sum(edge_travel_time) + loading_time + threshold
```

ETA v1 can call the ML baseline model per edge.
