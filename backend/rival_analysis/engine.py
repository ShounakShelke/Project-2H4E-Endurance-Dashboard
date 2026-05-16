from __future__ import annotations


class BattlePredictionEngine:
    model_family = "IsolationForest-ready battle and risk predictor"

    def compare(self, car_no: str, rival_no: str, gap_seconds: float) -> dict:
        intensity = max(0.0, min(1.0, 1 - gap_seconds / 18))
        return {
            "car_no": car_no,
            "rival_no": rival_no,
            "gap_seconds": gap_seconds,
            "pace_delta_vs_rival": round((9 - gap_seconds) / 10, 3),
            "predicted_rival_stop_lap": 187 + (len(rival_no) % 4),
            "battle_intensity": round(intensity, 3),
            "position_threat_score": round(intensity * 100, 1),
            "direct_rival_strategy": "cover undercut" if intensity > 0.65 else "protect tire life",
        }
