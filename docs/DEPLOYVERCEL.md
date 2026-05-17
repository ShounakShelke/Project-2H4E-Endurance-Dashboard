# Deploy Project 2H4E On Vercel

Use two Vercel projects: one for `frontend/`, one for `backend/`.

## Frontend Vercel Project

Project root:

```text
frontend
```

Build command:

```bash
npm run build
```

Install command:

```bash
npm install
```

Environment variable:

```text
VITE_PROJECT_2H4E_API_BASE=https://your-backend.vercel.app
```

Add it in:

```text
Vercel Project -> Settings -> Environment Variables
```

## Backend Vercel Project

Project root:

```text
backend
```

Vercel entry:

```text
backend/api/index.py
```

Backend config:

```text
backend/vercel.json
```

Environment variables:

```text
GROQ_API_KEY=your_groq_key
GROQ_MODEL=llama-3.1-8b-instant
PROJECT_2H4E_AI_API_URL=
PROJECT_2H4E_AI_API_KEY=
GOOGLE_API_KEY=
GOOGLE_CSE_ID=
PROJECT_2H4E_CORS_ORIGINS=https://your-frontend.vercel.app
PROJECT_2H4E_DISABLE_BACKGROUND_TASKS=1
```

Put `GROQ_API_KEY` only in the backend Vercel project. Do not expose it to the frontend.

## Backend Smoke Tests

After deploy:

```text
https://your-backend.vercel.app/health
https://your-backend.vercel.app/api/commentary/summaries
https://your-backend.vercel.app/api/circuits/report/latest
```

Circuit POST:

```bash
curl -X POST https://your-backend.vercel.app/api/circuits/report \
  -H "Content-Type: application/json" \
  -d "{\"location\":\"Nurburgring\",\"raceContext\":\"deployment smoke\"}"
```

## Vercel Limitations

Vercel serverless is good for:

- REST APIs.
- Commentary summaries.
- Circuit reports.
- Sample/demo mode.
- Clear mode.

Use a long-running backend host for:

- Persistent WebSockets.
- Continuous live timing polling.
- Always-running background tasks.

## Final Checks

```bash
cd frontend
npm run format
npm run lint
npm run build

cd ../backend
python -m compileall .
```
