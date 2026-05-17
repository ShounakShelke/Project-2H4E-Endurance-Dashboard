from __future__ import annotations

import hashlib
import json
import os
import re
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from html import unescape
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


def _valid_url(url: str) -> str:
    clean = url.strip()
    parsed = urllib.parse.urlparse(clean)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError("Enter valid http or https commentary links.")
    return clean


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


def source_type_for_url(url: str) -> str:
    host = urllib.parse.urlparse(url).netloc.lower()
    if "youtube.com" in host or "youtu.be" in host:
        return "youtube"
    return "web-commentary"


def external_id_for_url(url: str, source_type: str) -> str:
    if source_type == "youtube":
        return parse_video_id(url)
    return hashlib.sha1(url.encode("utf-8")).hexdigest()[:16]


def provider_name() -> str:
    if os.getenv("PROJECT_2H4E_AI_API_URL") and os.getenv("PROJECT_2H4E_AI_API_KEY"):
        return "primary-ai"
    if os.getenv("GROQ_API_KEY"):
        return "groq"
    return "demo"


def _extract_json_object(text: str, marker: str) -> dict[str, Any] | None:
    start = text.find(marker)
    if start < 0:
        return None
    brace_start = text.find("{", start)
    if brace_start < 0:
        return None
    depth = 0
    for index in range(brace_start, len(text)):
        char = text[index]
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                try:
                    return json.loads(text[brace_start : index + 1])
                except Exception:
                    return None
    return None


def fetch_youtube_metadata(url: str) -> dict[str, str]:
    metadata = {
        "title": "YouTube commentary source",
        "author": "YouTube",
        "description": "",
        "watching": "",
        "hashtags": "",
        "live_status": "",
    }
    try:
        query = urllib.parse.urlencode({"url": url, "format": "json"})
        request = urllib.request.Request(
            f"https://www.youtube.com/oembed?{query}",
            headers={"User-Agent": "Project2H4E/1.0 (race-commentary-intelligence)"},
        )
        with urllib.request.urlopen(request, timeout=8) as response:
            body = json.loads(response.read().decode("utf-8"))
        metadata["title"] = str(body.get("title") or metadata["title"]).strip()[:180]
        metadata["author"] = str(body.get("author_name") or metadata["author"]).strip()[:120]
    except Exception:
        pass
    try:
        request = urllib.request.Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 Project2H4E/1.0",
                "Accept-Language": "en-US,en;q=0.9",
            },
        )
        with urllib.request.urlopen(request, timeout=10) as response:
            html = response.read(700_000).decode("utf-8", errors="ignore")
        player = _extract_json_object(html, "ytInitialPlayerResponse")
        microformat = (player or {}).get("microformat", {}).get("playerMicroformatRenderer", {})
        video_details = (player or {}).get("videoDetails", {})
        metadata["title"] = str(video_details.get("title") or metadata["title"]).strip()[:180]
        metadata["author"] = str(video_details.get("author") or metadata["author"]).strip()[:120]
        description = str(
            video_details.get("shortDescription") or microformat.get("description", {}).get("simpleText") or ""
        )
        metadata["description"] = re.sub(r"\s+", " ", description).strip()[:500]
        metadata["live_status"] = str(microformat.get("liveBroadcastDetails", {}).get("isLiveNow") or "").lower()
        watching_match = re.search(r'"viewCount"\s*:\s*"([^"]+)"', html)
        if watching_match:
            metadata["watching"] = watching_match.group(1)
        hashtags = sorted(set(re.findall(r"#\w+", f"{metadata['title']} {metadata['description']}")))
        metadata["hashtags"] = ", ".join(hashtags[:10])
    except Exception:
        pass
    return metadata


def fetch_caption_text(video_id: str, url: str) -> tuple[str, str, str]:
    if video_id == "project2h4e-demo":
        return DEMO_TRANSCRIPT, "demo", "Project 2H4E sample commentary"
    metadata = fetch_youtube_metadata(url)
    title = metadata["title"]
    transcript = (
        f"YouTube commentary source connected. Title: {metadata['title']}. "
        f"Channel: {metadata['author']}. Video ID: {video_id}. Source URL: {url}. "
        f"Live status: {metadata['live_status'] or 'unknown'}. "
        f"Watching/view context: {metadata['watching'] or 'not exposed'}. "
        f"Hashtags/entities: {metadata['hashtags'] or 'not exposed'}. "
        f"Description context: {metadata['description'] or 'not exposed'}. "
        "Public captions were not directly available to the server, so this summary is based on "
        "real YouTube metadata and source context rather than demo transcript data."
    )
    return transcript, "youtube-metadata", title


def fetch_web_commentary_text(url: str) -> tuple[str, str, str]:
    try:
        request = urllib.request.Request(
            url,
            headers={
                "User-Agent": "Project2H4E/1.0 (race-commentary-intelligence)",
                "Accept": "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.2",
            },
        )
        with urllib.request.urlopen(request, timeout=10) as response:
            raw = response.read(200_000).decode("utf-8", errors="ignore")
        title_match = re.search(r"<title[^>]*>(.*?)</title>", raw, re.IGNORECASE | re.DOTALL)
        title = unescape(re.sub(r"\s+", " ", title_match.group(1)).strip()) if title_match else url
        text = re.sub(r"<(script|style).*?</\1>", " ", raw, flags=re.IGNORECASE | re.DOTALL)
        text = re.sub(r"<[^>]+>", " ", text)
        text = unescape(re.sub(r"\s+", " ", text)).strip()
        if len(text) < 120:
            raise ValueError("Not enough public commentary text.")
        return text[:4000], "web-text", title[:180]
    except Exception:
        host = urllib.parse.urlparse(url).netloc or url
        title = f"Web commentary source: {host}"
        transcript = (
            f"Web commentary source connected. Source URL: {url}. Host: {host}. "
            "Public page text or captions were not directly available to the server, so this source "
            "is tracked as connected metadata rather than demo fallback."
        )
        return transcript, "web-metadata", title


def transcript_for_source(source: Any) -> tuple[str, str, str]:
    if source["source_type"] == "youtube":
        return fetch_caption_text(source["video_id"], source["url"])
    return fetch_web_commentary_text(source["url"])


def metadata_summary(transcript: str) -> str | None:
    if "source connected" not in transcript.lower():
        return None
    title_match = re.search(r"Title:\s*([^\.]+)", transcript)
    source_match = re.search(r"Source URL:\s*(\S+)", transcript)
    title = title_match.group(1).strip() if title_match else "commentary source"
    source = source_match.group(1).strip() if source_match else "submitted link"
    hash_match = re.search(r"Hashtags/entities:\s*([^\.]+)", transcript)
    desc_match = re.search(r"Description context:\s*([^\.]+(?:\.[^\.]+)?)", transcript)
    channel_match = re.search(r"Channel:\s*([^\.]+)", transcript)
    live_match = re.search(r"Live status:\s*([^\.]+)", transcript)
    channel = channel_match.group(1).strip() if channel_match else "source"
    hashtags = hash_match.group(1).strip() if hash_match else "not exposed"
    description = desc_match.group(1).strip() if desc_match else "metadata context available"
    live_status = live_match.group(1).strip() if live_match else "unknown"
    mentioned = ", ".join(sorted(set(re.findall(r"#\d{1,3}", f"{title} {hashtags} {description}"))))
    if not mentioned:
        mentioned = "no car numbers exposed in public metadata"
    focus_bits = []
    lowered = f"{title} {description} {hashtags}".lower()
    if "24h" in lowered or "nürburgring" in lowered or "nurburgring" in lowered:
        focus_bits.append("endurance race control, pit-cycle timing, traffic risk, and night/weather evolution")
    if "live timing" in lowered:
        focus_bits.append("cross-check this broadcast context with the connected timing feed")
    likely_focus = "; ".join(focus_bits) or "source context is connected; detailed incidents need captions, AI, or manual commentary text"
    return (
        f"Broadcast Context: {title} from {channel} is connected as a race commentary source "
        f"({source}). Live status from public metadata is {live_status}. "
        f"Likely Race Focus: {likely_focus}. "
        f"Mentioned Cars: {mentioned}. "
        f"Strategy Relevance: use this source as broadcast context while timing data confirms leaders, "
        "pit windows, tire loss, and incidents. Public captions were not exposed, so this is a "
        "metadata-based engineering summary, not demo fallback. "
        "Confidence: medium."
    )


def action_detail(summary: str, entities: list[dict[str, str]]) -> str:
    cars = [entity["label"] for entity in entities if entity["type"] == "car"]
    teams = [entity["label"] for entity in entities if entity["type"] == "team"]
    if "metadata-based engineering summary" in summary:
        car_text = ", ".join(cars[:4]) if cars else "no public car numbers"
        team_text = ", ".join(teams[:3]) if teams else "race broadcast"
        return (
            f"Metadata source is connected for {team_text}; watch {car_text}. "
            "Use live timing for confirmed gaps, pit calls, and incidents until captions become available."
        )
    first_sentence = re.split(r"(?<=[.!?])\s+", summary.strip())[0]
    return first_sentence[:260]


def deterministic_summary(transcript: str) -> tuple[str, str, float, str]:
    source_summary = metadata_summary(transcript)
    if source_summary:
        return source_summary, "source-metadata", 0.66, "source-connected"
    return (
        "Pit strategy is active for #7 Toyota, tire degradation is building on #51 Ferrari, "
        "#911 Porsche is trending toward a stop within three laps, and #6 Porsche has a short "
        "clean-air push window. Weather risk is low but increasing around the circuit."
    ), "demo", 0.72, "demo"


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
                "content": "Summarize motorsport race commentary for a race engineer. Be concise and extract race-relevant events.",
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
    return deterministic_summary(transcript)


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
    if "metadata-based engineering summary" in lowered or "broadcast context" in lowered:
        return "summary", "Broadcast context connected", "info"
    if "pit" in lowered:
        return "strategy", "Pit cycle intelligence", "warning"
    if "tire" in lowered:
        return "tire", "Tire degradation intelligence", "warning"
    if "rain" in lowered or "weather" in lowered:
        return "weather", "Weather risk intelligence", "info"
    return "summary", "Race commentary summary", "info"


def configure_sources(urls: list[str]) -> dict[str, Any]:
    clean_urls = []
    for url in urls:
        if url.strip():
            clean_urls.append(_valid_url(url))
    if not clean_urls:
        raise ValueError("Add at least one commentary or video link.")
    with connect() as conn:
        conn.execute("UPDATE youtube_sources SET status = 'inactive' WHERE status = 'active'")
        source_ids = []
        for url in clean_urls:
            source_type = source_type_for_url(url)
            external_id = external_id_for_url(url, source_type)
            cursor = conn.execute(
                """
                INSERT INTO youtube_sources
                  (url, video_id, status, source_type, title, transcript_mode, last_polled_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (url, external_id, "active", source_type, None, None, utc_now()),
            )
            source_ids.append(cursor.lastrowid)
        conn.commit()
    for source_id in source_ids:
        create_summary(source_id)
    return latest_snapshot()


def configure_source(url: str) -> dict[str, Any]:
    return configure_sources([url])


def active_source_ids() -> list[int]:
    with connect() as conn:
        rows = conn.execute(
            "SELECT id FROM youtube_sources WHERE status = 'active' ORDER BY id DESC"
        ).fetchall()
    return [int(row["id"]) for row in rows]


def create_summary(source_id: int | None = None) -> dict[str, Any]:
    source_ids = [source_id] if source_id else active_source_ids()
    if not source_ids:
        return latest_snapshot()
    with connect() as conn:
        for current_source_id in source_ids:
            source = conn.execute(
                "SELECT * FROM youtube_sources WHERE id = ?", (current_source_id,)
            ).fetchone()
            if not source:
                continue
            transcript, transcript_mode, title = transcript_for_source(source)
            summary, provider, confidence, status = summarize_transcript(transcript)
            conn.execute(
                "INSERT INTO caption_segments (source_id, start_seconds, text, mode) VALUES (?, ?, ?, ?)",
                (current_source_id, 0, transcript, transcript_mode),
            )
            cursor = conn.execute(
                "INSERT INTO race_summaries (source_id, summary, provider, confidence, status) VALUES (?, ?, ?, ?, ?)",
                (current_source_id, summary, provider, confidence, status),
            )
            summary_id = cursor.lastrowid
            entities = extract_entities(summary)
            for entity in entities:
                conn.execute(
                    "INSERT INTO summary_entities (summary_id, entity_type, label, context) VALUES (?, ?, ?, ?)",
                    (summary_id, entity["type"], entity["label"], entity["context"]),
                )
            event_type, event_title, severity = classify_event(summary)
            car = next((e["label"] for e in entities if e["type"] == "car"), None)
            team = next((e["label"] for e in entities if e["type"] == "team"), None)
            detail = action_detail(summary, entities)
            conn.execute(
                "INSERT INTO timeline_events (source, event_type, title, detail, car_no, team, severity) VALUES (?, ?, ?, ?, ?, ?, ?)",
                ("race-commentary", event_type, event_title, detail, car, team, severity),
            )
            conn.execute(
                """
                UPDATE youtube_sources
                SET last_polled_at = ?, status = 'active', title = ?, transcript_mode = ?
                WHERE id = ?
                """,
                (utc_now(), title, transcript_mode, current_source_id),
            )
        conn.commit()
    return latest_snapshot()


def latest_snapshot() -> dict[str, Any]:
    with connect() as conn:
        sources = [
            dict(row)
            for row in conn.execute(
                "SELECT * FROM youtube_sources WHERE status = 'active' ORDER BY id DESC"
            ).fetchall()
        ]
        source_ids = [source["id"] for source in sources]
        summaries = []
        entities = []
        if source_ids:
            placeholders = ",".join("?" for _ in source_ids)
            summaries = [
                dict(row)
                for row in conn.execute(
                    f"""
                    SELECT rs.*, ys.url, ys.video_id, ys.source_type, ys.title AS source_title
                    FROM race_summaries rs
                    JOIN youtube_sources ys ON ys.id = rs.source_id
                    WHERE ys.id IN ({placeholders})
                    ORDER BY rs.id DESC
                    LIMIT 6
                    """,
                    source_ids,
                ).fetchall()
            ]
            latest_summary_id = summaries[0]["id"] if summaries else None
            if latest_summary_id:
                entities = [
                    dict(row)
                    for row in conn.execute(
                        "SELECT entity_type, label, context FROM summary_entities WHERE summary_id = ? ORDER BY id",
                        (latest_summary_id,),
                    ).fetchall()
                ]
            raw_timeline = [
                dict(row)
                for row in conn.execute(
                    "SELECT * FROM timeline_events WHERE source = 'race-commentary' ORDER BY id DESC LIMIT 24",
                ).fetchall()
            ]
            timeline = []
            seen_details = set()
            for event in raw_timeline:
                key = re.sub(r"\s+", " ", str(event.get("detail", "")).strip().lower())
                if key in seen_details:
                    continue
                seen_details.add(key)
                timeline.append(event)
                if len(timeline) >= 10:
                    break
        else:
            timeline = []
    mode = "blank"
    if summaries:
        mode = "demo-fallback" if summaries[0]["provider"] == "demo" else "live"
    return {
        "source": sources[0] if sources else None,
        "sources": sources,
        "summaries": summaries,
        "entities": entities,
        "timeline": timeline,
        "mode": mode,
        "poll_interval_seconds": 300,
    }


def clear_commentary() -> dict[str, Any]:
    with connect() as conn:
        source_rows = conn.execute("SELECT id FROM youtube_sources").fetchall()
        source_ids = [row["id"] for row in source_rows]
        if source_ids:
            placeholders = ",".join("?" for _ in source_ids)
            summary_rows = conn.execute(
                f"SELECT id FROM race_summaries WHERE source_id IN ({placeholders})", source_ids
            ).fetchall()
            summary_ids = [row["id"] for row in summary_rows]
            if summary_ids:
                summary_placeholders = ",".join("?" for _ in summary_ids)
                conn.execute(
                    f"DELETE FROM summary_entities WHERE summary_id IN ({summary_placeholders})",
                    summary_ids,
                )
            conn.execute(f"DELETE FROM race_summaries WHERE source_id IN ({placeholders})", source_ids)
            conn.execute(f"DELETE FROM caption_segments WHERE source_id IN ({placeholders})", source_ids)
        conn.execute("DELETE FROM timeline_events WHERE source IN ('race-commentary', 'live-youtube')")
        conn.execute("UPDATE youtube_sources SET status = 'inactive'")
        conn.commit()
    return latest_snapshot()


def summary_events_for_feed() -> list[dict[str, Any]]:
    return latest_snapshot()["timeline"][:3]


def ensure_demo_seed() -> None:
    # Blank-by-default UI: demo data is created only when a user clicks Load Full Sample.
    clear_commentary()
    return None
