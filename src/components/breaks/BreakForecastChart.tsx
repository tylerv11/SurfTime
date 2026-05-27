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
  air_temp_f: number | null;
}

interface SeriesConfig {
  key: SeriesKey;
  label: string;
  color: string;
  value: (row: ForecastRow) => number | null;
  format: (row: ForecastRow) => string;
  unit: string;
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
    unit: "0-10",
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
    unit: "mph",
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
    unit: "ft",
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
    unit: "ft",
  },
  {
    key: "temp",
    label: "Temp",
    color: "#22c55e",
    value: (row) => row.air_temp_f ?? row.water_temp_f,
    format: (row) => {
      const v = row.air_temp_f ?? row.water_temp_f;
      return v !== null ? `${v}°F` : "—";
    },
    unit: "°F",
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
      air_temp_f: win?.air_temp_f ?? null,
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
  const chartWidth = 780;
  const chartHeight = 320;
  const left = 54;
  const right = 18;
  const top = 24;
  const bottom = 36;
  const innerWidth = chartWidth - left - right;
  const innerHeight = chartHeight - top - bottom;
  const xPositions = [0.15, 0.5, 0.85].map((factor) => left + factor * innerWidth);
  const seriesList = SERIES.filter((series) => visibleSeries[series.key]);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500 font-mono">Forecast by daypart</div>
          <div className="text-[11px] text-slate-600 mt-1">
            These values are projections from the current forecast inputs, not historical readings.
          </div>
        </div>
        <div className="text-[10px] text-slate-500 font-mono">Swell {break_.wave_direction ?? "—"}{break_.period_s ? ` · ${break_.period_s}s` : ""}</div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-[0.22em] text-slate-500 font-mono">Toggle Lines:</span>
        {SERIES.map((series) => {
          const active = visibleSeries[series.key];
          return (
            <button
              key={series.key}
              type="button"
              onClick={() => setVisibleSeries((current) => ({ ...current, [series.key]: !current[series.key] }))}
              className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-mono transition-colors ${
                active ? "border-slate-600 bg-slate-800 text-white" : "border-slate-800 bg-slate-950 text-slate-600"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: series.color }} />
              {series.label}
            </button>
          );
        })}
      </div>

      <div className="mt-3 relative rounded-lg border border-slate-800 bg-slate-950/70 px-2 pb-8 pt-3 overflow-hidden">
        {selectedIndex >= 0 && (
          <div
            className="absolute top-0 bottom-0 bg-slate-700/10 pointer-events-none"
            style={{
              left: `${selectedIndex === 0 ? "0" : selectedIndex === 1 ? "33.33" : "66.66"}%`,
              width: "33.33%",
            }}
          />
        )}

        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="relative z-[1] h-[320px] w-full overflow-visible">
          {seriesList.length > 0 &&
            [0, 1, 2, 3].map((tick) => {
              const y = top + (innerHeight / 3) * tick;
              return <line key={tick} x1={left} x2={chartWidth - right} y1={y} y2={y} stroke="rgba(148,163,184,0.12)" strokeWidth="1" />;
            })}

          {seriesList.map((series) => {
            const values = rows.map((row) => series.value(row));
            const range = getNumericRange(values);
            const points = rows.map((row, index) => {
              const raw = series.value(row);
              const y = raw === null
                ? null
                : top + (1 - clamp((raw - range.min) / (range.max - range.min), 0, 1)) * innerHeight;
              return { row, index, raw, x: xPositions[index], y };
            });
            const path = points
              .filter((point) => point.y !== null)
              .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
              .join(" ");

            return (
              <g key={series.key}>
                {path && (
                  <path d={path} fill="none" stroke={series.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.92" />
                )}
                {points.map((point, pointIndex) => {
                  if (point.y === null || point.raw === null) return null;
                  const labelAbove = pointIndex !== 1;
                  const verticalOffset = 14 + seriesList.findIndex((entry) => entry.key === series.key) * 10;
                  const labelY = point.y + (labelAbove ? -(verticalOffset + 4) : verticalOffset + 10);
                  const labelX = point.x + (series.key === "score" ? 0 : series.key === "wind" ? 4 : series.key === "wave" ? -4 : 0);
                  return (
                    <g key={`${series.key}-${point.row.id}`}>
                      <circle cx={point.x} cy={point.y} r="4.5" fill={series.color} stroke="rgba(15,23,42,0.95)" strokeWidth="2" />
                      <circle cx={point.x} cy={point.y} r="10" fill="transparent" />
                      <text
                        x={labelX}
                        y={labelY}
                        fill="#e2e8f0"
                        fontSize="10"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {series.format(point.row)}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}

          {rows.map((row, index) => (
            <g key={row.id}>
              <text
                x={xPositions[index]}
                y={chartHeight - 10}
                fill={index === selectedIndex ? "#cbd5e1" : "#64748b"}
                fontSize="10"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {row.label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-slate-600 font-mono">
        <span>Wave {break_.wave_height_ft !== null ? `${break_.wave_height_ft}ft` : "—"}{break_.period_s ? ` ${break_.period_s}s` : ""}</span>
        <span>Swell {break_.wave_direction ?? "—"}</span>
        <span>Temp {break_.water_temp_f !== null ? `${break_.water_temp_f}°F` : "—"}</span>
      </div>
    </div>
  );
}
