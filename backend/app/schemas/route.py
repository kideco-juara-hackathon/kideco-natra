from pydantic import BaseModel


class RoutePlanRequest(BaseModel):
    vehicleId: str
    originNodeId: str
    destinationNodeId: str
    loadState: str = "Empty"
