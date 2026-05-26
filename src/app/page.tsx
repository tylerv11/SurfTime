"use client";

import { useEffect, useState, useCallback } from "react";
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

function useRelativeTime(isoString: string | null) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (!isoString) return;
    const update = () => {
      const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
      if (diff < 60) setLabel("just now");
      else if (diff < 3600) setLabel(`${Math.floor(diff / 60)}m ago`);
      else if (diff < 86400) setLabel(`${Math.floor(diff / 3600)}h ago`);
      else setLabel(`${Math.floor(diff / 86400)}d ago`);
    };
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [isoString]);

  return label;
}

export default function Home() {
  const [data, setData] = useState<ConditionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<"map" | "list">("map");

  const relativeTime = useRelativeTime(data?.updated_at ?? null);

  const fetchData = useCallback((isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setRefreshing(true);
    fetch("/api/conditions")
      .then((r) => r.json())
      .then((d) => { setData(d); })
      .catch(() => {})
      .finally(() => { setLoading(false); setRefreshing(false); });
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 10 minutes
    const id = setInterval(() => fetchData(true), 10 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchData]);

  const selectedBreak = data?.breaks.find((b) => b.break_id === selected);

  const bestBreaks = data?.breaks
    .filter((b) => b.rating === "epic" || b.rating === "good")
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 3) ?? [];

  return (
    <main className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Header */}
      <header className="px-4 py-3 border-b border-slate-700/60 flex items-center justify-between flex-shrink-0 bg-slate-900/95 backdrop-blur z-10">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏄</span>
          <div>
            <h1 className="text-lg font-bold tracking-tight leading-none">SurfTime</h1>
            <p className="text-xs text-slate-500 leading-none mt-0.5">SoCal Surf Conditions</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Last fetched indicator */}
          {data?.updated_at && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${refreshing ? "bg-yellow-400 animate-pulse" : "bg-green-500"}`} />
              <span className="text-slate-400">Updated {relativeTime}</span>
            </div>
          )}

          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-50"
            title="Refresh conditions"
          >
            <svg className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          <div className="flex rounded-lg overflow-hidden border border-slate-600/60">
            <button
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === "map" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}
              onClick={() => setView("map")}
            >
              Map
            </button>
            <button
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === "list" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}
              onClick={() => setView("list")}
            >
              List
            </button>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading conditions…</p>
        </div>
      ) : !data ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-3">
          <span className="text-4xl">🌊</span>
          <p className="text-slate-400">Failed to load conditions.</p>
          <button onClick={() => fetchData()} className="text-sm text-blue-400 hover:underline">Try again</button>
        </div>
      ) : (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Daily summary banner */}
          {data.daily_summary && (
            <DailySummary summary={data.daily_summary} updatedAt={data.updated_at} />
          )}

          {/* Best breaks chips (mobile) */}
          {bestBreaks.length > 0 && (
            <div className="flex gap-2 px-3 py-2 overflow-x-auto border-b border-slate-700/40 flex-shrink-0 lg:hidden">
              <span className="text-xs text-slate-500 self-center whitespace-nowrap">Best now:</span>
              {bestBreaks.map((b) => (
                <button
                  key={b.break_id}
                  onClick={() => { setSelected(b.break_id); setView("map"); }}
                  className={`flex-shrink-0 text-xs px-3 py-1 rounded-full border font-medium transition-colors ${
                    b.rating === "epic"
                      ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
                      : "bg-green-500/20 border-green-500/50 text-green-300"
                  }`}
                >
                  {b.break_name}
                </button>
              ))}
            </div>
          )}

          {/* Main content */}
          <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
            {/* Map pane */}
            <div className={`flex-1 overflow-hidden ${view === "list" ? "hidden lg:block" : ""}`}>
              <BreakMap breaks={data.breaks} selected={selected} onSelect={setSelected} />
            </div>

            {/* Sidebar */}
            <div
              className={`lg:w-96 overflow-y-auto border-l border-slate-700/60 bg-slate-900 flex-shrink-0
                ${view === "map" && !selected ? "hidden lg:flex lg:flex-col" : "flex flex-col"}
              `}
            >
              {selected && selectedBreak ? (
                <div className="p-4 flex flex-col gap-3">
                  <button
                    className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 self-start transition-colors"
                    onClick={() => setSelected(null)}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    All breaks
                  </button>
                  <BreakCard break_={selectedBreak} expanded />
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  <p className="text-xs text-slate-500 px-1 py-1">
                    {data.breaks.length} breaks · tap a pin or name to explore
                  </p>
                  {[...data.breaks]
                    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
                    .map((b) => (
                      <BreakCard
                        key={b.break_id}
                        break_={b}
                        onSelect={() => { setSelected(b.break_id); setView("map"); }}
                      />
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Mobile last-updated footer */}
          {data.updated_at && (
            <div className="sm:hidden flex items-center justify-center gap-2 py-2 border-t border-slate-700/40 text-xs text-slate-500">
              <span className={`w-1.5 h-1.5 rounded-full ${refreshing ? "bg-yellow-400 animate-pulse" : "bg-green-500"}`} />
              Data updated {relativeTime}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
