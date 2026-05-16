# Project 2H4E Backend

FastAPI backend for the Project 2H4E Endurance Dashboard.

## What It Provides

- Live timing source ingestion and normalized standings.
- Race Commentary Intelligence for YouTube and generic commentary/video webpage links.
- Wikipedia/Wikimedia circuit reports with backend-filtered circuit-layout images.
- `Change Image` support for rotating approved circuit images.
- Optional Google Programmable Search context.
- Optional Groq or primary AI summary generation.
- SQLite persistence for commentary sources, summaries, circuit reports, timelines, and engineering data.
- Local websocket endpoints for realtime-style development.

## Run Locally

From the repository root:

```bash
cd backend
pip install -r ../requirements.txt
uvicorn main:app --reload
```

Backend URL:

```text
http://127.0.0.1:8000
```

Health:

```bash
curl http://127.0.0.1:8000/health
```

## Important Endpoints

Live timing:

- `POST /api/live-timing/source`
- `GET /api/live-timing/status`
- `GET /api/live-timing/standings`
- `POST /api/live-timing/scrape-now`
- `POST /api/live-timing/clear`

Commentary:

- `POST /api/commentary/sources`
- `GET /api/commentary/status`
- `GET /api/commentary/summaries`
- `POST /api/commentary/summarize-now`
- `POST /api/commentary/clear`

Circuit:

- `POST /api/circuits/report`
- `GET /api/circuits/report/latest`
- `POST /api/circuits/report/change-image`

Engineering:

- `GET /api/engineering/telemetry`
- `GET /api/engineering/tires`
- `GET /api/engineering/fuel`
- `GET /api/engineering/strategy`
- `GET /api/engineering/rivals`
- `GET /api/engineering/ai-alerts`
- `GET /api/engineering/pit-window`
- `GET /api/engineering/degradation`
- `GET /api/engineering/battles`

WebSockets:

- `WS /ws/telemetry`
- `WS /ws/strategy`
- `WS /ws/events`
- `WS /ws/ml`
- `WS /ws/rivals`

## Environment

```bash
GROQ_API_KEY=
GROQ_MODEL=llama-3.1-8b-instant
PROJECT_2H4E_AI_API_URL=
PROJECT_2H4E_AI_API_KEY=
GOOGLE_API_KEY=
GOOGLE_CSE_ID=
PROJECT_2H4E_CORS_ORIGINS=http://127.0.0.1:5173,http://localhost:5173
PROJECT_2H4E_DISABLE_BACKGROUND_TASKS=0
```

Provider order:

1. Primary AI endpoint.
2. Groq fallback.
3. Deterministic labeled fallback.

## Vercel

Use `backend/vercel.json` and `backend/api/index.py`.

On Vercel, set:

```text
PROJECT_2H4E_DISABLE_BACKGROUND_TASKS=1
GROQ_API_KEY=your_backend_only_secret
```

Persistent WebSockets and background loops are best on a long-running backend host. Vercel is suitable for REST endpoints, source summaries, circuit reports, and demo flows.
