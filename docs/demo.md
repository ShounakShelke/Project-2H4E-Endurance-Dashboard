# Project 2H4E Demo Guide

This guide is for presenting Project 2H4E as a live race intelligence dashboard. The dashboard starts blank by design, then becomes useful when sample data or real source links are connected.

## 1. Start The Project

From the repository root:

```bat
run_project.bat
```

Open:

```text
http://127.0.0.1:5173/
```

Expected first state:

- Project 2H4E heading is visible.
- Telemetry source controls are visible.
- Data panels show blank or waiting states.
- No sample standings, summaries, charts, or circuit report appear until you load data.

## 2. One-Click Portfolio Demo

Click:

```text
Load Full Sample
```

Expected result:

- Live Standings fills as a wide full-page tile.
- Operations Core shows Race Pressure Index.
- Top 10 Pace Delta, Pit Exposure, and Class Threat appear as large chart-plus-explanation tiles.
- Live Telemetry, Strategy Impact, Circuit Report, Race Commentary Intelligence, Live Event Feed, AI Race Engineer, Intelligence Timeline, and Tire Degradation Curve fill with sample data.

Use this path when internet access is limited or when you need a fast presentation.

## 3. Real Live Timing Demo

Paste this in Telemetry Source Link:

```text
https://livetiming.azurewebsites.net/events/50/results
```

Click:

```text
Apply
```

Expected result:

- The backend connects to the Azure live timing WebSocket.
- Live Standings loads real rows.
- Race Pressure Index becomes nonblank with top-car pressure scores.
- Pace Delta, Pit Exposure, and Class Threat update from real timing fields.
- AI Race Engineer uses timing rows as the source of truth.
- The frontend refreshes `/api/live-timing/status` every 30 seconds until Clear.

Important demo note:

- A gap like `----LAP 133` is lap-status separation, not direct attack pressure.
- A timed value like `1:35.888` is a timed gap.
- The AI panel should not claim direct rival pressure unless a same-lap rival exists.

## 4. Race Commentary Intelligence Demo

Paste this commentary source:

```text
https://www.youtube.com/watch?v=ykB5jleVsAM
```

Click:

```text
Connect
```

Expected result:

- The dashboard accepts the YouTube source.
- If public captions are unavailable, it uses metadata-based race context.
- The summary is labeled as metadata/context, not as confirmed race events.
- Live timing remains the source of truth for leader, gap, pit, and incident conclusions.

## 5. Circuit Report Demo

Enter:

```text
Nurburgring
```

or:

```text
Nürburgring
```

Click:

```text
Build
```

Expected result:

- Wikipedia/Wikimedia source fields populate when network access is available.
- Circuit image candidates are filtered to layout/map/track-like images.
- Weather attempts to load from Open-Meteo using circuit/location context.
- If lookup fails, the UI shows a clear source-error/fallback state instead of fake real data.

## 6. Print PDF

Click:

```text
Print PDF
```

Expected result:

- Browser print opens.
- The report keeps a black-background dashboard style.
- Interactive controls are hidden or reduced for print readability.

## 7. Clear Demo

Click:

```text
Clear
```

Expected result:

- Telemetry URL is removed.
- Timing polling stops.
- Sample/demo content clears.
- Commentary, circuit report, standings, charts, and intelligence panels return to blank/waiting state.
