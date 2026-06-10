from __future__ import annotations

import math

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Asset, Waypoint
from app.schemas import LoadPlanResponse, LoadStop
from app.services.route_engine import create_route_plan


def create_load_plan(
    db: Session,
    asset: Asset,
    origin_code: str,
    candidate_pit_codes: list[str],
    destination_code: str,
    target_payload_ton: float | None,
) -> LoadPlanResponse:
    target = target_payload_ton or asset.capacity_ton or 0.0
    pits = db.scalars(
        select(Waypoint).where(Waypoint.waypoint_code.in_(candidate_pit_codes), Waypoint.deleted_at.is_(None))
    ).all()
    sorted_pits = sorted(pits, key=lambda pit: pit.stockpile_ton, reverse=True)

    remaining = target
    stops: list[LoadStop] = []
    for pit in sorted_pits:
        if remaining <= 0:
            break
        pickup = min(remaining, pit.stockpile_ton)
        if pickup > 0:
            stops.append(LoadStop(nodeId=pit.waypoint_code, pickupTon=round(pickup, 2)))
            remaining -= pickup

    planned_payload = round(target - max(remaining, 0), 2)
    estimated_vehicle_count = max(1, math.ceil(target / max(asset.capacity_ton or target or 1, 1)))
    route_origin = stops[0].node_id if stops else origin_code
    route_plan = create_route_plan(
        db=db,
        asset=asset,
        origin_code=route_origin,
        destination_code=destination_code,
        load_state="Full" if planned_payload > 0 else "Empty",
        payload_ton=planned_payload,
    )
    reason = (
        f"Muatan direncanakan {planned_payload} ton dari {len(stops)} pit. "
        f"Target {target} ton dapat dipenuhi dengan estimasi {estimated_vehicle_count} unit."
    )
    return LoadPlanResponse(
        vehicleId=asset.asset_code,
        targetPayloadTon=target,
        plannedPayloadTon=planned_payload,
        estimatedVehicleCount=estimated_vehicle_count,
        stops=stops,
        routePlan=route_plan,
        reason=reason,
    )
