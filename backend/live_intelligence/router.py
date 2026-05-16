from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from live_intelligence.service import configure_source, create_summary, latest_snapshot

router = APIRouter(prefix="/api/live-source", tags=["live-intelligence"])


class YouTubeSourceRequest(BaseModel):
    url: str


@router.post("/youtube")
async def set_youtube_source(payload: YouTubeSourceRequest) -> dict:
    try:
        return configure_source(payload.url)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/status")
async def get_status() -> dict:
    return latest_snapshot()


@router.get("/summaries")
async def get_summaries() -> dict:
    snapshot = latest_snapshot()
    return {
        "source": snapshot["source"],
        "summaries": snapshot["summaries"],
        "entities": snapshot["entities"],
        "timeline": snapshot["timeline"],
        "mode": snapshot["mode"],
    }


@router.post("/summarize-now")
async def summarize_now() -> dict:
    return create_summary()
