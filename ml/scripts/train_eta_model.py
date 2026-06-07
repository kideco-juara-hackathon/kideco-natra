import argparse
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error
from sklearn.model_selection import train_test_split

from ml.src.features import build_eta_features, build_eta_target


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Path to sanitized road segment CSV")
    parser.add_argument("--output", default="ml/models/eta_model.joblib")
    args = parser.parse_args()

    frame = pd.read_csv(args.input)
    features = build_eta_features(frame)
    target = build_eta_target(frame)

    valid = target.notna()
    x_train, x_test, y_train, y_test = train_test_split(
        features[valid],
        target[valid],
        test_size=0.2,
        random_state=42,
    )

    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(x_train, y_train)
    predictions = model.predict(x_test)
    mae = mean_absolute_error(y_test, predictions)

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, output_path)
    print({"model": "RandomForestRegressor", "target": "duration_sec", "mae_seconds": round(mae, 2)})


if __name__ == "__main__":
    main()
