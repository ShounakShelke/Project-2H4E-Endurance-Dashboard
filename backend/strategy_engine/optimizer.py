from __future__ import annotations


class PitWindowOptimizer:
    model_family = "time-series pit window optimizer"

    def optimize(self, car_no: str, current_lap: int) -> dict:
        offset = int(car_no[-1]) % 3 if car_no[-1].isdigit() else 1
        open_lap = current_lap + 2 + offset
        close_lap = open_lap + 3
        return {
            "car_no": car_no,
            "pit_window_open": open_lap,
            "pit_window_close": close_lap,
            "optimal_lap": open_lap + 1,
            "undercut_prediction_seconds": round(4.8 + offset * 0.7, 2),
            "overcut_viability": round(0.42 - offset * 0.05, 2),
            "clean_air_estimation_seconds": round(18.4 - offset * 1.2, 1),
            "traffic_risk": "medium" if offset else "low",
            "confidence": round(0.86 - offset * 0.03, 2),
        }


class StrategySimulationEngine:
    model_family = "Monte-Carlo-ready strategy simulation engine"

    def simulate(self, car_no: str, pit_laps: list[int], tire: str, fuel_save_mode: str) -> list[dict]:
        return [
            {
                "car_no": car_no,
                "pit_lap": lap,
                "tire": tire,
                "fuel_save_mode": fuel_save_mode,
                "predicted_finish_position": 1 if lap == min(pit_laps) + 1 else 2,
                "estimated_gain_loss_seconds": round(5.2 - abs(lap - (min(pit_laps) + 1)) * 2.1, 2),
                "strategy_confidence": round(0.89 - abs(lap - (min(pit_laps) + 1)) * 0.08, 2),
                "safety_car_sensitivity": "high" if lap == max(pit_laps) else "medium",
                "rain_strategy_change": "switch_to_inter_if_probability_above_35_percent",
            }
            for lap in pit_laps
        ]
