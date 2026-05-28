"use client";

import { BreakCondition, TimeWindow } from "@/app/page";
import BreakForecastChart from "@/components/breaks/BreakForecastChart";
import TideForecastChart from "@/components/breaks/TideForecastChart";
import WaveForecastChart from "@/components/breaks/WaveForecastChart";

const RATING_COLOR: Record<string, string> = {
  epic:            "text-violet-300 bg-violet-500/10 border-violet-500/30",
  good:            "text-teal-300 bg-teal-500/10 border-teal-500/30",
  fair:            "text-amber-300 bg-amber-500/10 border-amber-500/30",
  poor:            "text-orange-400 bg-orange-500/10 border-orange-500/30",
  "flat-or-blown": "text-red-400 bg-red-500/10 border-red-500/30",
  error:           "text-slate-400 bg-slate-500/10 border-slate-500/30",
};

const RATING_DOT: Record<string, string> = {
  epic:            "bg-violet-400",
  good:            "bg-teal-400",
  fair:            "bg-amber-400",
  poor:            "bg-orange-500",
  "flat-or-blown": "bg-red-500",
  error:           "bg-slate-500",
};

const RATING_GLOW: Record<string, string> = {
  epic:            "hover:shadow-[0_0_22px_rgba(167,139,250,0.22)] hover:border-violet-500/45",
  good:            "hover:shadow-[0_0_20px_rgba(45,212,191,0.18)] hover:border-teal-500/40",
  fair:            "hover:shadow-[0_0_16px_rgba(251,191,36,0.14)] hover:border-amber-500/30",
  poor:            "hover:shadow-[0_0_14px_rgba(249,115,22,0.12)] hover:border-orange-500/25",
  "flat-or-blown": "hover:shadow-[0_0_12px_rgba(239,68,68,0.1)] hover:border-red-500/20",
  error:           "",
};

const GAUGE_COLOR: Record<string, string> = {
  epic:            "#a78bfa",
  good:            "#2dd4bf",
  fair:            "#fbbf24",
  poor:            "#f97316",
  "flat-or-blown": "#ef4444",
  error:           "#475569",
};

const REGION_LABEL: Record<string, string> = {
  sd:      "San Diego",
  oc:      "Orange Co.",
  la:      "Los Angeles",
  sf:      "NorCal / SF",
  central: "Central Coast",
};

interface Props {
  break_: BreakCondition;
  expanded?: boolean;
  onSelect?: () => void;
  timeWindow?: TimeWindow;
}

function ScoreGauge({ score, rating }: { score: number | null; rating: string }) {
  const color = GAUGE_COLOR[rating] ?? GAUGE_COLOR.error;
  const r = 15.9;
  const circumference = 2 * Math.PI * r;
  const filled = score !== null ? Math.max(0, Math.min(1, score / 10)) * circumference : 0;

  return (
    <div className="relative w-10 h-10 flex-shrink-0">
      <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
        <circle
          cx="18" cy="18" r={r}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="2.5"
        />
        <circle
          cx="18" cy="18" r={r}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeDasharray={`${filled} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.7s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-[10px] font-bold font-mono leading-none"
        style={{ color }}
        aria-label={score !== null ? `Score: ${score} out of 10` : "No score"}
      >
        {score ?? "—"}
      </span>
    </div>
  );
}

export default function BreakCard({ break_: b, expanded, onSelect, timeWindow }: Props) {
  const dot = RATING_DOT[b.rating] ?? "bg-slate-500";
  const badge = RATING_COLOR[b.rating] ?? RATING_COLOR.error;
  const glow = RATING_GLOW[b.rating] ?? "";

  const waveBarPct = b.wave_height_ft !== null
    ? Math.min((b.wave_height_ft / 10) * 100, 100)
    : 0;

  const waveBarColor =
    b.wave_height_ft !== null && b.wave_height_ft >= 5 ? "from-teal-400 to-cyan-300"
    : b.wave_height_ft !== null && b.wave_height_ft >= 3 ? "from-teal-500 to-teal-400"
    : "from-slate-500 to-slate-400";

  return (
    <div
      className={`
        rounded-xl bg-slate-900/80 border border-slate-800 p-3
        transition-all duration-200 backdrop-blur-sm
        ${onSelect ? `cursor-pointer ${glow} active:scale-[0.99]` : ""}
      `}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
            <h2 className="font-semibold text-sm leading-tight truncate">{b.break_name}</h2>
          </div>
          {b.region && (
            <p className="text-[10px] text-slate-500 font-mono ml-3.5 mt-0.5 uppercase tracking-wide">
              {REGION_LABEL[b.region] ?? b.region}
            </p>
          )}
          <span className={`inline-flex mt-1.5 ml-3.5 text-[10px] px-2 py-0.5 rounded-sm border font-mono font-medium capitalize ${badge}`}>
            {b.rating === "flat-or-blown" ? "blown" : b.rating}
          </span>
        </div>

        <ScoreGauge score={b.score} rating={b.rating} />
      </div>

      {/* Conditions grid */}
      <div className="grid grid-cols-3 gap-x-2 gap-y-2 text-[11px] text-slate-400 font-mono">
        {/* Wave */}
        <div>
          <div className="text-[9px] text-slate-600 uppercase tracking-wide mb-0.5">Wave</div>
          <div className="text-slate-300">
            {b.wave_height_ft !== null ? `${b.wave_height_ft}ft` : "—"}
            {b.period_s ? <span className="text-slate-500"> {b.period_s}s</span> : null}
          </div>
          {/* Wave height bar */}
          <div className="mt-1 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${waveBarColor} rounded-full transition-all duration-700 ease-out`}
              style={{ width: `${waveBarPct}%` }}
            />
          </div>
        </div>

        {/* Wind */}
        <div>
          <div className="text-[9px] text-slate-600 uppercase tracking-wide mb-0.5">Wind</div>
          <div className="truncate text-slate-300">
            {b.wind_speed_mph ? `${b.wind_speed_mph}mph` : "—"}
            {b.wind_direction ? <span className="text-slate-500"> {b.wind_direction}</span> : null}
          </div>
        </div>

        {/* Tide */}
        <div>
          <div className="text-[9px] text-slate-600 uppercase tracking-wide mb-0.5">Tide</div>
          <div className="capitalize text-slate-300">{b.tide_stage ?? "—"}</div>
        </div>
      </div>

      {/* Briefing */}
      {(expanded || b.briefing) && (
        <p className={`mt-2.5 text-xs leading-relaxed ${
          expanded
            ? "pl-3 border-l-2 border-teal-500/30 text-slate-300 italic"
            : "text-slate-500 line-clamp-2"
        }`}>
          {b.briefing}
        </p>
      )}

      {/* Expanded detail */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-800">
          <div className="mb-2 text-[10px] text-slate-500 font-mono">
            Chosen model for this beach: {b.scoring_model ?? "weighted-rules-v1"}
          </div>
          <BreakForecastChart break_={b} selectedWindow={timeWindow} />
          <div className="mt-3">
            <WaveForecastChart lat={b.lat} lng={b.lng} modelName={b.scoring_model} />
          </div>
          <div className="mt-3">
            <TideForecastChart station={b.tide_station} modelName={b.scoring_model} />
          </div>
          <div className="mt-3 rounded-md border border-slate-800 bg-slate-950/60 p-2">
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-mono">
              Methodology · {b.scoring_model ?? "weighted-rules-v1"}
            </div>
            <div className="mt-1 text-[10px] text-slate-400">
              {b.scoring_method ?? "Deterministic weighted compatibility score (not regression / not R²)."} In plain terms: we forecast wave/wind/tide conditions first, then rank this beach by how well those conditions match its known ideal profile.
            </div>
            <div className="mt-1 text-[10px] text-slate-500 font-mono">
              Why this model here: stable and interpretable without requiring per-beach historical ML training data.
            </div>
            <div className="mt-1 text-[10px] text-slate-500 font-mono">
              Selection criteria: swell height, swell direction match, period quality, wind quality/direction, tide suitability.
            </div>
            {b.scoring_weights && (
              <div className="mt-1 text-[10px] text-slate-500 font-mono">
                Weights: H {Math.round((b.scoring_weights.swell_height ?? 0) * 100)}% · Dir {Math.round((b.scoring_weights.swell_direction ?? 0) * 100)}% ·
                Per {Math.round((b.scoring_weights.period ?? 0) * 100)}% · Wind {Math.round((b.scoring_weights.wind ?? 0) * 100)}% · Tide {Math.round((b.scoring_weights.tide ?? 0) * 100)}%
              </div>
            )}
            {!!b.reasons?.length && (
              <div className="mt-1 text-[10px] text-slate-500 font-mono truncate">
                Why this score: {b.reasons.slice(0, 2).join(" · ")}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
