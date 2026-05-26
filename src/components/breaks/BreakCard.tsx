"use client";

import { BreakCondition, TimeWindow } from "@/app/page";

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

const WINDOW_LABELS: Record<TimeWindow, string> = {
  early_morning: "5–8am",
  morning: "8–12pm",
  afternoon: "12–3pm",
};

interface Props {
  break_: BreakCondition;
  expanded?: boolean;
  onSelect?: () => void;
  timeWindow?: TimeWindow;
}

export default function BreakCard({ break_: b, expanded, onSelect, timeWindow }: Props) {
  const ratingColor = RATING_COLORS[b.rating] ?? "bg-slate-500";

  const windows = b.time_windows;
  const hasWindows = !!(windows && (windows.early_morning || windows.morning || windows.afternoon));

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
        <span>{WIND_ICONS[b.wind_quality] ?? "💨"} {b.wind_quality?.replace(/-/g, " ")} {b.wind_speed_mph ? `${b.wind_speed_mph}mph` : ""}</span>
        <span>{TIDE_ICONS[b.tide_stage] ?? "🌊"} {b.tide_stage} tide</span>
        {b.water_temp_f && <span>🌡️ {b.water_temp_f}°F</span>}
      </div>

      {/* Time window mini-scores (list card, not expanded) */}
      {!expanded && hasWindows && windows && (
        <div className="flex gap-1.5 mt-2">
          {(["early_morning", "morning", "afternoon"] as TimeWindow[]).map((wid) => {
            const win = windows[wid];
            if (!win) return null;
            const active = timeWindow === wid;
            const color = RATING_COLORS[win.rating] ?? "bg-slate-600";
            return (
              <div
                key={wid}
                className={`flex-1 text-center rounded-md py-1 px-0.5 text-[10px] transition-all ${
                  active ? `${color} text-white font-semibold` : "bg-slate-700/60 text-slate-400"
                }`}
              >
                <div>{WINDOW_LABELS[wid]}</div>
                <div className={active ? "text-white/90 font-bold" : "text-slate-300"}>{win.score}/10</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Briefing */}
      {(expanded || b.briefing) && (
        <p className={`mt-2 text-xs leading-relaxed ${expanded ? "text-slate-200" : "text-slate-400 line-clamp-2"}`}>
          {b.briefing}
        </p>
      )}

      {/* Expanded: time window breakdown */}
      {expanded && hasWindows && windows && (
        <div className="mt-3 pt-3 border-t border-slate-700">
          <p className="text-xs text-slate-500 mb-2">Forecast by time of day</p>
          <div className="grid grid-cols-3 gap-2">
            {(["early_morning", "morning", "afternoon"] as TimeWindow[]).map((wid) => {
              const win = windows[wid];
              if (!win) return null;
              const active = timeWindow === wid;
              const colorClass = RATING_COLORS[win.rating] ?? "bg-slate-600";
              return (
                <div
                  key={wid}
                  className={`rounded-lg p-2 text-center text-xs border ${
                    active
                      ? `bg-slate-700 border-blue-500/60`
                      : "bg-slate-700/40 border-slate-600/30"
                  }`}
                >
                  <div className="text-slate-400 text-[10px] mb-0.5">{WINDOW_LABELS[wid]}</div>
                  <div className={`font-bold text-sm ${active ? "text-white" : "text-slate-200"}`}>
                    {win.score}/10
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full text-white ${colorClass}`}>
                    {win.rating}
                  </span>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {WIND_ICONS[win.wind_quality] ?? "💨"} {win.wind_speed_mph}mph {win.wind_direction}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {TIDE_ICONS[win.tide_stage] ?? ""} {win.tide_stage} tide
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
