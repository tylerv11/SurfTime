"use client";

import { useEffect, useState } from "react";

interface Point {
  t: string;
  v: string;
  type?: "H" | "L";
}

export default function TideForecastChart({ station }: { station?: string }) {
  const [points, setPoints] = useState<Point[]>([]);
  const [highsLows, setHighsLows] = useState<Point[]>([]);

  useEffect(() => {
    if (!station) return;
    fetch(`/api/tides?station=${station}`)
      .then((r) => r.json())
      .then((d) => {
        setPoints((d.predictions ?? []).slice(0, 72));
        setHighsLows((d.highs_lows ?? []).slice(0, 12));
      })
      .catch(() => {
        setPoints([]);
        setHighsLows([]);
      });
  }, [station]);

  if (!station) return null;
  if (!points.length) return <div className="text-[11px] text-slate-500 font-mono">Loading 3-day tide forecast…</div>;

  const values = points.map((p) => Number.parseFloat(p.v)).filter((v) => Number.isFinite(v));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 0.1);
  const width = 780;
  const height = 150;
  const padTop = 12;
  const padBottom = 18;
  const toY = (value: number) => height - ((value - min) / span) * (height - padTop - padBottom) - padBottom;
  const toX = (index: number) => (index / (points.length - 1)) * width;
  const path = points
    .map((p, i) => {
      const x = toX(i);
      const y = toY(Number.parseFloat(p.v));
      return `${i === 0 ? "M" : "L"}${x},${Number.isFinite(y) ? y : height / 2}`;
    })
    .join(" ");

  const pointIndexByTime = new Map(points.map((p, i) => [p.t, i]));

  function formatClock(ts: string) {
    const date = new Date(ts.replace(" ", "T"));
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-2">
      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-mono mb-1">Tide Forecast (next 3 days)</div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32">
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
              <text x={x + 4} y={ty} fill="#cbd5e1" fontSize="9" fontFamily="monospace">
                {isHigh ? "▲" : "▼"} {label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-2 text-[10px] text-slate-500 font-mono">Exact highs/lows:</div>
      <div className="mt-1 grid grid-cols-2 gap-1 text-[10px] text-slate-400 font-mono">
        {highsLows.slice(0, 8).map((p) => (
          <div key={`${p.t}-${p.type}`} className="truncate">
            {p.type === "H" ? "▲ High" : "▼ Low"} {p.v}ft @ {p.t.slice(5, 16)}
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-slate-600 font-mono">
        <span>Curve shows hourly levels</span>
        <span>High/low timestamps are exact</span>
      </div>
    </div>
  );
}
