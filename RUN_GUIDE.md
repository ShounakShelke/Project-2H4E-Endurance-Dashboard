# Project 2H4E Run Guide

## Requirements

- Node.js
- npm
- Python 3.11+

## Frontend Setup

```bash
npm install
```

Optional local `.env`:

```bash
VITE_PROJECT_2H4E_API_BASE=http://127.0.0.1:8000
```

Run:

```bash
npm run dev -- --host 127.0.0.1
```

Frontend: `http://127.0.0.1:5173`

## Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend: `http://127.0.0.1:8000`

Optional backend env:

```bash
set GROQ_API_KEY=your_key_here
set GROQ_MODEL=llama-3.1-8b-instant
set PROJECT_2H4E_AI_API_URL=https://your-ai-service.example/summarize
set PROJECT_2H4E_AI_API_KEY=your_key_here
set GOOGLE_API_KEY=your_google_key_here
set GOOGLE_CSE_ID=your_programmable_search_engine_id
set PROJECT_2H4E_CORS_ORIGINS=http://127.0.0.1:5173,http://localhost:5173
```

AI provider order:

1. `PROJECT_2H4E_AI_API_URL` + `PROJECT_2H4E_AI_API_KEY`
2. `GROQ_API_KEY`
3. Labeled deterministic fallback

## Verification

```bash
npm run format
npm run lint
npm run build
python -m compileall backend
```

API smoke checks:

```bash
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:8000/api/commentary/summaries
curl http://127.0.0.1:8000/api/circuits/report/latest
```

## Notes

- The dashboard starts blank by design.
- `Load Full Sample` is the only automatic demo-data entry point.
- `Clear` returns the whole dashboard to blank.
- Vercel serverless deploys REST APIs cleanly, but persistent WebSockets/background loops are best on a long-running host.
