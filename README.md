# Project 2H4E

Project 2H4E is a race engineering command center for endurance racing operations. It combines live timing, telemetry, pit strategy, circuit intelligence, AI race-engineer alerts, and live broadcast summarization into a single PDF-ready dashboard.

## What It Does

- Displays a professional motorsport operations dashboard with live standings, track command view, telemetry, tire/fuel strategy, and race-control feed.
- Accepts a user-entered YouTube live URL and generates five-minute race summaries from captions or a labeled demo fallback transcript.
- Extracts cars, teams, incidents, strategy notes, weather, pit calls, and timeline markers from live summaries.
- Accepts a user-entered circuit/place and generates a race engineering circuit report.
- Reuses broadcast intelligence in the event feed, AI engineer panel, timeline, and car/team mention cards.
- Prints the full command center as a clean PDF using the browser print dialog.

## Architecture

```text
React + TypeScript dashboard
  -> REST first-load data
  -> WebSocket realtime updates
FastAPI backend
  -> SQLite persistence
  -> live YouTube intelligence
  -> circuit report generation
  -> race engineering telemetry and strategy services
```

## Main Interfaces

- Frontend: `http://127.0.0.1:5173/`
- Backend health: `http://127.0.0.1:8000/health`
- API docs: `http://127.0.0.1:8000/docs`

Key APIs:

- `POST /api/live-source/youtube`
- `GET /api/live-source/status`
- `GET /api/live-source/summaries`
- `POST /api/live-source/summarize-now`
- `POST /api/circuits/report`
- `GET /api/circuits/report/latest`
- `GET /api/engineering/strategy`
- `GET /api/engineering/ai-alerts`

## Environment

AI keys are optional. Without keys, the system stays usable through deterministic demo summaries.

```bash
GROQ_API_KEY=
PROJECT_2H4E_AI_API_URL=
PROJECT_2H4E_AI_API_KEY=
GROQ_MODEL=llama-3.1-8b-instant
```

## Notes

YouTube live captions depend on public caption availability. If captions are delayed, disabled, or blocked, Project 2H4E labels the panel as demo fallback, keeps retrying, and preserves the dashboard flow for testing and demos.
