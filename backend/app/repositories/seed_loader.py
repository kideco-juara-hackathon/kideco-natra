import json
from functools import lru_cache
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[3]
SEED_DIR = PROJECT_ROOT / "data" / "seeds"


@lru_cache(maxsize=16)
def load_seed(filename: str) -> Any:
    path = SEED_DIR / filename
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)
