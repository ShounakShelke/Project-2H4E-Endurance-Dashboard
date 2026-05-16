from __future__ import annotations


def driver_engineering(car_no: str) -> dict:
    seed = sum(ord(char) for char in car_no)
    consistency = 86 + seed % 9
    fatigue = 18 + seed % 13
    pressure = 82 + seed % 11
    recovery = 80 + seed % 14
    return {
        "car_no": car_no,
        "consistency_score": consistency,
        "fatigue_estimate": fatigue,
        "pressure_handling": pressure,
        "traffic_handling": 84 + seed % 10,
        "recovery_performance": recovery,
        "pace_stability": round(consistency / 100, 3),
    }
