# Kideco Main

Main application repository for KIC 2026 Hackathon.

## Project Direction

This repository contains the runnable MVP for a hauling logistics decision-support system. The first implementation slice focuses on route optimization, ETA estimation, fuel estimation, and telemetry simulation for mining haul trucks.

## Modules

| Folder | Purpose |
|---|---|
| `frontend` | Dispatcher dashboard and route intelligence UI. |
| `backend` | FastAPI service for seed data, route recommendation, telemetry, and health scoring. |
| `ml` | ETA model experiments and reusable prediction code. |
| `simulator` | HTTP telemetry simulator for vehicle speed, location, and health signals. |
| `data` | Seed data and sanitized sample data. Raw internal datasets are not committed by default. |
| `docs` | Technical architecture, API contract, and data contract. |

## Initial MVP Slice

```text
dispatcher selects vehicle and destination
        -> backend loads nodes and edges
        -> route engine recommends a path
        -> ETA/fuel/health are estimated
        -> frontend displays recommendation and simulated telemetry
```

## Local Development Targets

Planned commands after dependencies are added:

```bash
# backend
cd backend
uvicorn app.main:app --reload

# frontend
cd frontend
npm run dev

# simulator
cd simulator
python telemetry_simulator.py --scenario normal
```

## Data Policy

Do not commit raw internal mining datasets unless the team has explicit permission. Use `data/seeds` for sanitized simulation data and `data/raw` only for local-only files.
