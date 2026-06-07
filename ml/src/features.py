import pandas as pd


def build_eta_features(frame: pd.DataFrame) -> pd.DataFrame:
    features = pd.DataFrame()
    features["distance_m"] = frame["SlopeDistance"]
    features["is_full"] = (frame["LoadStateDescription"].str.lower() == "full").astype(int)
    features["is_night_shift"] = (frame["Shift"].str.upper() == "NS").astype(int)
    features["hour_of_day"] = pd.to_datetime(frame["START_TIME"], errors="coerce").dt.hour.fillna(0)
    return features


def build_eta_target(frame: pd.DataFrame) -> pd.Series:
    start = pd.to_datetime(frame["Date"].astype(str) + " " + frame["START_TIME"].astype(str), errors="coerce")
    end = pd.to_datetime(frame["Date"].astype(str) + " " + frame["END_TIME"].astype(str), errors="coerce")
    end = end.mask(end < start, end + pd.Timedelta(days=1))
    return (end - start).dt.total_seconds()
