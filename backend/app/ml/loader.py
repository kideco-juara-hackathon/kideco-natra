"""
ML model loader for KIDECO NATRA Hauling.

All models are loaded lazily on first use and return None on any failure,
allowing callers to fall back to rule-based predictions transparently.

Model file discovery order:
  1. ML_ETA_DIR / ML_FUEL_DIR / ML_MAINTENANCE_DIR environment variables
  2. Sibling repo relative path: ../../../../kideco-ml-*/results/ (local dev)
"""
from __future__ import annotations

import logging
import os
from datetime import datetime

_log = logging.getLogger(__name__)

try:
    import joblib
    import numpy as np
    import pandas as pd
    _ML_AVAILABLE = True
except ImportError:
    _ML_AVAILABLE = False
    _log.warning(
        "ML packages not installed — rule-based fallback active. "
        "Run: pip install joblib scikit-learn xgboost numpy pandas"
    )

# ── Lazy-loaded model state ─────────────────────────────────────────────────

_eta_model = None
_eta_encoder = None
_eta_lookup: dict | None = None

_fuel_model = None
_fuel_encoder = None
_fuel_lookup: dict | None = None

_maint_model = None
_maint_meta: dict | None = None

_eta_loaded = False
_fuel_loaded = False
_maint_loaded = False


def _model_dirs() -> tuple[str, str, str]:
    base = os.path.dirname(__file__)  # .../backend/app/ml/
    parent = os.path.normpath(os.path.join(base, "../../../../"))  # parent of kideco-main/

    eta_dir = os.environ.get("ML_ETA_DIR") or os.path.join(parent, "kideco-ml-eta", "results")
    fuel_dir = os.environ.get("ML_FUEL_DIR") or os.path.join(parent, "kideco-ml-fuel", "results")
    maint_dir = (
        os.environ.get("ML_MAINTENANCE_DIR")
        or os.path.join(parent, "kideco-ml-maintenance", "results")
    )
    return eta_dir, fuel_dir, maint_dir


def _load_eta() -> None:
    global _eta_model, _eta_encoder, _eta_lookup, _eta_loaded
    if _eta_loaded:
        return
    _eta_loaded = True
    if not _ML_AVAILABLE:
        return
    eta_dir, _, _ = _model_dirs()
    try:
        _eta_model = joblib.load(os.path.join(eta_dir, "eta_model.joblib"))
        _eta_encoder = joblib.load(os.path.join(eta_dir, "eta_encoder.joblib"))
        _eta_lookup = joblib.load(os.path.join(eta_dir, "eta_lookup.joblib"))
        _log.info("ETA model loaded from %s", eta_dir)
    except Exception as exc:
        _log.warning("ETA model unavailable (%s): %s", eta_dir, exc)
        _eta_model = _eta_encoder = _eta_lookup = None


def _load_fuel() -> None:
    global _fuel_model, _fuel_encoder, _fuel_lookup, _fuel_loaded
    if _fuel_loaded:
        return
    _fuel_loaded = True
    if not _ML_AVAILABLE:
        return
    _, fuel_dir, _ = _model_dirs()
    try:
        _fuel_model = joblib.load(os.path.join(fuel_dir, "fuel_model.joblib"))
        _fuel_encoder = joblib.load(os.path.join(fuel_dir, "fuel_encoder.joblib"))
        _fuel_lookup = joblib.load(os.path.join(fuel_dir, "fuel_lookup.joblib"))
        _log.info("Fuel model loaded from %s", fuel_dir)
    except Exception as exc:
        _log.warning("Fuel model unavailable (%s): %s", fuel_dir, exc)
        _fuel_model = _fuel_encoder = _fuel_lookup = None


def _load_maint() -> None:
    global _maint_model, _maint_meta, _maint_loaded
    if _maint_loaded:
        return
    _maint_loaded = True
    if not _ML_AVAILABLE:
        return
    _, _, maint_dir = _model_dirs()
    try:
        _maint_model = joblib.load(os.path.join(maint_dir, "maintenance_model.joblib"))
        _maint_meta = joblib.load(os.path.join(maint_dir, "maintenance_meta.joblib"))
        _log.info("Maintenance model loaded from %s", maint_dir)
    except Exception as exc:
        _log.warning("Maintenance model unavailable (%s): %s", maint_dir, exc)
        _maint_model = _maint_meta = None


# ── Feature engineering (mirrors save_model.py exactly) ────────────────────

def _add_maintenance_features(df: "pd.DataFrame") -> "pd.DataFrame":
    d = df.copy()
    d["Power_Index"]                    = d["Engine_RPM"] * d["Fuel_Pressure"]
    d["Thermal_Ratio"]                  = d["Lub_Oil_Temperature"] / d["Coolant_Temperature"]
    d["Pressure_Ratio"]                 = d["Lub_Oil_Pressure"] / (d["Coolant_Pressure"] + 0.001)
    d["Coolant_Pressure_to_Temp_Ratio"] = d["Coolant_Pressure"] / d["Coolant_Temperature"]
    d["Lub_Oil_Pressure_per_RPM"]       = d["Lub_Oil_Pressure"] / (d["Engine_RPM"] + 1)
    d["Coolant_Temp_Diff"]              = d["Coolant_Temperature"] - d["Lub_Oil_Temperature"]
    d["Temp_Diff"]                      = d["Lub_Oil_Temperature"] - d["Coolant_Temperature"]
    d["Coolant_Pressure_per_RPM"]       = d["Coolant_Pressure"] / (d["Engine_RPM"] + 1)
    d["Fuel_Pressure_per_RPM"]          = d["Fuel_Pressure"] / (d["Engine_RPM"] + 1)
    d["Coolant_Temp_to_RPM"]            = d["Coolant_Temperature"] / (d["Engine_RPM"] + 1)
    d["Lub_Oil_Temp_to_RPM"]            = d["Lub_Oil_Temperature"] / (d["Engine_RPM"] + 1)
    d["Expected_Lub_Oil_Pressure"]      = 0.000190 * d["Engine_RPM"] + 3.2121
    d["Lub_Oil_Pressure_Residual"]      = d["Lub_Oil_Pressure"] - d["Expected_Lub_Oil_Pressure"]
    return d


# ── Public prediction API ────────────────────────────────────────────────────

def predict_maintenance(
    rpm: float,
    lub_oil_pressure: float,
    coolant_temp: float,
    fuel_pressure: float,
    coolant_pressure: float,
    lub_oil_temp: float,
) -> float | None:
    """Return health score (1–100) from the ML maintenance model, or None on failure."""
    _load_maint()
    if _maint_model is None or _maint_meta is None or not _ML_AVAILABLE:
        return None
    try:
        row = {
            "Engine_RPM": rpm,
            "Fuel_Pressure": fuel_pressure,
            "Lub_Oil_Pressure": lub_oil_pressure,
            "Coolant_Pressure": coolant_pressure,
            "Coolant_Temperature": coolant_temp,
            "Lub_Oil_Temperature": lub_oil_temp,
        }
        df_fe = _add_maintenance_features(pd.DataFrame([row]))

        cols = _maint_meta["feature_columns"]
        missing = [c for c in cols if c not in df_fe.columns]
        if missing:
            _log.debug("Maintenance model: missing features %s", missing)
            return None

        anomaly_score = float(_maint_model.decision_function(df_fe[cols])[0])
        s_min = _maint_meta["score_min"]
        s_max = _maint_meta["score_max"]
        ml_penalty = 60.0 * (1.0 - (anomaly_score - s_min) / (s_max - s_min + 1e-6))
        ml_penalty = float(np.clip(ml_penalty, 0.0, 60.0))

        # Physics rules — mirrored from save_model.py compute_health_scores
        physical = 0.0
        if coolant_temp > 95:
            physical += 30.0 if rpm < 800 else 10.0
        if coolant_temp > 105:
            physical += 35.0
        expected_oil_p = 0.000190 * rpm + 3.2121
        residual = lub_oil_pressure - expected_oil_p
        if residual < -1.5:
            physical += 35.0
        elif residual < -1.0:
            physical += 20.0
        if lub_oil_pressure < 1.0:
            physical += 35.0
        if abs(lub_oil_temp - coolant_temp) > 15.0:
            physical += 15.0

        return round(float(np.clip(100.0 - ml_penalty - physical, 1.0, 100.0)), 2)
    except Exception as exc:
        _log.warning("Maintenance prediction error: %s", exc)
        return None


def predict_segment_eta_seconds(
    start_wp: str,
    end_wp: str,
    load_state: str,
    slope_dist_m: float,
    loader: str = "unknown",
    disposalsink: str = "unknown",
    truck_id: str = "unknown",
    hour: int | None = None,
) -> float | None:
    """Return predicted segment travel time in seconds, or None if unavailable."""
    _load_eta()
    if _eta_model is None or _eta_lookup is None or not _ML_AVAILABLE:
        return None
    try:
        if hour is None:
            hour = datetime.now().hour
        shift = "Day" if 6 <= hour < 18 else "Night"
        lk = _eta_lookup

        seg_key = f"{start_wp}_{end_wp}_{load_state}"
        seg_speed = lk["seg_speed_means"].get(seg_key, lk["global_speed_mean"])
        hauler_key = (truck_id, load_state)
        hauler_speed = lk["hauler_speed_means"].get(hauler_key, lk["global_speed_mean"])
        start_te = lk["start_waypoint_means"].get(start_wp, lk["train_global_mean"])
        end_te = lk["end_waypoint_means"].get(end_wp, lk["train_global_mean"])

        cat_enc = _eta_encoder.transform([[loader, disposalsink, load_state, shift, str(hour)]])[0]
        features = list(cat_enc) + [slope_dist_m, start_te, end_te, seg_speed, hauler_speed]
        X = pd.DataFrame([features], columns=lk["features"])
        return max(1.0, float(_eta_model.predict(X)[0]))
    except Exception as exc:
        _log.debug("ETA segment prediction error: %s", exc)
        return None


def predict_segment_fuel_liter(
    start_wp: str,
    end_wp: str,
    load_state: str,
    slope_dist_m: float,
    slope_grade_pct: float = 0.0,
    loader: str = "unknown",
    disposalsink: str = "unknown",
    truck_id: str = "unknown",
    hour: int | None = None,
) -> float | None:
    """Return predicted segment fuel consumption in liters, or None if unavailable."""
    _load_fuel()
    if _fuel_model is None or _fuel_lookup is None or not _ML_AVAILABLE:
        return None
    try:
        if hour is None:
            hour = datetime.now().hour
        shift = "Day" if 6 <= hour < 18 else "Night"
        lk = _fuel_lookup

        seg_key = f"{start_wp}_{end_wp}_{load_state}"
        seg_speed = lk["seg_speed_means"].get(seg_key, lk["global_speed_mean"])
        hauler_key = (truck_id, load_state)
        hauler_speed = lk["hauler_speed_means"].get(hauler_key, lk["global_speed_mean"])
        start_te = lk["start_waypoint_means"].get(start_wp, lk["train_global_mean"])
        end_te = lk["end_waypoint_means"].get(end_wp, lk["train_global_mean"])

        elevations = lk.get("elevations", {})
        z_start = elevations.get(start_wp)
        z_end = elevations.get(end_wp)
        if z_start is not None and z_end is not None and slope_dist_m > 0:
            slope = (z_end - z_start) / slope_dist_m
        else:
            slope = slope_grade_pct / 100.0
        slope = max(-0.12, min(0.12, slope))

        cat_enc = _fuel_encoder.transform([[loader, disposalsink, load_state, shift, str(hour)]])[0]
        features = list(cat_enc) + [slope_dist_m, start_te, end_te, seg_speed, hauler_speed, slope]
        X = pd.DataFrame([features], columns=lk["features"])
        return max(0.0, float(_fuel_model.predict(X)[0]))
    except Exception as exc:
        _log.debug("Fuel segment prediction error: %s", exc)
        return None
