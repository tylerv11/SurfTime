"""
Subagent 5: Conditions Briefing Writer
Uses OpenRouter (DeepSeek V3 Flash) to generate plain-English surf briefings.
Falls back to template-based briefings if no API key is set.
"""
import os
import requests


OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "deepseek/deepseek-chat"  # DeepSeek V3 via OpenRouter


def generate_briefing(scored: dict, break_config: dict) -> str:
    """Generate a plain-English briefing for a single break."""
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        return template_briefing(scored)

    prompt = build_prompt(scored, break_config)
    try:
        resp = requests.post(
            OPENROUTER_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "HTTP-Referer": "https://surftime.app",
                "X-Title": "SurfTime",
            },
            json={
                "model": MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 120,
                "temperature": 0.7,
            },
            timeout=15,
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"].strip()
    except Exception as e:
        return template_briefing(scored)


def generate_daily_summary(all_results: list) -> str:
    """Generate a ranked daily summary across all breaks."""
    api_key = os.getenv("OPENROUTER_API_KEY")

    top_3 = [r for r in all_results[:3] if r.get("score") and r["score"] >= 5]
    avoid = [r for r in all_results if r.get("score") and r["score"] < 3.5]

    if not api_key:
        return template_daily_summary(top_3, avoid)

    lines = []
    for r in all_results[:6]:
        if r.get("score"):
            lines.append(f"- {r['break_name']}: {r['score']}/10 ({r.get('rating','?')}), "
                        f"{r.get('wave_height_ft','?')}ft, {r.get('wind_quality','?')}, {r.get('tide_stage','?')} tide")

    prompt = f"""You are a local SoCal surf forecaster. Write a 2-3 sentence daily briefing covering today's best bets and what to avoid. Be specific, casual, and local. Don't say "today's" or start with "I".

Current conditions:
{chr(10).join(lines)}

Write the briefing:"""

    try:
        resp = requests.post(
            OPENROUTER_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "HTTP-Referer": "https://surftime.app",
                "X-Title": "SurfTime",
            },
            json={
                "model": MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 150,
                "temperature": 0.7,
            },
            timeout=15,
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"].strip()
    except Exception:
        return template_daily_summary(top_3, avoid)


def build_prompt(scored: dict, break_config: dict) -> str:
    return f"""You are a local SoCal surf forecaster. Write a 1-2 sentence briefing for {scored['break_name']}. Be specific, casual, and local. No fluff.

Conditions:
- Swell: {scored.get('wave_height_ft', '?')}ft at {scored.get('period_s', '?')}s from {scored.get('wave_direction', '?')}
- Wind: {scored.get('wind_quality', '?')} ({scored.get('wind_speed_mph', '?')}mph {scored.get('wind_direction', '?')})
- Tide: {scored.get('tide_stage', '?')}
- Score: {scored.get('score', '?')}/10 ({scored.get('rating', '?')})
- Break notes: {break_config.get('notes', '')}

Write the briefing (1-2 sentences max):"""


def template_briefing(scored: dict) -> str:
    """Rule-based fallback when no LLM key is available."""
    name = scored.get("break_name", "This break")
    height = scored.get("wave_height_ft")
    period = scored.get("period_s")
    wind = scored.get("wind_quality", "")
    tide = scored.get("tide_stage", "")
    rating = scored.get("rating", "fair")

    size = "flat" if not height or height < 1 else \
           "ankle-to-knee" if height < 2 else \
           "waist-high" if height < 3 else \
           "chest-to-head" if height < 5 else \
           "overhead" if height < 7 else "double-overhead+"

    wind_desc = {
        "glassy": "glass-off conditions",
        "offshore-good": "light offshore winds",
        "offshore-strong": "strong offshores",
        "onshore-poor": "onshore chop",
        "onshore-blown-out": "blown out by onshores",
        "cross-variable": "variable winds",
    }.get(wind, wind)

    if rating in ("epic", "good"):
        return f"{name} is {size} with {wind_desc}. Worth the drive."
    elif rating == "fair":
        return f"{name} is {size} with {wind_desc}. Playful but not firing."
    else:
        return f"{name} is {size} with {wind_desc}. Probably skip it today."


def template_daily_summary(top: list, avoid: list) -> str:
    if not top:
        return "Conditions are weak across the board today. Check back after the next swell."
    best = ", ".join(r["break_name"] for r in top[:2])
    skip = ", ".join(r["break_name"] for r in avoid[:2]) if avoid else None
    summary = f"Best bets today are {best}."
    if skip:
        summary += f" Skip {skip} — not worth it."
    return summary
