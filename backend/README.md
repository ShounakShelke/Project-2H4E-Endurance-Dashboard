# Project 2H4E Backend

Run from this folder:

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

The service exposes blank-first race engineering APIs, race commentary intelligence, source-backed circuit reports, SQLite-backed tables, and local websocket channels:

- `GET /api/engineering/telemetry`
- `GET /api/engineering/tires`
- `GET /api/engineering/fuel`
- `GET /api/engineering/strategy`
- `GET /api/engineering/rivals`
- `GET /api/engineering/ai-alerts`
- `GET /api/engineering/pit-window`
- `GET /api/engineering/degradation`
- `GET /api/engineering/battles`
- `POST /api/commentary/sources`
- `GET /api/commentary/summaries`
- `POST /api/commentary/summarize-now`
- `POST /api/commentary/clear`
- `POST /api/circuits/report`
- `WS /ws/telemetry`, `/ws/strategy`, `/ws/events`, `/ws/ml`, `/ws/rivals`

The current ML layer is a deterministic, dependency-light inference scaffold named after the production model responsibilities: tire degradation prediction, fuel consumption prediction, pit-window optimization, battle prediction, reliability risk, and strategy simulation. It is ready to swap to XGBoost, RandomForest, IsolationForest, and time-series models after training artifacts are available.

For Vercel backend deployment, use `backend/vercel.json` and set `GROQ_API_KEY` in the backend Vercel project only.
