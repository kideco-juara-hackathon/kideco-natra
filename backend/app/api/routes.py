from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.models import (
    Asset,
    PredictionResult,
    Recommendation,
    Route,
    RouteSegment,
    TelemetryRecord,
    Waypoint,
)
from app.db.session import get_db
from app.schemas import (
    DashboardSummary,
    DispatchRequest,
    DispatchResponse,
    EdgeResponse,
    HealthResponse,
    LoadPlanRequest,
    LoadPlanResponse,
    NodeResponse,
    OperationStateResponse,
    PredictionRequest,
    PredictionResponse,
    RecommendationResponse,
    RouteRecommendationRequest,
    RouteRecommendationResponse,
    RoutePlanRequest,
    RoutePlanResponse,
    ShiftResponse,
    ShiftStartRequest,
    TelemetryEvent,
    TelemetryResponse,
    TripProgressRequest,
    TruckResponse,
    VehicleResponse,
)
from app.services.load_optimizer import create_load_plan
from app.services.operation_state import (
    OperationStateError,
    dispatch_operation_truck,
    get_operation_state,
    get_shift,
    list_active_trips,
    list_operation_trucks,
    start_shift,
    update_trip_progress,
)
from app.services.prediction import assess_health, estimate_route_eta_seconds, estimate_route_fuel_liter
from app.services.route_engine import RouteNotFoundError, create_route_plan
from app.services.scoring import normalize_risk
from app.services.seed_route_engine import (
    SeedRouteError,
    create_recommendations,
    list_seed_edges,
    list_seed_nodes,
)
from app.services.telemetry import ingest_telemetry


router = APIRouter()


def get_asset_by_code(db: Session, code: str) -> Asset:
    asset = db.scalar(select(Asset).where(Asset.asset_code == code, Asset.deleted_at.is_(None)))
    if not asset:
        raise HTTPException(status_code=404, detail=f"Asset {code} was not found.")
    return asset


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(status="ok", service=settings.app_name, environment=settings.environment)


@router.get("/api/nodes", response_model=list[NodeResponse])
def list_nodes() -> list[NodeResponse]:
    nodes = list_seed_nodes()
    type_map = {
        "dispatch": "dispatch_point",
        "dump_point": "stockpile",
    }
    return [
        NodeResponse(
            id=node["id"],
            name=node["name"],
            type=type_map.get(node["type"], node["type"]),
            lat=node["visualLat"],
            lng=node["visualLng"],
            stockpileTon=0.0,
        )
        for node in nodes
    ]


@router.get("/api/edges", response_model=list[EdgeResponse])
def list_edges() -> list[EdgeResponse]:
    return [
            EdgeResponse(
                id=edge["id"],
                routeId=edge["id"],
                **{"from": edge["fromNodeId"]},
                to=edge["toNodeId"],
                distanceM=edge["distanceMeter"],
                speedLimitKmh=edge["avgSpeedKmh"],
                roadCondition=edge["roadCondition"],
                slopeLevel="medium" if edge["roadCondition"] == "medium" else "low",
                trafficLevel="normal",
                riskLevel=edge["riskLevel"],
            )
        for edge in list_seed_edges()
    ]


@router.get("/api/trucks", response_model=list[TruckResponse])
def list_trucks() -> list[TruckResponse]:
    return list_operation_trucks()


@router.get("/api/shift/current", response_model=ShiftResponse)
def shift_current() -> ShiftResponse:
    return get_shift()


@router.post("/api/shift/start", response_model=ShiftResponse)
def shift_start(payload: ShiftStartRequest) -> ShiftResponse:
    try:
        return start_shift(
            target_ton=payload.target_ton,
            dump_point_id=payload.dump_point_id,
            objective=payload.objective,
        )
    except SeedRouteError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/api/operation-state", response_model=OperationStateResponse)
def operation_state() -> OperationStateResponse:
    return get_operation_state()


@router.get("/api/trips/active", response_model=list[DispatchResponse])
def active_trips() -> list[DispatchResponse]:
    return list_active_trips()


@router.get("/api/vehicles", response_model=list[VehicleResponse])
def list_vehicles(db: Session = Depends(get_db)) -> list[VehicleResponse]:
    assets = db.scalars(select(Asset).where(Asset.deleted_at.is_(None)).order_by(Asset.asset_code)).all()
    response: list[VehicleResponse] = []
    for asset in assets:
        current_node = None
        if asset.current_waypoint_id:
            current_node = db.scalar(select(Waypoint.waypoint_code).where(Waypoint.id == asset.current_waypoint_id))
        response.append(
            VehicleResponse(
                id=asset.asset_code,
                name=asset.name,
                type=asset.asset_type,
                capacityTon=asset.capacity_ton,
                status=asset.status,
                healthScore=asset.health_score,
                currentNodeId=current_node,
                lat=asset.last_latitude,
                lng=asset.last_longitude,
            )
        )
    return response


@router.post("/api/route-plans", response_model=RoutePlanResponse)
def route_plan(payload: RoutePlanRequest, db: Session = Depends(get_db)) -> RoutePlanResponse:
    asset = get_asset_by_code(db, payload.vehicle_id)
    if asset.status in {"maintenance", "retired", "inactive"}:
        raise HTTPException(status_code=409, detail=f"Asset {asset.asset_code} is not dispatchable.")
    try:
        return create_route_plan(
            db=db,
            asset=asset,
            origin_code=payload.origin_node_id,
            destination_code=payload.destination_node_id,
            load_state=payload.load_state,
            payload_ton=payload.payload_ton,
        )
    except RouteNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/api/route-recommendations", response_model=RouteRecommendationResponse)
def route_recommendations(payload: RouteRecommendationRequest) -> RouteRecommendationResponse:
    try:
        return create_recommendations(
            truck_id=payload.truck_id,
            origin_node_id=payload.origin_node_id,
            candidate_loading_point_ids=payload.candidate_loading_point_ids,
            dump_point_id=payload.dump_point_id,
            target_payload_ton=payload.target_payload_ton,
            objective=payload.objective,
        )
    except SeedRouteError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/api/dispatch", response_model=DispatchResponse)
def dispatch(payload: DispatchRequest) -> DispatchResponse:
    try:
        return dispatch_operation_truck(
            truck_id=payload.truck_id,
            route_option_id=payload.route_option_id,
            loading_point_id=payload.loading_point_id,
            origin_node_id=payload.origin_node_id,
            dump_point_id=payload.dump_point_id,
            selection_mode=payload.selection_mode,
        )
    except SeedRouteError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except OperationStateError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.patch("/api/trips/{trip_id}/progress", response_model=DispatchResponse)
def trip_progress(trip_id: str, payload: TripProgressRequest) -> DispatchResponse:
    try:
        return update_trip_progress(trip_id=trip_id, progress=payload.progress)
    except OperationStateError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/api/load-plans", response_model=LoadPlanResponse)
def load_plan(payload: LoadPlanRequest, db: Session = Depends(get_db)) -> LoadPlanResponse:
    asset = get_asset_by_code(db, payload.vehicle_id)
    try:
        return create_load_plan(
            db=db,
            asset=asset,
            origin_code=payload.origin_node_id,
            candidate_pit_codes=payload.candidate_pit_node_ids,
            destination_code=payload.destination_node_id,
            target_payload_ton=payload.target_payload_ton,
        )
    except RouteNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/api/telemetry", response_model=TelemetryResponse)
def post_telemetry(payload: TelemetryEvent, db: Session = Depends(get_db)) -> TelemetryResponse:
    asset = get_asset_by_code(db, payload.vehicle_id)
    return ingest_telemetry(db, asset, payload)


@router.get("/api/telemetry/latest", response_model=dict[str, TelemetryResponse])
def latest_telemetry(
    asset_id: str | None = Query(default=None, alias="assetId"),
    db: Session = Depends(get_db),
):
    if not isinstance(asset_id, str):
        asset_id = None
    query = select(Asset).where(Asset.deleted_at.is_(None))
    if asset_id:
        query = query.where(Asset.asset_code == asset_id)
    assets = db.scalars(query).all()
    result: dict[str, TelemetryResponse] = {}
    for asset in assets:
        record = db.scalar(
            select(TelemetryRecord)
            .where(TelemetryRecord.asset_id == asset.id)
            .order_by(desc(TelemetryRecord.recorded_at))
            .limit(1)
        )
        if not record:
            continue
        health_score = round(float(asset.health_score if asset.health_score is not None else 85.0), 2)
        result[asset.asset_code] = TelemetryResponse(
            id=record.id,
            vehicleId=asset.asset_code,
            timestamp=record.recorded_at,
            lat=record.latitude,
            lng=record.longitude,
            speedKmh=record.speed,
            loadState=record.load_state,
            engineTempC=record.engine_temp_c,
            oilPressureBar=record.oil_pressure_bar,
            vibrationLevel=record.vibration_g,
            fuelRateLph=record.fuel_flow_rate,
            engineHour=record.engine_hour,
            healthScore=health_score,
            riskLevel=normalize_risk(health_score),
        )
    return result


@router.get("/api/telemetry/{asset_id}/history", response_model=list[TelemetryResponse])
def telemetry_history(asset_id: str, limit: int = 50, db: Session = Depends(get_db)) -> list[TelemetryResponse]:
    asset = get_asset_by_code(db, asset_id)
    records = db.scalars(
        select(TelemetryRecord)
        .where(TelemetryRecord.asset_id == asset.id)
        .order_by(desc(TelemetryRecord.recorded_at))
        .limit(limit)
    ).all()
    response: list[TelemetryResponse] = []
    for record in records:
        health_score, risk_level, _, _ = assess_health(asset, record)
        response.append(
            TelemetryResponse(
                id=record.id,
                vehicleId=asset.asset_code,
                timestamp=record.recorded_at,
                lat=record.latitude,
                lng=record.longitude,
                speedKmh=record.speed,
                loadState=record.load_state,
                engineTempC=record.engine_temp_c,
                oilPressureBar=record.oil_pressure_bar,
                vibrationLevel=record.vibration_g,
                fuelRateLph=record.fuel_flow_rate,
                engineHour=record.engine_hour,
                healthScore=health_score,
                riskLevel=risk_level,
            )
        )
    return response


@router.post("/api/predictions/eta", response_model=PredictionResponse)
def predict_eta(payload: PredictionRequest, db: Session = Depends(get_db)) -> PredictionResponse:
    asset = get_asset_by_code(db, payload.vehicle_id)
    segments = _segments_from_path_or_distance(db, payload.route_path, payload.distance_m)
    eta_seconds = estimate_route_eta_seconds(
        segments, asset, payload.load_state, payload.payload_ton, payload.route_path
    )
    return PredictionResponse(
        vehicleId=asset.asset_code,
        predictionType="eta",
        etaSeconds=eta_seconds,
        riskLevel="low",
        reason="ETA dihitung dari model ML per segmen (fallback: waktu tempuh berbasis aturan).",
    )


@router.post("/api/predictions/fuel", response_model=PredictionResponse)
def predict_fuel(payload: PredictionRequest, db: Session = Depends(get_db)) -> PredictionResponse:
    asset = get_asset_by_code(db, payload.vehicle_id)
    segments = _segments_from_path_or_distance(db, payload.route_path, payload.distance_m)
    fuel = estimate_route_fuel_liter(
        segments, asset, payload.load_state, payload.payload_ton, payload.route_path
    )
    return PredictionResponse(
        vehicleId=asset.asset_code,
        predictionType="fuel",
        fuelEstimateLiter=fuel,
        riskLevel="low",
        reason="Fuel dihitung dari model ML per segmen (fallback: konsumsi berbasis fisika).",
    )


@router.post("/api/predictions/health", response_model=PredictionResponse)
def predict_health(payload: TelemetryEvent, db: Session = Depends(get_db)) -> PredictionResponse:
    asset = get_asset_by_code(db, payload.vehicle_id)
    record = TelemetryRecord(
        site_id=asset.site_id,
        asset_id=asset.id,
        speed=payload.speed_kmh,
        engine_temp_c=payload.engine_temp_c,
        oil_pressure_bar=payload.oil_pressure_bar,
        vibration_g=payload.vibration_level,
        load_ton=payload.load_ton,
    )
    score, risk, components, action = assess_health(asset, record)
    return PredictionResponse(
        vehicleId=asset.asset_code,
        predictionType="health",
        healthScore=score,
        riskLevel=risk,
        reason=f"{action} Komponen dipantau: {', '.join(components) or 'normal'}.",
    )


@router.get("/api/dashboard/summary", response_model=DashboardSummary)
def dashboard_summary(db: Session = Depends(get_db)) -> DashboardSummary:
    assets = db.scalars(select(Asset).where(Asset.deleted_at.is_(None))).all()
    total_assets = len(assets)
    average_health = round(sum(asset.health_score for asset in assets) / total_assets, 2) if total_assets else 0
    open_recommendations = db.scalar(select(func.count()).select_from(Recommendation).where(Recommendation.status == "open")) or 0
    high_priority = db.scalar(
        select(func.count()).select_from(Recommendation).where(Recommendation.status == "open", Recommendation.priority.in_(["high", "critical"]))
    ) or 0
    latest_count = db.scalar(select(func.count(func.distinct(TelemetryRecord.asset_id))).select_from(TelemetryRecord)) or 0
    return DashboardSummary(
        totalAssets=total_assets,
        activeAssets=sum(1 for asset in assets if asset.status == "active"),
        idleAssets=sum(1 for asset in assets if asset.status == "idle"),
        maintenanceAssets=sum(1 for asset in assets if asset.status == "maintenance"),
        averageHealthScore=average_health,
        openRecommendations=open_recommendations,
        highPriorityRecommendations=high_priority,
        latestTelemetryCount=latest_count,
    )


@router.get("/api/recommendations", response_model=list[RecommendationResponse])
def list_recommendations(
    asset_id: str | None = Query(default=None, alias="assetId"),
    status: str = "open",
    db: Session = Depends(get_db),
) -> list[RecommendationResponse]:
    if not isinstance(asset_id, str):
        asset_id = None
    query = select(Recommendation, Asset.asset_code).outerjoin(Asset, Asset.id == Recommendation.asset_id)
    query = query.where(Recommendation.deleted_at.is_(None), Recommendation.status == status)
    if asset_id:
        asset = get_asset_by_code(db, asset_id)
        query = query.where(Recommendation.asset_id == asset.id)
    rows = db.execute(query.order_by(desc(Recommendation.created_at))).all()
    return [
        RecommendationResponse(
            id=recommendation.id,
            assetId=recommendation.asset_id,
            assetCode=asset_code,
            recommendationType=recommendation.recommendation_type,
            priority=recommendation.priority,
            title=recommendation.title,
            message=recommendation.message,
            recommendedAction=recommendation.recommended_action,
            status=recommendation.status,
            createdAt=recommendation.created_at,
        )
        for recommendation, asset_code in rows
    ]


@router.patch("/api/recommendations/{recommendation_id}/resolve", response_model=RecommendationResponse)
def resolve_recommendation(recommendation_id: str, db: Session = Depends(get_db)) -> RecommendationResponse:
    recommendation = db.get(Recommendation, recommendation_id)
    if not recommendation or recommendation.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Recommendation was not found.")
    recommendation.status = "resolved"
    db.commit()
    db.refresh(recommendation)
    asset_code = None
    if recommendation.asset_id:
        asset_code = db.scalar(select(Asset.asset_code).where(Asset.id == recommendation.asset_id))
    return RecommendationResponse(
        id=recommendation.id,
        assetId=recommendation.asset_id,
        assetCode=asset_code,
        recommendationType=recommendation.recommendation_type,
        priority=recommendation.priority,
        title=recommendation.title,
        message=recommendation.message,
        recommendedAction=recommendation.recommended_action,
        status=recommendation.status,
        createdAt=recommendation.created_at,
    )


def _segments_from_path_or_distance(db: Session, path: list[str] | None, distance_m: int | None) -> list[RouteSegment]:
    if path and len(path) >= 2:
        segments: list[RouteSegment] = []
        for start_code, end_code in zip(path, path[1:]):
            start_id = db.scalar(select(Waypoint.id).where(Waypoint.waypoint_code == start_code))
            end_id = db.scalar(select(Waypoint.id).where(Waypoint.waypoint_code == end_code))
            segment = db.scalar(
                select(RouteSegment).where(
                    RouteSegment.start_waypoint_id == start_id,
                    RouteSegment.end_waypoint_id == end_id,
                    RouteSegment.deleted_at.is_(None),
                )
            )
            if segment:
                segments.append(segment)
        if segments:
            return segments

    distance_km = (distance_m or 1000) / 1000
    return [
        RouteSegment(
            route_id="ad-hoc",
            start_waypoint_id="ad-hoc-start",
            end_waypoint_id="ad-hoc-end",
            distance_km=distance_km,
            speed_limit_kmh=30,
            road_condition="normal",
            slope_level="low",
            traffic_level="normal",
            risk_level="low",
        )
    ]
