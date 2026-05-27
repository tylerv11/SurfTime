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
