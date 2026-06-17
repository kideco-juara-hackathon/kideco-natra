from __future__ import annotations

from copy import deepcopy
from datetime import UTC, datetime
from math import sqrt
from threading import Lock

from app.schemas import DispatchResponse, OperationStateResponse, ShiftResponse, TruckResponse
from app.services.seed_route_engine import (
    SeedRouteError,
    dispatch_truck as create_seed_dispatch,
    get_dump_point,
    list_seed_nodes,
    list_seed_trucks,
)


class OperationStateError(ValueError):
    pass


SHIFT_TARGET_TON = 2500
DEFAULT_DUMP_POINT_ID = "DUMP-STOCKPILE-01"
DEFAULT_OBJECTIVE = "balanced"
DISPATCH_NODE_ID = "DISPATCH-01"
STOCKPILE_NODE_ID = "STOCKPILE-01"

_lock = Lock()
_shift = {
    "status": "not_started",
    "targetTon": SHIFT_TARGET_TON,
    "dumpPointId": DEFAULT_DUMP_POINT_ID,
    "objective": DEFAULT_OBJECTIVE,
    "hauledTon": 0.0,
    "startedAt": None,
}
_trucks: list[dict] = []
_active_trips: dict[str, DispatchResponse] = {}


def _node_position(node_id: str) -> dict[str, float]:
    node = next((item for item in list_seed_nodes() if item["id"] == node_id), None)
    if not node:
        return {"lat": -1.8907, "lng": 115.8721}
    return {"lat": node["visualLat"], "lng": node["visualLng"]}


def _staging_slots() -> list[dict[str, float]]:
    anchor = _node_position(DISPATCH_NODE_ID)
    return [
        {"lat": anchor["lat"] + 0.006, "lng": anchor["lng"] - 0.0072},
        {"lat": anchor["lat"] + 0.004, "lng": anchor["lng"] + 0.0072},
        {"lat": anchor["lat"] - 0.0056, "lng": anchor["lng"] - 0.0056},
        {"lat": anchor["lat"] - 0.0048, "lng": anchor["lng"] + 0.0064},
        {"lat": anchor["lat"] + 0.0072, "lng": anchor["lng"] + 0.0008},
    ]


def _start_of_shift_trucks() -> list[dict]:
    slots = _staging_slots()
    trucks = []
    for index, truck in enumerate(list_seed_trucks()):
        copy = deepcopy(truck)
        copy["currentNodeId"] = DISPATCH_NODE_ID
        copy["currentPayloadTon"] = 0
        copy["loadState"] = "empty"
        copy["position"] = slots[index % len(slots)]
        copy["status"] = "idle"
        trucks.append(copy)
    return trucks


def _ensure_initialized() -> None:
    global _trucks
    if not _trucks:
        _trucks = _start_of_shift_trucks()


def _shift_response() -> ShiftResponse:
    dump_point = get_dump_point(_shift["dumpPointId"])
    return ShiftResponse(
        status=_shift["status"],
        targetTon=_shift["targetTon"],
        dumpPointId=dump_point["id"],
        dumpPointName=dump_point["name"],
        objective=_shift["objective"],
        hauledTon=_shift["hauledTon"],
        startedAt=_shift["startedAt"],
    )


def _truck_response(truck: dict) -> TruckResponse:
    return TruckResponse(**truck)


def get_operation_state() -> OperationStateResponse:
    with _lock:
        _ensure_initialized()
        return OperationStateResponse(
            shift=_shift_response(),
            trucks=[_truck_response(truck) for truck in _trucks],
            activeTrips=list(_active_trips.values()),
        )


def get_shift() -> ShiftResponse:
    with _lock:
        _ensure_initialized()
        return _shift_response()


def start_shift(target_ton: float, dump_point_id: str, objective: str) -> ShiftResponse:
    with _lock:
        dump_point = get_dump_point(dump_point_id)
        _shift["status"] = "active"
        _shift["targetTon"] = target_ton
        _shift["dumpPointId"] = dump_point["id"]
        _shift["objective"] = objective
        _shift["hauledTon"] = 0.0
        _shift["startedAt"] = datetime.now(UTC).isoformat()
        _active_trips.clear()
        _trucks.clear()
        _trucks.extend(_start_of_shift_trucks())
        return _shift_response()


def list_operation_trucks() -> list[TruckResponse]:
    with _lock:
        _ensure_initialized()
        return [_truck_response(truck) for truck in _trucks]


def list_active_trips() -> list[DispatchResponse]:
    with _lock:
        return list(_active_trips.values())


def dispatch_operation_truck(
    truck_id: str,
    route_option_id: str,
    loading_point_id: str,
    origin_node_id: str | None,
    dump_point_id: str | None,
    selection_mode: str,
) -> DispatchResponse:
    with _lock:
        _ensure_initialized()
        if _shift["status"] != "active":
            raise OperationStateError("Shift has not been started.")

        truck = next((item for item in _trucks if item["id"] == truck_id), None)
        if not truck:
            raise SeedRouteError(f"Truck {truck_id} was not found.")
        if truck["status"] != "idle":
            raise OperationStateError(f"Truck {truck_id} is not idle.")

        assignment = create_seed_dispatch(
            truck_id=truck_id,
            route_option_id=route_option_id,
            loading_point_id=loading_point_id,
            origin_node_id=origin_node_id or truck["currentNodeId"],
            dump_point_id=dump_point_id or _shift["dumpPointId"],
            selection_mode=selection_mode,
        )
        _active_trips[assignment.trip_id] = assignment
        truck["status"] = "active"
        truck["currentPayloadTon"] = assignment.coal_ton
        truck["loadState"] = "loaded"
        return assignment


def _position_along_route(route_nodes: list[str], progress: int) -> dict[str, float]:
    if not route_nodes:
        return _node_position(DISPATCH_NODE_ID)
    if progress <= 0:
        return _node_position(route_nodes[0])
    if progress >= 100:
        return _node_position(route_nodes[-1])

    points = [_node_position(node_id) for node_id in route_nodes]
    lengths = [
        sqrt((points[index + 1]["lat"] - points[index]["lat"]) ** 2 + (points[index + 1]["lng"] - points[index]["lng"]) ** 2)
        for index in range(len(points) - 1)
    ]
    total = sum(lengths)
    if total == 0:
        return points[0]

    target = total * (progress / 100)
    walked = 0.0
    for index, length in enumerate(lengths):
        if walked + length >= target:
            ratio = (target - walked) / length if length else 0
            return {
                "lat": points[index]["lat"] + (points[index + 1]["lat"] - points[index]["lat"]) * ratio,
                "lng": points[index]["lng"] + (points[index + 1]["lng"] - points[index]["lng"]) * ratio,
            }
        walked += length
    return points[-1]


def update_trip_progress(trip_id: str, progress: int) -> DispatchResponse:
    with _lock:
        assignment = _active_trips.get(trip_id)
        if not assignment:
            raise OperationStateError(f"Active trip {trip_id} was not found.")

        progress = max(0, min(100, progress))
        updated = assignment.model_copy(update={"progress": progress})
        truck = next((item for item in _trucks if item["id"] == updated.truck_id), None)
        if truck:
            truck["position"] = _position_along_route(updated.route_nodes, progress)

        if progress < 100:
            _active_trips[trip_id] = updated
            return updated

        _active_trips.pop(trip_id, None)
        if truck:
            destination_node_id = updated.loaded_route.route_nodes[-1] if updated.loaded_route.route_nodes else STOCKPILE_NODE_ID
            truck["currentNodeId"] = destination_node_id
            truck["currentPayloadTon"] = 0
            truck["loadState"] = "empty"
            truck["position"] = _node_position(destination_node_id)
            truck["status"] = "idle"
        _shift["hauledTon"] = float(_shift["hauledTon"]) + updated.coal_ton
        return updated
