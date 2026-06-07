from fastapi import APIRouter

from app.api.routes import maintenance, route_plans, seed_data, telemetry, vehicles

api_router = APIRouter()
api_router.include_router(seed_data.router, tags=["seed-data"])
api_router.include_router(vehicles.router, tags=["vehicles"])
api_router.include_router(route_plans.router, tags=["route-plans"])
api_router.include_router(telemetry.router, tags=["telemetry"])
api_router.include_router(maintenance.router, tags=["maintenance"])
