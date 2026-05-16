from __future__ import annotations


class TireDegradationPredictor:
    model_family = "RandomForestRegressor-ready tire degradation predictor"

    def curve(self, tire_age: int) -> dict:
        pace_loss = tire_age * 0.055 + max(0, tire_age - 22) * 0.075
        return {
            "tire_age": tire_age,
            "pace_loss_seconds": round(pace_loss, 3),
            "thermal_stress": round(min(1.0, 0.22 + tire_age * 0.022), 3),
            "life_remaining": round(max(0.0, 1 - tire_age / 34), 3),
        }

    def predict(self, car_no: str, tire_age: int) -> dict:
        result = self.curve(tire_age)
        result["car_no"] = car_no
        result["stint_quality_score"] = round(100 - result["thermal_stress"] * 28 - result["pace_loss_seconds"] * 4, 1)
        return result
