from __future__ import annotations

import heapq
import math
import uuid
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Asset, PredictionResult, Recommendation, Route, RouteSegment, Waypoint
from app.schemas import RouteAlternative, RoutePlanResponse
from app.services.prediction import estimate_route_eta_seconds, estimate_route_fuel_liter, score_route
from app.services.scoring import normalize_risk


@dataclass(frozen=True)
class GraphEdge:
    route: Route
    segment: RouteSegment
    start: Waypoint
    end: Waypoint


class RouteNotFoundError(ValueError):
    pass


def haversine_km(a: Waypoint, b: Waypoint) -> float:
    if a.latitude is None or a.longitude is None or b.latitude is None or b.longitude is None:
        return 0.0
    radius_km = 6371.0
    lat1 = math.radians(a.latitude)
    lat2 = math.radians(b.latitude)
    dlat = lat2 - lat1
    dlng = math.radians(b.longitude - a.longitude)
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng / 2) ** 2
    return 2 * radius_km * math.asin(math.sqrt(h))


def load_graph(db: Session) -> tuple[dict[str, Waypoint], dict[str, list[GraphEdge]]]:
    waypoints = {
        waypoint.id: waypoint
        for waypoint in db.scalars(
            select(Waypoint).where(Waypoint.deleted_at.is_(None), Waypoint.domain == "land")
        )
    }
    routes = {route.id: route for route in db.scalars(select(Route).where(Route.deleted_at.is_(None), Route.is_current.is_(True)))}
    segments = db.scalars(
        select(RouteSegment).where(RouteSegment.deleted_at.is_(None), RouteSegment.is_current.is_(True))
    ).all()

    graph: dict[str, list[GraphEdge]] = {}
    for segment in segments:
        route = routes.get(segment.route_id)
        start = waypoints.get(segment.start_waypoint_id)
        end = waypoints.get(segment.end_waypoint_id)
        if not route or not start or not end:
            continue
        graph.setdefault(start.id, []).append(GraphEdge(route=route, segment=segment, start=start, end=end))
    return waypoints, graph


def edge_cost(edge: GraphEdge, asset: Asset, load_state: str, payload_ton: float | None) -> float:
    eta = estimate_route_eta_seconds([edge.segment], asset, load_state, payload_ton)
    fuel = estimate_route_fuel_liter([edge.segment], asset, load_state, payload_ton)
    risk_penalty = {"low": 0, "medium": 120, "high": 300, "critical": 720}.get(edge.segment.risk_level, 120)
    return eta + (fuel * 22) + risk_penalty


def shortest_path(
    db: Session,
    asset: Asset,
    origin_code: str,
    destination_code: str,
    load_state: str,
    payload_ton: float | None,
    banned_segment_ids: set[str] | None = None,
) -> list[GraphEdge]:
    banned_segment_ids = banned_segment_ids or set()
    origin = db.scalar(select(Waypoint).where(Waypoint.waypoint_code == origin_code, Waypoint.deleted_at.is_(None)))
    destination = db.scalar(
        select(Waypoint).where(Waypoint.waypoint_code == destination_code, Waypoint.deleted_at.is_(None))
    )
    if not origin or not destination:
        raise RouteNotFoundError("Origin or destination node was not found.")

    waypoints, graph = load_graph(db)
    queue: list[tuple[float, str]] = [(0.0, origin.id)]
    best_cost: dict[str, float] = {origin.id: 0.0}
    previous: dict[str, tuple[str, GraphEdge]] = {}

    while queue:
        _, current_id = heapq.heappop(queue)
        if current_id == destination.id:
            break
        current = waypoints[current_id]
        for edge in graph.get(current_id, []):
            if edge.segment.id in banned_segment_ids:
                continue
            next_id = edge.end.id
            cost = best_cost[current_id] + edge_cost(edge, asset, load_state, payload_ton)
            heuristic = haversine_km(edge.end, destination) * 70
            if cost < best_cost.get(next_id, float("inf")):
                best_cost[next_id] = cost
                previous[next_id] = (current_id, edge)
                heapq.heappush(queue, (cost + heuristic, next_id))

    if destination.id not in previous and origin.id != destination.id:
        raise RouteNotFoundError("No route path exists between the selected nodes.")

    path_edges: list[GraphEdge] = []
    cursor = destination.id
    while cursor != origin.id:
        prior_id, edge = previous[cursor]
        path_edges.append(edge)
        cursor = prior_id
    path_edges.reverse()
    return path_edges


def build_alternative(edges: list[GraphEdge], asset: Asset, load_state: str, payload_ton: float | None) -> RouteAlternative:
    segments = [edge.segment for edge in edges]
    path = [edges[0].start.waypoint_code] + [edge.end.waypoint_code for edge in edges] if edges else []
    distance_m = int(sum((segment.distance_km or 0) * 1000 for segment in segments))
    eta_seconds = estimate_route_eta_seconds(segments, asset, load_state, payload_ton)
    fuel_liter = estimate_route_fuel_liter(segments, asset, load_state, payload_ton)
    route_score = score_route(segments, eta_seconds, fuel_liter)
    risk_level = normalize_risk(route_score)
    reason = build_route_reason(route_score, fuel_liter, eta_seconds, risk_level)
    return RouteAlternative(
        path=path,
        distanceM=distance_m,
        etaSeconds=eta_seconds,
        fuelEstimateLiter=fuel_liter,
        routeScore=route_score,
        riskLevel=risk_level,
        reason=reason,
    )


def build_route_reason(route_score: float, fuel_liter: float, eta_seconds: int, risk_level: str) -> str:
    eta_minutes = round(eta_seconds / 60)
    if risk_level == "low":
        return f"Rute dipilih karena skor {route_score}/100, ETA sekitar {eta_minutes} menit, dan estimasi fuel {fuel_liter} liter dengan risiko rendah."
    if risk_level == "medium":
        return f"Rute masih layak, tetapi perlu monitoring karena skor {route_score}/100 dan risiko sedang pada kondisi jalan atau traffic."
    return f"Rute punya risiko {risk_level}; gunakan hanya jika tidak ada opsi lebih aman dan dispatcher menyetujui."


def create_route_plan(
    db: Session,
    asset: Asset,
    origin_code: str,
    destination_code: str,
    load_state: str,
    payload_ton: float | None,
) -> RoutePlanResponse:
    best_edges = shortest_path(db, asset, origin_code, destination_code, load_state, payload_ton)
    best = build_alternative(best_edges, asset, load_state, payload_ton)

    alternatives: list[RouteAlternative] = []
    seen_paths = {tuple(best.path)}
    for edge in best_edges[:3]:
        try:
            alt_edges = shortest_path(
                db,
                asset,
                origin_code,
                destination_code,
                load_state,
                payload_ton,
                banned_segment_ids={edge.segment.id},
            )
        except RouteNotFoundError:
            continue
        alt = build_alternative(alt_edges, asset, load_state, payload_ton)
        if tuple(alt.path) not in seen_paths:
            alternatives.append(alt)
            seen_paths.add(tuple(alt.path))

    comparison = {
        "baselineRoute": alternatives[0].path if alternatives else best.path,
        "etaSavingSeconds": (alternatives[0].eta_seconds - best.eta_seconds) if alternatives else 0,
        "fuelSavingLiter": round((alternatives[0].fuel_estimate_liter - best.fuel_estimate_liter), 2) if alternatives else 0,
    }
    route_id = f"PLAN-{uuid.uuid4().hex[:8].upper()}"

    route_db_id = best_edges[0].route.id if best_edges else None
    prediction = PredictionResult(
        site_id=asset.site_id,
        asset_id=asset.id,
        route_id=route_db_id,
        prediction_type="route_score",
        model_type="rule_based_v0",
        predicted_eta_minutes=round(best.eta_seconds / 60, 2),
        predicted_fuel_liter=best.fuel_estimate_liter,
        route_score=best.route_score,
        risk_category=best.risk_level,
        reason=best.reason,
        input_snapshot={
            "vehicleId": asset.asset_code,
            "originNodeId": origin_code,
            "destinationNodeId": destination_code,
            "loadState": load_state,
            "payloadTon": payload_ton,
        },
        output_payload=best.model_dump(by_alias=True),
    )
    db.add(prediction)
    db.flush()

    priority = "high" if best.risk_level in {"high", "critical"} else "medium"
    db.add(
        Recommendation(
            site_id=asset.site_id,
            asset_id=asset.id,
            route_id=route_db_id,
            prediction_result_id=prediction.id,
            recommendation_type="route",
            priority=priority,
            title="Rekomendasi rute hauling",
            message=best.reason,
            recommended_action="Gunakan rute rekomendasi dan pantau telemetry selama perjalanan.",
            status="open",
        )
    )
    db.commit()

    return RoutePlanResponse(
        routeId=route_id,
        vehicleId=asset.asset_code,
        path=best.path,
        distanceM=best.distance_m,
        etaSeconds=best.eta_seconds,
        fuelEstimateLiter=best.fuel_estimate_liter,
        routeScore=best.route_score,
        riskLevel=best.risk_level,
        reason=best.reason,
        comparisonVsDefault=comparison,
        alternatives=alternatives,
    )
