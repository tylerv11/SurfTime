"use client";

import { BreakCondition, TimeWindow } from "@/app/page";
import BreakForecastChart from "@/components/breaks/BreakForecastChart";

const RATING_COLOR: Record<string, string> = {
  epic:              "text-purple-400 bg-purple-500/10 border-purple-500/30",
  good:              "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  fair:              "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  poor:              "text-orange-400 bg-orange-500/10 border-orange-500/30",
  "flat-or-blown":   "text-red-400 bg-red-500/10 border-red-500/30",
  error:             "text-slate-400 bg-slate-500/10 border-slate-500/30",
};

const RATING_DOT: Record<string, string> = {
  epic:            "bg-purple-500",
  good:            "bg-emerald-500",
  fair:            "bg-yellow-500",
  poor:            "bg-orange-500",
  "flat-or-blown": "bg-red-500",
  error:           "bg-slate-500",
};

const REGION_LABEL: Record<string, string> = {
  sd:      "San Diego",
  oc:      "Orange Co.",
  la:      "Los Angeles",
  sf:      "NorCal / SF",
  central: "Central Coast",
};

const WINDOW_LABELS: Record<TimeWindow, string> = {
  early_morning: "5–8am",
  morning:       "8–12pm",
  afternoon:     "12–3pm",
};

interface Props {
  break_: BreakCondition;
  expanded?: boolean;
  onSelect?: () => void;
  timeWindow?: TimeWindow;
}

export default function BreakCard({ break_: b, expanded, onSelect, timeWindow }: Props) {
  const dot = RATING_DOT[b.rating] ?? "bg-slate-500";
  const badge = RATING_COLOR[b.rating] ?? RATING_COLOR.error;
  const windows = b.time_windows;
  const hasWindows = !!(windows && (windows.early_morning || windows.morning || windows.afternoon));

  return (
    <div
      className={`rounded-lg bg-slate-900 border border-slate-800 p-3 transition-colors ${
        onSelect ? "cursor-pointer hover:border-slate-600" : ""
      }`}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
            <h2 className="font-semibold text-sm leading-tight truncate">{b.break_name}</h2>
          </div>
          {b.region && (
            <p className="text-[10px] text-slate-600 font-mono ml-3.5 mt-0.5 uppercase tracking-wide">
              {REGION_LABEL[b.region] ?? b.region}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {b.score !== null && (
            <span className="text-xs font-mono font-bold text-slate-300">{b.score}/10</span>
          )}
          <span className={`text-[10px] px-2 py-0.5 rounded-sm border font-mono font-medium capitalize ${badge}`}>
            {b.rating === "flat-or-blown" ? "blown" : b.rating}
          </span>
        </div>
      </div>

      {/* Conditions */}
      <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-[11px] text-slate-400 font-mono">
        <div>
          <div className="text-[9px] text-slate-600 uppercase tracking-wide mb-0.5">Wave</div>
          <div>{b.wave_height_ft !== null ? `${b.wave_height_ft}ft` : "—"}{b.period_s ? ` ${b.period_s}s` : ""}</div>
        </div>
        <div>
          <div className="text-[9px] text-slate-600 uppercase tracking-wide mb-0.5">Wind</div>
          <div className="truncate">{b.wind_speed_mph ? `${b.wind_speed_mph}mph ${b.wind_direction}` : "—"}</div>
        </div>
        <div>
          <div className="text-[9px] text-slate-600 uppercase tracking-wide mb-0.5">Tide</div>
          <div className="capitalize">{b.tide_stage ?? "—"}</div>
        </div>
      </div>

      {/* Time window pills (list card) */}
      {!expanded && hasWindows && windows && (
        <div className="flex gap-1 mt-2.5 border-t border-slate-800 pt-2">
          {(["early_morning", "morning", "afternoon"] as TimeWindow[]).map((wid) => {
            const win = windows[wid];
            if (!win) return null;
            const active = timeWindow === wid;
            const activeDot = RATING_DOT[win.rating] ?? "bg-slate-600";
            return (
              <div
                key={wid}
                className={`flex-1 text-center py-1 px-0.5 rounded-sm text-[10px] font-mono transition-all ${
                  active ? "bg-slate-800 border border-slate-600 text-white" : "text-slate-600"
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  {active && <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeDot}`} />}
                  <span>{WINDOW_LABELS[wid]}</span>
                </div>
                <div className={`font-bold mt-0.5 ${active ? "text-slate-200" : "text-slate-600"}`}>
                  {win.score}/10
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Briefing */}
      {(expanded || b.briefing) && (
        <p className={`mt-2.5 text-xs leading-relaxed ${expanded ? "text-slate-300" : "text-slate-500 line-clamp-2"}`}>
          {b.briefing}
        </p>
      )}

      {/* Forecast chart (expanded) */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-800">
          <BreakForecastChart break_={b} selectedWindow={timeWindow} />
        </div>
      )}
    </div>
  );
}
