"""
Subagent 1: NOAA Wave Buoy Fetcher
Pulls swell height, period, and direction from NOAA NDBC buoys.
Free, no API key required.
"""
import requests
from datetime import datetime, timezone


NDBC_URL = "https://www.ndbc.noaa.gov/data/realtime2/{buoy_id}.txt"

# Column indices in NDBC standard meteorological data
COLS = {
    "WVHT": 8,   # Significant wave height (meters)
    "DPD": 9,    # Dominant wave period (seconds)
    "APD": 10,   # Average wave period (seconds)
    "MWD": 11,   # Mean wave direction (degrees)
    "WTMP": 14,  # Water temperature (Celsius)
}


def fetch_buoy(buoy_id: str) -> dict:
    url = NDBC_URL.format(buoy_id=buoy_id)
    resp = requests.get(url, timeout=10)
    resp.raise_for_status()

    lines = resp.text.strip().split("\n")
    # Line 0 = header, line 1 = units, line 2 = most recent data
    if len(lines) < 3:
        return {"error": f"No data for buoy {buoy_id}"}

    headers = lines[0].lstrip("#").split()
    data = lines[2].split()

    def get(col_name):
        if col_name in headers:
            idx = headers.index(col_name)
            val = data[idx] if idx < len(data) else "MM"
            return None if val == "MM" else float(val)
        return None

    wvht_m = get("WVHT")
    mwd = get("MWD")

    return {
        "buoy_id": buoy_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "wave_height_m": wvht_m,
        "wave_height_ft": round(wvht_m * 3.281, 1) if wvht_m else None,
        "dominant_period_s": get("DPD"),
        "avg_period_s": get("APD"),
        "wave_direction_deg": mwd,
        "wave_direction_cardinal": deg_to_cardinal(mwd) if mwd else None,
        "water_temp_c": get("WTMP"),
        "water_temp_f": round(get("WTMP") * 9/5 + 32, 1) if get("WTMP") else None,
    }


def deg_to_cardinal(deg: float) -> str:
    directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
                  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    idx = round(deg / 22.5) % 16
    return directions[idx]


if __name__ == "__main__":
    import json
    for buoy in ["46025", "46086", "46054"]:
        print(json.dumps(fetch_buoy(buoy), indent=2))
