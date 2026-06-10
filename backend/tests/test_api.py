from __future__ import annotations

import os
from pathlib import Path

TEST_DB = Path("/tmp/kideco_backend_test.db")
if TEST_DB.exists():
    TEST_DB.unlink()

os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB}"
os.environ["BACKEND_CORS_ORIGINS"] = "http://localhost:5173"

from app.api.routes import (  # noqa: E402
    dashboard_summary,
    health,
    latest_telemetry,
    list_edges,
    list_nodes,
    list_recommendations,
    list_vehicles,
    post_telemetry,
    route_plan,
)
from app.db.init_db import init_db  # noqa: E402
from app.db.session import SessionLocal  # noqa: E402
from app.schemas import RoutePlanRequest, TelemetryEvent  # noqa: E402


def make_db():
    db = SessionLocal()
    init_db(db)
    return db


def test_health_and_seed_endpoints() -> None:
    db = make_db()
    try:
        assert health().status == "ok"
        assert any(node.id == "DISPATCH-01" for node in list_nodes(db))
        assert len(list_edges(db)) >= 5
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
                destinationNodeId="JETTY-01",
                loadState="Full",
                payloadTon=28,
            ),
            db,
        )
        assert response.vehicle_id == "DT-01"
        assert response.path[0] == "DISPATCH-01"
        assert response.path[-1] == "JETTY-01"
        assert response.distance_m > 0
        assert response.eta_seconds > 0
        assert response.fuel_estimate_liter > 0
        assert response.model_type == "rule_based_v0"
        assert "etaSavingSeconds" in response.comparison_vs_default
    finally:
        db.close()


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

        dashboard = dashboard_summary(db)
        assert dashboard.latest_telemetry_count >= 1

        recommendations = list_recommendations(db=db)
        assert len(recommendations) >= 1
    finally:
        db.close()
