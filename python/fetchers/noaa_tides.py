"""
Subagent 3: NOAA Tides and Currents Fetcher
Free, no API key required.
"""
from __future__ import annotations
import requests
from datetime import datetime, timezone, timedelta
from typing import Optional


TIDES_URL = "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter"


def fetch_tides(station_id: str) -> dict:
    now = datetime.now(timezone.utc)
    today = now.strftime("%Y%m%d")

    params = {
        "product": "predictions",
        "application": "SurfTime",
        "begin_date": today,
        "range": 24,
        "datum": "MLLW",
        "station": station_id,
        "time_zone": "lst_ldt",
        "interval": "hilo",  # High/low only
        "units": "english",
        "format": "json",
    }

    resp = requests.get(TIDES_URL, params=params, timeout=10)
    resp.raise_for_status()
    data = resp.json()

    if "predictions" not in data:
        return {"error": f"No tide data for station {station_id}"}

    predictions = data["predictions"]
    current_height = fetch_current_height(station_id, today)

    # Find next high and low
    next_high = next((p for p in predictions if p["type"] == "H"), None)
    next_low = next((p for p in predictions if p["type"] == "L"), None)

    tide_stage = classify_tide(current_height, predictions)

    return {
        "station_id": station_id,
        "timestamp": now.isoformat(),
        "current_height_ft": current_height,
        "tide_stage": tide_stage,
        "next_high": {
            "time": next_high["t"],
            "height_ft": float(next_high["v"])
        } if next_high else None,
        "next_low": {
            "time": next_low["t"],
            "height_ft": float(next_low["v"])
        } if next_low else None,
        "all_predictions": [
            {"time": p["t"], "height_ft": float(p["v"]), "type": p["type"]}
            for p in predictions
        ],
    }


def fetch_current_height(station_id: str, date: str) -> Optional[float]:
    params = {
        "product": "water_level",
        "application": "SurfTime",
        "date": "latest",
        "datum": "MLLW",
        "station": station_id,
        "time_zone": "lst_ldt",
        "units": "english",
        "format": "json",
    }
    try:
        resp = requests.get(TIDES_URL, params=params, timeout=10)
        data = resp.json()
        if "data" in data and data["data"]:
            return float(data["data"][-1]["v"])
    except Exception:
        pass
    return None


def classify_tide(current_ft: Optional[float], predictions: list) -> str:
    if current_ft is None:
        return "unknown"

    heights = [float(p["v"]) for p in predictions]
    if not heights:
        return "unknown"

    tide_min, tide_max = min(heights), max(heights)
    tide_range = tide_max - tide_min
    if tide_range == 0:
        return "mid"

    pct = (current_ft - tide_min) / tide_range

    if pct < 0.25:
        return "low"
    elif pct < 0.45:
        return "low-mid"
    elif pct < 0.55:
        return "mid"
    elif pct < 0.75:
        return "mid-high"
    else:
        return "high"


if __name__ == "__main__":
    import json
    print(json.dumps(fetch_tides("9410230"), indent=2))
