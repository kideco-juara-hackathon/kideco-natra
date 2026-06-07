from fastapi import APIRouter

from app.repositories.seed_loader import load_seed

router = APIRouter()


@router.get("/vehicles")
def get_vehicles():
    return load_seed("vehicles.json")
