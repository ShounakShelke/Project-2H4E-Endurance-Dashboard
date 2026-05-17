# Project 2H4E Demo Guide

## 1. Start

From the repository root:

```bat
run_project.bat
```

Open `http://127.0.0.1:5173/`.

## 2. Blank First Load

Expected:

- Topbar shows `Project 2H4E`.
- Top-right shows `Created with love By Shounak Shelke`.
- Standings, telemetry, operations, commentary, AI, tire curve, event feed, mentions, and circuit report are blank.

## 3. Full Sample Demo

Click `Load Full Sample`.

Expected:

- Sample telemetry URL appears.
- Standings, operations, telemetry charts, commentary, event feed, AI engineer, timeline, mentions, tire chart, and Spa-Francorchamps circuit report populate.
- Tire Degradation Curve includes an AI tire read.
- Circuit image zoom and `Change Image` controls are available.

## 4. Real Timing Demo

Paste this into `Telemetry Source Link` and click `Apply`:

```text
https://livetiming.azurewebsites.net/events/50/results
```

Expected:

- Backend connects to the Azure live timing WebSocket.
- Standings populate from real source rows.
- Operations, telemetry, strategy impact, tire curve, and comparison modal derive from timing data.

## 5. Commentary Demo

Paste this into Race Commentary Intelligence and click `Connect`, then `Summarize Now`:

```text
https://www.youtube.com/watch?v=ykB5jleVsAM
```

Expected:

- Source metadata connects.
- Summary is `source-connected`, not demo fallback.
- Event feed, timeline, AI panel, and mention cards update from commentary data.

## 6. Circuit Demo

Enter:

```text
Nurburgring
```

Click `Build`.

Expected:

- Wikipedia/Wikimedia source attribution appears.
- Image is a backend-approved circuit/map/layout image.
- `Change Image` rotates to another approved circuit image when available.

## 7. Standings Comparison

Click any two different rows in Live Standings.

Expected:

- Comparison popup opens.
- It shows full car details, performance deltas, sector data, and race-engineering analysis.

## 8. Print

Click `Print PDF`.

Expected:

- Browser print dialog opens.
- Interactive setup controls are hidden.
- Black dashboard/report background is preserved.

## 9. Clear

Click `Clear`.

Expected:

- Dashboard returns to blank.
- Sample data, commentary, circuit report, standings, charts, and AI panels clear.
