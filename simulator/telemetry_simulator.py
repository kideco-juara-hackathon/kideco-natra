import argparse
import json
import random
import time
from datetime import datetime, timezone
from pathlib import Path

import requests


DEFAULT_URL = "http://localhost:8000/api/telemetry"
BASE_COORDINATES = {
    "DT-01": (-1.8912, 115.8720),
    "DT-02": (-1.8875, 115.8805),
    "DT-03": (-1.9050, 115.8585),
}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--scenario", default="normal")
    parser.add_argument("--url", default=DEFAULT_URL)
    parser.add_argument("--once", action="store_true")
    args = parser.parse_args()

    scenario = load_scenario(args.scenario)

    while True:
        for vehicle in scenario["vehicles"]:
            event = build_event(vehicle)
            response = requests.post(args.url, json=event, timeout=10)
            response.raise_for_status()
            print(event)

        if args.once:
            break

        time.sleep(scenario.get("intervalSeconds", 3))


def load_scenario(name: str) -> dict:
    path = Path(__file__).parent / "scenarios" / f"{name}.json"
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def build_event(vehicle: dict) -> dict:
    lat, lng = BASE_COORDINATES.get(vehicle["vehicleId"], (-1.8912, 115.8720))
    return {
        "vehicleId": vehicle["vehicleId"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "lat": jitter(lat),
        "lng": jitter(lng),
        "speedKmh": random_between(vehicle["speedRangeKmh"]),
        "loadState": "Full",
        "engineTempC": random_between(vehicle["engineTempRangeC"]),
        "oilPressureBar": random_between(vehicle["oilPressureRangeBar"]),
        "vibrationLevel": random_between(vehicle["vibrationRange"]),
        "fuelRateLph": random_between(vehicle["fuelRateRangeLph"]),
    }


def random_between(value_range: list[float]) -> float:
    return round(random.uniform(value_range[0], value_range[1]), 2)


def jitter(value: float) -> float:
    return round(value + random.uniform(-0.001, 0.001), 6)


if __name__ == "__main__":
    main()
