from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from circuit_report.service import build_report, change_image, latest_report

router = APIRouter(prefix="/api/circuits", tags=["circuit-report"])


class CircuitReportRequest(BaseModel):
    location: str
    raceContext: str | None = None


class ChangeCircuitImageRequest(BaseModel):
    location: str
    currentImageUrl: str | None = None


@router.post("/report")
async def create_report(payload: CircuitReportRequest) -> dict:
    try:
        return build_report(payload.location, payload.raceContext)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/report/latest")
async def get_latest_report() -> dict:
    return latest_report()


@router.post("/report/change-image")
async def rotate_report_image(payload: ChangeCircuitImageRequest) -> dict:
    try:
        return change_image(payload.location, payload.currentImageUrl)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
