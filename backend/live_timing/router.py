from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from live_timing.service import clear_source, configure_source, latest_snapshot, scrape_now

router = APIRouter(prefix="/api/live-timing", tags=["live-timing"])


class LiveTimingSourceRequest(BaseModel):
    url: str


@router.post("/source")
async def set_live_timing_source(payload: LiveTimingSourceRequest) -> dict:
    try:
        return await configure_source(payload.url)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/status")
async def get_live_timing_status() -> dict:
    return latest_snapshot()


@router.get("/standings")
async def get_live_timing_standings() -> dict:
    return latest_snapshot()


@router.post("/scrape-now")
async def scrape_live_timing_now() -> dict:
    return await scrape_now()


@router.post("/clear")
async def clear_live_timing_source() -> dict:
    return clear_source()
