from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from live_intelligence.service import (
    clear_commentary,
    configure_source,
    configure_sources,
    create_summary,
    latest_snapshot,
)

router = APIRouter(prefix="/api/live-source", tags=["live-intelligence"])
commentary_router = APIRouter(prefix="/api/commentary", tags=["race-commentary-intelligence"])


class YouTubeSourceRequest(BaseModel):
    url: str


class CommentarySourcesRequest(BaseModel):
    urls: list[str]


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


@commentary_router.post("/sources")
async def set_commentary_sources(payload: CommentarySourcesRequest) -> dict:
    try:
        return configure_sources(payload.urls)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@commentary_router.get("/status")
async def get_commentary_status() -> dict:
    return latest_snapshot()


@commentary_router.get("/summaries")
async def get_commentary_summaries() -> dict:
    return latest_snapshot()


@commentary_router.post("/summarize-now")
async def summarize_commentary_now() -> dict:
    return create_summary()


@commentary_router.post("/clear")
async def clear_commentary_sources() -> dict:
    return clear_commentary()
