# Project 2H4E Race Engineering Backend Architecture

## Runtime Topology

React TypeScript frontend connects to FastAPI over REST for blank-first data loading, sample mode, commentary summaries, circuit reports, and local websocket channels for realtime updates.

- REST base: `http://127.0.0.1:8000/api/engineering`
- Websocket base: `ws://127.0.0.1:8000/ws`
- Database: SQLite at `backend/race_engineering.sqlite3`
- Scheduler: FastAPI lifespan starts local async loops unless `VERCEL=1` or `PROJECT_2H4E_DISABLE_BACKGROUND_TASKS=1`

## Backend Modules

- `race_engineering`: API router, orchestration service, AI alerts, driver engineering
- `telemetry`: sample realtime telemetry frame generation
- `strategy_engine`: pit window optimizer, strategy simulator, reliability risk predictor
- `fuel_models`: fuel burn and fuel-save estimation
- `tire_models`: tire degradation, thermal stress, life remaining, pace-loss curves
- `rival_analysis`: battle intensity, threat score, rival pit prediction
- `live_intelligence`: race commentary source ingestion for YouTube and generic public commentary pages
- `circuit_report`: Wikipedia/Wikimedia circuit reports with Google context links or API results

## ML Model Upgrade Plan

The current predictors are deterministic scaffolds designed to be API-stable while training data is prepared.

- Replace `TireDegradationPredictor` internals with RandomForest or XGBoost regression over stint age, compound, track temp, driver, fuel load, and traffic.
- Replace `FuelConsumptionPredictor` internals with XGBoost regression over lap speed, throttle trace, lift/coast percentage, weather, FCY periods, and stint target.
- Replace `PitWindowOptimizer` internals with time-series forecasting plus Monte Carlo traffic simulation.
- Replace `BattlePredictionEngine` internals with a classifier/regressor pair for pass probability and position threat.
- Replace `ReliabilityRiskPredictor` internals with IsolationForest anomaly scoring over vibration, tire temp, brake temp, oil pressure, and ERS health.
- Keep `StrategySimulationEngine` as the integration facade for alternate pit laps, tire choices, fuel modes, safety car impact, and rain strategy changes.

## API Contract

- `POST /api/commentary/sources`: configure one or more commentary/video links
- `GET /api/commentary/summaries`: latest race commentary intelligence snapshot
- `POST /api/commentary/summarize-now`: summarize active commentary sources now
- `POST /api/commentary/clear`: return commentary state to blank
- `GET /telemetry`: speed, throttle, brake, tire temp, ERS deployment
- `GET /tires`: degradation estimate, thermal stress, tire life, stint score
- `GET /fuel`: burn rate, laps remaining, save mode, emergency pit prediction
- `GET /strategy`: optimal pit window and strategy simulation outputs
- `GET /rivals`: rival gap, pace delta, pit prediction, battle intensity
- `GET /ai-alerts`: severity, confidence, message, explanation, timestamp
- `GET /pit-window`: per-car optimal pit windows
- `GET /degradation`: tire degradation curve for charting
- `GET /battles`: active battle monitor data

## Websocket Channels

- `/ws/telemetry`: telemetry graph updates
- `/ws/strategy`: pit recommendations and simulation changes
- `/ws/events`: AI engineer messages and race-control style alerts
- `/ws/ml`: tire, fuel, degradation, reliability, and driver model output
- `/ws/rivals`: direct competitor and battle-monitor updates

## Frontend Integration

Use REST for initial page load, then merge websocket updates into the existing command-center state.

Suggested mapping:

- Live timing and telemetry panels consume `/ws/telemetry`
- Tire dashboard consumes `/api/engineering/tires` and `/ws/ml`
- Fuel dashboard consumes `/api/engineering/fuel` and `/ws/ml`
- Strategy timeline and pit visualizer consume `/api/engineering/strategy`, `/api/engineering/pit-window`, and `/ws/strategy`
- AI engineer feed consumes `/api/engineering/ai-alerts` and `/ws/events`
- Rival comparison consumes `/api/engineering/rivals`, `/api/engineering/battles`, and `/ws/rivals`

## Testing Checklist

1. Start backend: `cd backend && uvicorn main:app --reload`.
2. Confirm health: `GET http://127.0.0.1:8000/health`.
3. Confirm REST: call `/api/engineering/strategy`, `/ai-alerts`, and `/degradation`.
4. Confirm frontend: `npm run dev -- --host 127.0.0.1`.
5. Open `http://127.0.0.1:5173/`.
6. Confirm the frontend starts blank.
7. Press `Load Full Sample` to expose the sample data packet.
8. Press `Clear` to return to blank state.
