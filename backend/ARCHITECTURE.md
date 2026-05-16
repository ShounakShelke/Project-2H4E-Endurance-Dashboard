# Project 2H4E Backend Architecture

## Runtime Topology

```text
React/TanStack frontend
  -> REST calls through VITE_PROJECT_2H4E_API_BASE
  -> Optional local websocket streams

FastAPI backend
  -> SQLite persistence
  -> Live timing scraper
  -> Commentary source summarizer
  -> Circuit source/report service
  -> Engineering analytics routers

External sources
  -> Azure live timing websocket sources when user provides a supported URL
  -> YouTube oEmbed/page metadata
  -> Generic public commentary/video page metadata
  -> Wikipedia summary API
  -> Wikimedia image APIs
  -> Optional Google Programmable Search
  -> Optional Groq/primary AI
```

## Modules

- `live_timing`: user-provided telemetry/live-timing source parsing, Azure websocket protocol support, and normalized standings.
- `live_intelligence`: commentary source storage, YouTube metadata extraction, generic link extraction, summaries, entities, and timeline events.
- `circuit_report`: Wikipedia search, page summaries, Google context, Wikimedia circuit-image candidate filtering, and image rotation.
- `race_engineering`: engineering REST router and orchestration.
- `telemetry`: telemetry-shaped sample frames for dashboard charts.
- `strategy_engine`: pit-window, simulation, and reliability scaffolds.
- `fuel_models`: fuel burn, laps remaining, and emergency-stop estimates.
- `tire_models`: degradation, thermal stress, tire life, and pace-loss estimates.
- `rival_analysis`: battle intensity, threat scoring, and rival comparison.

## Data Model

SQLite stores:

- `youtube_sources`
- `caption_segments`
- `race_summaries`
- `summary_entities`
- `timeline_events`
- `circuit_reports`
- `telemetry_snapshots`
- `tire_metrics`
- `fuel_metrics`
- `strategy_predictions`
- `rival_analysis`
- `ai_engineer_alerts`

Circuit reports include:

- `source_title`
- `source_url`
- `image_url`
- `image_status`
- `image_candidates`
- `image_index`
- `image_reason`
- `data_source`
- `source_status`
- Google context fields

## Circuit Image Safety

The circuit service does not blindly trust Wikipedia thumbnails.

It accepts image candidates when filenames suggest:

- circuit
- track
- layout
- map
- course
- nordschleife
- grand prix
- route
- strecke

It rejects candidates when filenames suggest:

- logo
- icon
- seal
- poster
- portrait
- podium
- car
- flag
- badge
- emblem
- wordmark

If no approved image exists, the API returns `image_status: "no-circuit-image"` and an empty `image_url`.

## AI Provider Flow

```text
User links
  -> source metadata/text extraction
  -> primary AI if configured
  -> Groq fallback if GROQ_API_KEY exists
  -> deterministic labeled fallback
  -> summary + entities + timeline events
```

## Deployment Modes

Local:

- Full REST.
- Local websocket endpoints.
- Background tasks enabled unless disabled.

Vercel:

- REST/serverless endpoints.
- Background tasks disabled with `PROJECT_2H4E_DISABLE_BACKGROUND_TASKS=1`.
- Persistent websocket streaming should be hosted elsewhere for production realtime use.

## Verification Checklist

```bash
python -m compileall backend api
```

API checks:

- `GET /health`
- `POST /api/circuits/report`
- `POST /api/circuits/report/change-image`
- `POST /api/commentary/sources`
- `GET /api/commentary/summaries`
- `POST /api/live-timing/source`
