from __future__ import annotations

import time

from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import get_settings


def main() -> None:
    settings = get_settings()
    engine = create_engine(settings.database_url, future=True)
    last_error: Exception | None = None

    for _ in range(30):
        try:
            with engine.connect() as connection:
                connection.execute(text("SELECT 1"))
            print("Database is ready.")
            return
        except SQLAlchemyError as exc:
            last_error = exc
            print(f"Waiting for database: {exc}")
            time.sleep(2)

    raise RuntimeError(f"Database did not become ready: {last_error}")


if __name__ == "__main__":
    main()
