"use client";

import { useEffect, useState } from "react";

interface Point {
  t: string;
  v: string;
  type?: "H" | "L";
}

export default function TideForecastChart({ station, modelName }: { station?: string; modelName?: string }) {
  const [points, setPoints] = useState<Point[]>([]);
  const [highsLows, setHighsLows] = useState<Point[]>([]);

  useEffect(() => {
    if (!station) return;
    fetch(`/api/tides?station=${station}`)
      .then((r) => r.json())
      .then((d) => {
        setPoints((d.predictions ?? []).slice(0, 96));
        setHighsLows((d.highs_lows ?? []).slice(0, 12));
      })
      .catch(() => {
        setPoints([]);
        setHighsLows([]);
      });
  }, [station]);

  if (!station) return null;
  if (!points.length) return <div className="text-[11px] text-slate-500 font-mono">Loading 4-day tide forecast…</div>;

  const values = points.map((p) => Number.parseFloat(p.v)).filter((v) => Number.isFinite(v));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 0.1);
  const width = 1040;
  const height = 150;
  const leftPad = 30;
  const rightPad = 10;
  const padTop = 12;
  const padBottom = 18;
  const toY = (value: number) => height - ((value - min) / span) * (height - padTop - padBottom) - padBottom;
  const toX = (index: number) => leftPad + (index / (points.length - 1)) * (width - leftPad - rightPad);
  const path = points
    .map((p, i) => {
      const x = toX(i);
      const y = toY(Number.parseFloat(p.v));
      return `${i === 0 ? "M" : "L"}${x},${Number.isFinite(y) ? y : height / 2}`;
    })
    .join(" ");

  const pointIndexByTime = new Map(points.map((p, i) => [p.t, i]));
  const axisTicks = points
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => {
      const hour = Number.parseInt(p.t.slice(11, 13), 10);
      return hour === 6 || hour === 12 || hour === 18;
    });

  function formatClock(ts: string) {
    const date = new Date(ts.replace(" ", "T"));
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();
  }
  function formatDay(ts: string) {
    const date = new Date(ts.replace(" ", "T"));
    return date.toLocaleDateString("en-US", { weekday: "short", month: "numeric", day: "numeric" });
  }
  const yTicks = [min, min + span / 2, max];

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-2">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500 font-mono">High/Low Tide Forecast</div>
        <div className="text-[11px] text-slate-500 font-mono">Model: {modelName ?? "weighted-rules-v1"}</div>
      </div>
      <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[980px] w-full h-32">
        {yTicks.map((tick) => {
          const y = toY(tick);
          return (
            <g key={`y-${tick}`}>
              <line x1={leftPad} x2={width - rightPad} y1={y} y2={y} stroke="rgba(148,163,184,0.14)" strokeWidth="1" />
              <text x={2} y={y + 4} fill="#64748b" fontSize="10" fontFamily="monospace">
                {tick.toFixed(1)}ft
              </text>
            </g>
          );
        })}
        {axisTicks.map(({ p, i }) => {
          const x = toX(i);
          const hour = Number.parseInt(p.t.slice(11, 13), 10);
          const label = hour === 6 ? "6am" : hour === 12 ? "12pm" : "6pm";
          const day = formatDay(p.t);
          return (
            <g key={`tick-${p.t}`}>
              <line x1={x} x2={x} y1={height - 18} y2={height - 10} stroke="rgba(148,163,184,0.35)" strokeWidth="1" />
              <text x={x} y={height - 1} fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="middle">
                {label}
              </text>
              {hour === 6 && (
                <text x={x} y={10} fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="middle">
                  {day}
                </text>
              )}
            </g>
          );
        })}
        <path d={path} stroke="#94a3b8" strokeWidth="2" fill="none" />
        {highsLows.slice(0, 8).map((p) => {
          const idx = pointIndexByTime.get(p.t);
          if (idx === undefined) return null;
          const x = toX(idx);
          const y = toY(Number.parseFloat(p.v));
          const isHigh = p.type === "H";
          const label = `${isHigh ? "High" : "Low"} ${formatClock(p.t)}`;
          const ty = isHigh ? y - 8 : y + 16;
          return (
            <g key={`marker-${p.t}-${p.type}`}>
              <circle cx={x} cy={y} r="3" fill={isHigh ? "#f59e0b" : "#60a5fa"} />
              <text x={x + 4} y={ty} fill="#cbd5e1" fontSize="10.5" fontFamily="monospace">
                {isHigh ? "▲" : "▼"} {label}
              </text>
            </g>
          );
        })}
      </svg>
      </div>
      <div className="flex justify-between text-[10px] text-slate-600 font-mono">
        <span>Curve shows hourly levels</span>
        <span>High/low timestamps are exact</span>
      </div>
    </div>
  );
}
