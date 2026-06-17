#!/usr/bin/env python3
"""
NATRA Hauling Telemetry Simulator

Simulates realistic per-truck IoT telemetry for all active trips:
  - Position advances along route nodes (linear interpolation between waypoints)
  - Sensor values (engine temp, oil pressure, vibration, fuel rate, speed)
    are derived from each truck's health score + scenario modifiers
  - Trip progress and telemetry are pushed to the backend every tick

Trips must be dispatched from the web dashboard first.

Usage:
    python telemetry_simulator.py
    python telemetry_simulator.py --speed fast
    python telemetry_simulator.py --scenario degraded --speed real --interval 3
    python telemetry_simulator.py --backend http://localhost:8000
"""

import argparse
import asyncio
import math
import random
import sys
from datetime import datetime, timezone

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

try:
    import httpx
except ImportError:
    print("Missing dependency: pip install httpx")
    sys.exit(1)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def parse_args():
    parser = argparse.ArgumentParser(description="NATRA Telemetry Simulator")
    parser.add_argument(
        "--scenario",
        choices=["normal", "degraded", "breakdown"],
        default="normal",
        help="Simulation scenario (default: normal)",
    )
    parser.add_argument(
        "--interval",
        type=float,
        default=5.0,
        help="Seconds between ticks (default: 5)",
    )
    parser.add_argument(
        "--backend",
        default="http://localhost:8000",
        help="Backend base URL (default: http://localhost:8000)",
    )
    parser.add_argument(
        "--speed",
        choices=["real", "fast"],
        default="real",
        help="Speed mode: 'real' uses ETA duration, 'fast' completes trip in ~90s (default: real)",
    )
    # Which truck ID exhibits degraded/breakdown behavior
    parser.add_argument(
        "--scenario-truck",
        default="DT-03",
        help="Truck ID that exhibits degraded/breakdown behavior (default: DT-03)",
    )
    return parser.parse_args()


# ---------------------------------------------------------------------------
# Sensor value generation
# (mirrors frontend/src/lib/hauling-telemetry.ts formulas)
# ---------------------------------------------------------------------------

def truck_num(truck_id: str) -> int:
    digits = "".join(c for c in truck_id if c.isdigit())
    return int(digits) if digits else 1


def health_risk(score: float) -> str:
    if score < 60:
        return "high"
    if score < 78:
        return "medium"
    return "low"


def generate_telemetry(
    truck_id: str,
    health_score: float,
    load_state: str,   # "Full" or "Empty"
    is_active: bool,
    scenario: str,
    scenario_truck: str,
    tick: int,
) -> dict:
    idn = truck_num(truck_id)
    penalty = max(0.0, 100.0 - health_score)
    loaded = load_state == "Full"

    # Base sensor values
    speed_base = 24 + (idn % 5) * 2
    speed = max(8, round(speed_base + math.sin(tick * 0.7) * 3)) if is_active else 0

    engine_temp = round(74 + penalty * 0.32 + (6 if is_active else 1) + idn * 0.4)
    vibration = round(0.16 + penalty * 0.006 + idn * 0.008, 2)
    oil_pressure = round(max(2.4, 4.4 - penalty * 0.018), 1)
    fuel_rate = round((31 if loaded else 22) + penalty * 0.14 + idn * 0.35, 1)
    rpm = round(1200 + (idn % 3) * 80 + (200 if is_active else -200) + math.sin(tick) * 40)
    fuel_level = max(5.0, 82.0 - tick * 0.4 - idn * 0.2)

    # --- Scenario modifiers ---
    degrading = (scenario in ("degraded", "breakdown")) and truck_id == scenario_truck
    if degrading:
        if scenario == "degraded":
            # Gradual engine temp rise + vibration increase
            engine_temp += round(tick * 2.5)
            vibration = round(vibration + tick * 0.015, 2)
            oil_pressure = round(max(1.8, oil_pressure - tick * 0.05), 1)
            health_score = max(50.0, health_score - tick * 0.8)
        elif scenario == "breakdown":
            if tick < 8:
                # Early: slight rise
                engine_temp += round(tick * 2.5)
                vibration = round(vibration + tick * 0.01, 2)
            else:
                # Critical: sharp degradation
                engine_temp += round(8 * 2.5 + (tick - 8) * 6)
                vibration = round(vibration + 0.08 + (tick - 8) * 0.04, 2)
                oil_pressure = round(max(1.2, oil_pressure - (tick - 4) * 0.08), 1)
                health_score = max(20.0, health_score - (tick - 6) * 5)
                fuel_rate = round(fuel_rate * 1.3, 1)

    recommendations = []
    if engine_temp > 100:
        recommendations.append("ALERT: Engine overheating — reduce speed or stop for inspection")
    if vibration > 0.35:
        recommendations.append("WARNING: High vibration detected — check drive system")
    if oil_pressure < 2.0:
        recommendations.append("CRITICAL: Low oil pressure — stop operation immediately")
    if health_score < 50:
        recommendations.append("CRITICAL: Health score critical — schedule immediate maintenance")

    return {
        "vehicleId": truck_id,
        "speedKmh": float(speed),
        "loadState": load_state,
        "engineTempC": float(engine_temp),
        "oilPressureBar": float(oil_pressure),
        "vibrationLevel": float(vibration),
        "fuelRateLph": float(fuel_rate),
        "fuelLevelPercent": round(fuel_level, 1),
        "rpm": float(rpm),
        "_health_score": round(health_score, 1),  # internal use, stripped before POST
        "_recommendations": recommendations,        # internal use
    }


# ---------------------------------------------------------------------------
# Route graph & position interpolation
# ---------------------------------------------------------------------------

def build_node_map(nodes: list[dict]) -> dict[str, dict]:
    return {n["id"]: n for n in nodes}


def build_edge_map(edges: list[dict]) -> dict[str, dict]:
    return {e["from"]: e for e in edges}  # keyed by fromNodeId


def build_adjacency(edges: list[dict]) -> dict[str, list[dict]]:
    graph: dict[str, list[dict]] = {}
    for e in edges:
        graph.setdefault(e["from"], []).append(e)
    return graph


def interpolate_position(
    from_node: dict, to_node: dict, fraction: float
) -> tuple[float, float]:
    lat = from_node["lat"] + (to_node["lat"] - from_node["lat"]) * fraction
    lng = from_node["lng"] + (to_node["lng"] - from_node["lng"]) * fraction
    return lat, lng


def find_edge(edges: list[dict], from_id: str, to_id: str) -> dict | None:
    for e in edges:
        if e["from"] == from_id and e["to"] == to_id:
            return e
    return None


def build_route_segments(route_nodes: list[str], edges: list[dict]) -> list[dict]:
    """Return list of edges that make up the route in order."""
    segments = []
    for i in range(len(route_nodes) - 1):
        edge = find_edge(edges, route_nodes[i], route_nodes[i + 1])
        if edge:
            segments.append(edge)
        else:
            # fallback: synthetic segment (no real edge in data)
            segments.append({
                "from": route_nodes[i],
                "to": route_nodes[i + 1],
                "distanceM": 300,
                "speedLimitKmh": 20.0,
            })
    return segments


def total_route_distance_m(segments: list[dict]) -> int:
    return sum(s["distanceM"] for s in segments)


# ---------------------------------------------------------------------------
# Per-trip position state
# ---------------------------------------------------------------------------

class TripState:
    def __init__(self, trip_id: str, route_nodes: list[str], edges: list[dict]):
        self.trip_id = trip_id
        self.route_nodes = route_nodes
        self.segments = build_route_segments(route_nodes, edges)
        self.total_dist_m = total_route_distance_m(self.segments) or 1
        self.covered_dist_m = 0.0
        self.seg_index = 0
        self.dist_on_seg_m = 0.0

    @property
    def progress_pct(self) -> int:
        return min(100, round(self.covered_dist_m / self.total_dist_m * 100))

    @property
    def is_complete(self) -> bool:
        return self.seg_index >= len(self.segments)

    def advance(self, step_m: float, node_map: dict) -> tuple[float, float]:
        """Move forward step_m metres along the route. Return current (lat, lng)."""
        remaining = step_m
        while remaining > 0 and not self.is_complete:
            seg = self.segments[self.seg_index]
            seg_len = seg["distanceM"]
            space_left = seg_len - self.dist_on_seg_m
            if remaining >= space_left:
                remaining -= space_left
                self.covered_dist_m += space_left
                self.dist_on_seg_m = 0.0
                self.seg_index += 1
            else:
                self.dist_on_seg_m += remaining
                self.covered_dist_m += remaining
                remaining = 0

        if self.is_complete:
            last_node = node_map.get(self.route_nodes[-1], {})
            return last_node.get("lat", 0.0), last_node.get("lng", 0.0)

        seg = self.segments[self.seg_index]
        from_node = node_map.get(seg["from"], {})
        to_node = node_map.get(seg["to"], {})
        fraction = self.dist_on_seg_m / max(1, seg["distanceM"])
        lat = from_node.get("lat", 0.0) + (to_node.get("lat", 0.0) - from_node.get("lat", 0.0)) * fraction
        lng = from_node.get("lng", 0.0) + (to_node.get("lng", 0.0) - from_node.get("lng", 0.0)) * fraction
        return lat, lng

    def load_state_at_progress(self, trip: dict) -> str:
        """Determine if truck is loaded or empty based on route phase."""
        empty_nodes = set(trip.get("emptyRoute", {}).get("routeNodes", []))
        if self.seg_index < len(self.segments):
            current_from = self.segments[self.seg_index]["from"]
            if current_from in empty_nodes:
                return "Empty"
        return "Full"


# ---------------------------------------------------------------------------
# Main simulation loop
# ---------------------------------------------------------------------------

async def run(args):
    backend = args.backend.rstrip("/")
    scenario = args.scenario
    scenario_truck = args.scenario_truck

    print(f"NATRA Telemetry Simulator")
    print(f"  Backend  : {backend}")
    print(f"  Scenario : {scenario}")
    print(f"  Interval : {args.interval}s")
    print(f"  Speed    : {args.speed}")
    if scenario in ("degraded", "breakdown"):
        print(f"  Target   : {scenario_truck} will exhibit {scenario} behavior")
    print()

    # Fetch topology from backend
    async with httpx.AsyncClient() as client:
        # Check backend health
        try:
            hr = await client.get(f"{backend}/health", timeout=5)
            if hr.status_code != 200:
                print(f"Backend not responding (status {hr.status_code}). Is it running?")
                return
            print(f"Backend online: {hr.json().get('service', 'ok')}")
        except Exception as e:
            print(f"Cannot reach backend at {backend}: {e}")
            print("Run: docker compose up --build   or   uvicorn app.main:app --reload")
            return

        # Load topology (nodes + edges)
        print("Loading topology...")
        nodes_r = await client.get(f"{backend}/api/nodes", timeout=8)
        edges_r = await client.get(f"{backend}/api/edges", timeout=8)
        if nodes_r.status_code != 200 or edges_r.status_code != 200:
            print("Failed to load nodes/edges from backend")
            return

        raw_nodes = nodes_r.json()
        raw_edges = edges_r.json()

        # Normalize edge keys (API returns camelCase)
        edges: list[dict] = []
        for e in raw_edges:
            edges.append({
                "from": e.get("from") or e.get("fromNodeId") or e.get("from_node", ""),
                "to": e.get("to") or e.get("toNodeId", ""),
                "distanceM": e.get("distanceM") or e.get("distanceMeter", 300),
                "speedLimitKmh": e.get("speedLimitKmh") or e.get("avgSpeedKmh", 20.0),
            })
        node_map: dict[str, dict] = {n["id"]: n for n in raw_nodes}

        print(f"  {len(node_map)} nodes, {len(edges)} edges loaded")

        # Per-trip simulation state
        trip_states: dict[str, TripState] = {}
        # Per-truck health scores (adjusted by scenario)
        truck_health: dict[str, float] = {}
        tick = 0

        print("Simulation running (Ctrl+C to stop)...")
        print("-" * 60)

        while True:
            tick += 1
            now = datetime.now(timezone.utc).isoformat()

            # Fetch active trips
            try:
                trips_r = await client.get(f"{backend}/api/trips/active", timeout=8)
                if trips_r.status_code != 200:
                    print(f"[tick {tick}] Cannot fetch active trips: {trips_r.status_code}")
                    await asyncio.sleep(args.interval)
                    continue
                active_trips: list[dict] = trips_r.json()
            except Exception as e:
                print(f"[tick {tick}] Network error: {e}")
                await asyncio.sleep(args.interval)
                continue

            if not active_trips:
                print(f"[tick {tick}] No active trips. Dispatch a truck from the dashboard to begin.")
                await asyncio.sleep(args.interval)
                continue

            print(f"\n[tick {tick}] {len(active_trips)} active trip(s)")

            for trip in active_trips:
                trip_id = trip["tripId"]
                truck_id = trip["truckId"]
                route_nodes: list[str] = trip.get("routeNodes", [])

                if not route_nodes:
                    print(f"  {truck_id}: no routeNodes in trip, skipping")
                    continue

                # Init state for new trips
                if trip_id not in trip_states:
                    ts = TripState(trip_id, route_nodes, edges)
                    # Pre-populate based on current backend progress
                    current_progress = trip.get("progress", 0)
                    if current_progress > 0:
                        pre_advance = (current_progress / 100) * ts.total_dist_m
                        ts.advance(pre_advance, node_map)
                    trip_states[trip_id] = ts
                    print(f"  {truck_id}: initialized (route: {len(route_nodes)} nodes, {ts.total_dist_m}m total)")

                ts = trip_states[trip_id]

                if ts.is_complete:
                    print(f"  {truck_id}: trip complete (100%)")
                    trip_states.pop(trip_id, None)
                    continue

                # Compute per-trip advance distance based on speed mode
                eta_min = trip.get("etaMin", 10)
                if args.speed == "fast":
                    trip_step_m = ts.total_dist_m * args.interval / 90.0
                else:  # real
                    real_duration_s = max(eta_min * 60.0, 1.0)
                    trip_step_m = ts.total_dist_m * args.interval / real_duration_s

                # Advance position
                lat, lng = ts.advance(trip_step_m, node_map)
                progress = ts.progress_pct
                load_state = ts.load_state_at_progress(trip)

                # Health score (adjust by scenario over ticks)
                if truck_id not in truck_health:
                    truck_health[truck_id] = 84.0  # default fallback
                    # Try to pull real health from trucks list
                current_health = truck_health.get(truck_id, 84.0)

                # Generate telemetry
                telem = generate_telemetry(
                    truck_id=truck_id,
                    health_score=current_health,
                    load_state=load_state,
                    is_active=True,
                    scenario=scenario,
                    scenario_truck=scenario_truck,
                    tick=tick,
                )

                # Update stored health (so degradation persists across ticks)
                truck_health[truck_id] = telem.pop("_health_score")
                recommendations = telem.pop("_recommendations")

                # Build POST payload
                telemetry_payload = {
                    **telem,
                    "lat": round(lat, 6),
                    "lng": round(lng, 6),
                    "timestamp": now,
                }

                # POST telemetry
                try:
                    tr = await client.post(
                        f"{backend}/api/telemetry",
                        json=telemetry_payload,
                        timeout=8,
                    )
                    telem_ok = tr.status_code == 200
                except Exception:
                    telem_ok = False

                # PATCH progress
                try:
                    pr = await client.patch(
                        f"{backend}/api/trips/{trip_id}/progress",
                        json={"progress": progress},
                        timeout=8,
                    )
                    progress_ok = pr.status_code == 200
                except Exception:
                    progress_ok = False

                # Console summary
                status_icons = ("✓" if telem_ok else "✗") + ("✓" if progress_ok else "✗")
                health_str = f"{truck_health[truck_id]:.0f}"
                alert_str = f" ⚠ {recommendations[0]}" if recommendations else ""
                print(
                    f"  [{status_icons}] {truck_id:6s} | "
                    f"lat={lat:.5f} lng={lng:.5f} | "
                    f"{progress:3d}% | "
                    f"{load_state:5s} | "
                    f"T={telem.get('engineTempC', '?'):.0f}°C "
                    f"V={telem.get('vibrationLevel', '?'):.2f} "
                    f"HP={health_str}"
                    f"{alert_str}"
                )

                if recommendations and scenario in ("degraded", "breakdown"):
                    # Log extra line for critical alerts
                    for msg in recommendations:
                        print(f"         *** {msg} ***")

            await asyncio.sleep(args.interval)


def main():
    args = parse_args()
    try:
        asyncio.run(run(args))
    except KeyboardInterrupt:
        print("\nSimulator stopped.")


if __name__ == "__main__":
    main()
