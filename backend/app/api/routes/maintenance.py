from fastapi import APIRouter

from app.repositories.seed_loader import load_seed
from app.services.health_service import score_vehicle_health

router = APIRouter()


@router.get("/maintenance/health")
def get_vehicle_health():
    vehicles = load_seed("vehicles.json")
    return [score_vehicle_health(vehicle) for vehicle in vehicles]
