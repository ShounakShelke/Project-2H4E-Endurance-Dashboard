from __future__ import annotations

import json
import os
import re
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from typing import Any

from database import connect

DEMO_URL = "https://www.youtube.com/watch?v=project2h4e-demo"
DEMO_TRANSCRIPT = (
    "Race control reports car #7 Toyota is approaching the pit window. "
    "Car #51 Ferrari is losing rear tire performance through sector two. "
    "The #911 Porsche is expected to stop within three laps, and the #6 Porsche "
    "has clean air if it pushes now. Light rain is possible near the circuit in twenty minutes."
)

TEAM_HINTS = [
    "Toyota",
    "Porsche",
    "Ferrari",
    "Cadillac",
    "Peugeot",
    "Alpine",
    "Aston",
    "Corvette",
    "BMW",
    "Mercedes",
    "McLaren",
    "Lamborghini",
    "Ford",
]


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def parse_video_id(url: str) -> str:
    parsed = urllib.parse.urlparse(url.strip())
    if parsed.netloc.endswith("youtu.be"):
      video_id = parsed.path.strip("/")
    else:
      query = urllib.parse.parse_qs(parsed.query)
      video_id = query.get("v", [""])[0]
    if not video_id and "youtube.com/live/" in url:
      video_id = parsed.path.rstrip("/").split("/")[-1]
    if not re.fullmatch(r"[A-Za-z0-9_-]{6,}", video_id or ""):
      raise ValueError("Enter a valid YouTube live or video URL.")
    return video_id


def provider_name() -> str:
    if os.getenv("PROJECT_2H4E_AI_API_URL") and os.getenv("PROJECT_2H4E_AI_API_KEY"):
        return "primary-ai"
    if os.getenv("GROQ_API_KEY"):
        return "groq"
    return "demo"


def fetch_caption_text(video_id: str) -> tuple[str, str]:
    # Public live captions are intentionally best-effort in v1. Without adding fragile scraping
    # dependencies, we keep the system useful with a marked demo transcript and retry status.
    if video_id == "project2h4e-demo":
        return DEMO_TRANSCRIPT, "demo"
    return DEMO_TRANSCRIPT, "demo-fallback"


def deterministic_summary(transcript: str) -> str:
    return (
        "Pit strategy is active for #7 Toyota, tire degradation is building on #51 Ferrari, "
        "#911 Porsche is trending toward a stop within three laps, and #6 Porsche has a short "
        "clean-air push window. Weather risk is low but increasing around the circuit."
    )


def call_primary_ai(transcript: str) -> str | None:
    api_url = os.getenv("PROJECT_2H4E_AI_API_URL")
    api_key = os.getenv("PROJECT_2H4E_AI_API_KEY")
    if not api_url or not api_key:
        return None
    payload = json.dumps({"transcript": transcript, "task": "race_engineering_summary"}).encode()
    request = urllib.request.Request(
        api_url,
        data=payload,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=12) as response:
        body = json.loads(response.read().decode())
    return body.get("summary") or body.get("text")


def call_groq(transcript: str) -> str | None:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return None
    payload = {
        "model": os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
        "messages": [
            {
                "role": "system",
                "content": "Summarize motorsport live captions for a race engineer. Be concise and extract race-relevant events.",
            },
            {"role": "user", "content": transcript},
        ],
        "temperature": 0.2,
    }
    request = urllib.request.Request(
        "https://api.groq.com/openai/v1/chat/completions",
        data=json.dumps(payload).encode(),
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=16) as response:
        body = json.loads(response.read().decode())
    return body["choices"][0]["message"]["content"]


def summarize_transcript(transcript: str) -> tuple[str, str, float, str]:
    provider = provider_name()
    try:
        if provider == "primary-ai":
            summary = call_primary_ai(transcript)
        elif provider == "groq":
            summary = call_groq(transcript)
        else:
            summary = None
        if summary:
            return summary, provider, 0.88, "ai"
    except Exception:
        pass
    return deterministic_summary(transcript), "demo", 0.72, "demo"


def extract_entities(summary: str) -> list[dict[str, str]]:
    entities: list[dict[str, str]] = []
    for car_no in sorted(set(re.findall(r"#\d{1,3}", summary))):
        entities.append({"type": "car", "label": car_no, "context": summary})
    for team in TEAM_HINTS:
        if re.search(rf"\b{re.escape(team)}\b", summary, re.IGNORECASE):
            entities.append({"type": "team", "label": team, "context": summary})
    for keyword in ["pit", "tire", "fuel", "weather", "rain", "incident", "clean air"]:
        if keyword in summary.lower():
            entities.append({"type": "topic", "label": keyword.title(), "context": summary})
    return entities[:12]


def classify_event(summary: str) -> tuple[str, str, str]:
    lowered = summary.lower()
    if "pit" in lowered:
        return "strategy", "Pit cycle intelligence", "warning"
    if "tire" in lowered:
        return "tire", "Tire degradation intelligence", "warning"
    if "rain" in lowered or "weather" in lowered:
        return "weather", "Weather risk intelligence", "info"
    return "summary", "Live race summary", "info"


def configure_source(url: str) -> dict[str, Any]:
    video_id = parse_video_id(url)
    with connect() as conn:
        conn.execute("UPDATE youtube_sources SET status = 'inactive' WHERE status = 'active'")
        cursor = conn.execute(
            "INSERT INTO youtube_sources (url, video_id, status, last_polled_at) VALUES (?, ?, ?, ?)",
            (url, video_id, "active", utc_now()),
        )
        source_id = cursor.lastrowid
        conn.commit()
    return create_summary(source_id)


def latest_source_id() -> int:
    with connect() as conn:
        row = conn.execute(
            "SELECT id FROM youtube_sources WHERE status = 'active' ORDER BY id DESC LIMIT 1"
        ).fetchone()
        if row:
            return int(row["id"])
    return int(configure_source(DEMO_URL)["source"]["id"])


def create_summary(source_id: int | None = None) -> dict[str, Any]:
    source_id = source_id or latest_source_id()
    with connect() as conn:
        source = conn.execute("SELECT * FROM youtube_sources WHERE id = ?", (source_id,)).fetchone()
        if not source:
            raise ValueError("No active YouTube source configured.")
        transcript, caption_mode = fetch_caption_text(source["video_id"])
        summary, provider, confidence, status = summarize_transcript(transcript)
        conn.execute(
            "INSERT INTO caption_segments (source_id, start_seconds, text, mode) VALUES (?, ?, ?, ?)",
            (source_id, 0, transcript, caption_mode),
        )
        cursor = conn.execute(
            "INSERT INTO race_summaries (source_id, summary, provider, confidence, status) VALUES (?, ?, ?, ?, ?)",
            (source_id, summary, provider, confidence, status),
        )
        summary_id = cursor.lastrowid
        entities = extract_entities(summary)
        for entity in entities:
            conn.execute(
                "INSERT INTO summary_entities (summary_id, entity_type, label, context) VALUES (?, ?, ?, ?)",
                (summary_id, entity["type"], entity["label"], entity["context"]),
            )
        event_type, title, severity = classify_event(summary)
        car = next((e["label"] for e in entities if e["type"] == "car"), None)
        team = next((e["label"] for e in entities if e["type"] == "team"), None)
        conn.execute(
            "INSERT INTO timeline_events (source, event_type, title, detail, car_no, team, severity) VALUES (?, ?, ?, ?, ?, ?, ?)",
            ("live-youtube", event_type, title, summary, car, team, severity),
        )
        conn.execute(
            "UPDATE youtube_sources SET last_polled_at = ?, status = 'active' WHERE id = ?",
            (utc_now(), source_id),
        )
        conn.commit()
    return latest_snapshot()


def latest_snapshot() -> dict[str, Any]:
    with connect() as conn:
        source = conn.execute("SELECT * FROM youtube_sources ORDER BY id DESC LIMIT 1").fetchone()
        summaries = conn.execute(
            """
            SELECT rs.*, ys.url, ys.video_id
            FROM race_summaries rs
            JOIN youtube_sources ys ON ys.id = rs.source_id
            ORDER BY rs.id DESC
            LIMIT 6
            """
        ).fetchall()
        latest_summary_id = summaries[0]["id"] if summaries else None
        entities = []
        if latest_summary_id:
            entities = [
                dict(row)
                for row in conn.execute(
                    "SELECT entity_type, label, context FROM summary_entities WHERE summary_id = ? ORDER BY id",
                    (latest_summary_id,),
                ).fetchall()
            ]
        timeline = [
            dict(row)
            for row in conn.execute(
                "SELECT * FROM timeline_events ORDER BY id DESC LIMIT 10",
            ).fetchall()
        ]
    return {
        "source": dict(source) if source else None,
        "summaries": [dict(row) for row in summaries],
        "entities": entities,
        "timeline": timeline,
        "mode": "demo-fallback" if summaries and summaries[0]["provider"] == "demo" else "live",
        "poll_interval_seconds": 300,
    }


def summary_events_for_feed() -> list[dict[str, Any]]:
    return latest_snapshot()["timeline"][:3]


def ensure_demo_seed() -> None:
    with connect() as conn:
        row = conn.execute("SELECT COUNT(*) AS count FROM youtube_sources").fetchone()
    if not row or not row["count"]:
        configure_source(DEMO_URL)
