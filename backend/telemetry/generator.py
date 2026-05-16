from __future__ import annotations

import math
import time


def telemetry_frame() -> list[dict]:
    phase = time.time() / 4
    cars = ["7", "8", "6", "51", "911"]
    return [
        {
            "car_no": car,
            "lap": 184,
            "speed_kph": round(292 + math.sin(phase + idx) * 17, 1),
            "throttle": round(82 + math.sin(phase + idx / 3) * 9, 1),
            "brake": round(max(0, 18 + math.cos(phase + idx) * 14), 1),
            "tire_temp_c": round(88 + math.sin(phase / 2 + idx) * 6, 1),
            "ers_deploy": round(64 + math.cos(phase + idx) * 11, 1),
        }
        for idx, car in enumerate(cars)
    ]
