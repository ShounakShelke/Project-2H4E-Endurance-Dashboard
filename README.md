# Project 2H4E

Project 2H4E is an endurance racing command dashboard created by Shounak Shelke. It combines telemetry setup, race commentary intelligence, source-backed circuit reports, strategy panels, event timelines, and print-ready reporting for 4-24 hour endurance formats.

## Features

- Blank-by-default command center: no demo data appears until `Load Full Sample`.
- Full sample mode for portfolio demos, then `Clear` returns the page to a blank state.
- Race Commentary Intelligence accepts YouTube and generic commentary/video webpage links.
- Circuit Report uses Wikipedia/Wikimedia with Google search/API context and image zoom controls.
- Fixed floating topbar with `Created with ❤️ By Shounak Shelke`.
- Browser PDF print flow for the full dashboard.
- FastAPI backend with REST endpoints and local websocket support.

## Architecture

```text
React + TypeScript + TailwindCSS
  -> Project 2H4E dashboard
  -> env-driven API base
  -> blank/sample/clear states

FastAPI + SQLite
  -> commentary source ingestion
  -> Groq or primary AI summaries
  -> circuit report source lookup
  -> race engineering demo services
```

## Main Interfaces

- Frontend local: `http://127.0.0.1:5173/`
- Backend local: `http://127.0.0.1:8000`
- Health: `GET /health`
- Commentary APIs:
  - `POST /api/commentary/sources`
  - `GET /api/commentary/status`
  - `GET /api/commentary/summaries`
  - `POST /api/commentary/summarize-now`
  - `POST /api/commentary/clear`
- Circuit APIs:
  - `POST /api/circuits/report`
  - `GET /api/circuits/report/latest`

## Environment

Frontend:

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

Without AI keys, the app uses labeled deterministic fallback summaries only after the user connects commentary links or loads sample data.

## Credits

Created with ❤️ By Shounak Shelke  
Shounak Shelke @May2026  
Project 2H4E Endurance Dashboard  
Specially Made for NLS, GT-World, LeMans, Spa, and all types of 4-24 hours Endurance series Formats
