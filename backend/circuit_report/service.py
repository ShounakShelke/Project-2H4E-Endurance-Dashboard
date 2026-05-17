from __future__ import annotations

import json
import os
import re
from typing import Any
from urllib.error import URLError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen

from database import connect

USER_AGENT = "Project2H4E/1.0 (race-engineering-dashboard)"

ACCEPT_IMAGE_KEYWORDS = (
    "circuit",
    "track",
    "layout",
    "map",
    "course",
    "nordschleife",
    "grand prix",
    "route",
    "strecke",
)

REJECT_IMAGE_KEYWORDS = (
    "logo",
    "icon",
    "seal",
    "poster",
    "portrait",
    "podium",
    "car",
    "flag",
    "badge",
    "emblem",
    "wordmark",
)


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
            "srlimit": "8",
        }
    )
    data = _request_json(f"https://en.wikipedia.org/w/api.php?{query}")
    results = data.get("query", {}).get("search", [])
    if not results:
        return None
    for result in results:
        title = str(result.get("title", "")).lower()
        if "circuit" in title or "raceway" in title or "speedway" in title:
            return result
    return results[0]


def _wikipedia_summary(title: str) -> dict[str, Any]:
    return _request_json(f"https://en.wikipedia.org/api/rest_v1/page/summary/{quote(title)}")


def _wikipedia_page_images(title: str) -> list[str]:
    query = urlencode(
        {
            "action": "query",
            "prop": "images",
            "titles": title,
            "imlimit": "50",
            "format": "json",
        }
    )
    data = _request_json(f"https://en.wikipedia.org/w/api.php?{query}")
    pages = data.get("query", {}).get("pages", {})
    images: list[str] = []
    for page in pages.values():
        for image in page.get("images", []):
            image_title = image.get("title")
            if image_title:
                images.append(image_title)
    return images


def _commons_file_search(location: str, title: str) -> list[str]:
    searches = [
        f"{title} circuit map",
        f"{title} track layout",
        f"{location} circuit layout",
        f"{location} racing circuit map",
    ]
    results: list[str] = []
    seen: set[str] = set()
    for search in searches:
        query = urlencode(
            {
                "action": "query",
                "list": "search",
                "srnamespace": "6",
                "srsearch": search,
                "srlimit": "20",
                "format": "json",
            }
        )
        try:
            data = _request_json(f"https://commons.wikimedia.org/w/api.php?{query}")
        except Exception:
            continue
        for result in data.get("query", {}).get("search", []):
            file_title = result.get("title")
            if file_title and file_title not in seen:
                seen.add(file_title)
                results.append(file_title)
    return results


def _image_infos(file_titles: list[str]) -> list[dict[str, Any]]:
    if not file_titles:
        return []
    infos: list[dict[str, Any]] = []
    for start in range(0, len(file_titles), 40):
        batch = file_titles[start : start + 40]
        query = urlencode(
            {
                "action": "query",
                "prop": "imageinfo",
                "titles": "|".join(batch),
                "iiprop": "url|mime|extmetadata",
                "format": "json",
            }
        )
        try:
            data = _request_json(f"https://commons.wikimedia.org/w/api.php?{query}")
        except Exception:
            continue
        for page in data.get("query", {}).get("pages", {}).values():
            imageinfo = page.get("imageinfo", [])
            if not imageinfo:
                continue
            info = imageinfo[0]
            infos.append(
                {
                    "title": page.get("title", ""),
                    "url": info.get("url", ""),
                    "mime": info.get("mime", ""),
                }
            )
    return infos


def _candidate_reason(title: str, mime: str) -> str | None:
    lower = title.lower().replace("_", " ")
    if any(keyword in lower for keyword in REJECT_IMAGE_KEYWORDS):
        return None
    if mime and not mime.startswith("image/"):
        return None
    if not any(lower.endswith(ext) for ext in (".svg", ".png", ".jpg", ".jpeg")):
        return None
    matched = [keyword for keyword in ACCEPT_IMAGE_KEYWORDS if keyword in lower]
    if not matched:
        return None
    return f"Accepted Wikimedia circuit image: filename contains {', '.join(matched[:3])}."


def _image_sort_key(candidate: dict[str, Any]) -> tuple[int, int, str]:
    title = str(candidate.get("title", "")).lower()
    mime = str(candidate.get("mime", "")).lower()
    if mime == "image/svg+xml" or title.endswith(".svg"):
        file_rank = 0
    elif title.endswith(".png"):
        file_rank = 1
    else:
        file_rank = 2
    layout_rank = 0 if any(word in title for word in ("layout", "map", "track")) else 1
    return (file_rank, layout_rank, title)


def _thumbnail_candidate(summary: dict[str, Any]) -> dict[str, Any] | None:
    image_url = summary.get("originalimage", {}).get("source") or summary.get("thumbnail", {}).get(
        "source"
    )
    if not image_url:
        return None
    title = image_url.rsplit("/", 1)[-1]
    mime = "image/svg+xml" if title.lower().endswith(".svg") else "image/*"
    reason = _candidate_reason(title, mime)
    if not reason:
        return None
    return {"title": title, "url": image_url, "mime": mime, "reason": reason}


def _circuit_image_candidates(
    location: str, title: str, summary: dict[str, Any]
) -> list[dict[str, Any]]:
    file_titles: list[str] = []
    seen_titles: set[str] = set()
    try:
        wikipedia_images = _wikipedia_page_images(title)
    except Exception:
        wikipedia_images = []
    for file_title in [*wikipedia_images, *_commons_file_search(location, title)]:
        if file_title and file_title not in seen_titles:
            seen_titles.add(file_title)
            file_titles.append(file_title)

    candidates: list[dict[str, Any]] = []
    seen_urls: set[str] = set()
    for info in _image_infos(file_titles):
        reason = _candidate_reason(str(info.get("title", "")), str(info.get("mime", "")))
        url = str(info.get("url", ""))
        if reason and url and url not in seen_urls:
            seen_urls.add(url)
            candidates.append({**info, "reason": reason})

    thumbnail = _thumbnail_candidate(summary)
    if thumbnail and thumbnail["url"] not in seen_urls:
        candidates.append(thumbnail)

    return sorted(candidates, key=_image_sort_key)


def _decode_candidates(value: Any) -> list[dict[str, Any]]:
    if isinstance(value, list):
        return [item for item in value if isinstance(item, dict)]
    if not value:
        return []
    try:
        parsed = json.loads(value)
    except (TypeError, json.JSONDecodeError):
        return []
    return [item for item in parsed if isinstance(item, dict)] if isinstance(parsed, list) else []


def _serialize_report(report: dict[str, Any]) -> dict[str, Any]:
    serialized = dict(report)
    serialized["image_candidates"] = _decode_candidates(serialized.get("image_candidates"))
    return serialized


def _google_context(location: str) -> dict[str, str]:
    search_url = f"https://www.google.com/search?q={quote(f'{location} racing circuit endurance')}"
    key = os.getenv("GOOGLE_API_KEY")
    cx = os.getenv("GOOGLE_CSE_ID")
    if not key or not cx:
        return {
            "google_source_title": "Google circuit search",
            "google_source_url": search_url,
            "google_source_snippet": "Google API keys are not configured, so the dashboard provides a direct Google search link instead of scraped results.",
            "google_status": "search-link",
        }
    query = urlencode(
        {
            "key": key,
            "cx": cx,
            "q": f"{location} racing circuit endurance overtaking tire fuel strategy",
            "num": "1",
        }
    )
    data = _request_json(f"https://www.googleapis.com/customsearch/v1?{query}")
    items = data.get("items", [])
    if not items:
        return {
            "google_source_title": "Google circuit search",
            "google_source_url": search_url,
            "google_source_snippet": "Google Programmable Search returned no matching circuit context.",
            "google_status": "empty",
        }
    item = items[0]
    return {
        "google_source_title": item.get("title", "Google circuit result"),
        "google_source_url": item.get("link", search_url),
        "google_source_snippet": item.get("snippet", ""),
        "google_status": "live",
    }


def _weather_code_label(code: int | None) -> str:
    if code is None:
        return "unknown"
    if code == 0:
        return "clear"
    if code in {1, 2, 3}:
        return "partly cloudy"
    if code in {45, 48}:
        return "fog"
    if code in {51, 53, 55, 56, 57}:
        return "drizzle"
    if code in {61, 63, 65, 66, 67, 80, 81, 82}:
        return "rain"
    if code in {71, 73, 75, 77, 85, 86}:
        return "snow"
    if code in {95, 96, 99}:
        return "thunderstorm"
    return "mixed"


def _weather_context(location: str) -> dict[str, Any]:
    fallback = {
        "weather_summary": "Weather unavailable for this circuit location.",
        "weather_temperature_c": None,
        "weather_condition": "unavailable",
        "weather_wind_kph": None,
        "weather_source_status": "unavailable",
        "weather_source": "Open-Meteo",
    }
    try:
        weather_location = location
        lowered = location.lower()
        known_coordinates: tuple[float, float, str] | None = None
        if "n\u00fcrburgring" in lowered or "nurburgring" in lowered:
            weather_location = "N\u00fcrburg"
            known_coordinates = (50.3356, 6.9475, "N\u00fcrburgring, Germany")
        elif "spa" in lowered:
            weather_location = "Stavelot"
            known_coordinates = (50.4372, 5.9714, "Spa-Francorchamps, Belgium")
        elif "sarthe" in lowered or "lemans" in lowered or "le mans" in lowered:
            weather_location = "Le Mans"
            known_coordinates = (47.9566, 0.2077, "Circuit de la Sarthe, France")
        if known_coordinates:
            latitude, longitude, place = known_coordinates
        else:
            search = urlencode(
                {"name": weather_location, "count": "1", "language": "en", "format": "json"}
            )
            geocoded = _request_json(f"https://geocoding-api.open-meteo.com/v1/search?{search}")
            result = (geocoded.get("results") or [None])[0]
            if not result:
                return {**fallback, "weather_summary": f"Weather lookup could not resolve {location}."}
            latitude = result.get("latitude")
            longitude = result.get("longitude")
            place = ", ".join(
                item
                for item in [
                    str(result.get("name") or "").strip(),
                    str(result.get("country") or "").strip(),
                ]
                if item
            )
        forecast_query = urlencode(
            {
                "latitude": latitude,
                "longitude": longitude,
                "current": "temperature_2m,weather_code,wind_speed_10m",
                "timezone": "auto",
            }
        )
        forecast = _request_json(f"https://api.open-meteo.com/v1/forecast?{forecast_query}")
        current = forecast.get("current", {})
        temperature = current.get("temperature_2m")
        wind = current.get("wind_speed_10m")
        condition = _weather_code_label(current.get("weather_code"))
        temp_text = f"{float(temperature):.1f}C" if temperature is not None else "unknown temp"
        wind_text = f"{float(wind):.0f} kph wind" if wind is not None else "unknown wind"
        return {
            "weather_summary": f"{place or location}: {temp_text}, {condition}, {wind_text}.",
            "weather_temperature_c": temperature,
            "weather_condition": condition,
            "weather_wind_kph": wind,
            "weather_source_status": "live",
            "weather_source": "Open-Meteo",
        }
    except Exception:
        return fallback


def _normalize_location(location: str) -> str:
    clean_location = " ".join(location.strip().split())
    normalized = clean_location.lower()
    mojibake = "n" + "\u00e3" + "\u00bc" + "rburgring"
    if normalized in {"nurburgring", "nurbergring", "nuerburgring", mojibake}:
        return "N\u00fcrburgring"
    return clean_location


def _clean_extract(text: str) -> str:
    clean = re.sub(r"\s+", " ", text or "").strip()
    return clean[:900] if clean else ""


def _derive_report_from_source(
    location: str,
    race_context: str,
    summary: dict[str, Any],
    google: dict[str, str],
    weather: dict[str, Any],
) -> dict[str, Any]:
    extract = _clean_extract(summary.get("extract", ""))
    title = summary.get("title") or location
    source_url = summary.get("content_urls", {}).get("desktop", {}).get("page")
    image_candidates = _circuit_image_candidates(location, title, summary)
    first_image = image_candidates[0] if image_candidates else {}
    image_url = first_image.get("url", "")
    image_status = "circuit-image" if image_url else "no-circuit-image"
    image_reason = first_image.get(
        "reason", "No Wikimedia image passed the circuit-only filter."
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
    if google.get("google_source_snippet") and google.get("google_status") == "live":
        overview = f"{overview} Google source context: {google['google_source_snippet']}"
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
        "image_status": image_status,
        "image_candidates": image_candidates,
        "image_index": 0,
        "image_reason": image_reason,
        "data_source": (
            "Wikipedia / Wikimedia + Google Programmable Search"
            if google.get("google_status") == "live"
            else "Wikipedia / Wikimedia + Google search link"
        ),
        "source_status": "live",
        **google,
        **weather,
    }


def _fallback_report(
    location: str, race_context: str, google: dict[str, str], weather: dict[str, Any]
) -> dict[str, Any]:
    return {
        "location": location,
        "race_context": race_context,
        "overview": (
            f"Live Wikipedia lookup was unavailable for {location}. Source-backed circuit details are not confirmed yet; rebuild the report when external lookup is available."
        ),
        "overtaking_zones": "No source-backed overtaking zones are available from Wikipedia/Wikimedia for this lookup.",
        "tire_fuel_notes": "No source-backed tire or fuel implications are available until the circuit lookup succeeds.",
        "risk_areas": "Treat pit exit, cold tires, local yellows, traffic, and weather as manual engineer checks until live circuit data loads.",
        "recommendations": "Rebuild with the exact circuit name or check the source links. Do not treat this fallback as confirmed circuit intelligence.",
        "source_title": location,
        "source_url": f"https://en.wikipedia.org/wiki/Special:Search?search={quote(location)}",
        "image_url": "",
        "image_status": "no-circuit-image",
        "image_candidates": [],
        "image_index": 0,
        "image_reason": "Live source lookup failed before Wikimedia image candidates could be validated.",
        "data_source": "Wikipedia lookup fallback",
        "source_status": "fallback",
        **google,
        **weather,
    }


def build_report(location: str, race_context: str | None = None) -> dict[str, Any]:
    clean_location = _normalize_location(location)
    if len(clean_location) < 2:
        raise ValueError("Enter a circuit or place name.")
    context = race_context or "endurance race strategy"
    google = _google_context(clean_location)
    weather = _weather_context(clean_location)
    try:
        page = _find_wikipedia_page(clean_location)
        if not page:
            raise URLError("No Wikipedia result")
        summary = _wikipedia_summary(page["title"])
        report = _derive_report_from_source(clean_location, context, summary, google, weather)
    except Exception:
        report = _fallback_report(clean_location, context, google, weather)

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
                image_status,
                image_candidates,
                image_index,
                image_reason,
                data_source,
                source_status,
                google_source_title,
                google_source_url,
                google_source_snippet,
                google_status,
                weather_summary,
                weather_temperature_c,
                weather_condition,
                weather_wind_kph,
                weather_source_status,
                weather_source
              )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                report["image_status"],
                json.dumps(report["image_candidates"]),
                report["image_index"],
                report["image_reason"],
                report["data_source"],
                report["source_status"],
                report["google_source_title"],
                report["google_source_url"],
                report["google_source_snippet"],
                report["google_status"],
                report["weather_summary"],
                report["weather_temperature_c"],
                report["weather_condition"],
                report["weather_wind_kph"],
                report["weather_source_status"],
                report["weather_source"],
            ),
        )
        conn.commit()
        report["id"] = cursor.lastrowid
    return _serialize_report(report)


def latest_report() -> dict[str, Any]:
    with connect() as conn:
        row = conn.execute("SELECT * FROM circuit_reports ORDER BY id DESC LIMIT 1").fetchone()
    if not row:
        return build_report("Circuit de la Sarthe", "sample endurance race")
    report = _serialize_report(dict(row))
    if not report.get("source_status"):
        return build_report(report["location"], report.get("race_context"))
    return report


def change_image(location: str, current_image_url: str | None = None) -> dict[str, Any]:
    clean_location = _normalize_location(location)
    if len(clean_location) < 2:
        raise ValueError("Enter a circuit or place name.")
    with connect() as conn:
        row = conn.execute(
            """
            SELECT * FROM circuit_reports
            WHERE lower(location) = lower(?)
            ORDER BY id DESC
            LIMIT 1
            """,
            (clean_location,),
        ).fetchone()
    report = _serialize_report(dict(row)) if row else build_report(clean_location)
    candidates = _decode_candidates(report.get("image_candidates"))
    if not candidates:
        report = build_report(clean_location, report.get("race_context"))
        candidates = _decode_candidates(report.get("image_candidates"))
    if not candidates:
        report.update(
            {
                "image_url": "",
                "image_status": "no-circuit-image",
                "image_index": 0,
                "image_reason": "No backend-approved circuit image candidates are available.",
                "image_candidates": [],
            }
        )
        return report

    urls = [candidate.get("url") for candidate in candidates]
    current_url = current_image_url or report.get("image_url")
    try:
        current_index = urls.index(current_url)
    except ValueError:
        current_index = int(report.get("image_index") or 0) - 1
    next_index = (current_index + 1) % len(candidates)
    selected = candidates[next_index]
    report.update(
        {
            "image_url": selected.get("url", ""),
            "image_status": "circuit-image",
            "image_index": next_index,
            "image_reason": selected.get("reason", "Backend-approved circuit image."),
            "image_candidates": candidates,
        }
    )
    with connect() as conn:
        conn.execute(
            """
            UPDATE circuit_reports
            SET image_url = ?,
                image_status = ?,
                image_index = ?,
                image_reason = ?
            WHERE id = ?
            """,
            (
                report["image_url"],
                report["image_status"],
                report["image_index"],
                report["image_reason"],
                report.get("id"),
            ),
        )
        conn.commit()
    return report
