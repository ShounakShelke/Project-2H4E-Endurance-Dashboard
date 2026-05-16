# Deploy Project 2H4E On Vercel

This project is ready for local deployment and Vercel deployment. The cleanest Vercel setup is two projects: one frontend project and one backend project.

## Recommended Vercel Architecture

```text
Frontend Vercel Project
  Root: repository root
  Build: npm run build
  Env: VITE_PROJECT_2H4E_API_BASE=https://your-backend.vercel.app

Backend Vercel Project
  Root: backend
  Entry: backend/api/index.py
  Runtime: Python serverless
  Env: GROQ_API_KEY, optional AI and Google keys
```

Two projects are recommended because the frontend is React/TanStack/Vite and the backend is FastAPI/Python.

## Frontend Deployment

1. Open Vercel.
2. Create a new project.
3. Import the GitHub repo.
4. Keep the root directory as the repository root.
5. Use:

```bash
npm install
npm run build
```

6. Add frontend environment variable:

```text
VITE_PROJECT_2H4E_API_BASE=https://your-backend.vercel.app
```

Where to add it:

```text
Vercel Project -> Settings -> Environment Variables
```

Add it for Production, Preview, and Development if you want all deployments to hit the same backend.

## Backend Deployment

1. Create a second Vercel project.
2. Import the same GitHub repo.
3. Set Root Directory to:

```text
backend
```

4. Vercel will use:

```text
backend/vercel.json
backend/api/index.py
```

5. Add backend environment variables:

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

Where to add them:

```text
Vercel Project -> Settings -> Environment Variables
```

Add them for Production, Preview, and Development as needed.

Important: put `GROQ_API_KEY` only in the backend Vercel project. Do not put Groq secrets in the frontend project.

## Backend Smoke Tests After Deploy

```text
https://your-backend.vercel.app/health
https://your-backend.vercel.app/api/commentary/summaries
https://your-backend.vercel.app/api/circuits/report/latest
```

Circuit report POST test:

```bash
curl -X POST https://your-backend.vercel.app/api/circuits/report \
  -H "Content-Type: application/json" \
  -d "{\"location\":\"Spa-Francorchamps\",\"raceContext\":\"deployment smoke\"}"
```

Change image POST test:

```bash
curl -X POST https://your-backend.vercel.app/api/circuits/report/change-image \
  -H "Content-Type: application/json" \
  -d "{\"location\":\"Spa-Francorchamps\"}"
```

## Vercel Limitations

Vercel serverless works well for:

- REST APIs.
- Commentary summary requests.
- Circuit reports.
- Sample/demo mode.
- Clear mode.
- Print-ready frontend.

Vercel is limited for:

- Persistent WebSockets.
- Always-running background caption polling.
- Long-running telemetry streams.

For full continuous realtime telemetry and WebSocket broadcasting, use a long-running backend host such as Railway, Render, Fly.io, a VPS, or a dedicated FastAPI server.

## Final Pre-Deploy Checks

Run:

```bash
npm run format
npm run lint
npm run build
python -m compileall backend api
```

Confirm:

- First load is blank.
- `Load Full Sample` fills the full dashboard.
- `Clear` resets the full page.
- `Print PDF` keeps the black report background.
- `Change Image` rotates Spa/Nürburgring/Le Mans circuit images when Wikimedia is reachable.
