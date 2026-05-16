# Project 2H4E Run Guide

## Requirements

- Node.js 20+
- npm
- Python 3.11+
- Internet access for Wikipedia/Wikimedia, YouTube metadata, Groq, and optional Google context

## Install Frontend

```bash
npm install
```

Create `.env` if needed:

```bash
VITE_PROJECT_2H4E_API_BASE=http://127.0.0.1:8000
```

Run:

```bash
npm run dev -- --host 127.0.0.1
```

Frontend URL:

```text
http://127.0.0.1:5173
```

## Install Backend

```bash
cd backend
pip install -r ../requirements.txt
uvicorn main:app --reload
```

Backend URL:

```text
http://127.0.0.1:8000
```

Health check:

```bash
curl http://127.0.0.1:8000/health
```

## Backend Environment

Windows PowerShell examples:

```powershell
$env:GROQ_API_KEY="your_groq_key"
$env:GROQ_MODEL="llama-3.1-8b-instant"
$env:PROJECT_2H4E_AI_API_URL=""
$env:PROJECT_2H4E_AI_API_KEY=""
$env:GOOGLE_API_KEY=""
$env:GOOGLE_CSE_ID=""
$env:PROJECT_2H4E_CORS_ORIGINS="http://127.0.0.1:5173,http://localhost:5173"
```

Provider order:

1. Primary AI endpoint through `PROJECT_2H4E_AI_API_URL`.
2. Groq through `GROQ_API_KEY`.
3. Deterministic fallback, clearly labeled.

## Useful Smoke Checks

```bash
curl http://127.0.0.1:8000/api/commentary/summaries
curl http://127.0.0.1:8000/api/circuits/report/latest
```

PowerShell circuit report test:

```powershell
$body = @{ location = "Spa-Francorchamps"; raceContext = "smoke" } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8000/api/circuits/report -ContentType "application/json" -Body $body
```

PowerShell circuit image rotation test:

```powershell
$body = @{ location = "Spa-Francorchamps" } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8000/api/circuits/report/change-image -ContentType "application/json" -Body $body
```

## Build And Verification

```bash
npm run format
npm run lint
npm run build
python -m compileall backend api
```

Expected lint note:

- shadcn/ui generated files may show fast-refresh warnings.
- There should be no lint errors.

## Common Troubleshooting

- If the frontend cannot reach the backend, check `VITE_PROJECT_2H4E_API_BASE`.
- If circuit images do not change, confirm the backend is running and has internet access to Wikimedia.
- If YouTube captions are unavailable, the commentary system uses source metadata and labels that behavior.
- If the PDF preview looks white, confirm the latest `src/styles.css` print media is loaded and rebuild/restart the dev server.
- If port `5173` is occupied, Vite may start on another port. Use the URL Vite prints.

## Local Production Preview

```bash
npm run build
npm run start
```

For the backend:

```bash
cd backend
uvicorn main:app --host 127.0.0.1 --port 8000
```
