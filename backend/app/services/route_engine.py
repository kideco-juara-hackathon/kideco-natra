from heapq import heappop, heappush

from app.repositories.seed_loader import load_seed
from app.schemas.route import RoutePlanRequest
from app.services.eta_service import estimate_edge_eta_seconds
from app.services.fuel_service import estimate_fuel_liter


def build_route_recommendation(payload: RoutePlanRequest) -> dict:
    edges = load_seed("edges.json")
    path = _dijkstra(edges, payload.originNodeId, payload.destinationNodeId)
    route_edges = _edges_for_path(edges, path)

    distance_m = sum(edge["distanceM"] for edge in route_edges)
    eta_seconds = sum(
        estimate_edge_eta_seconds(
            edge["distanceM"],
            edge["speedLimitKmh"],
            payload.loadState,
        )
        for edge in route_edges
    )
    fuel_liter = sum(
        estimate_fuel_liter(edge["distanceM"], payload.loadState, edge["slopeLevel"])
        for edge in route_edges
    )
    risk_level = _max_risk(edge["riskLevel"] for edge in route_edges)

    return {
        "routeId": "ROUTE-SIM-001",
        "vehicleId": payload.vehicleId,
        "path": path,
        "distanceM": distance_m,
        "etaSeconds": eta_seconds,
        "fuelEstimateLiter": round(fuel_liter, 2),
        "riskLevel": risk_level,
    }


def _dijkstra(edges: list[dict], origin: str, destination: str) -> list[str]:
    graph: dict[str, list[tuple[str, int]]] = {}
    for edge in edges:
        graph.setdefault(edge["from"], []).append((edge["to"], edge["distanceM"]))

    queue: list[tuple[int, str, list[str]]] = [(0, origin, [origin])]
    visited: set[str] = set()

    while queue:
        cost, node, path = heappop(queue)
        if node == destination:
            return path
        if node in visited:
            continue
        visited.add(node)
        for next_node, edge_cost in graph.get(node, []):
            if next_node not in visited:
                heappush(queue, (cost + edge_cost, next_node, [*path, next_node]))

    raise ValueError(f"No route found from {origin} to {destination}")


def _edges_for_path(edges: list[dict], path: list[str]) -> list[dict]:
    route_edges = []
    for start, end in zip(path, path[1:]):
        match = next(edge for edge in edges if edge["from"] == start and edge["to"] == end)
        route_edges.append(match)
    return route_edges


def _max_risk(risks) -> str:
    rank = {"low": 1, "medium": 2, "high": 3}
    return max(risks, key=lambda risk: rank.get(risk, 1))
