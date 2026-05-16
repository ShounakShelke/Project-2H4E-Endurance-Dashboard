# Project 2H4E Demo Guide

This guide gives a clean portfolio demo path for the current dashboard.

## 1. Start The Project

Backend:

```bash
cd backend
uvicorn main:app --reload
```

Frontend:

```bash
npm run dev -- --host 127.0.0.1
```

Open:

```text
http://127.0.0.1:5173/
```

## 2. First Load

Expected first-load state:

- The topbar shows `Project 2H4E`.
- Top-right shows `Created with ❤️ By Shounak Shelke`.
- `Your Time` appears beside `Print PDF`.
- `Track Time` appears only after a circuit report exists.
- No standings, telemetry, circuit report, commentary summary, AI alerts, or timeline data is preloaded.

## 3. Load Full Sample

Click `Load Full Sample`.

Expected:

- Sample telemetry URL appears.
- Live standings fill with demo endurance cars.
- Operations Core shows race/lap/track/weather status.
- Race Commentary Intelligence fills with demo commentary.
- Event feed, AI Race Engineer, timeline, mention cards, and tire chart populate.
- Circuit Report loads the Spa-Francorchamps sample with a circuit-layout image.

## 4. Test Standings Comparison

In Live Standings:

1. Click one row.
2. Confirm the row is selected.
3. Click a second different row.
4. Confirm the comparison modal opens.

Expected modal sections:

- Full details for both cars.
- Performance Delta Dashboard.
- Race Engineering Dashboard.
- Sector comparison when sector data exists.

Close the modal. Selection clears.

## 5. Test Real Telemetry Source

Paste a live timing URL into `Telemetry Source Link`, then click `Apply`.

Expected:

- Backend scraper attempts the source.
- If the source is supported and reachable, standings and operations fields update.
- If the source is unavailable, the UI shows an error state instead of silent demo data.

## 6. Test Race Commentary Intelligence

Paste one or more commentary/video links, one per line.

Example:

```text
https://www.youtube.com/watch?v=ykB5jleVsAM&list=PL1tySj0KEznQk8HN5kRnFTJ-bO82SLeT0&index=1
```

Click `Connect`, then `Summarize Now`.

Expected:

- Source chips appear.
- The summary is source-connected when metadata is available.
- If captions are not public, the output explains that it is metadata/context based.
- The event feed, timeline, AI panel, and mention cards receive commentary-derived items.

## 7. Test Circuit Report

Enter:

```text
Spa-Francorchamps
```

Click `Build`.

Expected:

- Wikipedia/Wikimedia source attribution appears.
- The image is a circuit/map/layout image, not a logo.
- `Zoom In`, `Zoom Out`, and `Reset` affect only the image.
- `Change Image` rotates to another backend-approved circuit image when one exists.

Try:

```text
Nürburgring
Circuit de la Sarthe
```

## 8. Print PDF

Click `Print PDF`.

Expected:

- Browser print opens.
- Interactive setup controls are hidden.
- The report keeps the black background and command-center style.

## 9. Clear

Click `Clear`.

Expected:

- Telemetry URL clears.
- Commentary sources clear.
- Circuit report clears.
- Standings, operations, timelines, AI panel, charts, and mentions return to blank state.
