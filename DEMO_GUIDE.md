# Project 2H4E Demo Guide

## 1. Start

Backend:

```bash
cd backend
uvicorn main:app --reload
```

Frontend:

```bash
npm run dev -- --host 127.0.0.1
```

Open `http://127.0.0.1:5173/`.

## 2. Blank First Load

On first load, confirm the dashboard shows only the shell, setup controls, empty-state messages, and no static race data.

Expected:

- Topbar says `Project 2H4E`.
- Top-right says `Created with ❤️ By Shounak Shelke`.
- Standings, telemetry, operations core, AI alerts, timeline, circuit report, and mention cards are blank.

## 3. Full Sample Demo

Click `Load Full Sample`.

Expected:

- Telemetry source fills with the sample websocket link.
- Standings, operations core, telemetry charts, race commentary summary, event feed, AI engineer panel, timeline, mentions, tire chart, and circuit report populate.
- Circuit report image zoom controls become usable.

## 4. Race Commentary Intelligence

Paste one or more links into `Race Commentary Intelligence`, one per line.

Examples:

```text
https://www.youtube.com/watch?v=project2h4e-demo
https://www.fiawec.com/
```

Click `Connect`, then `Summarize Now`.

Expected:

- Source chips appear.
- Commentary summary appears if source text/captions are available.
- If public captions/text are unavailable, fallback is clearly labeled.

## 5. Circuit Report And Zoom

Enter a circuit name:

```text
Spa-Francorchamps
```

Click `Build`, then use `Zoom In`, `Zoom Out`, and `Reset` on the image.

Expected:

- Report is source-backed from Wikipedia/Wikimedia when available.
- Google context link appears.
- Image zoom changes the image only, not the tile size.

## 6. Clear

Click `Clear` in the telemetry source bar.

Expected:

- Entire dashboard returns to blank state.
- Commentary links, sample telemetry, summaries, timeline, circuit report, event feed, AI panel, and charts clear.

## 7. Print

Click `Print PDF`.

Expected:

- Browser print dialog opens.
- Interactive setup controls are hidden in print mode.
