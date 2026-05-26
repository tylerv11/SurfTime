"""
Subagent 2: National Weather Service Wind Fetcher
Free, no API key required.
"""
import requests
from datetime import datetime, timezone


NWS_FORECAST_URL = "https://api.weather.gov/gridpoints/{office}/{x},{y}/forecast/hourly"

TIME_WINDOW_HOURS = {"early_morning": 6, "morning": 10, "afternoon": 14}


def fetch_wind(office: str, x: int, y: int) -> dict:
    url = NWS_FORECAST_URL.format(office=office, x=x, y=y)
    headers = {"User-Agent": "SurfTime/1.0 (surf conditions app; contact@surftime.app)"}

    resp = requests.get(url, timeout=10, headers=headers)
    resp.raise_for_status()

    periods = resp.json()["properties"]["periods"]
    now = periods[0]  # Current hour

    wind_speed_mph = parse_wind_speed(now.get("windSpeed", "0 mph"))
    wind_dir = now.get("windDirection", "N")

    # Build time windows from the same API response
    time_windows = {}
    for window_id, target_hour in TIME_WINDOW_HOURS.items():
        period = _find_period_for_hour(periods, target_hour)
        if period:
            speed = parse_wind_speed(period.get("windSpeed", "0 mph"))
            direction = period.get("windDirection", "N")
            time_windows[window_id] = {
                "wind_speed_mph": round(speed, 1),
                "wind_direction": direction,
                "wind_quality": rate_wind_for_surf(direction, speed),
                "short_forecast": period.get("shortForecast", ""),
            }

    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "wind_speed_mph": wind_speed_mph,
        "wind_direction": wind_dir,
        "wind_quality": rate_wind_for_surf(wind_dir, wind_speed_mph),
        "short_forecast": now.get("shortForecast", ""),
        "next_6h": [
            {
                "start": p["startTime"],
                "speed_mph": parse_wind_speed(p.get("windSpeed", "0 mph")),
                "direction": p.get("windDirection", "N"),
            }
            for p in periods[1:7]
        ],
        "time_windows": time_windows,
    }


def _find_period_for_hour(periods: list, target_hour: int) -> dict | None:
    """Find forecast period closest to target hour, preferring today's date."""
    today = datetime.now().strftime("%Y-%m-%d")
    # First pass: exact match on today
    for p in periods[:48]:
        start = p.get("startTime", "")
        if start.startswith(today):
            try:
                if int(start[11:13]) == target_hour:
                    return p
            except (ValueError, IndexError):
                continue
    # Second pass: closest hour overall
    best, best_diff = None, float("inf")
    for p in periods[:48]:
        start = p.get("startTime", "")
        try:
            hour = int(start[11:13])
            diff = abs(hour - target_hour)
            if not start.startswith(today):
                diff += 24
            if diff < best_diff:
                best_diff, best = diff, p
        except (ValueError, IndexError):
            continue
    return best


def parse_wind_speed(wind_str: str) -> float:
    """Parse '10 mph' or '5 to 10 mph' → average float."""
    parts = wind_str.lower().replace("mph", "").strip().split("to")
    try:
        nums = [float(p.strip()) for p in parts]
        return sum(nums) / len(nums)
    except ValueError:
        return 0.0


def rate_wind_for_surf(direction: str, speed_mph: float) -> str:
    """
    Offshore winds (N, NE, E for SoCal/NorCal) = good.
    Onshore winds (S, SW, W) = bad.
    Light winds any direction = clean.
    """
    if speed_mph <= 5:
        return "glassy"

    offshore = {"N", "NNE", "NE", "ENE", "E"}
    onshore = {"S", "SSW", "SW", "WSW", "W"}

    if direction in offshore:
        return "offshore-good" if speed_mph <= 15 else "offshore-strong"
    elif direction in onshore:
        return "onshore-poor" if speed_mph <= 15 else "onshore-blown-out"
    else:
        return "cross-variable"


if __name__ == "__main__":
    import json
    print(json.dumps(fetch_wind("LOX", 142, 49), indent=2))
