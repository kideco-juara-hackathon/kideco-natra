from app.schemas.route import RoutePlanRequest
from app.services.route_engine import build_route_recommendation


def test_build_route_recommendation():
    result = build_route_recommendation(
        RoutePlanRequest(
            vehicleId="DT-01",
            originNodeId="DISPATCH-01",
            destinationNodeId="LP-ROTO-S-01",
            loadState="Empty",
        )
    )

    assert result["path"] == ["DISPATCH-01", "CP-ROTO-01", "CP-ROTO-02", "LP-ROTO-S-01"]
    assert result["distanceM"] == 4200
    assert result["etaSeconds"] > 0
