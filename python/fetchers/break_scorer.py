"""
Subagent 4: Break Characteristics Scorer
No API calls — pure logic against the breaks.json config.
Returns a 0-10 compatibility score per break.
"""
from typing import Any


def score_break(break_config: dict, buoy_data: dict, wind_data: dict, tide_data: dict) -> dict:
    ideal = break_config["ideal"]
    score = 0
    max_score = 0
    reasons = []

    # --- Swell height (30% weight) ---
    max_score += 3
    height_ft = buoy_data.get("wave_height_ft")
    if height_ft is not None:
        min_h = ideal.get("min_height_ft", 0)
        max_h = ideal.get("max_height_ft", 20)
        if min_h <= height_ft <= max_h:
            score += 3
            reasons.append(f"{height_ft}ft swell in ideal range")
        elif height_ft < min_h:
            partial = max(0, 3 * (height_ft / min_h))
            score += partial
            reasons.append(f"{height_ft}ft swell — a bit small (ideal {min_h}ft+)")
        else:
            partial = max(0, 3 * (1 - (height_ft - max_h) / max_h))
            score += partial
            reasons.append(f"{height_ft}ft swell — overhead, handle with care")

    # --- Swell direction (25% weight) ---
    max_score += 2.5
    wave_dir = buoy_data.get("wave_direction_cardinal")
    ideal_dirs = ideal.get("swell_direction", [])
    if wave_dir and ideal_dirs:
        if wave_dir in ideal_dirs:
            score += 2.5
            reasons.append(f"{wave_dir} swell — ideal direction")
        elif any(close_direction(wave_dir, d) for d in ideal_dirs):
            score += 1.5
            reasons.append(f"{wave_dir} swell — close to ideal")
        else:
            reasons.append(f"{wave_dir} swell — not the ideal direction")

    # --- Period (15% weight) ---
    max_score += 1.5
    period = buoy_data.get("dominant_period_s")
    min_period = ideal.get("period_min_s", 8)
    if period is not None:
        if period >= min_period:
            score += 1.5
            reasons.append(f"{period}s period — groundswell quality")
        elif period >= min_period - 3:
            score += 0.75
            reasons.append(f"{period}s period — medium quality")
        else:
            reasons.append(f"{period}s period — short choppy period")

    # --- Wind (20% weight) ---
    max_score += 2
    wind_quality = wind_data.get("wind_quality", "")
    wind_speed = wind_data.get("wind_speed_mph", 0)
    wind_dir = wind_data.get("wind_direction", "")
    max_wind = ideal.get("wind_max_mph", 15)

    if wind_quality == "glassy":
        score += 2
        reasons.append("Glassy — perfect surface conditions")
    elif wind_quality == "offshore-good":
        score += 1.75
        reasons.append(f"Light offshore {wind_dir} — grooming the waves")
    elif wind_quality == "offshore-strong":
        score += 1.0
        reasons.append(f"Strong offshore {wind_dir} — may be choppy on top")
    elif wind_quality == "cross-variable":
        score += 0.75
        reasons.append(f"Variable winds — surface OK")
    elif wind_quality == "onshore-poor":
        score += 0.25
        reasons.append(f"Onshore {wind_dir} at {wind_speed:.0f}mph — getting choppy")
    else:
        reasons.append(f"Blown out — strong onshore {wind_dir}")

    # --- Tide (10% weight) ---
    max_score += 1
    tide_stage = tide_data.get("tide_stage", "unknown")
    ideal_tide = ideal.get("tide", "any")

    if ideal_tide == "any" or tide_stage == "unknown":
        score += 0.5
    elif tide_stage in ideal_tide or ideal_tide in tide_stage:
        score += 1
        reasons.append(f"{tide_stage} tide — ideal for this break")
    else:
        reasons.append(f"{tide_stage} tide — not ideal (wants {ideal_tide})")

    final_score = round((score / max_score) * 10, 1) if max_score > 0 else 5.0

    return {
        "break_id": break_config["id"],
        "break_name": break_config["name"],
        "score": final_score,
        "rating": score_to_rating(final_score),
        "reasons": reasons,
        "wave_height_ft": buoy_data.get("wave_height_ft"),
        "period_s": buoy_data.get("dominant_period_s"),
        "wave_direction": buoy_data.get("wave_direction_cardinal"),
        "wind_quality": wind_quality,
        "wind_speed_mph": round(wind_speed, 1),
        "wind_direction": wind_dir,
        "tide_stage": tide_stage,
        "water_temp_f": buoy_data.get("water_temp_f"),
        "notes": break_config.get("notes", ""),
    }


def score_to_rating(score: float) -> str:
    if score >= 8.5:
        return "epic"
    elif score >= 7.0:
        return "good"
    elif score >= 5.5:
        return "fair"
    elif score >= 3.5:
        return "poor"
    else:
        return "flat-or-blown"


DIRECTION_ORDER = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
                   "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]


def close_direction(d1: str, d2: str) -> bool:
    """Returns True if two cardinal directions are within 45 degrees."""
    if d1 not in DIRECTION_ORDER or d2 not in DIRECTION_ORDER:
        return False
    i1, i2 = DIRECTION_ORDER.index(d1), DIRECTION_ORDER.index(d2)
    diff = min(abs(i1 - i2), 16 - abs(i1 - i2))
    return diff <= 2
