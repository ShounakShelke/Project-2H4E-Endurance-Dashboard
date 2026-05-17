# Project 2H4E Run Guide

Project 2H4E is split into two deployable apps:

```text
frontend/  React + TypeScript + Vite + TanStack Start
backend/   FastAPI + SQLite + live timing/commentary/circuit services
```

## Requirements

- Node.js 18+
- Python 3.11+
- Windows PowerShell or Command Prompt

## One-Click Local Run

From the repository root:

```bat
run_project.bat
```

The launcher starts:

- Backend: `http://127.0.0.1:8000`
- Frontend: `http://127.0.0.1:5173`

It also opens the frontend in the browser.

## Manual Backend Run

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

Health check:

```text
http://127.0.0.1:8000/health
```

## Manual Frontend Run

```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1
```

Open:

```text
http://127.0.0.1:5173/
```

## Environment Variables

Frontend, in `frontend/.env`:

```bash
VITE_PROJECT_2H4E_API_BASE=http://127.0.0.1:8000
```

Backend:

```bash
GROQ_API_KEY=
GROQ_MODEL=llama-3.1-8b-instant
PROJECT_2H4E_AI_API_URL=
PROJECT_2H4E_AI_API_KEY=
GOOGLE_API_KEY=
GOOGLE_CSE_ID=
PROJECT_2H4E_CORS_ORIGINS=http://127.0.0.1:5173,http://localhost:5173
```

`GROQ_API_KEY` belongs only on the backend side.

## Main Local Checks

Frontend:

```bash
cd frontend
npm run format
npm run lint
npm run build
```

Backend:

```bash
cd backend
python -m compileall .
```

## Live Timing Test

Use:

```text
https://livetiming.azurewebsites.net/events/50/results
```

Expected:

- `/api/live-timing/source` accepts the URL.
- `/api/live-timing/status` returns live rows.
- The backend refreshes every 30 seconds.
- The frontend polls status every 30 seconds until Clear.

## Commentary Test

Use:

```text
https://www.youtube.com/watch?v=ykB5jleVsAM
```

Expected:

- Metadata-based summary if public captions are unavailable.
- Summary is context-only unless captions or AI text are available.
- Timing data remains the source of truth for race conclusions.

## Circuit Test

Use:

```text
Nurburgring
```

Expected:

- Backend normalizes to Nürburgring.
- Wikipedia/Wikimedia lookup attempts source-backed report and circuit images.
- Weather attempts Open-Meteo lookup.
- Failures are visible and labeled, not silently replaced with fake data.

## Troubleshooting

- If frontend cannot reach backend, check `VITE_PROJECT_2H4E_API_BASE`.
- If timing does not load, confirm the live timing source is reachable and not blocked.
- If YouTube captions are unavailable, the dashboard will use metadata context.
- If weather is unavailable, the circuit report will still load source fields when Wikipedia/Wikimedia works.
- If Vite build fails with `spawn EPERM`, rerun the build from a normal terminal outside restrictive sandboxing.
