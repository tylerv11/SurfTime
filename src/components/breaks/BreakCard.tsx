"use client";

import { BreakCondition } from "@/app/page";

const RATING_COLORS: Record<string, string> = {
  epic: "bg-purple-500",
  good: "bg-green-500",
  fair: "bg-yellow-500",
  poor: "bg-orange-500",
  "flat-or-blown": "bg-red-500",
  error: "bg-slate-500",
};

const WIND_ICONS: Record<string, string> = {
  glassy: "🪟",
  "offshore-good": "💨",
  "offshore-strong": "🌬️",
  "onshore-poor": "😬",
  "onshore-blown-out": "❌",
  "cross-variable": "↕️",
};

const TIDE_ICONS: Record<string, string> = {
  low: "⬇️",
  "low-mid": "↙️",
  mid: "➡️",
  "mid-high": "↗️",
  high: "⬆️",
  unknown: "❓",
};

interface Props {
  break_: BreakCondition;
  expanded?: boolean;
  onSelect?: () => void;
}

export default function BreakCard({ break_: b, expanded, onSelect }: Props) {
  const ratingColor = RATING_COLORS[b.rating] ?? "bg-slate-500";

  return (
    <div
      className={`rounded-xl bg-slate-800 border border-slate-700 p-3 ${onSelect ? "cursor-pointer hover:border-blue-500 transition-colors" : ""}`}
      onClick={onSelect}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-semibold text-sm">{b.break_name}</h2>
        <div className="flex items-center gap-2">
          {b.score !== null && (
            <span className="text-xs font-bold text-white opacity-80">{b.score}/10</span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium text-white ${ratingColor}`}>
            {b.rating}
          </span>
        </div>
      </div>

      {/* Conditions row */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
        {b.wave_height_ft !== null && (
          <span>🌊 {b.wave_height_ft}ft {b.period_s ? `@ ${b.period_s}s` : ""} {b.wave_direction ?? ""}</span>
        )}
        <span>{WIND_ICONS[b.wind_quality] ?? "💨"} {b.wind_quality?.replace("-", " ")} {b.wind_speed_mph ? `${b.wind_speed_mph}mph` : ""}</span>
        <span>{TIDE_ICONS[b.tide_stage] ?? "🌊"} {b.tide_stage} tide</span>
        {b.water_temp_f && <span>🌡️ {b.water_temp_f}°F</span>}
      </div>

      {/* Briefing */}
      {(expanded || b.briefing) && (
        <p className={`mt-2 text-xs leading-relaxed ${expanded ? "text-slate-200" : "text-slate-400 line-clamp-2"}`}>
          {b.briefing}
        </p>
      )}
    </div>
  );
}
