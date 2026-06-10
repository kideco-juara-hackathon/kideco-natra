"""initial MVP schema

Revision ID: 20260607_0001
Revises:
Create Date: 2026-06-07
"""
from alembic import op
import sqlalchemy as sa


revision = "20260607_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "sites",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("site_code", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("site_type", sa.String(length=64), nullable=False),
        sa.Column("timezone", sa.String(length=64), nullable=False),
        sa.Column("coordinate_system", sa.String(length=64), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("site_code"),
    )
    op.create_index("ix_sites_site_code", "sites", ["site_code"])

    op.create_table(
        "users",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("site_id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("email", sa.String(length=160), nullable=False),
        sa.Column("role", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["site_id"], ["sites.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "data_import_logs",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("site_id", sa.String(length=36), nullable=False),
        sa.Column("imported_by_user_id", sa.String(length=36), nullable=True),
        sa.Column("source_type", sa.String(length=64), nullable=False),
        sa.Column("source_file", sa.String(length=255), nullable=True),
        sa.Column("source_checksum", sa.String(length=128), nullable=True),
        sa.Column("target_entity", sa.String(length=80), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("row_count", sa.Integer(), nullable=False),
        sa.Column("inserted_count", sa.Integer(), nullable=False),
        sa.Column("updated_count", sa.Integer(), nullable=False),
        sa.Column("skipped_count", sa.Integer(), nullable=False),
        sa.Column("error_count", sa.Integer(), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("raw_payload", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["imported_by_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["site_id"], ["sites.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "shifts",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("site_id", sa.String(length=36), nullable=False),
        sa.Column("shift_code", sa.String(length=32), nullable=False),
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=False),
        sa.Column("valid_from", sa.DateTime(timezone=True), nullable=True),
        sa.Column("valid_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["site_id"], ["sites.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "waypoints",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("site_id", sa.String(length=36), nullable=False),
        sa.Column("import_log_id", sa.String(length=36), nullable=True),
        sa.Column("waypoint_code", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("domain", sa.String(length=32), nullable=False),
        sa.Column("waypoint_type", sa.String(length=64), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("x_coordinate", sa.Float(), nullable=True),
        sa.Column("y_coordinate", sa.Float(), nullable=True),
        sa.Column("coordinate_system", sa.String(length=64), nullable=False),
        sa.Column("stockpile_ton", sa.Float(), nullable=False),
        sa.Column("raw_payload", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["import_log_id"], ["data_import_logs.id"]),
        sa.ForeignKeyConstraint(["site_id"], ["sites.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_waypoints_site_domain", "waypoints", ["site_id", "domain"])
    op.create_index("ix_waypoints_waypoint_code", "waypoints", ["waypoint_code"])

    op.create_table(
        "assets",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("site_id", sa.String(length=36), nullable=False),
        sa.Column("import_log_id", sa.String(length=36), nullable=True),
        sa.Column("asset_code", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("domain", sa.String(length=32), nullable=False),
        sa.Column("asset_type", sa.String(length=64), nullable=False),
        sa.Column("capacity_ton", sa.Float(), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("health_score", sa.Float(), nullable=False),
        sa.Column("current_waypoint_id", sa.String(length=36), nullable=True),
        sa.Column("last_latitude", sa.Float(), nullable=True),
        sa.Column("last_longitude", sa.Float(), nullable=True),
        sa.Column("last_x_coordinate", sa.Float(), nullable=True),
        sa.Column("last_y_coordinate", sa.Float(), nullable=True),
        sa.Column("coordinate_system", sa.String(length=64), nullable=False),
        sa.Column("base_fuel_l_per_km", sa.Float(), nullable=False),
        sa.Column("engine_hour", sa.Float(), nullable=False),
        sa.Column("last_service_engine_hour", sa.Float(), nullable=False),
        sa.Column("raw_payload", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["current_waypoint_id"], ["waypoints.id"]),
        sa.ForeignKeyConstraint(["import_log_id"], ["data_import_logs.id"]),
        sa.ForeignKeyConstraint(["site_id"], ["sites.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_assets_asset_code", "assets", ["asset_code"])
    op.create_index("ix_assets_site_code", "assets", ["site_id", "asset_code"])

    op.create_table(
        "routes",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("site_id", sa.String(length=36), nullable=False),
        sa.Column("import_log_id", sa.String(length=36), nullable=True),
        sa.Column("domain", sa.String(length=32), nullable=False),
        sa.Column("route_code", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("version_no", sa.Integer(), nullable=False),
        sa.Column("origin_waypoint_id", sa.String(length=36), nullable=False),
        sa.Column("destination_waypoint_id", sa.String(length=36), nullable=False),
        sa.Column("distance_km", sa.Float(), nullable=True),
        sa.Column("distance_nm", sa.Float(), nullable=True),
        sa.Column("road_description", sa.String(length=255), nullable=True),
        sa.Column("default_eta_minutes", sa.Float(), nullable=True),
        sa.Column("default_fuel_liter", sa.Float(), nullable=True),
        sa.Column("valid_from", sa.DateTime(timezone=True), nullable=True),
        sa.Column("valid_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_current", sa.Boolean(), nullable=False),
        sa.Column("operational_status", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["destination_waypoint_id"], ["waypoints.id"]),
        sa.ForeignKeyConstraint(["import_log_id"], ["data_import_logs.id"]),
        sa.ForeignKeyConstraint(["origin_waypoint_id"], ["waypoints.id"]),
        sa.ForeignKeyConstraint(["site_id"], ["sites.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_routes_route_code", "routes", ["route_code"])
    op.create_index("ix_routes_site_domain_current", "routes", ["site_id", "domain", "is_current"])

    op.create_table(
        "route_segments",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("route_id", sa.String(length=36), nullable=False),
        sa.Column("sequence_no", sa.Integer(), nullable=False),
        sa.Column("version_no", sa.Integer(), nullable=False),
        sa.Column("start_waypoint_id", sa.String(length=36), nullable=False),
        sa.Column("end_waypoint_id", sa.String(length=36), nullable=False),
        sa.Column("distance_km", sa.Float(), nullable=True),
        sa.Column("distance_nm", sa.Float(), nullable=True),
        sa.Column("speed_limit_kmh", sa.Float(), nullable=False),
        sa.Column("slope_distance", sa.Float(), nullable=True),
        sa.Column("slope_grade_pct", sa.Float(), nullable=False),
        sa.Column("slope_level", sa.String(length=32), nullable=False),
        sa.Column("road_condition", sa.String(length=32), nullable=False),
        sa.Column("traffic_level", sa.String(length=32), nullable=False),
        sa.Column("risk_level", sa.String(length=32), nullable=False),
        sa.Column("valid_from", sa.DateTime(timezone=True), nullable=True),
        sa.Column("valid_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_current", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["end_waypoint_id"], ["waypoints.id"]),
        sa.ForeignKeyConstraint(["route_id"], ["routes.id"]),
        sa.ForeignKeyConstraint(["start_waypoint_id"], ["waypoints.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_route_segments_route_sequence", "route_segments", ["route_id", "sequence_no"])

    op.create_table(
        "trips",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("site_id", sa.String(length=36), nullable=False),
        sa.Column("import_log_id", sa.String(length=36), nullable=True),
        sa.Column("domain", sa.String(length=32), nullable=False),
        sa.Column("asset_id", sa.String(length=36), nullable=False),
        sa.Column("loader_asset_id", sa.String(length=36), nullable=True),
        sa.Column("route_id", sa.String(length=36), nullable=True),
        sa.Column("origin_waypoint_id", sa.String(length=36), nullable=True),
        sa.Column("destination_waypoint_id", sa.String(length=36), nullable=True),
        sa.Column("shift_id", sa.String(length=36), nullable=True),
        sa.Column("operation_date", sa.Date(), nullable=True),
        sa.Column("shift", sa.String(length=32), nullable=True),
        sa.Column("operation_hour", sa.Integer(), nullable=True),
        sa.Column("hour_sequence", sa.Integer(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("actual_duration_minutes", sa.Float(), nullable=True),
        sa.Column("average_speed", sa.Float(), nullable=True),
        sa.Column("load_ton", sa.Float(), nullable=True),
        sa.Column("load_state", sa.String(length=32), nullable=False),
        sa.Column("disposal_sink_waypoint_id", sa.String(length=36), nullable=True),
        sa.Column("actual_fuel_liter", sa.Float(), nullable=True),
        sa.Column("data_source", sa.String(length=64), nullable=False),
        sa.Column("deduplication_key", sa.String(length=255), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("requested_by_user_id", sa.String(length=36), nullable=True),
        sa.Column("raw_payload", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["asset_id"], ["assets.id"]),
        sa.ForeignKeyConstraint(["destination_waypoint_id"], ["waypoints.id"]),
        sa.ForeignKeyConstraint(["disposal_sink_waypoint_id"], ["waypoints.id"]),
        sa.ForeignKeyConstraint(["import_log_id"], ["data_import_logs.id"]),
        sa.ForeignKeyConstraint(["loader_asset_id"], ["assets.id"]),
        sa.ForeignKeyConstraint(["origin_waypoint_id"], ["waypoints.id"]),
        sa.ForeignKeyConstraint(["requested_by_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["route_id"], ["routes.id"]),
        sa.ForeignKeyConstraint(["shift_id"], ["shifts.id"]),
        sa.ForeignKeyConstraint(["site_id"], ["sites.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_trips_site_asset_started", "trips", ["site_id", "asset_id", "started_at"])

    op.create_table(
        "telemetry_records",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("site_id", sa.String(length=36), nullable=False),
        sa.Column("import_log_id", sa.String(length=36), nullable=True),
        sa.Column("asset_id", sa.String(length=36), nullable=False),
        sa.Column("trip_id", sa.String(length=36), nullable=True),
        sa.Column("recorded_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("x_coordinate", sa.Float(), nullable=True),
        sa.Column("y_coordinate", sa.Float(), nullable=True),
        sa.Column("speed", sa.Float(), nullable=True),
        sa.Column("average_speed", sa.Float(), nullable=True),
        sa.Column("fuel_level_percent", sa.Float(), nullable=True),
        sa.Column("fuel_flow_rate", sa.Float(), nullable=True),
        sa.Column("engine_hour", sa.Float(), nullable=True),
        sa.Column("rpm", sa.Float(), nullable=True),
        sa.Column("engine_temp_c", sa.Float(), nullable=True),
        sa.Column("oil_pressure_bar", sa.Float(), nullable=True),
        sa.Column("vibration_g", sa.Float(), nullable=True),
        sa.Column("brake_temp_c", sa.Float(), nullable=True),
        sa.Column("coolant_temp_c", sa.Float(), nullable=True),
        sa.Column("load_ton", sa.Float(), nullable=True),
        sa.Column("load_state", sa.String(length=32), nullable=True),
        sa.Column("data_source", sa.String(length=64), nullable=False),
        sa.Column("raw_payload", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["asset_id"], ["assets.id"]),
        sa.ForeignKeyConstraint(["import_log_id"], ["data_import_logs.id"]),
        sa.ForeignKeyConstraint(["site_id"], ["sites.id"]),
        sa.ForeignKeyConstraint(["trip_id"], ["trips.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_telemetry_asset_recorded", "telemetry_records", ["asset_id", "recorded_at"])

    op.create_table(
        "environment_conditions",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("site_id", sa.String(length=36), nullable=False),
        sa.Column("domain", sa.String(length=32), nullable=False),
        sa.Column("route_id", sa.String(length=36), nullable=True),
        sa.Column("route_segment_id", sa.String(length=36), nullable=True),
        sa.Column("recorded_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("valid_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("data_source", sa.String(length=64), nullable=False),
        sa.Column("weather_status", sa.String(length=64), nullable=False),
        sa.Column("road_condition", sa.String(length=32), nullable=False),
        sa.Column("traffic_level", sa.String(length=32), nullable=False),
        sa.Column("queue_minutes", sa.Float(), nullable=False),
        sa.Column("wave_height_m", sa.Float(), nullable=True),
        sa.Column("wind_speed_knot", sa.Float(), nullable=True),
        sa.Column("current_speed_knot", sa.Float(), nullable=True),
        sa.Column("visibility_level", sa.String(length=32), nullable=True),
        sa.Column("raw_payload", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["route_id"], ["routes.id"]),
        sa.ForeignKeyConstraint(["route_segment_id"], ["route_segments.id"]),
        sa.ForeignKeyConstraint(["site_id"], ["sites.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "maintenance_records",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("site_id", sa.String(length=36), nullable=False),
        sa.Column("asset_id", sa.String(length=36), nullable=False),
        sa.Column("reported_by_user_id", sa.String(length=36), nullable=True),
        sa.Column("completed_by_user_id", sa.String(length=36), nullable=True),
        sa.Column("maintenance_type", sa.String(length=64), nullable=False),
        sa.Column("component_name", sa.String(length=120), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("engine_hour_at_service", sa.Float(), nullable=True),
        sa.Column("downtime_minutes", sa.Float(), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("raw_payload", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["asset_id"], ["assets.id"]),
        sa.ForeignKeyConstraint(["completed_by_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["reported_by_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["site_id"], ["sites.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "prediction_results",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("site_id", sa.String(length=36), nullable=False),
        sa.Column("asset_id", sa.String(length=36), nullable=True),
        sa.Column("trip_id", sa.String(length=36), nullable=True),
        sa.Column("route_id", sa.String(length=36), nullable=True),
        sa.Column("environment_condition_id", sa.String(length=36), nullable=True),
        sa.Column("requested_by_user_id", sa.String(length=36), nullable=True),
        sa.Column("prediction_type", sa.String(length=64), nullable=False),
        sa.Column("model_type", sa.String(length=64), nullable=False),
        sa.Column("model_version", sa.String(length=64), nullable=False),
        sa.Column("predicted_eta_minutes", sa.Float(), nullable=True),
        sa.Column("predicted_fuel_liter", sa.Float(), nullable=True),
        sa.Column("predicted_cost", sa.Float(), nullable=True),
        sa.Column("health_score", sa.Float(), nullable=True),
        sa.Column("risk_category", sa.String(length=32), nullable=True),
        sa.Column("route_score", sa.Float(), nullable=True),
        sa.Column("confidence_score", sa.Float(), nullable=False),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("input_snapshot", sa.JSON(), nullable=True),
        sa.Column("output_payload", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["asset_id"], ["assets.id"]),
        sa.ForeignKeyConstraint(["environment_condition_id"], ["environment_conditions.id"]),
        sa.ForeignKeyConstraint(["requested_by_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["route_id"], ["routes.id"]),
        sa.ForeignKeyConstraint(["site_id"], ["sites.id"]),
        sa.ForeignKeyConstraint(["trip_id"], ["trips.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_prediction_asset_type_created", "prediction_results", ["asset_id", "prediction_type", "created_at"])

    op.create_table(
        "recommendations",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("site_id", sa.String(length=36), nullable=False),
        sa.Column("asset_id", sa.String(length=36), nullable=True),
        sa.Column("trip_id", sa.String(length=36), nullable=True),
        sa.Column("route_id", sa.String(length=36), nullable=True),
        sa.Column("prediction_result_id", sa.String(length=36), nullable=True),
        sa.Column("created_by_user_id", sa.String(length=36), nullable=True),
        sa.Column("delivered_to_user_id", sa.String(length=36), nullable=True),
        sa.Column("recommendation_type", sa.String(length=64), nullable=False),
        sa.Column("priority", sa.String(length=32), nullable=False),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("recommended_action", sa.Text(), nullable=False),
        sa.Column("delivery_channel", sa.String(length=64), nullable=False),
        sa.Column("delivered_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("acknowledged_by_user_id", sa.String(length=36), nullable=True),
        sa.Column("acknowledged_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("resolved_by_user_id", sa.String(length=36), nullable=True),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["acknowledged_by_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["asset_id"], ["assets.id"]),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["delivered_to_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["prediction_result_id"], ["prediction_results.id"]),
        sa.ForeignKeyConstraint(["resolved_by_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["route_id"], ["routes.id"]),
        sa.ForeignKeyConstraint(["site_id"], ["sites.id"]),
        sa.ForeignKeyConstraint(["trip_id"], ["trips.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_recommendations_asset_status_priority", "recommendations", ["asset_id", "status", "priority"])


def downgrade() -> None:
    op.drop_index("ix_recommendations_asset_status_priority", table_name="recommendations")
    op.drop_table("recommendations")
    op.drop_index("ix_prediction_asset_type_created", table_name="prediction_results")
    op.drop_table("prediction_results")
    op.drop_table("maintenance_records")
    op.drop_table("environment_conditions")
    op.drop_index("ix_telemetry_asset_recorded", table_name="telemetry_records")
    op.drop_table("telemetry_records")
    op.drop_index("ix_trips_site_asset_started", table_name="trips")
    op.drop_table("trips")
    op.drop_index("ix_route_segments_route_sequence", table_name="route_segments")
    op.drop_table("route_segments")
    op.drop_index("ix_routes_site_domain_current", table_name="routes")
    op.drop_index("ix_routes_route_code", table_name="routes")
    op.drop_table("routes")
    op.drop_index("ix_assets_site_code", table_name="assets")
    op.drop_index("ix_assets_asset_code", table_name="assets")
    op.drop_table("assets")
    op.drop_index("ix_waypoints_waypoint_code", table_name="waypoints")
    op.drop_index("ix_waypoints_site_domain", table_name="waypoints")
    op.drop_table("waypoints")
    op.drop_table("shifts")
    op.drop_table("data_import_logs")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
    op.drop_index("ix_sites_site_code", table_name="sites")
    op.drop_table("sites")
