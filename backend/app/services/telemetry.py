from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.models import Asset, PredictionResult, Recommendation, TelemetryRecord
from app.schemas import TelemetryEvent, TelemetryResponse
from app.services.prediction import assess_health


def ingest_telemetry(db: Session, asset: Asset, payload: TelemetryEvent) -> TelemetryResponse:
    recorded_at = payload.timestamp or datetime.now(UTC)
    if recorded_at.tzinfo is None:
        recorded_at = recorded_at.replace(tzinfo=UTC)
    record = TelemetryRecord(
        site_id=asset.site_id,
        asset_id=asset.id,
        recorded_at=recorded_at,
        latitude=payload.lat,
        longitude=payload.lng,
        speed=payload.speed_kmh,
        fuel_level_percent=payload.fuel_level_percent,
        fuel_flow_rate=payload.fuel_rate_lph,
        engine_hour=asset.engine_hour,
        rpm=payload.rpm,
        engine_temp_c=payload.engine_temp_c,
        oil_pressure_bar=payload.oil_pressure_bar,
        vibration_g=payload.vibration_level,
        load_ton=payload.load_ton,
        load_state=payload.load_state,
        data_source="dummy_simulator",
        raw_payload=payload.raw_payload,
    )
    db.add(record)
    db.flush()

    # --- Engine hour accumulation ---
    # Find the previous telemetry record for this asset to compute elapsed time.
    prev_record = db.scalar(
        select(TelemetryRecord)
        .where(
            TelemetryRecord.asset_id == asset.id,
            TelemetryRecord.id != record.id,
        )
        .order_by(desc(TelemetryRecord.recorded_at))
        .limit(1)
    )
    if prev_record is not None and prev_record.recorded_at is not None:
        elapsed_s = (recorded_at - prev_record.recorded_at).total_seconds()
        # Cap at 5 minutes to ignore stale gaps from simulator restarts
        elapsed_s = max(0.0, min(elapsed_s, 300.0))
        settings = get_settings()
        asset.engine_hour = (asset.engine_hour or 0.0) + elapsed_s * settings.wear_multiplier / 3600.0
        # Update the just-flushed record to reflect the new accumulated value
        record.engine_hour = asset.engine_hour

    if payload.lat is not None:
        asset.last_latitude = payload.lat
    if payload.lng is not None:
        asset.last_longitude = payload.lng
    if payload.engine_temp_c or payload.oil_pressure_bar or payload.vibration_level:
        health_score, risk_level, components, action = assess_health(asset, record)
        asset.health_score = health_score
    else:
        health_score, risk_level, components, action = asset.health_score, "low", [], "Telemetry tersimpan."

    recommendations: list[str] = []
    if risk_level in {"medium", "high", "critical"}:
        prediction = PredictionResult(
            site_id=asset.site_id,
            asset_id=asset.id,
            prediction_type="health",
            model_type="rule_based_v0",
            health_score=health_score,
            risk_category=risk_level,
            reason=action,
            input_snapshot=payload.model_dump(by_alias=True),
            output_payload={"componentsAtRisk": components, "recommendedAction": action},
        )
        db.add(prediction)
        db.flush()
        recommendation = Recommendation(
            site_id=asset.site_id,
            asset_id=asset.id,
            prediction_result_id=prediction.id,
            recommendation_type="maintenance",
            priority="critical" if risk_level == "critical" else "high" if risk_level == "high" else "medium",
            title="Alert kesehatan unit",
            message=f"{asset.asset_code} masuk risiko {risk_level}. Komponen: {', '.join(components) or 'general'}",
            recommended_action=action,
            status="open",
        )
        db.add(recommendation)
        recommendations.append(recommendation.message)

    db.commit()
    db.refresh(record)
    return TelemetryResponse(
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
        healthScore=health_score,
        riskLevel=risk_level,
        recommendations=recommendations,
    )
