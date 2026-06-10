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


SITE_CODE = "KIDECO-KALTIM"


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

    import_log = DataImportLog(
        site_id=site.id,
        imported_by_user_id=dispatcher.id,
        source_type="seed",
        source_file="app/db/seed.py",
        target_entity="demo_backend_dataset",
        row_count=32,
        inserted_count=32,
        started_at=datetime.now(UTC),
        finished_at=datetime.now(UTC),
        raw_payload={"scope": "hauling_land_mvp"},
    )
    db.add(import_log)
    db.flush()

    db.add_all(
        [
            Shift(site_id=site.id, shift_code="DAY", name="Day Shift", start_time=time(6, 0), end_time=time(18, 0)),
            Shift(site_id=site.id, shift_code="NIGHT", name="Night Shift", start_time=time(18, 0), end_time=time(6, 0)),
        ]
    )

    waypoint_specs = [
        ("DISPATCH-01", "Dispatch Point", "dispatch_point", -1.8912, 115.8720, 0.0),
        ("PIT-A-01", "Pit A North", "pit", -1.8840, 115.8645, 75.0),
        ("PIT-B-01", "Pit B South", "pit", -1.8975, 115.8580, 48.0),
        ("CP-ROTO-01", "Roto Checkpoint 01", "checkpoint", -1.8895, 115.8625, 0.0),
        ("CP-ROTO-02", "Roto Checkpoint 02", "checkpoint", -1.9010, 115.8660, 0.0),
        ("STOCKPILE-01", "Main Stockpile", "stockpile", -1.9050, 115.8755, 180.0),
        ("JETTY-01", "Jetty Loading Point", "jetty", -1.9095, 115.8840, 0.0),
    ]
    waypoints: dict[str, Waypoint] = {}
    for code, name, waypoint_type, lat, lng, stockpile_ton in waypoint_specs:
        waypoint = Waypoint(
            site_id=site.id,
            import_log_id=import_log.id,
            waypoint_code=code,
            name=name,
            domain="land",
            waypoint_type=waypoint_type,
            latitude=lat,
            longitude=lng,
            stockpile_ton=stockpile_ton,
        )
        db.add(waypoint)
        waypoints[code] = waypoint
    db.flush()

    vehicle_specs = [
        ("DT-01", "Dump Truck 01", 32.0, "idle", 88.0, "DISPATCH-01", 1.34, 860.0, 500.0),
        ("DT-02", "Dump Truck 02", 32.0, "active", 81.0, "CP-ROTO-01", 1.41, 1220.0, 900.0),
        ("DT-03", "Dump Truck 03", 36.0, "idle", 92.0, "DISPATCH-01", 1.38, 430.0, 260.0),
        ("DT-07", "Dump Truck 07", 30.0, "maintenance", 54.0, "STOCKPILE-01", 1.58, 1750.0, 1100.0),
        ("EX-12", "Excavator 12", 0.0, "active", 84.0, "PIT-A-01", 0.0, 980.0, 700.0),
    ]
    for code, name, capacity, status, health, waypoint_code, fuel_rate, engine_hour, service_hour in vehicle_specs:
        wp = waypoints[waypoint_code]
        db.add(
            Asset(
                site_id=site.id,
                import_log_id=import_log.id,
                asset_code=code,
                name=name,
                domain="land",
                asset_type="loader" if code.startswith("EX") else "hauler",
                capacity_ton=capacity,
                status=status,
                health_score=health,
                current_waypoint_id=wp.id,
                last_latitude=wp.latitude,
                last_longitude=wp.longitude,
                base_fuel_l_per_km=fuel_rate,
                engine_hour=engine_hour,
                last_service_engine_hour=service_hour,
            )
        )
    db.flush()

    segment_specs = [
        ("R-DISPATCH-PIT-A", "Dispatch to Pit A", "DISPATCH-01", "PIT-A-01", 1.55, 32, "normal", "low", "low", "normal", 2.0),
        ("R-DISPATCH-CP1", "Dispatch to Checkpoint 01", "DISPATCH-01", "CP-ROTO-01", 1.60, 35, "normal", "medium", "low", "normal", 3.0),
        ("R-CP1-PIT-A", "Checkpoint 01 to Pit A", "CP-ROTO-01", "PIT-A-01", 1.05, 28, "muddy", "medium", "medium", "busy", 4.5),
        ("R-CP1-PIT-B", "Checkpoint 01 to Pit B", "CP-ROTO-01", "PIT-B-01", 1.85, 30, "normal", "medium", "medium", "normal", 3.5),
        ("R-PIT-A-STOCKPILE", "Pit A to Stockpile", "PIT-A-01", "STOCKPILE-01", 3.40, 27, "normal", "high", "medium", "busy", 5.5),
        ("R-PIT-B-CP2", "Pit B to Checkpoint 02", "PIT-B-01", "CP-ROTO-02", 1.40, 26, "rough", "medium", "medium", "normal", 4.0),
        ("R-CP2-STOCKPILE", "Checkpoint 02 to Stockpile", "CP-ROTO-02", "STOCKPILE-01", 1.75, 30, "normal", "low", "low", "normal", 1.5),
        ("R-STOCKPILE-JETTY", "Stockpile to Jetty", "STOCKPILE-01", "JETTY-01", 1.25, 25, "normal", "low", "low", "busy", 0.8),
        ("R-CP1-CP2", "Checkpoint 01 to Checkpoint 02", "CP-ROTO-01", "CP-ROTO-02", 2.05, 34, "normal", "low", "low", "normal", 1.0),
        ("R-DISPATCH-CP2", "Dispatch to Checkpoint 02", "DISPATCH-01", "CP-ROTO-02", 2.45, 33, "normal", "low", "low", "normal", 1.2),
    ]
    for idx, (code, name, origin, destination, distance_km, speed, road, slope, risk, traffic, slope_pct) in enumerate(segment_specs, start=1):
        route = Route(
            site_id=site.id,
            import_log_id=import_log.id,
            domain="land",
            route_code=code,
            name=name,
            version_no=1,
            origin_waypoint_id=waypoints[origin].id,
            destination_waypoint_id=waypoints[destination].id,
            distance_km=distance_km,
            road_description=road,
            default_eta_minutes=(distance_km / speed) * 60,
            default_fuel_liter=distance_km * 1.35,
            operational_status="available",
        )
        db.add(route)
        db.flush()
        db.add(
            RouteSegment(
                route_id=route.id,
                sequence_no=idx,
                start_waypoint_id=waypoints[origin].id,
                end_waypoint_id=waypoints[destination].id,
                distance_km=distance_km,
                speed_limit_kmh=speed,
                road_condition=road,
                slope_level=slope,
                risk_level=risk,
                traffic_level=traffic,
                slope_grade_pct=slope_pct,
            )
        )

    db.add_all(
        [
            EnvironmentCondition(site_id=site.id, domain="land", weather_status="clear", road_condition="normal", traffic_level="normal"),
            EnvironmentCondition(site_id=site.id, domain="land", weather_status="heavy_rain", road_condition="muddy", traffic_level="busy", queue_minutes=8),
            MaintenanceRecord(
                site_id=site.id,
                asset_id=db.scalar(select(Asset.id).where(Asset.asset_code == "DT-07")),
                maintenance_type="inspection",
                component_name="Cooling System",
                description="Dummy history for elevated maintenance risk.",
                engine_hour_at_service=1680,
                status="completed",
            ),
        ]
    )
    db.commit()
