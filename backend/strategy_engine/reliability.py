from __future__ import annotations


class ReliabilityRiskPredictor:
    model_family = "IsolationForest-ready reliability risk predictor"

    def predict(self, car_no: str, vibration_index: float, tire_temp_c: float) -> dict:
        risk = min(1.0, max(0.0, vibration_index * 0.55 + max(0, tire_temp_c - 92) * 0.025))
        return {
            "car_no": car_no,
            "risk_score": round(risk, 3),
            "severity": "critical" if risk > 0.78 else "warning" if risk > 0.48 else "nominal",
            "explanation": "Risk blends vibration anomaly score, tire temperature, and stint load.",
        }
