"use client";

import { useState } from "react";
import type { BreakCondition, TimeWindow } from "@/app/page";

type SeriesKey = "score" | "wind" | "wave" | "tide" | "temp";

interface ForecastRow {
  id: TimeWindow;
  label: string;
  hours: string;
  score: number | null;
  wind_speed_mph: number | null;
  wind_direction: string | null;
  wave_height_ft: number | null;
  period_s: number | null;
  wave_direction: string | null;
  tide_stage: string | null;
  tide_height_ft: number | null;
  water_temp_f: number | null;
}

interface SeriesConfig {
  key: SeriesKey;
  label: string;
  color: string;
  value: (row: ForecastRow) => number | null;
  format: (row: ForecastRow) => string;
}

interface Props {
  break_: BreakCondition;
  selectedWindow?: TimeWindow;
}

const WINDOW_ORDER: { id: TimeWindow; label: string; hours: string }[] = [
  { id: "early_morning", label: "Dawn", hours: "5-8am" },
  { id: "morning", label: "8-12pm", hours: "8am-12pm" },
  { id: "afternoon", label: "12-3pm", hours: "12-3pm" },
];

const SERIES: SeriesConfig[] = [
  {
    key: "score",
    label: "Score",
    color: "#60a5fa",
    value: (row) => row.score,
    format: (row) => `${row.score ?? "?"}/10`,
  },
  {
    key: "wind",
    label: "Wind",
    color: "#f59e0b",
    value: (row) => row.wind_speed_mph,
    format: (row) =>
      row.wind_speed_mph !== null
        ? `${row.wind_speed_mph}mph ${row.wind_direction ?? ""}`.trim()
        : "—",
  },
  {
    key: "wave",
    label: "Wave",
    color: "#38bdf8",
    value: (row) => row.wave_height_ft,
    format: (row) => {
      const size = row.wave_height_ft !== null ? `${row.wave_height_ft}ft` : "—";
      const period = row.period_s !== null ? ` ${row.period_s}s` : "";
      const dir = row.wave_direction ? ` ${row.wave_direction}` : "";
      return `${size}${period}${dir}`.trim();
    },
  },
  {
    key: "tide",
    label: "Tide",
    color: "#a78bfa",
    value: (row) => row.tide_height_ft,
    format: (row) => {
      const stage = row.tide_stage ?? "—";
      const height = row.tide_height_ft !== null ? `${row.tide_height_ft.toFixed(1)}ft` : "";
      return `${stage}${height ? ` · ${height}` : ""}`;
    },
  },
  {
    key: "temp",
    label: "Temp",
    color: "#22c55e",
    value: (row) => row.water_temp_f,
    format: (row) => (row.water_temp_f !== null ? `${row.water_temp_f}°F` : "—"),
  },
];

function buildRows(b: BreakCondition): ForecastRow[] {
  return WINDOW_ORDER.map((window) => {
    const win = b.time_windows?.[window.id];
    return {
      id: window.id,
      label: window.label,
      hours: window.hours,
      score: win?.score ?? b.score,
      wind_speed_mph: win?.wind_speed_mph ?? b.wind_speed_mph ?? null,
      wind_direction: win?.wind_direction ?? b.wind_direction ?? null,
      wave_height_ft: b.wave_height_ft,
      period_s: b.period_s,
      wave_direction: b.wave_direction,
      tide_stage: win?.tide_stage ?? b.tide_stage ?? null,
      tide_height_ft: win?.tide_height_ft ?? null,
      water_temp_f: b.water_temp_f,
    };
  });
}

function getNumericRange(values: Array<number | null>) {
  const filtered = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (filtered.length === 0) return { min: 0, max: 1 };
  let min = Math.min(...filtered);
  let max = Math.max(...filtered);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const pad = (max - min) * 0.18;
  return { min: min - pad, max: max + pad };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function BreakForecastChart({ break_, selectedWindow }: Props) {
  const rows = buildRows(break_);
  const [visibleSeries, setVisibleSeries] = useState<Record<SeriesKey, boolean>>({
    score: true,
    wind: true,
    wave: true,
    tide: true,
    temp: true,
  });

  const selectedIndex = selectedWindow ? WINDOW_ORDER.findIndex((window) => window.id === selectedWindow) : -1;
  const sharedX = [0.17, 0.5, 0.83];
  const swells = `${break_.wave_direction ?? "—"}${break_.period_s ? ` · ${break_.period_s}s` : ""}`;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500 font-mono">Forecast by daypart</div>
          <div className="text-[11px] text-slate-600 mt-1">Dawn, 8-12pm, and 12-3pm. Toggle lines below to compare metrics.</div>
        </div>
        <div className="text-[10px] text-slate-500 font-mono">Swell {swells}</div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {SERIES.map((series) => (
          <button
            key={series.key}
            type="button"
            onClick={() => setVisibleSeries((current) => ({ ...current, [series.key]: !current[series.key] }))}
            className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-mono transition-colors ${
              visibleSeries[series.key]
                ? "border-slate-600 bg-slate-800 text-white"
                : "border-slate-800 bg-slate-950 text-slate-600"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: series.color }} />
            {series.label}
          </button>
        ))}
      </div>

      <div className="mt-3 space-y-3">
        {SERIES.map((series, seriesIndex) => {
          if (!visibleSeries[series.key]) return null;
          const values = rows.map((row) => series.value(row));
          const range = getNumericRange(values);
          const width = 640;
          const height = 118;
          const left = 34;
          const right = 18;
          const top = 18;
          const bottom = 34;
          const innerWidth = width - left - right;
          const innerHeight = height - top - bottom;
          const xPositions = sharedX.map((factor) => left + factor * innerWidth);
          const points = rows.map((row, index) => {
            const raw = series.value(row);
            const y = raw === null
              ? null
              : top + (1 - clamp((raw - range.min) / (range.max - range.min), 0, 1)) * innerHeight;
            return {
              row,
              index,
              raw,
              x: xPositions[index],
              y,
            };
          });
          const path = points
            .filter((point) => point.y !== null)
            .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
            .join(" ");

          return (
            <div
              key={series.key}
              className="grid gap-2 md:grid-cols-[72px_minmax(0,1fr)] md:items-start"
            >
              <div className="pt-2">
                <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500 font-mono">{series.label}</div>
                <div className="text-[10px] text-slate-600 mt-1">
                  {series.key === "score" ? "0-10" : series.key === "wind" ? "mph" : series.key === "wave" ? "ft" : series.key === "tide" ? "ft" : "°F"}
                </div>
              </div>

              <div className="relative rounded-lg border border-slate-800 bg-slate-950/70 px-2 pb-6 pt-2 overflow-hidden">
                {selectedIndex >= 0 && (
                  <div
                    className="absolute top-0 bottom-0 bg-slate-700/10 pointer-events-none"
                    style={{
                      left: `${sharedX[selectedIndex] * 100 - 13}%`,
                      width: "26%",
                    }}
                  />
                )}

                <svg viewBox={`0 0 ${width} ${height}`} className="relative z-[1] h-[118px] w-full overflow-visible">
                  <defs>
                    <linearGradient id={`line-${series.key}`} x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor={series.color} stopOpacity="0.95" />
                      <stop offset="100%" stopColor={series.color} stopOpacity="0.35" />
                    </linearGradient>
                  </defs>

                  {[0, 1, 2, 3].map((tick) => {
                    const y = top + (innerHeight / 3) * tick;
                    return <line key={tick} x1={left} x2={width - right} y1={y} y2={y} stroke="rgba(148,163,184,0.12)" strokeWidth="1" />;
                  })}

                  {path && (
                    <path d={path} fill="none" stroke={`url(#line-${series.key})`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  )}

                  {points.map((point, index) => {
                    if (point.y === null || point.raw === null) return null;
                    const above = index % 2 === 0;
                    const labelOffset = series.key === "score" ? 12 : series.key === "wind" ? 14 : series.key === "wave" ? 16 : series.key === "tide" ? 14 : 13;
                    return (
                      <g key={`${series.key}-${point.row.id}`}>
                        <circle cx={point.x} cy={point.y} r="4.5" fill={series.color} stroke="rgba(15,23,42,0.95)" strokeWidth="2" />
                        <text
                          x={point.x}
                          y={point.y + (above ? -labelOffset : labelOffset + 2)}
                          fill="#e2e8f0"
                          fontSize="10"
                          fontFamily="monospace"
                          textAnchor="middle"
                        >
                          {series.format(point.row)}
                        </text>
                        <text
                          x={point.x}
                          y={height - 8}
                          fill={point.index === selectedIndex ? "#cbd5e1" : "#64748b"}
                          fontSize="9"
                          fontFamily="monospace"
                          textAnchor="middle"
                        >
                          {point.row.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-slate-600 font-mono">
        <span>Wave {break_.wave_height_ft !== null ? `${break_.wave_height_ft}ft` : "—"}{break_.period_s ? ` ${break_.period_s}s` : ""}</span>
        <span>Swell {break_.wave_direction ?? "—"}</span>
        <span>Temp {break_.water_temp_f !== null ? `${break_.water_temp_f}°F` : "—"}</span>
      </div>
    </div>
  );
}
