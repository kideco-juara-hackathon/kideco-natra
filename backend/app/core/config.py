from functools import lru_cache
from os import getenv

from pydantic import BaseModel


class Settings(BaseModel):
    app_name: str
    environment: str
    database_url: str
    backend_cors_origins: str
    fuel_price_per_liter: float
    default_loading_time_seconds: int
    default_eta_threshold_seconds: int

    @property
    def cors_origins(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.backend_cors_origins.split(",")
            if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings(
        app_name=getenv("APP_NAME", "KIDECO Backend"),
        environment=getenv("ENVIRONMENT", "local"),
        database_url=getenv("DATABASE_URL", "sqlite:///./kideco_backend.db"),
        backend_cors_origins=getenv(
            "BACKEND_CORS_ORIGINS",
            "http://localhost:5173,http://localhost:3000",
        ),
        fuel_price_per_liter=float(getenv("FUEL_PRICE_PER_LITER", "15000")),
        default_loading_time_seconds=int(getenv("DEFAULT_LOADING_TIME_SECONDS", "420")),
        default_eta_threshold_seconds=int(getenv("DEFAULT_ETA_THRESHOLD_SECONDS", "600")),
    )
