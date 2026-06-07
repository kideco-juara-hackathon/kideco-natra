from fastapi import APIRouter

from app.schemas.route import RoutePlanRequest
from app.services.route_engine import build_route_recommendation

router = APIRouter()


@router.post("/route-plans")
def create_route_plan(payload: RoutePlanRequest):
    return build_route_recommendation(payload)
