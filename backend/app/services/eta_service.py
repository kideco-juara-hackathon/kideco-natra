def estimate_edge_eta_seconds(distance_m: float, speed_limit_kmh: float, load_state: str) -> int:
    load_factor = 0.82 if load_state.lower() == "full" else 1.0
    effective_speed_kmh = max(speed_limit_kmh * load_factor, 5)
    speed_mps = effective_speed_kmh * 1000 / 3600
    return round(distance_m / speed_mps)
