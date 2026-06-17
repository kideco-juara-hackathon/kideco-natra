from __future__ import annotations

import argparse
import json
import math
import re
from pathlib import Path
from typing import Any

import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = Path(r"C:\Users\NITRO 5\Downloads\Data Road Segmen.xlsx - Front Utara - Fase 7.csv")
SEED_DIR = ROOT / "data" / "seeds"
FRONTEND_GENERATED_DIR = ROOT / "frontend" / "src" / "data" / "generated"

DEMO_HAULERS = ["CO4544", "CO4587", "CO4602", "CO4440", "CO4583"]
LOADING_LOADERS = ["CE6155", "CE5255", "CE6170", "CE5242"]

NODE_SPECS = [
    {
        "id": "DISPATCH-01",
        "code": "DISPATCH-01",
        "name": "Dispatch / Parking Area",
        "type": "dispatch",
        "visualLat": -1.89070,
        "visualLng": 115.87210,
        "sourceWaypointId": "Begin.Travelling.Empty",
    },
    {
        "id": "CP-JOGJA-1400",
        "code": "JOGJA-1400",
        "name": "Jogja STA 1400",
        "type": "checkpoint",
        "visualLat": -1.89550,
        "visualLng": 115.86680,
        "sourceWaypointId": "Jl_Jogja_STA1400",
    },
    {
        "id": "CP-JOGJA-1100",
        "code": "JOGJA-1100",
        "name": "Jogja STA 1100",
        "type": "checkpoint",
        "visualLat": -1.89860,
        "visualLng": 115.86430,
        "sourceWaypointId": "Jl_Jogja_STA1100",
    },
    {
        "id": "CP-JOGJA-1000",
        "code": "JOGJA-1000",
        "name": "Jogja STA 1000",
        "type": "checkpoint",
        "visualLat": -1.90120,
        "visualLng": 115.86120,
        "sourceWaypointId": "Jl_Jogja_STA1000",
    },
    {
        "id": "CP-JOGJA-900",
        "code": "JOGJA-900",
        "name": "Jogja STA 900",
        "type": "checkpoint",
        "visualLat": -1.90380,
        "visualLng": 115.85880,
        "sourceWaypointId": "Jl_Jogja_STA900",
    },
    {
        "id": "CP-JOGJA-800",
        "code": "JOGJA-800",
        "name": "Jogja STA 800",
        "type": "checkpoint",
        "visualLat": -1.90620,
        "visualLng": 115.85630,
        "sourceWaypointId": "Jl_Jogja_STA800",
    },
    {
        "id": "PIT-A",
        "code": "PIT-A",
        "name": "Pit A - CE6155 Front",
        "type": "pit",
        "visualLat": -1.90880,
        "visualLng": 115.85480,
        "sourceWaypointId": "SRC_CE6155",
        "sourceLoaderId": "CE6155",
    },
    {
        "id": "LP-A1",
        "code": "LP-A1",
        "name": "Loading Point A1",
        "type": "loading_point",
        "visualLat": -1.91070,
        "visualLng": 115.85280,
        "sourceWaypointId": "SRC_CE6155",
        "sourceLoaderId": "CE6155",
    },
    {
        "id": "CP-KB4-200",
        "code": "KB4-200",
        "name": "KB4 Front STA 200",
        "type": "checkpoint",
        "visualLat": -1.89900,
        "visualLng": 115.85160,
        "sourceWaypointId": "Akses_Front_Jl_KB4_STA200",
    },
    {
        "id": "CP-KB4-400",
        "code": "KB4-400",
        "name": "KB4 Front STA 400",
        "type": "checkpoint",
        "visualLat": -1.89420,
        "visualLng": 115.84790,
        "sourceWaypointId": "Akses_Front_Jl_KB4_STA_400",
    },
    {
        "id": "PIT-B",
        "code": "PIT-B",
        "name": "Pit B - CE5255 Front",
        "type": "pit",
        "visualLat": -1.88830,
        "visualLng": 115.84420,
        "sourceWaypointId": "SRC_CE5255",
        "sourceLoaderId": "CE5255",
    },
    {
        "id": "LP-B1",
        "code": "LP-B1",
        "name": "Loading Point B1",
        "type": "loading_point",
        "visualLat": -1.88590,
        "visualLng": 115.84140,
        "sourceWaypointId": "SRC_CE5255",
        "sourceLoaderId": "CE5255",
    },
    {
        "id": "CP-KB4-700",
        "code": "KB4-700",
        "name": "KB4 Front STA 700",
        "type": "checkpoint",
        "visualLat": -1.88190,
        "visualLng": 115.84970,
        "sourceWaypointId": "Akses_Front_Jl_KB4_STA700",
    },
    {
        "id": "PIT-C",
        "code": "PIT-C",
        "name": "Pit C - CE6170 Front",
        "type": "pit",
        "visualLat": -1.87860,
        "visualLng": 115.85770,
        "sourceWaypointId": "SRC_CE6170",
        "sourceLoaderId": "CE6170",
    },
    {
        "id": "LP-C1",
        "code": "LP-C1",
        "name": "Loading Point C1",
        "type": "loading_point",
        "visualLat": -1.87550,
        "visualLng": 115.86120,
        "sourceWaypointId": "SRC_CE6170",
        "sourceLoaderId": "CE6170",
    },
    {
        "id": "CP-PELAIHARI-800",
        "code": "PELAIHARI-800",
        "name": "Pelaihari STA 800",
        "type": "checkpoint",
        "visualLat": -1.88380,
        "visualLng": 115.88060,
        "sourceWaypointId": "Jl_Pelaihari_STA800",
    },
    {
        "id": "CP-PELAIHARI-600",
        "code": "PELAIHARI-600",
        "name": "Pelaihari STA 600",
        "type": "checkpoint",
        "visualLat": -1.88070,
        "visualLng": 115.88730,
        "sourceWaypointId": "Jl_Pelaihari_STA600",
    },
    {
        "id": "CP-PELAIHARI-500",
        "code": "PELAIHARI-500",
        "name": "Pelaihari STA 500",
        "type": "checkpoint",
        "visualLat": -1.87820,
        "visualLng": 115.89290,
        "sourceWaypointId": "Jl_Pelaihari_STA500",
    },
    {
        "id": "CP-PELAIHARI-400",
        "code": "PELAIHARI-400",
        "name": "Pelaihari STA 400",
        "type": "checkpoint",
        "visualLat": -1.87520,
        "visualLng": 115.89850,
        "sourceWaypointId": "Jl_Pelaihari_STA400",
    },
    {
        "id": "CP-BARCELONA",
        "code": "BARCELONA",
        "name": "Simpang Barcelona",
        "type": "checkpoint",
        "visualLat": -1.87220,
        "visualLng": 115.90290,
        "sourceWaypointId": "Jl_Simpang_Barcelona",
    },
    {
        "id": "CP-OPK-0",
        "code": "OPK-0",
        "name": "OPK STA 0",
        "type": "checkpoint",
        "visualLat": -1.86930,
        "visualLng": 115.90670,
        "sourceWaypointId": "Jl_OPK_STA0",
    },
    {
        "id": "CP-OPK-100",
        "code": "OPK-100",
        "name": "OPK STA 100",
        "type": "checkpoint",
        "visualLat": -1.86680,
        "visualLng": 115.91030,
        "sourceWaypointId": "Jl_OPK_STA100",
    },
    {
        "id": "CP-DISP-300",
        "code": "DISP-300",
        "name": "Disposal Access STA 300",
        "type": "checkpoint",
        "visualLat": -1.86390,
        "visualLng": 115.91460,
        "sourceWaypointId": "Akses_Disposal_Jl_OPK_STA300",
    },
    {
        "id": "CP-DISP-500",
        "code": "DISP-500",
        "name": "Disposal Access STA 500",
        "type": "checkpoint",
        "visualLat": -1.86160,
        "visualLng": 115.91820,
        "sourceWaypointId": "Akses_Disposal_Jl_OPK_STA500",
    },
    {
        "id": "STOCKPILE-01",
        "code": "STOCKPILE-01",
        "name": "OPD SP20 / Stockpile",
        "type": "dump_point",
        "visualLat": -1.85930,
        "visualLng": 115.92170,
        "sourceWaypointId": "OPD_SP20",
    },
]

EDGE_SPECS = [
    ("E-DISPATCH-JOGJA1400", "DISPATCH-01", "CP-JOGJA-1400", "empty_haul", "low", ["Begin.Travelling.Empty", "Supply_Pelaihari", "Jl_Jogja_STA1400"]),
    ("E-JOGJA1400-JOGJA1100", "CP-JOGJA-1400", "CP-JOGJA-1100", "empty_haul", "low", ["Jl_Jogja_STA1400", "Supply_Pelaihari", "Jl_Simpang_Bayern_Munich", "Jl_Jogja_STA1100"]),
    ("E-JOGJA1100-JOGJA1000", "CP-JOGJA-1100", "CP-JOGJA-1000", "empty_haul", "low", ["Jl_Jogja_STA1100", "Jl_Jogja_STA1000"]),
    ("E-JOGJA1000-JOGJA900", "CP-JOGJA-1000", "CP-JOGJA-900", "empty_haul", "low", ["Jl_Jogja_STA1000", "Jl_Jogja_STA900"]),
    ("E-JOGJA900-JOGJA800", "CP-JOGJA-900", "CP-JOGJA-800", "empty_haul", "low", ["Jl_Jogja_STA900", "Jl_Jogja_STA800"]),
    ("E-JOGJA800-PITA", "CP-JOGJA-800", "PIT-A", "empty_haul", "medium", ["Jl_Jogja_STA800", "Akses_Front_Jl_KB4_STA200", "SRC_CE6155"]),
    ("E-PITA-LPA1", "PIT-A", "LP-A1", "connector", "medium", ["SRC_CE6155", "Begin.Loading"]),
    ("E-JOGJA800-KB4200", "CP-JOGJA-800", "CP-KB4-200", "empty_haul", "low", ["Jl_Jogja_STA800", "Jl_KB4_New_STA0", "Jl_KB4_New_STA100", "Akses_Front_Jl_KB4_STA200"]),
    ("E-KB4200-KB4400", "CP-KB4-200", "CP-KB4-400", "connector", "medium", ["Akses_Front_Jl_KB4_STA200", "Akses_Front_Jl_KB4_STA_400"]),
    ("E-KB4400-PITB", "CP-KB4-400", "PIT-B", "empty_haul", "medium", ["Akses_Front_Jl_KB4_STA_400", "SRC_CE5255"]),
    ("E-PITB-LPB1", "PIT-B", "LP-B1", "connector", "medium", ["SRC_CE5255", "Begin.Loading"]),
    ("E-KB4200-KB4700", "CP-KB4-200", "CP-KB4-700", "empty_haul", "medium", ["Akses_Front_Jl_KB4_STA200", "Akses_Front_Jl_KB4_STA700"]),
    ("E-KB4700-PITC", "CP-KB4-700", "PIT-C", "empty_haul", "medium", ["Akses_Front_Jl_KB4_STA700", "Akses_Front_Jl_Sudan_STA200", "SRC_CE6170"]),
    ("E-PITC-LPC1", "PIT-C", "LP-C1", "connector", "medium", ["SRC_CE6170", "Begin.Loading"]),
    ("E-LPA1-PELAIHARI800", "LP-A1", "CP-PELAIHARI-800", "loaded_haul", "medium", ["Begin.Loading", "Begin.Travelling.Full", "Jl_Jogja_STA1400", "Jl_Pelaihari_STA800"]),
    ("E-LPB1-PELAIHARI800", "LP-B1", "CP-PELAIHARI-800", "loaded_haul", "medium", ["Begin.Loading", "SRC_CE5255", "Jl_Jogja_STA1400", "Jl_Pelaihari_STA800"]),
    ("E-LPC1-PELAIHARI800", "LP-C1", "CP-PELAIHARI-800", "loaded_haul", "medium", ["Begin.Loading", "SRC_CE6170", "Jl_Jogja_STA1400", "Jl_Pelaihari_STA800"]),
    ("E-PELAIHARI800-600", "CP-PELAIHARI-800", "CP-PELAIHARI-600", "loaded_haul", "low", ["Jl_Pelaihari_STA800", "Jl_Pelaihari_STA600"]),
    ("E-PELAIHARI600-500", "CP-PELAIHARI-600", "CP-PELAIHARI-500", "loaded_haul", "low", ["Jl_Pelaihari_STA600", "Jl_Pelaihari_STA500"]),
    ("E-PELAIHARI500-400", "CP-PELAIHARI-500", "CP-PELAIHARI-400", "loaded_haul", "low", ["Jl_Pelaihari_STA500", "Jl_Pelaihari_STA400"]),
    ("E-PELAIHARI400-BARCELONA", "CP-PELAIHARI-400", "CP-BARCELONA", "loaded_haul", "low", ["Jl_Pelaihari_STA400", "Jl_Simpang_Barcelona"]),
    ("E-BARCELONA-OPK0", "CP-BARCELONA", "CP-OPK-0", "loaded_haul", "low", ["Jl_Simpang_Barcelona", "Jl_Pelaihari_STA100", "Jl_OPK_STA0"]),
    ("E-OPK0-OPK100", "CP-OPK-0", "CP-OPK-100", "loaded_haul", "low", ["Jl_OPK_STA0", "Jl_OPK_STA100"]),
    ("E-OPK100-DISP300", "CP-OPK-100", "CP-DISP-300", "loaded_haul", "medium", ["Jl_OPK_STA100", "Akses_Disposal_Jl_OPK_STA100", "Akses_Disposal_Jl_OPK_STA200", "Akses_Disposal_Jl_OPK_STA300"]),
    ("E-DISP300-DISP500", "CP-DISP-300", "CP-DISP-500", "loaded_haul", "medium", ["Akses_Disposal_Jl_OPK_STA300", "Akses_Disposal_Jl_OPK_STA400", "Akses_Disposal_Jl_OPK_STA500"]),
    ("E-DISP500-STOCKPILE", "CP-DISP-500", "STOCKPILE-01", "loaded_haul", "medium", ["Akses_Disposal_Jl_OPK_STA500", "OPD_SP20"]),
]

ROUTE_SCENARIOS = [
    {
        "id": "OPTIMAL-A1",
        "label": "Rekomendasi Optimal",
        "loadingPointId": "LP-A1",
        "reason": "Loader paling stabil, sample historis terbesar, dan rute loaded menuju OPD SP20 paling konsisten.",
        "queuePenalty": 1,
        "riskPenalty": 2,
        "underloadPenalty": 0,
        "emptyRouteNodes": ["DISPATCH-01", "CP-JOGJA-1400", "CP-JOGJA-1100", "CP-JOGJA-1000", "CP-JOGJA-900", "CP-JOGJA-800", "PIT-A", "LP-A1"],
        "loadedRouteNodes": ["LP-A1", "CP-PELAIHARI-800", "CP-PELAIHARI-600", "CP-PELAIHARI-500", "CP-PELAIHARI-400", "CP-BARCELONA", "CP-OPK-0", "CP-OPK-100", "CP-DISP-300", "CP-DISP-500", "STOCKPILE-01"],
    },
    {
        "id": "FUEL-B1",
        "label": "Fuel Saver",
        "loadingPointId": "LP-B1",
        "reason": "Jalur empty lebih pendek dan risiko road segment masih moderat, cocok saat fuel menjadi prioritas.",
        "queuePenalty": 4,
        "riskPenalty": 3,
        "underloadPenalty": 0,
        "emptyRouteNodes": ["DISPATCH-01", "CP-JOGJA-1400", "CP-JOGJA-1100", "CP-JOGJA-1000", "CP-JOGJA-900", "CP-JOGJA-800", "CP-KB4-200", "CP-KB4-400", "PIT-B", "LP-B1"],
        "loadedRouteNodes": ["LP-B1", "CP-PELAIHARI-800", "CP-PELAIHARI-600", "CP-PELAIHARI-500", "CP-PELAIHARI-400", "CP-BARCELONA", "CP-OPK-0", "CP-OPK-100", "CP-DISP-300", "CP-DISP-500", "STOCKPILE-01"],
    },
    {
        "id": "QUEUE-C1",
        "label": "Fastest / Low Queue",
        "loadingPointId": "LP-C1",
        "reason": "Antrean loader paling rendah, tetapi jalur front lebih jauh sehingga score total sedikit turun.",
        "queuePenalty": 0,
        "riskPenalty": 5,
        "underloadPenalty": 2,
        "emptyRouteNodes": ["DISPATCH-01", "CP-JOGJA-1400", "CP-JOGJA-1100", "CP-JOGJA-1000", "CP-JOGJA-900", "CP-JOGJA-800", "CP-KB4-200", "CP-KB4-700", "PIT-C", "LP-C1"],
        "loadedRouteNodes": ["LP-C1", "CP-PELAIHARI-800", "CP-PELAIHARI-600", "CP-PELAIHARI-500", "CP-PELAIHARI-400", "CP-BARCELONA", "CP-OPK-0", "CP-OPK-100", "CP-DISP-300", "CP-DISP-500", "STOCKPILE-01"],
    },
]


def slug(value: str) -> str:
    return re.sub(r"[^A-Z0-9]+", "-", value.upper()).strip("-")


def direct_edge_stats(df: pd.DataFrame, from_waypoint: str, to_waypoint: str) -> dict[str, Any] | None:
    segment = df[(df["StartWaypoint"] == from_waypoint) & (df["EndWaypoint"] == to_waypoint)]
    if segment.empty:
        segment = df[(df["StartWaypoint"] == to_waypoint) & (df["EndWaypoint"] == from_waypoint)]
    if segment.empty:
        return None

    distance = float(segment["SlopeDistance"].dropna().mean())
    speed = float(segment["AverageSpeed"].dropna().mean())
    sample_count = int(len(segment))
    eta_sec = 0 if speed <= 0 or math.isnan(speed) else distance / 1000 / speed * 3600

    return {
        "distanceMeter": round(distance),
        "avgSpeedKmh": round(speed, 1),
        "historicalEtaSec": round(eta_sec),
        "sampleCount": sample_count,
    }


def aggregate_path(df: pd.DataFrame, waypoints: list[str]) -> dict[str, Any]:
    distance = 0
    weighted_speed = 0.0
    eta_sec = 0
    sample_count = 0
    source_edges: list[str] = []

    for start, end in zip(waypoints, waypoints[1:]):
        stats = direct_edge_stats(df, start, end)
        if stats is None:
            continue

        distance += stats["distanceMeter"]
        weighted_speed += stats["avgSpeedKmh"] * stats["distanceMeter"]
        eta_sec += stats["historicalEtaSec"]
        sample_count += stats["sampleCount"]
        source_edges.append(f"{start}->{end}")

    if distance == 0:
        fallback = df[df["StartWaypoint"].isin(waypoints) | df["EndWaypoint"].isin(waypoints)]
        if fallback.empty:
            fallback = df.head(100)
        distance = round(float(fallback["SlopeDistance"].dropna().mean()) * max(1, len(waypoints) - 1))
        avg_speed = round(float(fallback["AverageSpeed"].dropna().mean()), 1)
        eta_sec = round(distance / 1000 / max(avg_speed, 1) * 3600)
        sample_count = int(len(fallback))
        source_edges = [f"fallback:{waypoints[0]}->{waypoints[-1]}"]
    else:
        avg_speed = round(weighted_speed / max(distance, 1), 1)

    return {
        "distanceMeter": int(distance),
        "avgSpeedKmh": avg_speed,
        "historicalEtaSec": int(eta_sec),
        "sampleCount": sample_count,
        "sourceEdges": source_edges,
    }


def edge_kind_to_condition(kind: str, risk_level: str) -> str:
    if risk_level == "high":
        return "rough"
    if risk_level == "medium":
        return "medium"
    if kind == "connector":
        return "medium"
    return "good"


def calculate_route_metrics(edges: list[dict[str, Any]], route_nodes: list[str]) -> dict[str, Any]:
    by_pair = {(edge["fromNodeId"], edge["toNodeId"]): edge for edge in edges}
    total_distance = 0
    total_eta_sec = 0
    total_fuel = 0.0
    source_edge_ids: list[str] = []

    for start, end in zip(route_nodes, route_nodes[1:]):
        edge = by_pair.get((start, end)) or by_pair.get((end, start))
        if edge is None:
            continue
        total_distance += edge["distanceMeter"]
        total_eta_sec += edge["historicalEtaSec"]
        # Rule-based fuel proxy: loaded haul costs more than empty haul.
        fuel_rate = 4.2 if edge["type"] == "loaded_haul" else 2.8 if edge["type"] == "empty_haul" else 3.3
        total_fuel += edge["distanceMeter"] / 1000 * fuel_rate
        source_edge_ids.append(edge["id"])

    return {
        "routeNodes": route_nodes,
        "distanceMeter": round(total_distance),
        "etaMin": max(1, round(total_eta_sec / 60)),
        "fuelLiter": max(1, round(total_fuel)),
        "sourceEdgeIds": source_edge_ids,
    }


def build_data(input_csv: Path) -> dict[str, Any]:
    df = pd.read_csv(input_csv)
    df = df.dropna(subset=["StartWaypoint", "EndWaypoint", "SlopeDistance", "AverageSpeed"])
    df = df[df["AverageSpeed"] > 0]

    nodes = NODE_SPECS
    node_by_id = {node["id"]: node for node in nodes}

    edges = []
    for edge_id, from_node_id, to_node_id, kind, risk_level, source_waypoints in EDGE_SPECS:
        metrics = aggregate_path(df, source_waypoints)
        edges.append(
            {
                "id": edge_id,
                "fromNodeId": from_node_id,
                "toNodeId": to_node_id,
                "type": kind,
                "distanceMeter": metrics["distanceMeter"],
                "avgSpeedKmh": metrics["avgSpeedKmh"],
                "historicalEtaSec": metrics["historicalEtaSec"],
                "etaHistoricalMin": round(metrics["historicalEtaSec"] / 60, 1),
                "sampleCount": metrics["sampleCount"],
                "roadCondition": edge_kind_to_condition(kind, risk_level),
                "riskLevel": risk_level,
                "sourceSegmentId": f"DATASET-{slug(edge_id)}",
                "sourceEdges": metrics["sourceEdges"],
            }
        )

    loader_counts = df["Loader"].value_counts()
    loading_specs = [
        ("LP-A1", "PIT-A", "Pit A - CE6155 Front", "CE6155", 1, 620, 8, "medium"),
        ("LP-B1", "PIT-B", "Pit B - CE5255 Front", "CE5255", 4, 520, 9, "medium"),
        ("LP-C1", "PIT-C", "Pit C - CE6170 Front", "CE6170", 0, 460, 7, "medium"),
        ("LP-D1", "PIT-D", "Pit D - CE5242 Front", "CE5242", 3, 300, 10, "high"),
    ]
    loading_points = []
    for point_id, pit_id, pit_name, loader_id, queue_count, stock_ton, loading_min, risk in loading_specs:
        node = node_by_id.get(point_id)
        if node is None:
            continue
        loading_points.append(
            {
                "id": point_id,
                "nodeId": point_id,
                "name": node["name"],
                "pitId": pit_id,
                "pitName": pit_name,
                "sourceLoaderId": loader_id,
                "sourceWaypointId": node["sourceWaypointId"],
                "availableCoalTon": stock_ton,
                "queueCount": queue_count,
                "estimatedLoadingTimeMin": loading_min,
                "status": "active",
                "riskLevel": risk,
                "datasetRows": int(loader_counts.get(loader_id, 0)),
            }
        )

    route_scenarios = []
    for scenario in ROUTE_SCENARIOS:
        loading_point = next(point for point in loading_points if point["id"] == scenario["loadingPointId"])
        empty_route = calculate_route_metrics(edges, scenario["emptyRouteNodes"])
        loaded_route = calculate_route_metrics(edges, scenario["loadedRouteNodes"])
        eta_min = empty_route["etaMin"] + loading_point["estimatedLoadingTimeMin"] + loaded_route["etaMin"]
        fuel_liter = empty_route["fuelLiter"] + loaded_route["fuelLiter"]
        score = max(
            55,
            100
            - round(eta_min * 0.55)
            - round(fuel_liter * 0.2)
            - scenario["queuePenalty"]
            - scenario["riskPenalty"]
            - scenario["underloadPenalty"],
        )
        route_scenarios.append(
            {
                **scenario,
                "originNodeId": "DISPATCH-01",
                "dumpPointId": "DUMP-STOCKPILE-01",
                "emptyRoute": empty_route,
                "loadedRoute": loaded_route,
                "loadingTimeMin": loading_point["estimatedLoadingTimeMin"],
                "routeNodes": scenario["emptyRouteNodes"] + scenario["loadedRouteNodes"][1:],
                "etaMin": eta_min,
                "fuelLiter": fuel_liter,
                "coalTon": 60,
                "fulfillment": 100,
                "score": score,
                "riskLevel": loading_point["riskLevel"],
            }
        )

    hauler_counts = df["Hauler"].value_counts()
    trucks = []
    health_scores = [91, 87, 84, 76, 72]
    fuel_levels = [82, 76, 68, 64, 58]
    positions = [
        (-1.88780, 115.86920),
        (-1.88930, 115.87580),
        (-1.89200, 115.87040),
        (-1.89170, 115.87410),
        (-1.88880, 115.87220),
    ]
    for index, source_hauler_id in enumerate(DEMO_HAULERS):
        is_idle = index < 2
        trucks.append(
            {
                "id": f"DT-{index + 1:02d}",
                "code": f"DT-{index + 1:02d}",
                "sourceHaulerId": source_hauler_id,
                "capacityTon": 60 if index != 1 else 80,
                "currentPayloadTon": 0 if is_idle else 60,
                "currentNodeId": "DISPATCH-01" if is_idle else route_scenarios[index - 2]["loadingPointId"],
                "fuelLevelPercent": fuel_levels[index],
                "healthScore": health_scores[index],
                "lastSeenAt": "2026-06-15T07:58:00+08:00",
                "loadState": "empty" if is_idle else "loaded",
                "status": "idle" if is_idle else "active",
                "position": {"lat": positions[index][0], "lng": positions[index][1]},
                "datasetRows": int(hauler_counts.get(source_hauler_id, 0)),
            }
        )

    assignments = []
    for index, route in enumerate(route_scenarios):
        truck = trucks[index + 2]
        assignments.append(
            {
                "tripId": f"TRIP-22{index + 1:02d}",
                "truckId": truck["id"],
                "originNodeId": route["originNodeId"],
                "loadingPointId": route["loadingPointId"],
                "dumpPointId": route["dumpPointId"],
                "routeOptionId": route["id"],
                "routeLabel": route["label"],
                "selectionMode": "recommended",
                "emptyRoute": route["emptyRoute"],
                "loadedRoute": route["loadedRoute"],
                "routeNodes": route["routeNodes"],
                "etaMin": route["etaMin"],
                "fuelLiter": route["fuelLiter"],
                "coalTon": truck["currentPayloadTon"],
                "status": "loaded_travel",
                "progress": [72, 38, 54][index],
            }
        )

    dump_points = [
        {
            "id": "DUMP-STOCKPILE-01",
            "nodeId": "STOCKPILE-01",
            "name": "OPD SP20 / Stockpile",
            "type": "stockpile",
            "capacityTon": 2200,
            "currentStockTon": 980,
            "sourceWaypointId": "OPD_SP20",
            "status": "active",
        }
    ]

    metadata = {
        "source": "Data Road Segmen.xlsx - Front Utara - Fase 7.csv",
        "generatedFromRows": int(len(df)),
        "uniqueSourceWaypoints": int(pd.concat([df["StartWaypoint"], df["EndWaypoint"]]).nunique()),
        "uniqueHaulers": int(df["Hauler"].nunique()),
        "selectedHaulers": DEMO_HAULERS,
        "selectedLoaders": LOADING_LOADERS,
        "dominantDisposalSink": "OPD_SP20",
        "note": "MVP seed uses dataset-derived metrics with rebased/simulated visual coordinates around the KIDECO demo map.",
    }

    return {
        "metadata": metadata,
        "nodes": nodes,
        "edges": edges,
        "trucks": trucks,
        "loadingPoints": loading_points,
        "dumpPoints": dump_points,
        "routeScenarios": route_scenarios,
        "initialAssignments": assignments,
    }


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_frontend_ts(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    exports = {
        "haulingSeedMetadata": data["metadata"],
        "dispatchSeedNodes": data["nodes"],
        "dispatchSeedEdges": data["edges"],
        "truckSeeds": data["trucks"],
        "loadingPointSeeds": data["loadingPoints"],
        "dumpPointSeeds": data["dumpPoints"],
        "routeScenarioSeeds": data["routeScenarios"],
        "initialAssignmentSeeds": data["initialAssignments"],
    }
    lines = [
        "// Generated by scripts/build_hauling_seed_data.py.",
        "// Do not edit manually; update the processing script or source CSV instead.",
        "",
    ]
    for name, value in exports.items():
        serialized = json.dumps(value, indent=2, ensure_ascii=False)
        lines.append(f"export const {name} = {serialized} as const;")
        lines.append("")
    path.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Build MVP hauling seed data from road segment CSV.")
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    args = parser.parse_args()

    data = build_data(args.input)

    write_json(SEED_DIR / "nodes.json", {"metadata": data["metadata"], "nodes": data["nodes"]})
    write_json(SEED_DIR / "edges.json", {"metadata": data["metadata"], "edges": data["edges"]})
    write_json(SEED_DIR / "trucks.json", {"metadata": data["metadata"], "trucks": data["trucks"]})
    write_json(
        SEED_DIR / "route_scenarios.json",
        {
            "metadata": data["metadata"],
            "loadingPoints": data["loadingPoints"],
            "dumpPoints": data["dumpPoints"],
            "routeScenarios": data["routeScenarios"],
            "initialAssignments": data["initialAssignments"],
        },
    )
    write_frontend_ts(FRONTEND_GENERATED_DIR / "hauling-seeds.ts", data)

    print(
        "Generated hauling seeds:",
        f"{len(data['nodes'])} nodes,",
        f"{len(data['edges'])} edges,",
        f"{len(data['trucks'])} trucks,",
        f"{len(data['routeScenarios'])} route scenarios.",
    )


if __name__ == "__main__":
    main()
