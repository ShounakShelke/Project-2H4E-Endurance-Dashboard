from __future__ import annotations

from datetime import datetime, timezone

from fuel_models.predictor import FuelConsumptionPredictor
from rival_analysis.engine import BattlePredictionEngine
from strategy_engine.optimizer import PitWindowOptimizer, StrategySimulationEngine
from strategy_engine.reliability import ReliabilityRiskPredictor
from telemetry.generator import telemetry_frame
from tire_models.predictor import TireDegradationPredictor
from race_engineering.driver import driver_engineering

tire_model = TireDegradationPredictor()
fuel_model = FuelConsumptionPredictor()
pit_model = PitWindowOptimizer()
battle_model = BattlePredictionEngine()
sim_model = StrategySimulationEngine()
reliability_model = ReliabilityRiskPredictor()


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def telemetry() -> dict:
    return {"timestamp": now(), "cars": telemetry_frame()}


def tires() -> dict:
    return {"timestamp": now(), "metrics": [tire_model.predict("7", 14), tire_model.predict("51", 18), tire_model.predict("911", 24)]}


def fuel() -> dict:
    return {"timestamp": now(), "metrics": [fuel_model.predict("7", 184), fuel_model.predict("8", 184), fuel_model.predict("51", 184)]}


def strategy() -> dict:
    return {
        "timestamp": now(),
        "recommendation": pit_model.optimize("7", current_lap=184),
        "simulation": sim_model.simulate(car_no="7", pit_laps=[186, 187, 188], tire="M", fuel_save_mode="2"),
    }


def rivals() -> dict:
    return {"timestamp": now(), "rivals": [battle_model.compare("7", "8", 4.812), battle_model.compare("7", "6", 12.408)]}


def ai_alerts() -> dict:
    return {
        "timestamp": now(),
        "alerts": [
            {
                "severity": "critical",
                "confidence": 0.91,
                "message": "Pit window opening in 2 laps.",
                "explanation": "Traffic and fuel models agree that lap 186 is the strongest release point.",
            },
            {
                "severity": "warning",
                "confidence": 0.84,
                "message": "Rival undercut likely.",
                "explanation": "Car #6 has a shorter current stint and clear pit entry delta.",
            },
            {
                "severity": "info",
                "confidence": 0.78,
                "message": "Pace improving in sector 2.",
                "explanation": "Throttle trace stability improved across the last four laps.",
            },
            {
                "severity": "warning",
                "confidence": 0.81,
                "message": "Reliability vibration trend above baseline.",
                "explanation": "Isolation-style anomaly score is rising on car #51 rear axle telemetry.",
            },
        ],
    }


def pit_window() -> dict:
    return {"timestamp": now(), "windows": [pit_model.optimize("7", 184), pit_model.optimize("8", 184), pit_model.optimize("51", 184)]}


def degradation() -> dict:
    return {"timestamp": now(), "curve": [tire_model.curve(age) for age in range(1, 31)]}


def battles() -> dict:
    return {"timestamp": now(), "battles": [battle_model.compare("7", "8", 4.812), battle_model.compare("92", "33", 0.087)]}


def build_snapshot() -> dict:
    return {
        "telemetry": telemetry(),
        "strategy": strategy(),
        "events": {"timestamp": now(), "events": ai_alerts()["alerts"]},
        "ml": {
            "timestamp": now(),
            "models": {
                "tire": tires(),
                "fuel": fuel(),
                "degradation": degradation(),
                "reliability": reliability_model.predict("51", vibration_index=0.64, tire_temp_c=96.2),
                "driver": [driver_engineering("7"), driver_engineering("51")],
            },
        },
        "rivals": rivals(),
    }
