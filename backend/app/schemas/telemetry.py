from pydantic import BaseModel


class TelemetryEvent(BaseModel):
    vehicleId: str
    timestamp: str
    lat: float
    lng: float
    speedKmh: float
    loadState: str
    engineTempC: float
    oilPressureBar: float
    vibrationLevel: float
    fuelRateLph: float
