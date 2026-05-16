from __future__ import annotations

import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).with_name("race_engineering.sqlite3")


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    statements = [
        """
        CREATE TABLE IF NOT EXISTS tire_metrics (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          car_no TEXT NOT NULL,
          tire_age INTEGER NOT NULL,
          degradation REAL NOT NULL,
          thermal_stress REAL NOT NULL,
          life_remaining REAL NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS fuel_metrics (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          car_no TEXT NOT NULL,
          burn_kg_lap REAL NOT NULL,
          laps_remaining REAL NOT NULL,
          save_mode TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS strategy_predictions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          car_no TEXT NOT NULL,
          pit_window_open INTEGER NOT NULL,
          pit_window_close INTEGER NOT NULL,
          confidence REAL NOT NULL,
          recommendation TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS rival_analysis (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          car_no TEXT NOT NULL,
          rival_no TEXT NOT NULL,
          gap_seconds REAL NOT NULL,
          battle_intensity REAL NOT NULL,
          threat_score REAL NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS telemetry_snapshots (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          car_no TEXT NOT NULL,
          lap INTEGER NOT NULL,
          speed_kph REAL NOT NULL,
          throttle REAL NOT NULL,
          brake REAL NOT NULL,
          tire_temp_c REAL NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS ai_engineer_alerts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          severity TEXT NOT NULL,
          confidence REAL NOT NULL,
          message TEXT NOT NULL,
          explanation TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
        """,
    ]
    with connect() as conn:
        for statement in statements:
            conn.execute(statement)
        conn.commit()


def seed_db() -> None:
    with connect() as conn:
        row = conn.execute("SELECT COUNT(*) AS count FROM ai_engineer_alerts").fetchone()
        if row and row["count"]:
            return
        conn.execute(
            "INSERT INTO ai_engineer_alerts (severity, confidence, message, explanation) VALUES (?, ?, ?, ?)",
            ("critical", 0.91, "Pit window opening in 2 laps.", "Traffic model shows clean release if car #7 stops before #6."),
        )
        conn.commit()
