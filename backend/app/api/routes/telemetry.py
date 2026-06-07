from fastapi import APIRouter

from app.repositories.in_memory_store import telemetry_store
from app.schemas.telemetry import TelemetryEvent

router = APIRouter()


@router.post("/telemetry")
def receive_telemetry(event: TelemetryEvent):
    telemetry_store[event.vehicleId] = event.model_dump()
    return {"status": "accepted", "vehicleId": event.vehicleId}


@router.get("/telemetry/latest")
def get_latest_telemetry():
    return telemetry_store
