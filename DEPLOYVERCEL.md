# Deploy Project 2H4E On Vercel

This guide covers Vercel deployment for the Project 2H4E frontend and FastAPI backend.

## Recommended Setup

Use two Vercel projects:

- Frontend project: repo root
- Backend project: `backend` folder

This keeps Python serverless API settings separate from the React frontend build.

## Backend On Vercel

1. Create a new Vercel project.
2. Import the same GitHub repo.
3. Set the project root directory to `backend`.
4. Vercel will use `backend/vercel.json` and `backend/api/index.py`.
5. Add Environment Variables in Vercel:

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

`Vercel Project -> Settings -> Environment Variables`

Add them for `Production`, `Preview`, and `Development` if you want the same behavior everywhere.

After deploy, test:

```text
https://your-backend.vercel.app/health
https://your-backend.vercel.app/api/commentary/summaries
```

## Frontend On Vercel

1. Create a second Vercel project.
2. Import the same GitHub repo.
3. Use repo root as project root.
4. Build command:

```bash
npm run build
```

5. Add Environment Variable:

```text
VITE_PROJECT_2H4E_API_BASE=https://your-backend.vercel.app
```

Where to add it:

`Vercel Project -> Settings -> Environment Variables`

Use the backend Vercel URL from the backend deployment.

## Full-Stack Single Project Option

The root `vercel.json` also includes Python API routing for `/api/*`. This is useful for experiments, but two projects are cleaner because the backend is Python/FastAPI and the frontend is TanStack/Vite.

## Groq Key

Put `GROQ_API_KEY` in the backend Vercel project, not the frontend project. The browser should never receive the Groq secret.

Recommended backend env:

```text
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.1-8b-instant
```

## Vercel Limitation

Vercel serverless functions are request/response oriented. The REST APIs work for commentary summaries, circuit reports, and sample/demo flows. Persistent WebSockets and always-running background tasks are limited on Vercel, so keep those for local development or a long-running backend host if you need continuous realtime streaming.

## Final Checks

Before deploying:

```bash
npm run format
npm run lint
npm run build
python -m compileall backend
```
