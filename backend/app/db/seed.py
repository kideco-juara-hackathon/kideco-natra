from __future__ import annotations

from datetime import UTC, datetime, time

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import (
    Asset,
    DataImportLog,
    EnvironmentCondition,
    MaintenanceRecord,
    Route,
    RouteSegment,
    Shift,
    Site,
    User,
    Waypoint,
)
from app.services.seed_route_engine import load_seed_data


SITE_CODE = "KIDECO-KALTIM"

# Single source of truth: the DB seed mirrors the JSON seeds in data/seeds/*,
# the same files that drive /api/nodes, /api/edges, /api/trucks, operation-state,
# and the frontend map. Keeping the topology identical here means the DB-backed
# endpoints (/api/vehicles, /api/route-plans A*, telemetry, dashboard) operate on
# the exact same nodes, trucks, and routes as the dispatch flow.

# nodes.json uses demo-facing type names; map them to the DB waypoint vocabulary.
WAYPOINT_TYPE_MAP = {
    "dispatch": "dispatch_point",
    "dump_point": "stockpile",
    "pit": "pit",
    "loading_point": "loading_point",
    "checkpoint": "checkpoint",
}


def seed_demo_data(db: Session) -> None:
    existing_site = db.scalar(select(Site).where(Site.site_code == SITE_CODE))
    if existing_site:
        return

    site = Site(
        site_code=SITE_CODE,
        name="KIDECO Kalimantan Timur Demo Site",
        site_type="mining",
        timezone="Asia/Singapore",
        coordinate_system="WGS84",
    )
    db.add(site)
    db.flush()

    dispatcher = User(
        site_id=site.id,
        name="Demo Dispatcher",
        email="dispatcher.demo@kideco.local",
        role="dispatcher",
    )
    db.add(dispatcher)
    db.flush()

    seed_data = load_seed_data()
    node_specs = seed_data["nodes"]
    edge_specs = seed_data["edges"]
    truck_specs = seed_data["trucks"]
    # Available coal per loading point, keyed by the node it sits on, so loading-point
    # waypoints carry a meaningful stockpile figure.
    coal_by_node = {lp["nodeId"]: float(lp.get("availableCoalTon", 0.0)) for lp in seed_data["loadingPoints"]}

    import_log = DataImportLog(
        site_id=site.id,
        imported_by_user_id=dispatcher.id,
        source_type="seed",
        source_file="data/seeds/*.json",
        target_entity="demo_backend_dataset",
        row_count=len(node_specs) + len(edge_specs) + len(truck_specs),
        inserted_count=len(node_specs) + len(edge_specs) + len(truck_specs),
        started_at=datetime.now(UTC),
        finished_at=datetime.now(UTC),
        raw_payload={"scope": "hauling_land_mvp", "source": "data/seeds"},
    )
    db.add(import_log)
    db.flush()

    db.add_all(
        [
            Shift(site_id=site.id, shift_code="DAY", name="Day Shift", start_time=time(6, 0), end_time=time(18, 0)),
            Shift(site_id=site.id, shift_code="NIGHT", name="Night Shift", start_time=time(18, 0), end_time=time(6, 0)),
        ]
    )

    # --- Waypoints (from data/seeds/nodes.json) ---
    waypoints: dict[str, Waypoint] = {}
    for node in node_specs:
        code = node["id"]
        node_type = node["type"]
        stockpile_ton = coal_by_node.get(code, 180.0 if node_type == "dump_point" else 0.0)
        waypoint = Waypoint(
            site_id=site.id,
            import_log_id=import_log.id,
            waypoint_code=code,
            name=node["name"],
            domain="land",
            waypoint_type=WAYPOINT_TYPE_MAP.get(node_type, node_type),
            latitude=node["visualLat"],
            longitude=node["visualLng"],
            stockpile_ton=stockpile_ton,
        )
        db.add(waypoint)
        waypoints[code] = waypoint
    db.flush()

    # --- Assets (from data/seeds/trucks.json) ---
    # engine_hour / last_service are backend-only wear inputs not present in the JSON;
    # derive them from health so the gap stays under the 500h threshold at seed time
    # and the simulator's accumulation pushes lower-health units over it during a demo.
    for truck in truck_specs:
        code = truck["id"]
        health = float(truck["healthScore"])
        engine_hour = round(800.0 + (100.0 - health) * 20.0, 1)
        last_service_engine_hour = round(engine_hour - (100.0 - health) * 6.0, 1)
        wp = waypoints.get(truck["currentNodeId"])
        position = truck.get("position") or {}
        db.add(
            Asset(
                site_id=site.id,
                import_log_id=import_log.id,
                asset_code=code,
                name=f"Dump Truck {code.split('-')[-1]}",
                domain="land",
                asset_type="hauler",
                capacity_ton=float(truck["capacityTon"]),
                status="active" if truck.get("status") == "active" else "idle",
                health_score=health,
                current_waypoint_id=wp.id if wp else None,
                last_latitude=position.get("lat", wp.latitude if wp else None),
                last_longitude=position.get("lng", wp.longitude if wp else None),
                engine_hour=engine_hour,
                last_service_engine_hour=last_service_engine_hour,
            )
        )
    db.flush()

    # --- Routes + segments (from data/seeds/edges.json) ---
    # One route/segment per edge mirrors the directed haul graph the dispatch engine
    # uses, so the DB A* (/api/route-plans) traverses the same topology.
    for idx, edge in enumerate(edge_specs, start=1):
        origin = waypoints.get(edge["fromNodeId"])
        destination = waypoints.get(edge["toNodeId"])
        if not origin or not destination:
            continue
        distance_km = float(edge["distanceMeter"]) / 1000.0
        speed = float(edge["avgSpeedKmh"])
        road = edge.get("roadCondition", "normal")
        risk = edge.get("riskLevel", "low")
        eta_min = float(edge.get("etaHistoricalMin") or ((distance_km / max(speed, 1.0)) * 60.0))
        route = Route(
            site_id=site.id,
            import_log_id=import_log.id,
            domain="land",
            route_code=edge["id"],
            name=f"{edge['fromNodeId']} to {edge['toNodeId']}",
            version_no=1,
            origin_waypoint_id=origin.id,
            destination_waypoint_id=destination.id,
            distance_km=distance_km,
            road_description=road,
            default_eta_minutes=eta_min,
            default_fuel_liter=distance_km * 1.35,
            operational_status="available",
        )
        db.add(route)
        db.flush()
        db.add(
            RouteSegment(
                route_id=route.id,
                sequence_no=idx,
                start_waypoint_id=origin.id,
                end_waypoint_id=destination.id,
                distance_km=distance_km,
                speed_limit_kmh=speed,
                road_condition=road,
                slope_level="low",
                risk_level=risk,
                traffic_level="normal",
                slope_grade_pct=0.0,
            )
        )

    # Attach the dummy maintenance history to the lowest-health hauler in the fleet.
    weakest = min(truck_specs, key=lambda t: float(t["healthScore"]))
    weakest_engine_hour = round(800.0 + (100.0 - float(weakest["healthScore"])) * 20.0, 1)
    db.add_all(
        [
            EnvironmentCondition(site_id=site.id, domain="land", weather_status="clear", road_condition="normal", traffic_level="normal"),
            EnvironmentCondition(site_id=site.id, domain="land", weather_status="heavy_rain", road_condition="muddy", traffic_level="busy", queue_minutes=8),
            MaintenanceRecord(
                site_id=site.id,
                asset_id=db.scalar(select(Asset.id).where(Asset.asset_code == weakest["id"])),
                maintenance_type="inspection",
                component_name="Cooling System",
                description="Dummy history for elevated maintenance risk.",
                engine_hour_at_service=weakest_engine_hour - 80.0,
                status="completed",
            ),
        ]
    )
    db.commit()
