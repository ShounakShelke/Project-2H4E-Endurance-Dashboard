from __future__ import annotations

import asyncio
import json
import re
import time
from datetime import datetime, timezone
from typing import Any
from urllib.parse import parse_qs, urlparse

try:
    import websockets
except Exception:  # pragma: no cover - dependency guard for partial installs
    websockets = None


EMPTY_SNAPSHOT: dict[str, Any] = {
    "source": None,
    "event_id": None,
    "status": "blank",
    "message": "Waiting for live timing source.",
    "session": None,
    "track": None,
    "event_name": None,
    "cup": None,
    "heat": None,
    "heat_type": None,
    "time_of_day": None,
    "track_state": None,
    "standings": [],
    "received_at": None,
}

_latest_snapshot: dict[str, Any] = dict(EMPTY_SNAPSHOT)
_active_source: str | None = None


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def parse_event_source(url: str) -> tuple[str, str, str]:
    clean = url.strip()
    parsed = urlparse(clean)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError("Enter a valid http or https live timing URL.")
    query = parse_qs(parsed.query)
    event_id = query.get("event", [""])[0]
    if not event_id:
        match = re.search(r"(?:^|/)event[=/](\d+)(?:/|$)", parsed.path)
        if match:
            event_id = match.group(1)
    if not event_id:
        match = re.search(r"event=(\d+)", clean)
        if match:
            event_id = match.group(1)
    if not event_id or not event_id.isdigit():
        raise ValueError("Live timing URL must include an event id such as event=50.")
    scheme = "wss" if parsed.scheme == "https" else "ws"
    return clean, event_id, f"{scheme}://{parsed.netloc}"


def normalize_timing_row(row: dict[str, Any], event_id: str, session: str | None, host: str) -> dict[str, Any]:
    car_no = str(row.get("STNR") or "").strip()
    sectors = []
    for index in range(1, 10):
        speed = row.get(f"S{index}SPEED")
        sector_time = row.get(f"S{index}TIME")
        if speed is None and sector_time is None:
            continue
        sectors.append(
            {
                "sector": index,
                "speed": speed,
                "time": sector_time,
                "speed_status": row.get(f"ST{index}V"),
                "time_status": row.get(f"ST{index}T"),
            }
        )
    lap_data_url = None
    if car_no and session:
        lap_data_url = f"{host}/event/{event_id}/laps-data?session={session}&startingNo={car_no}"
    return {
        "position": row.get("POSITION"),
        "position_change": row.get("CHG"),
        "car_no": car_no,
        "state": row.get("STATE") or "",
        "class_name": row.get("CLASSNAME") or "",
        "rank": row.get("RANK"),
        "dynamic_rank": row.get("DYNARANK"),
        "class_rank": row.get("CLASSRANK"),
        "driver": row.get("NAME") or "",
        "team": row.get("TEAM") or "",
        "laps": row.get("LAPS") or 0,
        "gap": row.get("GAP") or "",
        "last_lap": row.get("LASTLAPTIME") or "",
        "last_lap_status": row.get("LLTS") or "",
        "fastest_lap": row.get("FASTESTLAP") or "",
        "fastest_lap_status": row.get("FLTS") or "",
        "pit_count": row.get("PITSTOPCOUNT") or 0,
        "vehicle": row.get("CAR") or "",
        "sectors": sectors,
        "lap_data_url": lap_data_url,
    }


def normalize_track_state(frame: dict[str, Any]) -> dict[str, Any]:
    return {
        "pid": frame.get("PID"),
        "track_status": frame.get("TRACKSTATUS") or frame.get("TRACKSTATE") or frame.get("STATUS"),
        "raw": frame,
        "received_at": utc_now(),
    }


def normalize_results_frame(source_url: str, event_id: str, ws_url: str, frame: dict[str, Any]) -> dict[str, Any]:
    session = str(frame.get("SESSION") or "")
    host = ws_url.replace("wss://", "https://").replace("ws://", "http://")
    standings = [
        normalize_timing_row(row, event_id, session, host)
        for row in frame.get("RESULT", [])
        if isinstance(row, dict)
    ]
    return {
        "source": source_url,
        "event_id": event_id,
        "status": "live",
        "message": "Real live timing data loaded from Azure WebSocket.",
        "session": session or None,
        "track": frame.get("TRACKNAME"),
        "event_name": frame.get("CUP"),
        "cup": frame.get("CUP"),
        "heat": frame.get("HEAT"),
        "heat_type": frame.get("HEATTYPE"),
        "time_of_day": frame.get("TOD"),
        "track_state": _latest_snapshot.get("track_state"),
        "standings": standings,
        "received_at": utc_now(),
    }


async def scrape_live_timing(url: str, timeout_seconds: float = 12.0) -> dict[str, Any]:
    if websockets is None:
        raise RuntimeError("Python package 'websockets' is required for live timing scraping.")
    source_url, event_id, ws_url = parse_event_source(url)
    parsed_source = urlparse(source_url)
    origin = f"{parsed_source.scheme}://{parsed_source.netloc}"
    payload = {"eventId": event_id, "eventPid": [0, 4], "clientLocalTime": int(time.time() * 1000)}
    last_track_state: dict[str, Any] | None = None
    async with websockets.connect(
        ws_url,
        open_timeout=timeout_seconds,
        close_timeout=2,
        origin=origin,
        user_agent_header="Mozilla/5.0 Project2H4E/1.0",
    ) as websocket:
        await websocket.send(json.dumps(payload))
        deadline = asyncio.get_running_loop().time() + timeout_seconds
        while asyncio.get_running_loop().time() < deadline:
            raw = await asyncio.wait_for(websocket.recv(), timeout=max(0.5, deadline - asyncio.get_running_loop().time()))
            frame = json.loads(raw)
            pid = str(frame.get("PID") or "")
            if pid == "LTS_TIMESYNC":
                continue
            if pid == "4":
                last_track_state = normalize_track_state(frame)
                continue
            if pid == "0":
                snapshot = normalize_results_frame(source_url, event_id, ws_url, frame)
                if last_track_state:
                    snapshot["track_state"] = last_track_state
                return snapshot
    raise TimeoutError("Live timing WebSocket did not return leaderboard data before timeout.")


async def configure_source(url: str) -> dict[str, Any]:
    global _active_source, _latest_snapshot
    source_url, event_id, _ = parse_event_source(url)
    _active_source = source_url
    try:
        _latest_snapshot = await scrape_live_timing(source_url)
    except Exception as exc:
        _latest_snapshot = {
            **EMPTY_SNAPSHOT,
            "source": source_url,
            "event_id": event_id,
            "status": "error",
            "message": f"Live timing source accepted, but scraping failed: {exc}",
            "received_at": utc_now(),
        }
    return _latest_snapshot


async def scrape_now() -> dict[str, Any]:
    if not _active_source:
        return _latest_snapshot
    return await configure_source(_active_source)


def latest_snapshot() -> dict[str, Any]:
    return _latest_snapshot


def clear_source() -> dict[str, Any]:
    global _active_source, _latest_snapshot
    _active_source = None
    _latest_snapshot = dict(EMPTY_SNAPSHOT)
    return _latest_snapshot
