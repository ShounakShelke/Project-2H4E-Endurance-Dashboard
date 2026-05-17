# Project 2H4E Project Report

## Product Summary

Project 2H4E is a race engineering and endurance dashboard built for live timing, race commentary intelligence, circuit reporting, strategy analysis, and print-ready reporting. It is designed for NLS, GT-World, Le Mans, Spa, Nürburgring, and 4-24 hour endurance formats.

The dashboard is blank by default. Real content appears only when the user connects sources or clicks `Load Full Sample`.

## Architecture

```text
frontend/
  React + TypeScript + Vite + TanStack Start
  TailwindCSS + shadcn/ui + Recharts

backend/
  FastAPI
  SQLite
  Azure live timing scraper
  Commentary source summarizer
  Circuit report and image filtering
  Weather context lookup
```

The frontend calls the backend through:

```text
VITE_PROJECT_2H4E_API_BASE
```

Local default:

```text
http://127.0.0.1:8000
```

## Core Dashboard Flow

1. User enters a telemetry/live timing URL.
2. Backend parses the event id and connects to Azure live timing WebSocket.
3. Backend normalizes timing rows into positions, cars, drivers, laps, gaps, last laps, best laps, pit counts, class ranks, vehicles, sectors, and lap-data links.
4. Frontend renders Live Standings as a separate wide tile.
5. Operations Core derives pressure, pace, pit exposure, class threat, telemetry conclusions, and AI engineer messages from the timing rows.
6. User can add commentary links for broadcast context.
7. User can build circuit reports from source-backed Wikipedia/Wikimedia data.

## Live Timing

Supported example:

```text
https://livetiming.azurewebsites.net/events/50/results
```

The backend converts the event page into a WebSocket request and listens for leaderboard frames.

Important fields:

- `car_no`
- `driver`
- `team`
- `class_name`
- `laps`
- `gap`
- `last_lap`
- `fastest_lap`
- `pit_count`
- `class_rank`
- `vehicle`
- `sectors`

The dashboard refreshes live timing every 30 seconds until Clear.

## Race Pressure Index

Race Pressure Index is derived from live timing rows. It is not a raw timing field.

Inputs:

- running position
- lap status
- parsed gap type
- class rank
- pit count
- lap-loss percentile
- stint phase

Rules:

- `1:35.888` is a timed gap.
- `----LAP 133` is lap-status separation.
- blank gap is unknown.
- lap-status separation must not be displayed as direct attack pressure.

The chart guarantees nonzero values for valid live rows so real timing feeds do not render as blank charts.

## Analysis Charts

Operations Core includes three large conclusion tiles:

- `Top 10 Pace Delta`
- `Pit Exposure`
- `Class Threat`

Each tile uses a 75/25 layout:

- 75% graph
- 25% explanation

The explanation is generated from the same rows as the chart.

## AI Race Engineer

AI Race Engineer is timing-first.

It can show:

- leader watch
- same-lap rival pressure
- lap-status separation warning
- pit-cycle risk
- broadcast context

It should not claim direct rival pressure from a lap-down or unknown-gap car.

## Race Commentary Intelligence

The commentary system accepts YouTube and generic video/commentary links.

If captions are exposed, summaries may be content-based. If captions are not exposed, the dashboard uses source metadata as broadcast context.

Metadata is useful for:

- source title
- channel
- public live/watch status
- hashtags
- mentioned car numbers
- event identity

Metadata is not treated as confirmed race action.

## Circuit Report

Circuit reports use:

- Wikipedia Search API
- Wikipedia Page Summary API
- Wikimedia image lookup
- optional Google Programmable Search
- Open-Meteo weather lookup

Circuit images are filtered to prefer track maps/layouts and reject logos, badges, cars, flags, posters, and unrelated media.

If external lookup fails, the dashboard shows a labeled fallback/error state. It does not silently present sample copy as real source-backed data.

## Frontend Stack

- React
- TypeScript
- Vite
- TanStack Start
- TailwindCSS
- shadcn/ui
- Recharts
- Lucide icons

## Backend Stack

- FastAPI
- SQLite
- Pydantic
- websockets
- urllib-based source lookups

Optional AI:

- primary configured AI endpoint
- Groq fallback through `GROQ_API_KEY`
- deterministic labeled fallback when no AI key is configured

## Deployment

Frontend Vercel root:

```text
frontend/
```

Backend Vercel root:

```text
backend/
```

Vercel frontend env:

```text
VITE_PROJECT_2H4E_API_BASE=https://your-backend.vercel.app
```

Vercel backend env:

```text
GROQ_API_KEY
GROQ_MODEL
PROJECT_2H4E_AI_API_URL
PROJECT_2H4E_AI_API_KEY
GOOGLE_API_KEY
GOOGLE_CSE_ID
PROJECT_2H4E_CORS_ORIGINS
```

## Known Limitations

- YouTube public captions may not be exposed to the backend.
- Metadata-only commentary must be treated as broadcast context, not confirmed race events.
- Vercel serverless is suitable for REST but not ideal for persistent WebSocket/background loops.
- Weather can fail if external Open-Meteo access is unavailable.
- Circuit image availability depends on Wikimedia candidates for the resolved page.

## Verification

```bash
cd frontend
npm run format
npm run lint
npm run build

cd ../backend
python -m compileall .
```

Recommended smoke test:

1. Load blank dashboard.
2. Click `Load Full Sample`.
3. Clear.
4. Apply live timing URL.
5. Connect YouTube commentary URL.
6. Build Nürburgring circuit report.
7. Confirm Race Pressure Index, Top 10 Pace Delta, Pit Exposure, Class Threat, AI Race Engineer, and Intelligence Timeline show data-driven conclusions.
