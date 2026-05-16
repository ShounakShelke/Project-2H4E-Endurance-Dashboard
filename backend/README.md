# Race Engineering Command Center Backend

Run from this folder:

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

The service exposes realtime-ready mock engineering data through FastAPI, SQLite-backed tables, and websocket channels:

- `GET /api/engineering/telemetry`
- `GET /api/engineering/tires`
- `GET /api/engineering/fuel`
- `GET /api/engineering/strategy`
- `GET /api/engineering/rivals`
- `GET /api/engineering/ai-alerts`
- `GET /api/engineering/pit-window`
- `GET /api/engineering/degradation`
- `GET /api/engineering/battles`
- `WS /ws/telemetry`, `/ws/strategy`, `/ws/events`, `/ws/ml`, `/ws/rivals`

The current ML layer is a deterministic, dependency-light inference scaffold named after the production model responsibilities: tire degradation prediction, fuel consumption prediction, pit-window optimization, battle prediction, reliability risk, and strategy simulation. It is ready to swap to XGBoost, RandomForest, IsolationForest, and time-series models after training artifacts are available.
