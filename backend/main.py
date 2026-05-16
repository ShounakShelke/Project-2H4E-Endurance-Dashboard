from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from database import init_db, seed_db
from race_engineering.router import router as engineering_router
from race_engineering.service import build_snapshot


class ChannelHub:
    def __init__(self) -> None:
        self.channels: dict[str, set[WebSocket]] = {
            "telemetry": set(),
            "strategy": set(),
            "events": set(),
            "ml": set(),
            "rivals": set(),
        }

    async def connect(self, channel: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self.channels[channel].add(websocket)

    def disconnect(self, channel: str, websocket: WebSocket) -> None:
        self.channels[channel].discard(websocket)

    async def broadcast(self, channel: str, payload: dict) -> None:
        stale: list[WebSocket] = []
        for websocket in self.channels[channel]:
            try:
                await websocket.send_json(payload)
            except RuntimeError:
                stale.append(websocket)
        for websocket in stale:
            self.disconnect(channel, websocket)


hub = ChannelHub()


async def inference_loop() -> None:
    while True:
        snapshot = build_snapshot()
        await hub.broadcast("telemetry", snapshot["telemetry"])
        await hub.broadcast("strategy", snapshot["strategy"])
        await hub.broadcast("events", snapshot["events"])
        await hub.broadcast("ml", snapshot["ml"])
        await hub.broadcast("rivals", snapshot["rivals"])
        await asyncio.sleep(1.0)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    seed_db()
    task = asyncio.create_task(inference_loop())
    try:
        yield
    finally:
        task.cancel()


app = FastAPI(title="Project 2H4E Race Engineering Command Center", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(engineering_router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "race-engineering-command-center"}


async def websocket_endpoint(channel: str, websocket: WebSocket) -> None:
    await hub.connect(channel, websocket)
    try:
        await websocket.send_json(build_snapshot()[channel])
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        hub.disconnect(channel, websocket)


@app.websocket("/ws/telemetry")
async def ws_telemetry(websocket: WebSocket) -> None:
    await websocket_endpoint("telemetry", websocket)


@app.websocket("/ws/strategy")
async def ws_strategy(websocket: WebSocket) -> None:
    await websocket_endpoint("strategy", websocket)


@app.websocket("/ws/events")
async def ws_events(websocket: WebSocket) -> None:
    await websocket_endpoint("events", websocket)


@app.websocket("/ws/ml")
async def ws_ml(websocket: WebSocket) -> None:
    await websocket_endpoint("ml", websocket)


@app.websocket("/ws/rivals")
async def ws_rivals(websocket: WebSocket) -> None:
    await websocket_endpoint("rivals", websocket)
