"use client";

import { useEffect, useState } from "react";
import BreakMap from "@/components/map/BreakMap";
import BreakCard from "@/components/breaks/BreakCard";
import DailySummary from "@/components/briefing/DailySummary";

export interface BreakCondition {
  break_id: string;
  break_name: string;
  lat: number;
  lng: number;
  score: number | null;
  rating: string;
  wave_height_ft: number | null;
  period_s: number | null;
  wave_direction: string | null;
  wind_quality: string;
  wind_speed_mph: number;
  wind_direction: string;
  tide_stage: string;
  water_temp_f: number | null;
  briefing: string;
  updated_at: string;
}

interface ConditionsData {
  breaks: BreakCondition[];
  daily_summary: string | null;
  updated_at: string | null;
}

export default function Home() {
  const [data, setData] = useState<ConditionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<"map" | "list">("map");

  useEffect(() => {
    fetch("/api/conditions")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const selectedBreak = data?.breaks.find((b) => b.break_id === selected);

  return (
    <main className="min-h-screen bg-slate-900 text-white">
      <header className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏄</span>
          <h1 className="text-xl font-bold tracking-tight">SurfTime</h1>
          <span className="text-xs text-slate-400 hidden sm:block">SoCal Surf Conditions</span>
        </div>
        <div className="flex items-center gap-3">
          {data?.updated_at && (
            <span className="text-xs text-slate-500">
              Updated {new Date(data.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <div className="flex rounded-lg overflow-hidden border border-slate-600">
            <button className={`px-3 py-1 text-sm ${view === "map" ? "bg-blue-600" : "bg-slate-800"}`} onClick={() => setView("map")}>Map</button>
            <button className={`px-3 py-1 text-sm ${view === "list" ? "bg-blue-600" : "bg-slate-800"}`} onClick={() => setView("list")}>List</button>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-slate-400 animate-pulse">Loading conditions...</div>
        </div>
      ) : !data ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-slate-400">Failed to load conditions. Try again soon.</div>
        </div>
      ) : (
        <>
          {data.daily_summary && <DailySummary summary={data.daily_summary} />}
          <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)]">
            <div className={`flex-1 ${view === "list" ? "hidden lg:block" : ""}`}>
              <BreakMap breaks={data.breaks} selected={selected} onSelect={setSelected} />
            </div>
            <div className={`lg:w-96 overflow-y-auto border-l border-slate-700 ${view === "map" && !selected ? "hidden lg:block" : ""}`}>
              {selected && selectedBreak ? (
                <div className="p-4">
                  <button className="text-sm text-blue-400 mb-3" onClick={() => setSelected(null)}>← All breaks</button>
                  <BreakCard break_={selectedBreak} expanded />
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  <p className="text-xs text-slate-500 px-1">{data.breaks.length} breaks · tap to explore</p>
                  {data.breaks.map((b) => (
                    <BreakCard key={b.break_id} break_={b} onSelect={() => setSelected(b.break_id)} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </main>
  );
}
