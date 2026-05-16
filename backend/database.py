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
        """
        CREATE TABLE IF NOT EXISTS youtube_sources (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          url TEXT NOT NULL,
          video_id TEXT NOT NULL,
          status TEXT NOT NULL,
          last_polled_at TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS caption_segments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          source_id INTEGER NOT NULL,
          start_seconds INTEGER NOT NULL,
          text TEXT NOT NULL,
          mode TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(source_id) REFERENCES youtube_sources(id)
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS race_summaries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          source_id INTEGER NOT NULL,
          summary TEXT NOT NULL,
          provider TEXT NOT NULL,
          confidence REAL NOT NULL,
          status TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(source_id) REFERENCES youtube_sources(id)
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS summary_entities (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          summary_id INTEGER NOT NULL,
          entity_type TEXT NOT NULL,
          label TEXT NOT NULL,
          context TEXT NOT NULL,
          FOREIGN KEY(summary_id) REFERENCES race_summaries(id)
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS circuit_reports (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          location TEXT NOT NULL,
          race_context TEXT,
          overview TEXT NOT NULL,
          overtaking_zones TEXT NOT NULL,
          tire_fuel_notes TEXT NOT NULL,
          risk_areas TEXT NOT NULL,
          recommendations TEXT NOT NULL,
          source_title TEXT,
          source_url TEXT,
          image_url TEXT,
          data_source TEXT,
          source_status TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS timeline_events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          source TEXT NOT NULL,
          event_type TEXT NOT NULL,
          title TEXT NOT NULL,
          detail TEXT NOT NULL,
          car_no TEXT,
          team TEXT,
          severity TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
        """,
    ]
    with connect() as conn:
        for statement in statements:
            conn.execute(statement)
        existing_columns = {
            row["name"] for row in conn.execute("PRAGMA table_info(circuit_reports)").fetchall()
        }
        for column, definition in {
            "source_title": "TEXT",
            "source_url": "TEXT",
            "image_url": "TEXT",
            "data_source": "TEXT",
            "source_status": "TEXT",
        }.items():
            if column not in existing_columns:
                conn.execute(f"ALTER TABLE circuit_reports ADD COLUMN {column} {definition}")
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
