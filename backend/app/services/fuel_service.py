def estimate_fuel_liter(distance_m: float, load_state: str, slope_level: str) -> float:
    base_liter_per_km = 0.75
    load_factor = 1.25 if load_state.lower() == "full" else 1.0
    slope_factor = {"low": 1.0, "medium": 1.15, "high": 1.35}.get(slope_level, 1.1)
    return round((distance_m / 1000) * base_liter_per_km * load_factor * slope_factor, 2)
