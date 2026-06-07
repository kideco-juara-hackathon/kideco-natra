def score_vehicle_health(vehicle: dict) -> dict:
    score = vehicle.get("healthScore", 70)
    if score >= 80:
        status = "safe"
    elif score >= 60:
        status = "monitor"
    elif score >= 40:
        status = "medium_risk"
    else:
        status = "high_risk"

    return {
        "vehicleId": vehicle["id"],
        "vehicleName": vehicle["name"],
        "healthScore": score,
        "status": status,
    }
