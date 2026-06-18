from __future__ import annotations

from app.core.config import get_settings
from app.db.models import Asset, RouteSegment, TelemetryRecord
from app.services.scoring import ROAD_MULTIPLIER, SLOPE_MULTIPLIER, TRAFFIC_MULTIPLIER, clamp, normalize_risk
from app.ml.loader import predict_segment_eta_seconds as _ml_eta, predict_segment_fuel_liter as _ml_fuel


def payload_ratio(asset: Asset, payload_ton: float | None, load_state: str | None = None) -> float:
    if payload_ton is not None and asset.capacity_ton:
        return clamp(payload_ton / asset.capacity_ton, 0.0, 1.4)
    if load_state and load_state.lower() == "full":
        return 1.0
    return 0.0


def estimate_segment_eta_seconds(segment: RouteSegment, load_ratio: float) -> int:
    distance_km = segment.distance_km or 0.0
    safe_speed = max(segment.speed_limit_kmh, 1.0)
    base_seconds = (distance_km / safe_speed) * 3600
    multiplier = (
        ROAD_MULTIPLIER.get(segment.road_condition, 1.0)
        * SLOPE_MULTIPLIER.get(segment.slope_level, 1.0)
        * TRAFFIC_MULTIPLIER.get(segment.traffic_level, 1.0)
        * (1.0 + load_ratio * 0.18)
    )
    return int(base_seconds * multiplier)


def estimate_route_eta_seconds(
    segments: list[RouteSegment],
    asset: Asset,
    load_state: str,
    payload_ton: float | None,
    waypoint_codes: list[str] | None = None,
) -> int:
    settings = get_settings()
    ratio = payload_ratio(asset, payload_ton, load_state)
    travel_seconds = 0.0
    for i, segment in enumerate(segments):
        # Use ML prediction when waypoint codes are provided
        if waypoint_codes and i + 1 < len(waypoint_codes):
            slope_m = float((segment.slope_distance or (segment.distance_km or 0.0) * 1000))
            ml_secs = _ml_eta(
                start_wp=waypoint_codes[i],
                end_wp=waypoint_codes[i + 1],
                load_state=load_state,
                slope_dist_m=slope_m,
                truck_id=asset.asset_code,
            )
            if ml_secs is not None:
                travel_seconds += ml_secs
                continue
        travel_seconds += estimate_segment_eta_seconds(segment, ratio)
    loading_seconds = settings.default_loading_time_seconds if load_state.lower() == "full" or ratio > 0 else 0
    return int(travel_seconds + loading_seconds + settings.default_eta_threshold_seconds)


def estimate_route_fuel_liter(
    segments: list[RouteSegment],
    asset: Asset,
    load_state: str,
    payload_ton: float | None,
    waypoint_codes: list[str] | None = None,
) -> float:
    ratio = payload_ratio(asset, payload_ton, load_state)
    total = 0.0
    for i, segment in enumerate(segments):
        # Use ML prediction when waypoint codes are provided
        if waypoint_codes and i + 1 < len(waypoint_codes):
            slope_m = float((segment.slope_distance or (segment.distance_km or 0.0) * 1000))
            ml_lit = _ml_fuel(
                start_wp=waypoint_codes[i],
                end_wp=waypoint_codes[i + 1],
                load_state=load_state,
                slope_dist_m=slope_m,
                slope_grade_pct=segment.slope_grade_pct,
                truck_id=asset.asset_code,
            )
            if ml_lit is not None:
                total += ml_lit
                continue
        distance_km = segment.distance_km or 0.0
        total += (
            distance_km
            * asset.base_fuel_l_per_km
            * (1.0 + ratio * 0.42)
            * ROAD_MULTIPLIER.get(segment.road_condition, 1.0)
            * SLOPE_MULTIPLIER.get(segment.slope_level, 1.0)
            * TRAFFIC_MULTIPLIER.get(segment.traffic_level, 1.0)
        )
    return round(total, 2)


def score_route(segments: list[RouteSegment], eta_seconds: int, fuel_liter: float) -> float:
    distance_km = sum(segment.distance_km or 0.0 for segment in segments)
    if distance_km <= 0:
        return 0.0

    eta_minutes_per_km = (eta_seconds / 60) / distance_km
    fuel_per_km = fuel_liter / distance_km
    road_penalty = sum((ROAD_MULTIPLIER.get(segment.road_condition, 1.0) - 1.0) * 18 for segment in segments)
    risk_penalty = sum({"low": 0, "medium": 6, "high": 15, "critical": 25}.get(segment.risk_level, 6) for segment in segments)

    time_score = clamp(100 - eta_minutes_per_km * 4.2, 0, 100)
    fuel_score = clamp(100 - fuel_per_km * 13.0, 0, 100)
    road_score = clamp(100 - road_penalty, 0, 100)
    risk_score = clamp(100 - risk_penalty, 0, 100)
    return round((fuel_score * 0.35) + (time_score * 0.30) + (road_score * 0.20) + (risk_score * 0.15), 2)


def assess_health(asset: Asset, telemetry: TelemetryRecord | None = None) -> tuple[float, str, list[str], str]:
    score = float(asset.health_score or 85.0)
    components: list[str] = []

    engine_hour_since_service = max((asset.engine_hour or 0) - (asset.last_service_engine_hour or 0), 0)
    if engine_hour_since_service > 500:
        score -= 15
        components.append("scheduled service")

    if telemetry:
        if telemetry.engine_temp_c is not None and telemetry.engine_temp_c >= 96:
            score -= 20
            components.append("cooling system")
        elif telemetry.engine_temp_c is not None and telemetry.engine_temp_c >= 90:
            score -= 10
            components.append("engine temperature")

        if telemetry.oil_pressure_bar is not None and telemetry.oil_pressure_bar < 2.6:
            score -= 25
            components.append("oil pressure")
        elif telemetry.oil_pressure_bar is not None and telemetry.oil_pressure_bar < 3.2:
            score -= 12
            components.append("lubrication")

        if telemetry.vibration_g is not None and telemetry.vibration_g >= 0.55:
            score -= 18
            components.append("vibration")
        elif telemetry.vibration_g is not None and telemetry.vibration_g >= 0.35:
            score -= 9
            components.append("drivetrain vibration")

        if telemetry.speed is not None and telemetry.speed > 40:
            score -= 10
            components.append("overspeed safety")

        if telemetry.load_ton is not None and asset.capacity_ton and telemetry.load_ton > asset.capacity_ton:
            score -= 12
            components.append("payload overload")

    score = round(clamp(score, 0, 100), 2)
    risk = normalize_risk(score)
    if risk == "low":
        action = "Unit layak operasi. Pantau telemetry normal."
    elif risk == "medium":
        action = "Lanjut operasi dengan monitoring lebih ketat."
    elif risk == "high":
        action = "Jadwalkan inspeksi sebelum dispatch berikutnya."
    else:
        action = "Stop sementara dan arahkan ke maintenance."
    return score, risk, sorted(set(components)), action
