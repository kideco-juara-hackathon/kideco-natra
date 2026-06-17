from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ApiSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class HealthResponse(ApiSchema):
    status: str
    service: str
    environment: str


class NodeResponse(ApiSchema):
    id: str
    name: str
    type: str
    lat: float | None = None
    lng: float | None = None
    stockpile_ton: float = Field(alias="stockpileTon", default=0.0)


class EdgeResponse(ApiSchema):
    id: str
    route_id: str = Field(alias="routeId")
    from_node: str = Field(alias="from")
    to: str
    distance_m: int = Field(alias="distanceM")
    speed_limit_kmh: float = Field(alias="speedLimitKmh")
    road_condition: str = Field(alias="roadCondition")
    slope_level: str = Field(alias="slopeLevel")
    traffic_level: str = Field(alias="trafficLevel")
    risk_level: str = Field(alias="riskLevel")


class VehicleResponse(ApiSchema):
    id: str
    name: str
    type: str
    capacity_ton: float | None = Field(alias="capacityTon")
    status: str
    health_score: float = Field(alias="healthScore")
    current_node_id: str | None = Field(alias="currentNodeId")
    lat: float | None = None
    lng: float | None = None


class TruckResponse(ApiSchema):
    id: str
    code: str
    source_hauler_id: str | None = Field(alias="sourceHaulerId", default=None)
    capacity_ton: float = Field(alias="capacityTon")
    current_payload_ton: float = Field(alias="currentPayloadTon")
    current_node_id: str = Field(alias="currentNodeId")
    fuel_level_percent: float = Field(alias="fuelLevelPercent")
    health_score: float = Field(alias="healthScore")
    last_seen_at: str = Field(alias="lastSeenAt")
    load_state: str = Field(alias="loadState")
    status: str
    position: dict[str, float]
    dataset_rows: int | None = Field(alias="datasetRows", default=None)


class RoutePlanRequest(ApiSchema):
    vehicle_id: str = Field(alias="vehicleId")
    origin_node_id: str = Field(alias="originNodeId")
    destination_node_id: str = Field(alias="destinationNodeId")
    load_state: str = Field(alias="loadState", default="Empty")
    payload_ton: float | None = Field(alias="payloadTon", default=None)
    objective: str = "balanced"


class RouteAlternative(ApiSchema):
    path: list[str]
    distance_m: int = Field(alias="distanceM")
    eta_seconds: int = Field(alias="etaSeconds")
    fuel_estimate_liter: float = Field(alias="fuelEstimateLiter")
    route_score: float = Field(alias="routeScore")
    risk_level: str = Field(alias="riskLevel")
    reason: str


class RoutePlanResponse(RouteAlternative):
    route_id: str = Field(alias="routeId")
    vehicle_id: str = Field(alias="vehicleId")
    model_type: str = Field(alias="modelType", default="rule_based_v0")
    comparison_vs_default: dict[str, Any] = Field(alias="comparisonVsDefault")
    alternatives: list[RouteAlternative] = []


class RouteLegResponse(ApiSchema):
    route_nodes: list[str] = Field(alias="routeNodes")
    distance_meter: int = Field(alias="distanceMeter")
    eta_min: int = Field(alias="etaMin")
    fuel_liter: int = Field(alias="fuelLiter")
    source_edge_ids: list[str] = Field(alias="sourceEdgeIds", default_factory=list)


class RouteRecommendationItem(ApiSchema):
    id: str
    label: str
    origin_node_id: str = Field(alias="originNodeId")
    loading_point_id: str = Field(alias="loadingPointId")
    dump_point_id: str = Field(alias="dumpPointId")
    empty_route: RouteLegResponse = Field(alias="emptyRoute")
    loaded_route: RouteLegResponse = Field(alias="loadedRoute")
    loading_time_min: int = Field(alias="loadingTimeMin")
    route_nodes: list[str] = Field(alias="routeNodes")
    eta_min: int = Field(alias="etaMin")
    fuel_liter: int = Field(alias="fuelLiter")
    coal_ton: float = Field(alias="coalTon")
    fulfillment: int
    score: int
    reason: str
    risk_level: str = Field(alias="riskLevel")


class RouteRecommendationRequest(ApiSchema):
    truck_id: str = Field(alias="truckId")
    origin_node_id: str | None = Field(alias="originNodeId", default=None)
    candidate_loading_point_ids: list[str] | None = Field(alias="candidateLoadingPointIds", default=None)
    dump_point_id: str | None = Field(alias="dumpPointId", default=None)
    target_payload_ton: float | None = Field(alias="targetPayloadTon", default=None)
    objective: str = "balanced"


class RouteRecommendationResponse(ApiSchema):
    truck_id: str = Field(alias="truckId")
    origin_node_id: str = Field(alias="originNodeId")
    dump_point_id: str = Field(alias="dumpPointId")
    model_type: str = Field(alias="modelType", default="dijkstra_seed_v1")
    recommendations: list[RouteRecommendationItem]


class DispatchRequest(ApiSchema):
    truck_id: str = Field(alias="truckId")
    route_option_id: str = Field(alias="routeOptionId")
    loading_point_id: str = Field(alias="loadingPointId")
    origin_node_id: str | None = Field(alias="originNodeId", default=None)
    dump_point_id: str | None = Field(alias="dumpPointId", default=None)
    selection_mode: str = Field(alias="selectionMode", default="recommended")


class DispatchResponse(ApiSchema):
    trip_id: str = Field(alias="tripId")
    truck_id: str = Field(alias="truckId")
    origin_node_id: str = Field(alias="originNodeId")
    loading_point_id: str = Field(alias="loadingPointId")
    dump_point_id: str = Field(alias="dumpPointId")
    route_option_id: str = Field(alias="routeOptionId")
    route_label: str = Field(alias="routeLabel")
    selection_mode: str = Field(alias="selectionMode")
    empty_route: RouteLegResponse = Field(alias="emptyRoute")
    loaded_route: RouteLegResponse = Field(alias="loadedRoute")
    route_nodes: list[str] = Field(alias="routeNodes")
    eta_min: int = Field(alias="etaMin")
    fuel_liter: int = Field(alias="fuelLiter")
    coal_ton: float = Field(alias="coalTon")
    status: str
    progress: int


class ShiftStartRequest(ApiSchema):
    target_ton: float = Field(alias="targetTon", default=2500)
    dump_point_id: str = Field(alias="dumpPointId", default="DUMP-STOCKPILE-01")
    objective: str = "balanced"


class ShiftResponse(ApiSchema):
    status: str
    target_ton: float = Field(alias="targetTon")
    dump_point_id: str = Field(alias="dumpPointId")
    dump_point_name: str = Field(alias="dumpPointName")
    objective: str
    hauled_ton: float = Field(alias="hauledTon")
    started_at: str | None = Field(alias="startedAt", default=None)


class TripProgressRequest(ApiSchema):
    progress: int


class OperationStateResponse(ApiSchema):
    shift: ShiftResponse
    trucks: list[TruckResponse]
    active_trips: list[DispatchResponse] = Field(alias="activeTrips")


class LoadPlanRequest(ApiSchema):
    vehicle_id: str = Field(alias="vehicleId")
    origin_node_id: str = Field(alias="originNodeId")
    candidate_pit_node_ids: list[str] = Field(alias="candidatePitNodeIds")
    destination_node_id: str = Field(alias="destinationNodeId")
    target_payload_ton: float | None = Field(alias="targetPayloadTon", default=None)


class LoadStop(ApiSchema):
    node_id: str = Field(alias="nodeId")
    pickup_ton: float = Field(alias="pickupTon")


class LoadPlanResponse(ApiSchema):
    vehicle_id: str = Field(alias="vehicleId")
    target_payload_ton: float = Field(alias="targetPayloadTon")
    planned_payload_ton: float = Field(alias="plannedPayloadTon")
    estimated_vehicle_count: int = Field(alias="estimatedVehicleCount")
    stops: list[LoadStop]
    route_plan: RoutePlanResponse = Field(alias="routePlan")
    reason: str


class TelemetryEvent(ApiSchema):
    vehicle_id: str = Field(alias="vehicleId")
    timestamp: datetime | None = None
    lat: float | None = None
    lng: float | None = None
    speed_kmh: float | None = Field(alias="speedKmh", default=None)
    load_state: str | None = Field(alias="loadState", default=None)
    load_ton: float | None = Field(alias="loadTon", default=None)
    engine_temp_c: float | None = Field(alias="engineTempC", default=None)
    oil_pressure_bar: float | None = Field(alias="oilPressureBar", default=None)
    vibration_level: float | None = Field(alias="vibrationLevel", default=None)
    fuel_rate_lph: float | None = Field(alias="fuelRateLph", default=None)
    fuel_level_percent: float | None = Field(alias="fuelLevelPercent", default=None)
    rpm: float | None = None
    raw_payload: dict[str, Any] | None = Field(alias="rawPayload", default=None)


class TelemetryResponse(ApiSchema):
    id: str
    vehicle_id: str = Field(alias="vehicleId")
    timestamp: datetime
    lat: float | None = None
    lng: float | None = None
    speed_kmh: float | None = Field(alias="speedKmh", default=None)
    load_state: str | None = Field(alias="loadState", default=None)
    engine_temp_c: float | None = Field(alias="engineTempC", default=None)
    oil_pressure_bar: float | None = Field(alias="oilPressureBar", default=None)
    vibration_level: float | None = Field(alias="vibrationLevel", default=None)
    fuel_rate_lph: float | None = Field(alias="fuelRateLph", default=None)
    health_score: float | None = Field(alias="healthScore", default=None)
    risk_level: str | None = Field(alias="riskLevel", default=None)
    recommendations: list[str] = []
    model_type: str = Field(alias="modelType", default="rule_based_v0")


class PredictionRequest(ApiSchema):
    vehicle_id: str = Field(alias="vehicleId")
    route_path: list[str] | None = Field(alias="routePath", default=None)
    distance_m: int | None = Field(alias="distanceM", default=None)
    load_state: str = Field(alias="loadState", default="Empty")
    payload_ton: float | None = Field(alias="payloadTon", default=None)
    road_condition: str = Field(alias="roadCondition", default="normal")
    slope_level: str = Field(alias="slopeLevel", default="low")
    traffic_level: str = Field(alias="trafficLevel", default="normal")


class PredictionResponse(ApiSchema):
    vehicle_id: str = Field(alias="vehicleId")
    prediction_type: str = Field(alias="predictionType")
    model_type: str = Field(alias="modelType", default="rule_based_v0")
    eta_seconds: int | None = Field(alias="etaSeconds", default=None)
    fuel_estimate_liter: float | None = Field(alias="fuelEstimateLiter", default=None)
    health_score: float | None = Field(alias="healthScore", default=None)
    risk_level: str | None = Field(alias="riskLevel", default=None)
    reason: str


class RecommendationResponse(ApiSchema):
    id: str
    asset_id: str | None = Field(alias="assetId", default=None)
    asset_code: str | None = Field(alias="assetCode", default=None)
    recommendation_type: str = Field(alias="recommendationType")
    priority: str
    title: str
    message: str
    recommended_action: str = Field(alias="recommendedAction")
    status: str
    created_at: datetime = Field(alias="createdAt")


class DashboardSummary(ApiSchema):
    total_assets: int = Field(alias="totalAssets")
    active_assets: int = Field(alias="activeAssets")
    idle_assets: int = Field(alias="idleAssets")
    maintenance_assets: int = Field(alias="maintenanceAssets")
    average_health_score: float = Field(alias="averageHealthScore")
    open_recommendations: int = Field(alias="openRecommendations")
    high_priority_recommendations: int = Field(alias="highPriorityRecommendations")
    latest_telemetry_count: int = Field(alias="latestTelemetryCount")
    model_type: str = Field(alias="modelType", default="rule_based_v0")
