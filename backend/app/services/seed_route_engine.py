from __future__ import annotations

import heapq
import json
from functools import lru_cache
from pathlib import Path
from typing import Any
from uuid import uuid4

from app.schemas import (
    DispatchResponse,
    RouteLegResponse,
    RouteRecommendationItem,
    RouteRecommendationResponse,
)


class SeedRouteError(ValueError):
    pass


def project_root() -> Path:
    return Path(__file__).resolve().parents[3]


def seed_dir() -> Path:
    return project_root() / "data" / "seeds"


def read_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise SeedRouteError(f"Seed file was not found: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


@lru_cache(maxsize=1)
def load_seed_data() -> dict[str, Any]:
    nodes = read_json(seed_dir() / "nodes.json")
    edges = read_json(seed_dir() / "edges.json")
    trucks = read_json(seed_dir() / "trucks.json")
    scenarios = read_json(seed_dir() / "route_scenarios.json")
    return {
        "metadata": nodes.get("metadata", {}),
        "nodes": nodes["nodes"],
        "edges": edges["edges"],
        "trucks": trucks["trucks"],
        "loadingPoints": scenarios["loadingPoints"],
        "dumpPoints": scenarios["dumpPoints"],
        "routeScenarios": scenarios["routeScenarios"],
        "initialAssignments": scenarios["initialAssignments"],
    }


def list_seed_nodes() -> list[dict[str, Any]]:
    return load_seed_data()["nodes"]


def list_seed_edges() -> list[dict[str, Any]]:
    return load_seed_data()["edges"]


def list_seed_trucks() -> list[dict[str, Any]]:
    return load_seed_data()["trucks"]


def get_truck(truck_id: str) -> dict[str, Any]:
    truck = next((item for item in list_seed_trucks() if item["id"] == truck_id), None)
    if not truck:
        raise SeedRouteError(f"Truck {truck_id} was not found.")
    return truck


def get_dump_point(dump_point_id: str | None) -> dict[str, Any]:
    dump_points = load_seed_data()["dumpPoints"]
    if dump_point_id:
        dump_point = next((item for item in dump_points if item["id"] == dump_point_id), None)
        if dump_point:
            return dump_point
        # Frontend route options sometimes pass the node id instead of the dump point id.
        dump_point = next((item for item in dump_points if item["nodeId"] == dump_point_id), None)
        if dump_point:
            return dump_point
        raise SeedRouteError(f"Dump point {dump_point_id} was not found.")
    return dump_points[0]


def loading_points_by_candidate(candidate_ids: list[str] | None) -> list[dict[str, Any]]:
    points = load_seed_data()["loadingPoints"]
    if not candidate_ids:
        return points
    selected = [point for point in points if point["id"] in set(candidate_ids)]
    if not selected:
        raise SeedRouteError("No candidate loading points were found.")
    return selected


def edge_graph() -> dict[str, list[dict[str, Any]]]:
    graph: dict[str, list[dict[str, Any]]] = {}
    for edge in list_seed_edges():
        graph.setdefault(edge["fromNodeId"], []).append(edge)
        reverse_edge = {
            **edge,
            "id": f"{edge['id']}-REV",
            "fromNodeId": edge["toNodeId"],
            "toNodeId": edge["fromNodeId"],
        }
        graph.setdefault(reverse_edge["fromNodeId"], []).append(reverse_edge)
    return graph


def edge_weight(edge: dict[str, Any], load_state: str, objective: str) -> float:
    eta = float(edge["historicalEtaSec"])
    distance = float(edge["distanceMeter"])
    fuel = estimate_edge_fuel(edge, load_state)
    risk = {"low": 0, "medium": 180, "high": 420}.get(edge.get("riskLevel", "medium"), 180)

    if objective == "fastest":
        return eta + risk * 0.45
    if objective == "fuel":
        return fuel * 95 + eta * 0.35 + risk * 0.25
    return eta + fuel * 35 + distance * 0.02 + risk


def dijkstra(origin_node_id: str, destination_node_id: str, load_state: str, objective: str) -> list[dict[str, Any]]:
    nodes = {node["id"] for node in list_seed_nodes()}
    if origin_node_id not in nodes:
        raise SeedRouteError(f"Origin node {origin_node_id} was not found.")
    if destination_node_id not in nodes:
        raise SeedRouteError(f"Destination node {destination_node_id} was not found.")
    if origin_node_id == destination_node_id:
        return []

    graph = edge_graph()
    queue: list[tuple[float, str]] = [(0.0, origin_node_id)]
    best: dict[str, float] = {origin_node_id: 0.0}
    previous: dict[str, tuple[str, dict[str, Any]]] = {}

    while queue:
        cost, current = heapq.heappop(queue)
        if current == destination_node_id:
            break
        if cost > best.get(current, float("inf")):
            continue
        for edge in graph.get(current, []):
            next_node = edge["toNodeId"]
            next_cost = cost + edge_weight(edge, load_state, objective)
            if next_cost < best.get(next_node, float("inf")):
                best[next_node] = next_cost
                previous[next_node] = (current, edge)
                heapq.heappush(queue, (next_cost, next_node))

    if destination_node_id not in previous:
        raise SeedRouteError(f"No route exists from {origin_node_id} to {destination_node_id}.")

    edges: list[dict[str, Any]] = []
    cursor = destination_node_id
    while cursor != origin_node_id:
        previous_node, edge = previous[cursor]
        edges.append(edge)
        cursor = previous_node
    edges.reverse()
    return edges


def estimate_edge_fuel(edge: dict[str, Any], load_state: str) -> float:
    distance_km = edge["distanceMeter"] / 1000
    if load_state.lower() == "loaded" or edge.get("type") == "loaded_haul":
        rate = 4.2
    elif edge.get("type") == "connector":
        rate = 3.3
    else:
        rate = 2.8
    if edge.get("roadCondition") == "rough":
        rate *= 1.18
    elif edge.get("roadCondition") == "medium":
        rate *= 1.08
    return distance_km * rate


def build_leg(edges: list[dict[str, Any]], origin_node_id: str, destination_node_id: str, load_state: str) -> RouteLegResponse:
    route_nodes = [origin_node_id] + [edge["toNodeId"] for edge in edges]
    distance_meter = int(sum(edge["distanceMeter"] for edge in edges))
    eta_sec = int(sum(edge["historicalEtaSec"] for edge in edges))
    fuel_liter = round(sum(estimate_edge_fuel(edge, load_state) for edge in edges))
    return RouteLegResponse(
        routeNodes=route_nodes if edges else [origin_node_id, destination_node_id],
        distanceMeter=distance_meter,
        etaMin=max(1, round(eta_sec / 60)),
        fuelLiter=max(1, fuel_liter),
        sourceEdgeIds=[edge["id"] for edge in edges],
    )


def risk_for_edges(edges: list[dict[str, Any]]) -> str:
    order = {"low": 0, "medium": 1, "high": 2}
    worst = max((order.get(edge.get("riskLevel", "medium"), 1) for edge in edges), default=0)
    return next(label for label, value in order.items() if value == worst)


def score_recommendation(
    eta_min: int,
    fuel_liter: int,
    queue_count: int,
    fulfillment: int,
    risk_level: str,
    objective: str,
) -> int:
    risk_penalty = {"low": 0, "medium": 5, "high": 12}.get(risk_level, 5)
    underload_penalty = max(0, 100 - fulfillment) // 5
    if objective == "fastest":
        score = 104 - eta_min * 1.4 - queue_count * 2 - risk_penalty
    elif objective == "fuel":
        score = 104 - fuel_liter * 1.1 - queue_count - underload_penalty - risk_penalty
    else:
        score = 108 - eta_min * 0.75 - fuel_liter * 0.7 - queue_count * 2 - underload_penalty - risk_penalty
    return max(45, min(99, round(score)))


def reason_for(label: str, loading_point: dict[str, Any], eta_min: int, fuel_liter: int, risk_level: str) -> str:
    return (
        f"{label}: {loading_point['name']} dipilih dengan ETA {eta_min} menit, "
        f"estimasi fuel {fuel_liter} liter, antrean {loading_point['queueCount']} unit, "
        f"dan risiko {risk_level}."
    )


def create_recommendations(
    truck_id: str,
    origin_node_id: str | None,
    candidate_loading_point_ids: list[str] | None,
    dump_point_id: str | None,
    target_payload_ton: float | None,
    objective: str,
) -> RouteRecommendationResponse:
    truck = get_truck(truck_id)
    origin = origin_node_id or truck["currentNodeId"]
    dump_point = get_dump_point(dump_point_id)
    loading_points = loading_points_by_candidate(candidate_loading_point_ids)

    recommendations: list[RouteRecommendationItem] = []
    for loading_point in loading_points:
        empty_edges = dijkstra(origin, loading_point["nodeId"], "empty", objective)
        loaded_edges = dijkstra(loading_point["nodeId"], dump_point["nodeId"], "loaded", objective)
        empty_route = build_leg(empty_edges, origin, loading_point["nodeId"], "empty")
        loaded_route = build_leg(loaded_edges, loading_point["nodeId"], dump_point["nodeId"], "loaded")
        coal_ton = min(target_payload_ton or truck["capacityTon"], truck["capacityTon"], loading_point["availableCoalTon"])
        fulfillment = round((coal_ton / max(target_payload_ton or truck["capacityTon"], 1)) * 100)
        eta_min = empty_route.eta_min + loading_point["estimatedLoadingTimeMin"] + loaded_route.eta_min
        fuel_liter = empty_route.fuel_liter + loaded_route.fuel_liter
        risk_level = risk_for_edges(empty_edges + loaded_edges)
        label = label_for_objective(objective, len(recommendations))
        recommendations.append(
            RouteRecommendationItem(
                id=f"{label.upper().replace(' / ', '-').replace(' ', '-')}-{loading_point['id']}",
                label=label,
                originNodeId=origin,
                loadingPointId=loading_point["id"],
                dumpPointId=dump_point["id"],
                emptyRoute=empty_route,
                loadedRoute=loaded_route,
                loadingTimeMin=loading_point["estimatedLoadingTimeMin"],
                routeNodes=empty_route.route_nodes + loaded_route.route_nodes[1:],
                etaMin=eta_min,
                fuelLiter=fuel_liter,
                coalTon=coal_ton,
                fulfillment=min(100, fulfillment),
                score=score_recommendation(
                    eta_min=eta_min,
                    fuel_liter=fuel_liter,
                    queue_count=loading_point["queueCount"],
                    fulfillment=fulfillment,
                    risk_level=risk_level,
                    objective=objective,
                ),
                reason=reason_for(label, loading_point, eta_min, fuel_liter, risk_level),
                riskLevel=risk_level,
            )
        )

    recommendations.sort(key=lambda item: item.score, reverse=True)
    ranked_labels = ["Rekomendasi Optimal", "Fuel Saver", "Fastest / Low Queue"]
    loading_point_lookup = {point["id"]: point for point in loading_points}
    for index, recommendation in enumerate(recommendations):
        if index >= len(ranked_labels):
            break
        label = ranked_labels[index]
        loading_point = loading_point_lookup[recommendation.loading_point_id]
        recommendation.label = label
        recommendation.id = f"{label.upper().replace(' / ', '-').replace(' ', '-')}-{recommendation.loading_point_id}"
        recommendation.reason = reason_for(
            label,
            loading_point,
            recommendation.eta_min,
            recommendation.fuel_liter,
            recommendation.risk_level,
        )

    return RouteRecommendationResponse(
        truckId=truck_id,
        originNodeId=origin,
        dumpPointId=dump_point["id"],
        recommendations=recommendations,
    )


def label_for_objective(objective: str, index: int) -> str:
    if objective == "fuel":
        labels = ["Fuel Saver", "Rekomendasi Optimal", "Fastest / Low Queue"]
    elif objective == "fastest":
        labels = ["Fastest / Low Queue", "Rekomendasi Optimal", "Fuel Saver"]
    else:
        labels = ["Rekomendasi Optimal", "Fuel Saver", "Fastest / Low Queue"]
    return labels[index] if index < len(labels) else f"Opsi Rute {index + 1}"


def dispatch_truck(
    truck_id: str,
    route_option_id: str,
    loading_point_id: str,
    origin_node_id: str | None,
    dump_point_id: str | None,
    selection_mode: str,
) -> DispatchResponse:
    response = create_recommendations(
        truck_id=truck_id,
        origin_node_id=origin_node_id,
        candidate_loading_point_ids=[loading_point_id],
        dump_point_id=dump_point_id,
        target_payload_ton=None,
        objective="balanced",
    )
    recommendation = response.recommendations[0]
    return DispatchResponse(
        tripId=f"TRIP-{uuid4().hex[:8].upper()}",
        truckId=truck_id,
        originNodeId=recommendation.origin_node_id,
        loadingPointId=recommendation.loading_point_id,
        dumpPointId=recommendation.dump_point_id,
        routeOptionId=route_option_id or recommendation.id,
        routeLabel=recommendation.label,
        selectionMode=selection_mode,
        emptyRoute=recommendation.empty_route,
        loadedRoute=recommendation.loaded_route,
        routeNodes=recommendation.route_nodes,
        etaMin=recommendation.eta_min,
        fuelLiter=recommendation.fuel_liter,
        coalTon=recommendation.coal_ton,
        status="active",
        progress=0,
    )
