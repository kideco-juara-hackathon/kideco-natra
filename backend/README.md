# KIDECO Backend

FastAPI backend for the KIDECO hauling logistics decision-support MVP.

## Local Run

```bash
cd kideco-main/backend
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Swagger is available at `http://localhost:8000/docs`.

## Docker Compose

From `kideco-main`:

```bash
docker compose up --build
```

This starts:

- `postgres` on `localhost:5432`
- `backend` on `http://localhost:8000`

The backend runs `alembic upgrade head` before starting Uvicorn.

Useful commands:

```bash
docker compose down
docker compose down -v
docker compose logs -f backend
```

## Environment

```bash
DATABASE_URL=postgresql+psycopg://kideco:kideco@localhost:5432/kideco
BACKEND_CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000
```

If `DATABASE_URL` is not set, the app uses SQLite at `./kideco_backend.db` for local development.

## Main API

- `GET /health`
- `GET /api/nodes`
- `GET /api/edges`
- `GET /api/vehicles`
- `POST /api/route-plans`
- `POST /api/telemetry`
- `GET /api/telemetry/latest`
- `GET /api/telemetry/{assetId}/history`
- `GET /api/dashboard/summary`
- `GET /api/recommendations`
- `PATCH /api/recommendations/{recommendationId}/resolve`
