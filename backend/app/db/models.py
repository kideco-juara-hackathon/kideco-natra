from __future__ import annotations

import uuid
from datetime import UTC, date, datetime, time

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Index, Integer, String, Text, Time
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.types import JSON


JsonType = JSON().with_variant(JSONB, "postgresql")


def new_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(UTC)


class Base(DeclarativeBase):
    pass


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Site(Base, TimestampMixin):
    __tablename__ = "sites"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    site_code: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(160))
    site_type: Mapped[str] = mapped_column(String(64), default="mining")
    timezone: Mapped[str] = mapped_column(String(64), default="Asia/Singapore")
    coordinate_system: Mapped[str] = mapped_column(String(64), default="WGS84")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    assets: Mapped[list[Asset]] = relationship(back_populates="site")
    waypoints: Mapped[list[Waypoint]] = relationship(back_populates="site")


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    site_id: Mapped[str] = mapped_column(ForeignKey("sites.id"))
    name: Mapped[str] = mapped_column(String(160))
    email: Mapped[str] = mapped_column(String(160), unique=True, index=True)
    role: Mapped[str] = mapped_column(String(64), default="dispatcher")
    status: Mapped[str] = mapped_column(String(32), default="active")


class DataImportLog(Base, TimestampMixin):
    __tablename__ = "data_import_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    site_id: Mapped[str] = mapped_column(ForeignKey("sites.id"))
    imported_by_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    source_type: Mapped[str] = mapped_column(String(64), default="seed")
    source_file: Mapped[str | None] = mapped_column(String(255), nullable=True)
    source_checksum: Mapped[str | None] = mapped_column(String(128), nullable=True)
    target_entity: Mapped[str] = mapped_column(String(80), default="seed_dataset")
    status: Mapped[str] = mapped_column(String(32), default="completed")
    row_count: Mapped[int] = mapped_column(Integer, default=0)
    inserted_count: Mapped[int] = mapped_column(Integer, default=0)
    updated_count: Mapped[int] = mapped_column(Integer, default=0)
    skipped_count: Mapped[int] = mapped_column(Integer, default=0)
    error_count: Mapped[int] = mapped_column(Integer, default=0)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    raw_payload: Mapped[dict | None] = mapped_column(JsonType, nullable=True)


class Shift(Base, TimestampMixin):
    __tablename__ = "shifts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    site_id: Mapped[str] = mapped_column(ForeignKey("sites.id"))
    shift_code: Mapped[str] = mapped_column(String(32))
    name: Mapped[str] = mapped_column(String(80))
    start_time: Mapped[time] = mapped_column(Time)
    end_time: Mapped[time] = mapped_column(Time)
    valid_from: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    valid_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class Asset(Base, TimestampMixin):
    __tablename__ = "assets"
    __table_args__ = (Index("ix_assets_site_code", "site_id", "asset_code"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    site_id: Mapped[str] = mapped_column(ForeignKey("sites.id"))
    import_log_id: Mapped[str | None] = mapped_column(ForeignKey("data_import_logs.id"), nullable=True)
    asset_code: Mapped[str] = mapped_column(String(64), index=True)
    name: Mapped[str] = mapped_column(String(160))
    domain: Mapped[str] = mapped_column(String(32), default="land")
    asset_type: Mapped[str] = mapped_column(String(64), default="hauler")
    capacity_ton: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="idle")
    health_score: Mapped[float] = mapped_column(Float, default=85.0)
    current_waypoint_id: Mapped[str | None] = mapped_column(ForeignKey("waypoints.id"), nullable=True)
    last_latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    last_longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    last_x_coordinate: Mapped[float | None] = mapped_column(Float, nullable=True)
    last_y_coordinate: Mapped[float | None] = mapped_column(Float, nullable=True)
    coordinate_system: Mapped[str] = mapped_column(String(64), default="WGS84")
    base_fuel_l_per_km: Mapped[float] = mapped_column(Float, default=1.35)
    engine_hour: Mapped[float] = mapped_column(Float, default=0.0)
    last_service_engine_hour: Mapped[float] = mapped_column(Float, default=0.0)
    raw_payload: Mapped[dict | None] = mapped_column(JsonType, nullable=True)

    site: Mapped[Site] = relationship(back_populates="assets")
    current_waypoint: Mapped[Waypoint | None] = relationship(foreign_keys=[current_waypoint_id])


class Waypoint(Base, TimestampMixin):
    __tablename__ = "waypoints"
    __table_args__ = (Index("ix_waypoints_site_domain", "site_id", "domain"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    site_id: Mapped[str] = mapped_column(ForeignKey("sites.id"))
    import_log_id: Mapped[str | None] = mapped_column(ForeignKey("data_import_logs.id"), nullable=True)
    waypoint_code: Mapped[str] = mapped_column(String(64), index=True)
    name: Mapped[str] = mapped_column(String(160))
    domain: Mapped[str] = mapped_column(String(32), default="land")
    waypoint_type: Mapped[str] = mapped_column(String(64))
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    x_coordinate: Mapped[float | None] = mapped_column(Float, nullable=True)
    y_coordinate: Mapped[float | None] = mapped_column(Float, nullable=True)
    coordinate_system: Mapped[str] = mapped_column(String(64), default="WGS84")
    stockpile_ton: Mapped[float] = mapped_column(Float, default=0.0)
    raw_payload: Mapped[dict | None] = mapped_column(JsonType, nullable=True)

    site: Mapped[Site] = relationship(back_populates="waypoints")


class Route(Base, TimestampMixin):
    __tablename__ = "routes"
    __table_args__ = (Index("ix_routes_site_domain_current", "site_id", "domain", "is_current"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    site_id: Mapped[str] = mapped_column(ForeignKey("sites.id"))
    import_log_id: Mapped[str | None] = mapped_column(ForeignKey("data_import_logs.id"), nullable=True)
    domain: Mapped[str] = mapped_column(String(32), default="land")
    route_code: Mapped[str] = mapped_column(String(64), index=True)
    name: Mapped[str] = mapped_column(String(160))
    version_no: Mapped[int] = mapped_column(Integer, default=1)
    origin_waypoint_id: Mapped[str] = mapped_column(ForeignKey("waypoints.id"))
    destination_waypoint_id: Mapped[str] = mapped_column(ForeignKey("waypoints.id"))
    distance_km: Mapped[float | None] = mapped_column(Float, nullable=True)
    distance_nm: Mapped[float | None] = mapped_column(Float, nullable=True)
    road_description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    default_eta_minutes: Mapped[float | None] = mapped_column(Float, nullable=True)
    default_fuel_liter: Mapped[float | None] = mapped_column(Float, nullable=True)
    valid_from: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    valid_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_current: Mapped[bool] = mapped_column(Boolean, default=True)
    operational_status: Mapped[str] = mapped_column(String(32), default="available")


class RouteSegment(Base, TimestampMixin):
    __tablename__ = "route_segments"
    __table_args__ = (Index("ix_route_segments_route_sequence", "route_id", "sequence_no"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    route_id: Mapped[str] = mapped_column(ForeignKey("routes.id"))
    sequence_no: Mapped[int] = mapped_column(Integer, default=1)
    version_no: Mapped[int] = mapped_column(Integer, default=1)
    start_waypoint_id: Mapped[str] = mapped_column(ForeignKey("waypoints.id"))
    end_waypoint_id: Mapped[str] = mapped_column(ForeignKey("waypoints.id"))
    distance_km: Mapped[float | None] = mapped_column(Float, nullable=True)
    distance_nm: Mapped[float | None] = mapped_column(Float, nullable=True)
    speed_limit_kmh: Mapped[float] = mapped_column(Float, default=30.0)
    slope_distance: Mapped[float | None] = mapped_column(Float, nullable=True)
    slope_grade_pct: Mapped[float] = mapped_column(Float, default=0.0)
    slope_level: Mapped[str] = mapped_column(String(32), default="low")
    road_condition: Mapped[str] = mapped_column(String(32), default="normal")
    traffic_level: Mapped[str] = mapped_column(String(32), default="normal")
    risk_level: Mapped[str] = mapped_column(String(32), default="low")
    valid_from: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    valid_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_current: Mapped[bool] = mapped_column(Boolean, default=True)


class Trip(Base, TimestampMixin):
    __tablename__ = "trips"
    __table_args__ = (Index("ix_trips_site_asset_started", "site_id", "asset_id", "started_at"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    site_id: Mapped[str] = mapped_column(ForeignKey("sites.id"))
    import_log_id: Mapped[str | None] = mapped_column(ForeignKey("data_import_logs.id"), nullable=True)
    domain: Mapped[str] = mapped_column(String(32), default="land")
    asset_id: Mapped[str] = mapped_column(ForeignKey("assets.id"))
    loader_asset_id: Mapped[str | None] = mapped_column(ForeignKey("assets.id"), nullable=True)
    route_id: Mapped[str | None] = mapped_column(ForeignKey("routes.id"), nullable=True)
    origin_waypoint_id: Mapped[str | None] = mapped_column(ForeignKey("waypoints.id"), nullable=True)
    destination_waypoint_id: Mapped[str | None] = mapped_column(ForeignKey("waypoints.id"), nullable=True)
    shift_id: Mapped[str | None] = mapped_column(ForeignKey("shifts.id"), nullable=True)
    operation_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    shift: Mapped[str | None] = mapped_column(String(32), nullable=True)
    operation_hour: Mapped[int | None] = mapped_column(Integer, nullable=True)
    hour_sequence: Mapped[int | None] = mapped_column(Integer, nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    actual_duration_minutes: Mapped[float | None] = mapped_column(Float, nullable=True)
    average_speed: Mapped[float | None] = mapped_column(Float, nullable=True)
    load_ton: Mapped[float | None] = mapped_column(Float, nullable=True)
    load_state: Mapped[str] = mapped_column(String(32), default="Empty")
    disposal_sink_waypoint_id: Mapped[str | None] = mapped_column(ForeignKey("waypoints.id"), nullable=True)
    actual_fuel_liter: Mapped[float | None] = mapped_column(Float, nullable=True)
    data_source: Mapped[str] = mapped_column(String(64), default="dummy_simulator")
    deduplication_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="planned")
    requested_by_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    raw_payload: Mapped[dict | None] = mapped_column(JsonType, nullable=True)


class TelemetryRecord(Base, TimestampMixin):
    __tablename__ = "telemetry_records"
    __table_args__ = (Index("ix_telemetry_asset_recorded", "asset_id", "recorded_at"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    site_id: Mapped[str] = mapped_column(ForeignKey("sites.id"))
    import_log_id: Mapped[str | None] = mapped_column(ForeignKey("data_import_logs.id"), nullable=True)
    asset_id: Mapped[str] = mapped_column(ForeignKey("assets.id"))
    trip_id: Mapped[str | None] = mapped_column(ForeignKey("trips.id"), nullable=True)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    x_coordinate: Mapped[float | None] = mapped_column(Float, nullable=True)
    y_coordinate: Mapped[float | None] = mapped_column(Float, nullable=True)
    speed: Mapped[float | None] = mapped_column(Float, nullable=True)
    average_speed: Mapped[float | None] = mapped_column(Float, nullable=True)
    fuel_level_percent: Mapped[float | None] = mapped_column(Float, nullable=True)
    fuel_flow_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    engine_hour: Mapped[float | None] = mapped_column(Float, nullable=True)
    rpm: Mapped[float | None] = mapped_column(Float, nullable=True)
    engine_temp_c: Mapped[float | None] = mapped_column(Float, nullable=True)
    oil_pressure_bar: Mapped[float | None] = mapped_column(Float, nullable=True)
    vibration_g: Mapped[float | None] = mapped_column(Float, nullable=True)
    brake_temp_c: Mapped[float | None] = mapped_column(Float, nullable=True)
    coolant_temp_c: Mapped[float | None] = mapped_column(Float, nullable=True)
    lub_oil_temp_c: Mapped[float | None] = mapped_column(Float, nullable=True)
    fuel_pressure_bar: Mapped[float | None] = mapped_column(Float, nullable=True)
    coolant_pressure_bar: Mapped[float | None] = mapped_column(Float, nullable=True)
    load_ton: Mapped[float | None] = mapped_column(Float, nullable=True)
    load_state: Mapped[str | None] = mapped_column(String(32), nullable=True)
    data_source: Mapped[str] = mapped_column(String(64), default="dummy_simulator")
    raw_payload: Mapped[dict | None] = mapped_column(JsonType, nullable=True)


class EnvironmentCondition(Base, TimestampMixin):
    __tablename__ = "environment_conditions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    site_id: Mapped[str] = mapped_column(ForeignKey("sites.id"))
    domain: Mapped[str] = mapped_column(String(32), default="land")
    route_id: Mapped[str | None] = mapped_column(ForeignKey("routes.id"), nullable=True)
    route_segment_id: Mapped[str | None] = mapped_column(ForeignKey("route_segments.id"), nullable=True)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    valid_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    data_source: Mapped[str] = mapped_column(String(64), default="dummy_simulator")
    weather_status: Mapped[str] = mapped_column(String(64), default="clear")
    road_condition: Mapped[str] = mapped_column(String(32), default="normal")
    traffic_level: Mapped[str] = mapped_column(String(32), default="normal")
    queue_minutes: Mapped[float] = mapped_column(Float, default=0.0)
    wave_height_m: Mapped[float | None] = mapped_column(Float, nullable=True)
    wind_speed_knot: Mapped[float | None] = mapped_column(Float, nullable=True)
    current_speed_knot: Mapped[float | None] = mapped_column(Float, nullable=True)
    visibility_level: Mapped[str | None] = mapped_column(String(32), nullable=True)
    raw_payload: Mapped[dict | None] = mapped_column(JsonType, nullable=True)


class MaintenanceRecord(Base, TimestampMixin):
    __tablename__ = "maintenance_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    site_id: Mapped[str] = mapped_column(ForeignKey("sites.id"))
    asset_id: Mapped[str] = mapped_column(ForeignKey("assets.id"))
    reported_by_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    completed_by_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    maintenance_type: Mapped[str] = mapped_column(String(64), default="inspection")
    component_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    engine_hour_at_service: Mapped[float | None] = mapped_column(Float, nullable=True)
    downtime_minutes: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="planned")
    raw_payload: Mapped[dict | None] = mapped_column(JsonType, nullable=True)


class PredictionResult(Base, TimestampMixin):
    __tablename__ = "prediction_results"
    __table_args__ = (Index("ix_prediction_asset_type_created", "asset_id", "prediction_type", "created_at"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    site_id: Mapped[str] = mapped_column(ForeignKey("sites.id"))
    asset_id: Mapped[str | None] = mapped_column(ForeignKey("assets.id"), nullable=True)
    trip_id: Mapped[str | None] = mapped_column(ForeignKey("trips.id"), nullable=True)
    route_id: Mapped[str | None] = mapped_column(ForeignKey("routes.id"), nullable=True)
    environment_condition_id: Mapped[str | None] = mapped_column(ForeignKey("environment_conditions.id"), nullable=True)
    requested_by_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    prediction_type: Mapped[str] = mapped_column(String(64))
    model_type: Mapped[str] = mapped_column(String(64), default="rule_based_v0")
    model_version: Mapped[str] = mapped_column(String(64), default="v0")
    predicted_eta_minutes: Mapped[float | None] = mapped_column(Float, nullable=True)
    predicted_fuel_liter: Mapped[float | None] = mapped_column(Float, nullable=True)
    predicted_cost: Mapped[float | None] = mapped_column(Float, nullable=True)
    health_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    risk_category: Mapped[str | None] = mapped_column(String(32), nullable=True)
    route_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    confidence_score: Mapped[float] = mapped_column(Float, default=0.72)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    input_snapshot: Mapped[dict | None] = mapped_column(JsonType, nullable=True)
    output_payload: Mapped[dict | None] = mapped_column(JsonType, nullable=True)


class Recommendation(Base, TimestampMixin):
    __tablename__ = "recommendations"
    __table_args__ = (Index("ix_recommendations_asset_status_priority", "asset_id", "status", "priority"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    site_id: Mapped[str] = mapped_column(ForeignKey("sites.id"))
    asset_id: Mapped[str | None] = mapped_column(ForeignKey("assets.id"), nullable=True)
    trip_id: Mapped[str | None] = mapped_column(ForeignKey("trips.id"), nullable=True)
    route_id: Mapped[str | None] = mapped_column(ForeignKey("routes.id"), nullable=True)
    prediction_result_id: Mapped[str | None] = mapped_column(ForeignKey("prediction_results.id"), nullable=True)
    created_by_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    delivered_to_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    recommendation_type: Mapped[str] = mapped_column(String(64))
    priority: Mapped[str] = mapped_column(String(32), default="medium")
    title: Mapped[str] = mapped_column(String(160))
    message: Mapped[str] = mapped_column(Text)
    recommended_action: Mapped[str] = mapped_column(Text)
    delivery_channel: Mapped[str] = mapped_column(String(64), default="dashboard")
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    acknowledged_by_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    acknowledged_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="open")
    resolved_by_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
