# Project 2H4E Demo Guide

## 1. Start The System

Run the backend:

```bash
cd backend
uvicorn main:app --reload
```

Run the frontend:

```bash
npm run dev -- --host 127.0.0.1
```

Open `http://127.0.0.1:5173/`.

## 2. Show The Command Center

Point out the three-part operations layout:

- Left: live standings and car order
- Center: circuit command surface with race position markers
- Right: live telemetry, strategy impact, and circuit report
- Bottom: YouTube intelligence, event feed, AI engineer, timeline, and mention cards

## 3. Demonstrate Live YouTube Intelligence

Paste a YouTube live URL into the Live YouTube Intelligence tile.

Use this demo URL if no live stream is available:

```text
https://www.youtube.com/watch?v=project2h4e-demo
```

Click `Connect`, then `Summarize Now`.

Expected result:

- Summary appears in the tile
- Event feed receives race intelligence
- AI engineer panel includes broadcast context
- Timeline updates
- Cars and teams mentioned appear as cards

## 4. Demonstrate Circuit Report

Enter a circuit or location, for example:

```text
Circuit de la Sarthe
```

Click `Build`.

Expected result:

- Circuit report updates
- Overtaking, tire/fuel, risk, and engineer-call sections appear
- Circuit map card remains visually aligned with the main command view

## 5. Print The Report

Click `Print PDF`.

Expected result:

- Browser print dialog opens
- Interactive-only controls are hidden
- Dashboard panels print as a clean engineering report

## 6. Backend API Demo

Open:

- `http://127.0.0.1:8000/health`
- `http://127.0.0.1:8000/api/live-source/summaries`
- `http://127.0.0.1:8000/api/circuits/report/latest`
- `http://127.0.0.1:8000/api/engineering/strategy`
