from __future__ import annotations

from fastapi import APIRouter

from race_engineering.service import (
    ai_alerts,
    battles,
    degradation,
    fuel,
    pit_window,
    rivals,
    strategy,
    telemetry,
    tires,
)

router = APIRouter(prefix="/api/engineering", tags=["race-engineering"])


@router.get("/telemetry")
async def get_telemetry() -> dict:
    return telemetry()


@router.get("/tires")
async def get_tires() -> dict:
    return tires()


@router.get("/fuel")
async def get_fuel() -> dict:
    return fuel()


@router.get("/strategy")
async def get_strategy() -> dict:
    return strategy()


@router.get("/rivals")
async def get_rivals() -> dict:
    return rivals()


@router.get("/ai-alerts")
async def get_ai_alerts() -> dict:
    return ai_alerts()


@router.get("/pit-window")
async def get_pit_window() -> dict:
    return pit_window()


@router.get("/degradation")
async def get_degradation() -> dict:
    return degradation()


@router.get("/battles")
async def get_battles() -> dict:
    return battles()
