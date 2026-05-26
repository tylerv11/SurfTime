"""
Main Orchestrator — runs all subagents, scores all breaks, generates briefings,
writes results to Supabase.

Run manually: python python/orchestrator/run.py
Or triggered by Vercel Cron → POST /api/cron/update-conditions
"""
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

# Add parent dir to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from fetchers.noaa_buoy import fetch_buoy
from fetchers.nws_wind import fetch_wind
from fetchers.noaa_tides import fetch_tides
from fetchers.break_scorer import score_break
from briefing_writer import generate_briefing, generate_daily_summary

BREAKS_CONFIG = json.loads(
    (Path(__file__).parent.parent.parent / "config" / "breaks.json").read_text()
)


def run_all():
    print(f"[{datetime.now(timezone.utc).isoformat()}] Starting conditions update...")

    # 1. Fetch buoy data (3 buoys cover all 14 breaks)
    buoy_cache = {}
    for buoy_id in BREAKS_CONFIG["buoys"]:
        print(f"  Fetching buoy {buoy_id}...")
        try:
            buoy_cache[buoy_id] = fetch_buoy(buoy_id)
        except Exception as e:
            print(f"  ERROR buoy {buoy_id}: {e}")
            buoy_cache[buoy_id] = {"error": str(e)}

    results = []
    for brk in BREAKS_CONFIG["breaks"]:
        print(f"  Processing {brk['name']}...")
        try:
            buoy_data = buoy_cache.get(brk["noaa_buoy"], {})
            nws = brk["nws_grid"]
            wind_data = fetch_wind(nws["office"], nws["x"], nws["y"])
            tide_data = fetch_tides(brk["tide_station"])

            scored = score_break(brk, buoy_data, wind_data, tide_data)
            briefing = generate_briefing(scored, brk)

            result = {
                **scored,
                "briefing": briefing,
                "lat": brk["lat"],
                "lng": brk["lng"],
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
            results.append(result)

        except Exception as e:
            print(f"  ERROR {brk['name']}: {e}")
            results.append({
                "break_id": brk["id"],
                "break_name": brk["name"],
                "score": None,
                "rating": "error",
                "briefing": "Conditions temporarily unavailable.",
                "lat": brk["lat"],
                "lng": brk["lng"],
                "error": str(e),
            })

    # Sort by score descending
    results.sort(key=lambda x: x.get("score") or 0, reverse=True)

    daily_summary = generate_daily_summary(results)

    output = {
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "daily_summary": daily_summary,
        "breaks": results,
        "buoys": buoy_cache,
    }

    # Write to Supabase
    if os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_SERVICE_ROLE_KEY"):
        write_to_supabase(output)
    else:
        print("  No Supabase env vars — writing to local conditions.json")
        (Path(__file__).parent.parent.parent / "conditions.json").write_text(
            json.dumps(output, indent=2)
        )

    print(f"  Done. Top break: {results[0]['break_name']} ({results[0]['score']}/10)")
    return output


def write_to_supabase(data: dict):
    from supabase import create_client
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    client = create_client(url, key)

    # Upsert each break's conditions
    for brk in data["breaks"]:
        client.table("conditions").upsert({
            "break_id": brk["break_id"],
            "data": brk,
            "updated_at": brk.get("updated_at"),
        }, on_conflict="break_id").execute()

    # Store daily summary
    client.table("daily_summaries").upsert({
        "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "summary": data["daily_summary"],
        "updated_at": data["updated_at"],
    }, on_conflict="date").execute()

    print("  Written to Supabase.")


if __name__ == "__main__":
    result = run_all()
    print(json.dumps(result, indent=2))
