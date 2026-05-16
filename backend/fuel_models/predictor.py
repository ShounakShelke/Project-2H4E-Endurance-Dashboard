from __future__ import annotations


class FuelConsumptionPredictor:
    model_family = "XGBoost-ready fuel burn predictor"

    def predict(self, car_no: str, current_lap: int) -> dict:
        burn = 3.42 + (int(car_no[-1]) % 4) * 0.035 if car_no[-1].isdigit() else 3.48
        laps_remaining = 11.5 - (current_lap % 3) * 0.6
        return {
            "car_no": car_no,
            "burn_kg_lap": round(burn, 3),
            "laps_remaining": round(laps_remaining, 1),
            "fuel_save_recommendation": "mode_3" if laps_remaining < 11 else "mode_2",
            "emergency_pit_prediction_lap": current_lap + max(4, int(laps_remaining)),
            "aggressive_mode_delta": "-1.8 laps",
        }
