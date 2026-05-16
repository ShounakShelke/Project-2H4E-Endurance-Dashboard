# Project 2H4E Run Guide

## Requirements

- Node.js
- npm
- Python 3.11+

## Install Frontend

```bash
npm install
```

## Install Backend

```bash
cd backend
pip install -r requirements.txt
```

## Run Backend

```bash
cd backend
uvicorn main:app --reload
```

The backend runs at `http://127.0.0.1:8000`.

## Run Frontend

```bash
npm run dev -- --host 127.0.0.1
```

The frontend runs at `http://127.0.0.1:5173`.

## Optional AI Configuration

```bash
set GROQ_API_KEY=your_key_here
set GROQ_MODEL=llama-3.1-8b-instant
```

Optional primary AI service:

```bash
set PROJECT_2H4E_AI_API_URL=https://your-ai-service.example/summarize
set PROJECT_2H4E_AI_API_KEY=your_key_here
```

Provider order:

1. `PROJECT_2H4E_AI_API_URL` + `PROJECT_2H4E_AI_API_KEY`
2. `GROQ_API_KEY`
3. Deterministic demo fallback

## Verification Commands

```bash
npm run lint
npm run build
python -m compileall backend
```

API smoke checks:

```bash
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:8000/api/live-source/summaries
curl http://127.0.0.1:8000/api/circuits/report/latest
```

## Troubleshooting

- If YouTube captions are unavailable, the app intentionally uses a labeled demo fallback transcript.
- If AI keys are missing, summaries still work in demo mode.
- If the frontend cannot reach the backend, the UI displays local demo data so the dashboard remains testable.
- If print output includes controls, use the `Print PDF` button rather than printing an individual browser frame.
