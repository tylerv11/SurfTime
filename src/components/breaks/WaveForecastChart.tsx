"use client";

import { useEffect, useState } from "react";

interface Point {
  t: string;
  v: number;
}

export default function WaveForecastChart({ lat, lng }: { lat: number; lng: number }) {
  const [points, setPoints] = useState<Point[]>([]);

  useEffect(() => {
    fetch(`/api/waves?lat=${lat}&lng=${lng}`)
      .then((r) => r.json())
      .then((d) => setPoints((d.points ?? []).slice(0, 72)))
      .catch(() => setPoints([]));
  }, [lat, lng]);

  if (!points.length) return <div className="text-[11px] text-slate-500 font-mono">Loading 3-day wave forecast…</div>;

  const values = points.map((p) => p.v).filter((v) => Number.isFinite(v));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 0.1);
  const width = 780;
  const height = 140;
  const padTop = 10;
  const padBottom = 18;
  const toY = (value: number) => height - ((value - min) / span) * (height - padTop - padBottom) - padBottom;
  const toX = (index: number) => (index / (points.length - 1)) * width;

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(p.v)}`).join(" ");
  const axisTicks = points
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => {
      const hour = new Date(p.t).getHours();
      return hour === 6 || hour === 12 || hour === 18;
    });
  const peak = points.reduce((acc, p) => (p.v > acc.v ? p : acc), points[0]);
  const trough = points.reduce((acc, p) => (p.v < acc.v ? p : acc), points[0]);
  const peakIdx = points.findIndex((p) => p.t === peak.t);
  const troughIdx = points.findIndex((p) => p.t === trough.t);
  const fmt = (ts: string) =>
    new Date(ts).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", hour12: true }).toLowerCase();

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-2">
      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-mono mb-1">Wave Height Forecast (next 3 days)</div>
      <div className="text-[10px] text-slate-600 font-mono mb-1">Projection from marine forecast model inputs.</div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-28">
        {axisTicks.map(({ p, i }) => {
          const x = toX(i);
          const hour = new Date(p.t).getHours();
          const label = hour === 6 ? "6am" : hour === 12 ? "12pm" : "6pm";
          const day = new Date(p.t).toLocaleDateString("en-US", { weekday: "short" });
          return (
            <g key={`tick-${p.t}`}>
              <line x1={x} x2={x} y1={height - 18} y2={height - 10} stroke="rgba(148,163,184,0.35)" strokeWidth="1" />
              <text x={x} y={height - 1} fill="#64748b" fontSize="8.5" fontFamily="monospace" textAnchor="middle">
                {label}
              </text>
              {hour === 6 && (
                <text x={x} y={10} fill="#64748b" fontSize="8.5" fontFamily="monospace" textAnchor="middle">
                  {day}
                </text>
              )}
            </g>
          );
        })}
        <path d={path} stroke="#38bdf8" strokeWidth="2" fill="none" />
        <circle cx={toX(peakIdx)} cy={toY(peak.v)} r="3" fill="#22c55e" />
        <text x={toX(peakIdx) + 4} y={toY(peak.v) - 6} fill="#cbd5e1" fontSize="9" fontFamily="monospace">
          ▲ Peak {peak.v.toFixed(1)}ft {fmt(peak.t)}
        </text>
        <circle cx={toX(troughIdx)} cy={toY(trough.v)} r="3" fill="#f59e0b" />
        <text x={toX(troughIdx) + 4} y={toY(trough.v) + 14} fill="#cbd5e1" fontSize="9" fontFamily="monospace">
          ▼ Low {trough.v.toFixed(1)}ft {fmt(trough.t)}
        </text>
      </svg>
    </div>
  );
}
