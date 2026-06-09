ROAD_MULTIPLIER = {
    "good": 0.95,
    "normal": 1.0,
    "muddy": 1.18,
    "rough": 1.25,
    "restricted": 1.45,
}

SLOPE_MULTIPLIER = {
    "low": 1.0,
    "medium": 1.12,
    "high": 1.25,
}

TRAFFIC_MULTIPLIER = {
    "low": 0.95,
    "normal": 1.0,
    "busy": 1.18,
    "blocked": 1.7,
}

RISK_PENALTY = {
    "low": 0,
    "medium": 12,
    "high": 28,
    "critical": 45,
}


def normalize_risk(score: float) -> str:
    if score >= 80:
        return "low"
    if score >= 62:
        return "medium"
    if score >= 42:
        return "high"
    return "critical"


def clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(upper, value))
