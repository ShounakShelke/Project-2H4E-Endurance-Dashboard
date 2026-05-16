from __future__ import annotations

import json
import re
from typing import Any
from urllib.error import URLError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen

from database import connect

USER_AGENT = "Project2H4E/1.0 (race-engineering-dashboard)"


def _request_json(url: str) -> dict[str, Any]:
    request = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(request, timeout=8) as response:
        return json.loads(response.read().decode("utf-8"))


def _find_wikipedia_page(location: str) -> dict[str, Any] | None:
    query = urlencode(
        {
            "action": "query",
            "list": "search",
            "srsearch": f"{location} racing circuit motorsport",
            "format": "json",
            "utf8": "1",
            "srlimit": "1",
        }
    )
    data = _request_json(f"https://en.wikipedia.org/w/api.php?{query}")
    results = data.get("query", {}).get("search", [])
    if not results:
        return None
    return results[0]


def _wikipedia_summary(title: str) -> dict[str, Any]:
    return _request_json(f"https://en.wikipedia.org/api/rest_v1/page/summary/{quote(title)}")


def _clean_extract(text: str) -> str:
    clean = re.sub(r"\s+", " ", text or "").strip()
    return clean[:900] if clean else ""


def _derive_report_from_source(
    location: str,
    race_context: str,
    summary: dict[str, Any],
) -> dict[str, Any]:
    extract = _clean_extract(summary.get("extract", ""))
    title = summary.get("title") or location
    source_url = summary.get("content_urls", {}).get("desktop", {}).get("page")
    image_url = summary.get("thumbnail", {}).get("source") or summary.get("originalimage", {}).get(
        "source"
    )
    lower = extract.lower()
    endurance_note = (
        "Long-run execution should focus on stable tire temperatures, traffic release, and avoiding overlap with slower classes."
    )
    if "street circuit" in lower:
        passing = "Use pit timing and restart positioning first. On-track passing should be reserved for the heaviest braking references because walls and limited runoff raise the cost of contact."
        risks = "Primary risks are wall proximity, safety-car compression, poor visibility around incidents, and cold tires after slow running."
    elif "road course" in lower or "race track" in lower or "circuit" in lower:
        passing = "Plan overtakes around the longest acceleration zones and the following braking phase. Traffic clearing before the pit window is more valuable than a marginal low-percentage move."
        risks = "Watch pit exit, multi-class closing speeds, local yellow zones, and tire warm-up on out laps."
    else:
        passing = "Treat the venue as a location-driven circuit profile until more precise telemetry arrives. Prioritize clean exits, low-risk braking moves, and pit-cycle positioning."
        risks = "Main risks are unknown grip evolution, weather changes, and conservative traffic calls until live timing confirms the surface trend."
    if "elevation" in lower or "hill" in lower:
        tire_fuel = "Elevation changes increase traction demand and fuel sensitivity. Protect rear tires on loaded exits and lift early before the highest-energy braking zones."
    else:
        tire_fuel = "Run the first laps of each stint below peak attack to control thermal rise, then release pace once degradation stabilizes. Fuel save should use lift-and-coast before major braking references."
    overview = (
        f"Wikipedia source: {extract}"
        if extract
        else f"{title} report generated from live source lookup with limited public summary text available."
    )
    return {
        "location": location,
        "race_context": race_context,
        "overview": overview,
        "overtaking_zones": passing,
        "tire_fuel_notes": f"{tire_fuel} {endurance_note}",
        "risk_areas": risks,
        "recommendations": "Build strategy from the live circuit report first, then let telemetry confirm tire drop, traffic windows, and stop timing. Re-run the report when the user changes location.",
        "source_title": title,
        "source_url": source_url,
        "image_url": image_url,
        "data_source": "Wikipedia / Wikimedia",
        "source_status": "live",
    }


def _fallback_report(location: str, race_context: str) -> dict[str, Any]:
    return {
        "location": location,
        "race_context": race_context,
        "overview": (
            f"Live Wikipedia lookup was unavailable for {location}. This fallback keeps the dashboard testable while the backend retries external circuit sources."
        ),
        "overtaking_zones": "Use the longest approach to a heavy braking zone as the primary passing area, then evaluate secondary moves from live sector and gap data.",
        "tire_fuel_notes": "Protect tires at the start of the stint, use lift-and-coast before the biggest braking references, and update fuel targets from live telemetry.",
        "risk_areas": "Fallback mode cannot confirm exact layout hazards, so flag pit exit, cold tires, local yellows, and weather as high-priority checks.",
        "recommendations": "Enter the exact circuit name and rebuild when internet access is available. Until then, use the sample telemetry and live intelligence panels for a complete demo.",
        "source_title": location,
        "source_url": f"https://en.wikipedia.org/wiki/Special:Search?search={quote(location)}",
        "image_url": "",
        "data_source": "Wikipedia lookup fallback",
        "source_status": "fallback",
    }


def build_report(location: str, race_context: str | None = None) -> dict[str, Any]:
    clean_location = " ".join(location.strip().split())
    if len(clean_location) < 2:
        raise ValueError("Enter a circuit or place name.")
    context = race_context or "endurance race strategy"
    try:
        page = _find_wikipedia_page(clean_location)
        if not page:
            raise URLError("No Wikipedia result")
        summary = _wikipedia_summary(page["title"])
        report = _derive_report_from_source(clean_location, context, summary)
    except Exception:
        report = _fallback_report(clean_location, context)

    with connect() as conn:
        cursor = conn.execute(
            """
            INSERT INTO circuit_reports
              (
                location,
                race_context,
                overview,
                overtaking_zones,
                tire_fuel_notes,
                risk_areas,
                recommendations,
                source_title,
                source_url,
                image_url,
                data_source,
                source_status
              )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                report["location"],
                report["race_context"],
                report["overview"],
                report["overtaking_zones"],
                report["tire_fuel_notes"],
                report["risk_areas"],
                report["recommendations"],
                report["source_title"],
                report["source_url"],
                report["image_url"],
                report["data_source"],
                report["source_status"],
            ),
        )
        conn.commit()
        report["id"] = cursor.lastrowid
    return report


def latest_report() -> dict[str, Any]:
    with connect() as conn:
        row = conn.execute("SELECT * FROM circuit_reports ORDER BY id DESC LIMIT 1").fetchone()
    if not row:
        return build_report("Circuit de la Sarthe", "sample endurance race")
    report = dict(row)
    if not report.get("source_status"):
        return build_report(report["location"], report.get("race_context"))
    return report
