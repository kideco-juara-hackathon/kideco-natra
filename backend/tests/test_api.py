from __future__ import annotations

import os
from pathlib import Path
import tempfile

TEST_DB = Path(tempfile.gettempdir()) / "kideco_backend_test.db"
if TEST_DB.exists():
    TEST_DB.unlink()

os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB}"
os.environ["BACKEND_CORS_ORIGINS"] = "http://localhost:5173"

from app.api.routes import (  # noqa: E402
    dispatch,
    dashboard_summary,
    health,
    latest_telemetry,
    list_edges,
    list_nodes,
    list_recommendations,
    list_trucks,
    list_vehicles,
    operation_state,
    post_telemetry,
    route_recommendations,
    route_plan,
    shift_start,
    active_trips,
    trip_progress,
)
from app.db.init_db import init_db  # noqa: E402
from app.db.session import SessionLocal  # noqa: E402
from app.schemas import DispatchRequest, RoutePlanRequest, RouteRecommendationRequest, ShiftStartRequest, TelemetryEvent, TripProgressRequest  # noqa: E402


def make_db():
    db = SessionLocal()
    init_db(db)
    return db


def test_health_and_seed_endpoints() -> None:
    db = make_db()
    try:
        assert health().status == "ok"
        assert any(node.id == "DISPATCH-01" for node in list_nodes())
        assert len(list_edges()) >= 5
        assert len(list_trucks()) == 5
        assert any(truck.id == "DT-01" and truck.source_hauler_id == "CO4544" for truck in list_trucks())
        assert any(vehicle.id == "DT-01" for vehicle in list_vehicles(db))
    finally:
        db.close()


def test_route_plan_returns_recommendation_shape() -> None:
    db = make_db()
    try:
        response = route_plan(
            RoutePlanRequest(
                vehicleId="DT-01",
                originNodeId="DISPATCH-01",
                destinationNodeId="STOCKPILE-01",
                loadState="Full",
                payloadTon=28,
            ),
            db,
        )
        assert response.vehicle_id == "DT-01"
        assert response.path[0] == "DISPATCH-01"
        assert response.path[-1] == "STOCKPILE-01"
        assert response.distance_m > 0
        assert response.eta_seconds > 0
        assert response.fuel_estimate_liter > 0
        assert response.model_type == "rule_based_v0"
        assert "etaSavingSeconds" in response.comparison_vs_default
    finally:
        db.close()


def test_seed_route_recommendations_and_dispatch() -> None:
    started = shift_start(ShiftStartRequest(targetTon=2500, dumpPointId="DUMP-STOCKPILE-01"))
    assert started.status == "active"

    response = route_recommendations(
        RouteRecommendationRequest(
            truckId="DT-01",
            originNodeId="DISPATCH-01",
            candidateLoadingPointIds=["LP-A1", "LP-B1", "LP-C1"],
            dumpPointId="DUMP-STOCKPILE-01",
            targetPayloadTon=60,
        )
    )
    assert response.truck_id == "DT-01"
    assert response.origin_node_id == "DISPATCH-01"
    assert len(response.recommendations) == 3
    assert response.recommendations[0].score >= response.recommendations[-1].score
    assert response.recommendations[0].empty_route.route_nodes[0] == "DISPATCH-01"
    assert response.recommendations[0].loaded_route.route_nodes[-1] == "STOCKPILE-01"

    selected = response.recommendations[0]
    assignment = dispatch(
        DispatchRequest(
            truckId="DT-01",
            routeOptionId=selected.id,
            loadingPointId=selected.loading_point_id,
            originNodeId=response.origin_node_id,
            dumpPointId=response.dump_point_id,
        )
    )
    assert assignment.truck_id == "DT-01"
    assert assignment.status == "active"
    assert assignment.progress == 0
    assert assignment.route_nodes[0] == "DISPATCH-01"
    assert assignment.route_nodes[-1] == "STOCKPILE-01"

    state = operation_state()
    assert any(truck.id == "DT-01" and truck.status == "active" for truck in state.trucks)
    assert any(trip.trip_id == assignment.trip_id for trip in active_trips())

    completed = trip_progress(assignment.trip_id, TripProgressRequest(progress=100))
    assert completed.progress == 100
    state_after = operation_state()
    assert not any(trip.trip_id == assignment.trip_id for trip in state_after.active_trips)
    assert any(
        truck.id == "DT-01" and truck.status == "idle" and truck.current_node_id == "STOCKPILE-01"
        for truck in state_after.trucks
    )


def test_telemetry_health_alert_and_dashboard_summary() -> None:
    db = make_db()
    try:
        telemetry = post_telemetry(
            TelemetryEvent(
                vehicleId="DT-01",
                lat=-1.891,
                lng=115.872,
                speedKmh=43,
                loadState="Full",
                loadTon=34,
                engineTempC=99,
                oilPressureBar=2.2,
                vibrationLevel=0.61,
                fuelRateLph=42,
            ),
            db,
        )
        assert telemetry.vehicle_id == "DT-01"
        assert telemetry.health_score < 88
        assert telemetry.risk_level in {"high", "critical"}

        latest = latest_telemetry(asset_id="DT-01", db=db)
        assert "DT-01" in latest
        assert latest["DT-01"].health_score == telemetry.health_score

        dashboard = dashboard_summary(db)
        assert dashboard.latest_telemetry_count >= 1

        recommendations = list_recommendations(db=db)
        assert len(recommendations) >= 1
    finally:
        db.close()
