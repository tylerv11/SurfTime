"use client";

import { useEffect, useState, useCallback } from "react";
import BreakMap from "@/components/map/BreakMap";
import BreakCard from "@/components/breaks/BreakCard";
import DailySummary from "@/components/briefing/DailySummary";

export interface TimeWindowData {
  score: number | null;
  rating: string;
  wind_quality: string;
  wind_speed_mph: number;
  wind_direction: string;
  tide_stage: string;
  tide_height_ft: number | null;
}

export interface BreakCondition {
  break_id: string;
  break_name: string;
  region?: string;
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
  time_windows?: {
    early_morning?: TimeWindowData;
    morning?: TimeWindowData;
    afternoon?: TimeWindowData;
  };
}

interface ConditionsData {
  breaks: BreakCondition[];
  daily_summary: string | null;
  updated_at: string | null;
}

export type TimeWindow = "early_morning" | "morning" | "afternoon";

const TIME_WINDOWS: { id: TimeWindow; label: string; hours: string; sliderVal: number }[] = [
  { id: "early_morning", label: "Dawn",      hours: "5–8 am",    sliderVal: 0 },
  { id: "morning",       label: "Morning",   hours: "8 am–12",   sliderVal: 1 },
  { id: "afternoon",     label: "Afternoon", hours: "12–3 pm",   sliderVal: 2 },
];

const REGION_FILTERS: { id: string; label: string; regions: string[] }[] = [
  { id: "all",  label: "All",          regions: [] },
  { id: "sd",   label: "San Diego",    regions: ["sd"] },
  { id: "oc",   label: "Orange Co.",   regions: ["oc"] },
  { id: "la",   label: "LA",           regions: ["la"] },
  { id: "sf",   label: "SF / NorCal",  regions: ["sf", "central"] },
];

type SortBy = "score" | "wave_height";

function getRegionLabel(regionFilter: string) {
  return REGION_FILTERS.find((filter) => filter.id === regionFilter)?.label ?? "All";
}

function getDefaultWindow(): TimeWindow {
  const h = new Date().getHours();
  if (h < 8) return "early_morning";
  if (h < 12) return "morning";
  return "afternoon";
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

function formatAbsoluteTime(isoString: string | null): string {
  if (!isoString) return "";
  return new Date(isoString).toLocaleString("en-US", {
    month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
    hour12: true, timeZoneName: "short",
  });
}

export function getBreakForWindow(b: BreakCondition, window: TimeWindow): BreakCondition {
  const win = b.time_windows?.[window];
  if (!win) return b;
  return {
    ...b,
    score: win.score,
    rating: win.rating,
    wind_quality: win.wind_quality,
    wind_speed_mph: win.wind_speed_mph,
    wind_direction: win.wind_direction,
    tide_stage: win.tide_stage,
  };
}

export default function Home() {
  const [data, setData] = useState<ConditionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<"map" | "list">("map");
  const [timeWindow, setTimeWindow] = useState<TimeWindow>(getDefaultWindow);
  const [regionFilter, setRegionFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortBy>("score");

  const sliderIdx = TIME_WINDOWS.findIndex((w) => w.id === timeWindow);
  const relativeTime = useRelativeTime(data?.updated_at ?? null);

  const fetchData = useCallback((isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setRefreshing(true);
    fetch("/api/conditions")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => { setLoading(false); setRefreshing(false); });
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(() => fetchData(true), 10 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchData]);

  const windowedBreaks = data?.breaks.map((b) => getBreakForWindow(b, timeWindow)) ?? [];

  const activeFilter = REGION_FILTERS.find((f) => f.id === regionFilter)!;
  const filteredBreaks = activeFilter.regions.length === 0
    ? windowedBreaks
    : windowedBreaks.filter((b) => b.region && activeFilter.regions.includes(b.region));

  const sortedBreaks = [...filteredBreaks].sort((a, b) => {
    if (sortBy === "wave_height") return (b.wave_height_ft ?? 0) - (a.wave_height_ft ?? 0);
    return (b.score ?? 0) - (a.score ?? 0);
  });

  const selectedBreak = sortedBreaks.find((b) => b.break_id === selected) ?? null;
  const bestBreaks = filteredBreaks
    .filter((b) => b.rating === "epic" || b.rating === "good")
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 4);

  const activeWindow = TIME_WINDOWS[sliderIdx];

  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <header className="px-4 py-3 border-b border-slate-800 flex items-center justify-between flex-shrink-0 bg-slate-950/95 backdrop-blur z-10">
        <div className="flex items-center gap-3 min-w-0">
          <pre className="hidden lg:block text-[9px] leading-tight text-blue-500/50 font-mono select-none flex-shrink-0">
            {`  ~  ~~~  ~\n )) surf ((\n  ~  ~~~  ~`}
          </pre>
          <div className="min-w-0">
            <h1 className="text-base font-bold tracking-tight leading-none font-mono">SurfTime</h1>
            <p className="text-[11px] text-slate-500 leading-none mt-0.5 hidden sm:block tracking-wide uppercase">CA Surf Conditions</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {data?.updated_at && (
            <div className="hidden md:flex items-center gap-1.5 text-xs" title={formatAbsoluteTime(data.updated_at)}>
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${refreshing ? "bg-yellow-400 animate-pulse" : "bg-emerald-500"}`} />
              <span className="text-slate-500">Updated {relativeTime}</span>
            </div>
          )}

          <a
            href="https://github.com/tylerv11/SurfTime"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="GitHub (private)"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </a>

          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors disabled:opacity-40"
            title="Refresh"
          >
            <svg className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          <div className="flex rounded-md overflow-hidden border border-slate-700">
            {(["map", "list"] as const).map((v) => (
              <button
                key={v}
                className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${view === v ? "bg-blue-600 text-white" : "bg-slate-900 text-slate-400 hover:text-white"}`}
                onClick={() => { setView(v); if (v === "map") setSelected(null); }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-4">
          <pre className="text-blue-500/40 text-[10px] leading-tight font-mono select-none text-center">
            {`   ~  ~~~  ~  ~~~  ~\n  )))  loading  (((\n   ~  ~~~  ~  ~~~  ~`}
          </pre>
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-3">
          <pre className="text-slate-600 text-[10px] leading-tight font-mono text-center">
            {`  __\n |  |  wipeout\n |__|`}
          </pre>
          <p className="text-slate-400 text-sm">Failed to load conditions.</p>
          <button onClick={() => fetchData()} className="text-sm text-blue-400 hover:underline">Try again</button>
        </div>
      ) : (
        <div className="flex flex-col flex-1 overflow-hidden">
          {data.daily_summary && (
            <DailySummary summary={data.daily_summary} updatedAt={data.updated_at} />
          )}

          {/* Time-of-day slider */}
          <div className="px-4 py-3 border-b border-slate-800 bg-slate-950 flex-shrink-0">
            <div className="flex items-center gap-4 max-w-2xl">
              <div className="flex-shrink-0 w-28 hidden sm:block">
                <div className="text-xs font-semibold text-slate-200 font-mono">{activeWindow.label}</div>
                <div className="text-[10px] text-slate-500">{activeWindow.hours}</div>
              </div>

              <div className="flex-1 relative">
                <div className="flex justify-between mb-1.5 px-0.5">
                  {TIME_WINDOWS.map((w, i) => (
                    <button
                      key={w.id}
                      onClick={() => setTimeWindow(w.id)}
                      className={`flex flex-col items-center transition-all ${
                        sliderIdx === i ? "text-white" : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      <span className={`text-[10px] font-mono font-medium ${sliderIdx === i ? "text-blue-400" : ""}`}>{w.label}</span>
                      <span className="text-[9px] text-slate-600 mt-0.5">{w.hours}</span>
                    </button>
                  ))}
                </div>

                <div className="relative h-5 flex items-center">
                  <div className="absolute inset-x-0 h-px bg-slate-700" />
                  <div
                    className="absolute h-px bg-blue-500 transition-all duration-200"
                    style={{ width: `${(sliderIdx / 2) * 100}%` }}
                  />
                  {TIME_WINDOWS.map((_, i) => (
                    <div
                      key={i}
                      className={`absolute w-2 h-2 rounded-full border transition-all duration-200 ${
                        i <= sliderIdx ? "bg-blue-500 border-blue-400" : "bg-slate-800 border-slate-600"
                      }`}
                      style={{ left: `calc(${(i / 2) * 100}% - 4px)` }}
                    />
                  ))}
                  <input
                    type="range" min={0} max={2} step={1} value={sliderIdx}
                    onChange={(e) => setTimeWindow(TIME_WINDOWS[Number(e.target.value)].id)}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
                  />
                </div>
              </div>

              {data.updated_at && (
                <div className="flex-shrink-0 text-right hidden sm:block" title={formatAbsoluteTime(data.updated_at)}>
                  <div className="flex items-center gap-1 justify-end">
                    <span className={`w-1.5 h-1.5 rounded-full ${refreshing ? "bg-yellow-400 animate-pulse" : "bg-emerald-500"}`} />
                    <span className="text-[10px] text-slate-500">Pulled {relativeTime}</span>
                  </div>
                  <div className="text-[10px] text-slate-600">{formatAbsoluteTime(data.updated_at)}</div>
                </div>
              )}
            </div>
          </div>

          {/* Best breaks row (map view only) */}
          {view === "map" && bestBreaks.length > 0 && (
            <div className="flex gap-2 px-3 py-2 overflow-x-auto border-b border-slate-800 flex-shrink-0 lg:hidden">
              <span className="text-[10px] text-slate-600 self-center whitespace-nowrap uppercase tracking-wide">Best</span>
              {bestBreaks.map((b) => (
                <button
                  key={b.break_id}
                  onClick={() => { setSelected(b.break_id); setView("map"); }}
                  className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-sm border font-mono transition-colors ${
                    b.rating === "epic"
                      ? "bg-purple-500/10 border-purple-500/40 text-purple-300"
                      : "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                  }`}
                >
                  {b.break_name} {b.score}/10
                </button>
              ))}
            </div>
          )}

          {view === "map" && (
            <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-950 flex items-center justify-between gap-3 flex-wrap flex-shrink-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-600 uppercase tracking-wide">Region</span>
                {REGION_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setRegionFilter(f.id);
                      setSelected(null);
                    }}
                    className={`text-xs px-3 py-1 rounded-sm border font-mono transition-colors ${
                      regionFilter === f.id
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-600 uppercase tracking-wide">Time</span>
                {TIME_WINDOWS.map((window) => (
                  <button
                    key={window.id}
                    onClick={() => setTimeWindow(window.id)}
                    className={`text-xs px-3 py-1 rounded-sm border font-mono transition-colors ${
                      timeWindow === window.id
                        ? "bg-slate-700 border-slate-600 text-white"
                        : "bg-slate-900 border-slate-800 text-slate-500 hover:text-white"
                    }`}
                  >
                    {window.label}
                  </button>
                ))}
                <span className="text-[10px] text-slate-600 ml-1">{sortedBreaks.length} spots</span>
              </div>
            </div>
          )}

          {/* List view: full grid with filters */}
          {view === "list" ? (
            <div className="flex-1 overflow-y-auto">
              {/* Filter + sort bar */}
              <div className="sticky top-0 z-10 px-4 py-2.5 border-b border-slate-800 bg-slate-950 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {REGION_FILTERS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setRegionFilter(f.id)}
                      className={`text-xs px-3 py-1 rounded-sm border font-mono transition-colors ${
                        regionFilter === f.id
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-600 uppercase tracking-wide">Sort</span>
                  {(["score", "wave_height"] as SortBy[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSortBy(s)}
                      className={`text-xs px-2.5 py-1 rounded-sm border font-mono transition-colors ${
                        sortBy === s
                          ? "bg-slate-700 border-slate-600 text-white"
                          : "bg-slate-900 border-slate-800 text-slate-500 hover:text-white"
                      }`}
                    >
                      {s === "score" ? "Score" : "Wave Ht"}
                    </button>
                  ))}
                  <span className="text-[10px] text-slate-600 ml-1">{sortedBreaks.length} spots</span>
                </div>
              </div>

              {/* Grid */}
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {sortedBreaks.map((b) => (
                  <BreakCard
                    key={b.break_id}
                    break_={b}
                    timeWindow={timeWindow}
                    onSelect={() => { setSelected(b.break_id); setView("map"); }}
                  />
                ))}
                {sortedBreaks.length === 0 && (
                  <div className="col-span-full text-center py-12 text-slate-600 font-mono text-sm">
                    No breaks in this region.
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Map view */
            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
              <div className="flex-1 lg:basis-1/2 overflow-hidden border-b border-slate-800 lg:border-b-0 lg:border-r">
                <BreakMap
                  breaks={sortedBreaks}
                  selected={selected}
                  onSelect={setSelected}
                  focusLabel={getRegionLabel(regionFilter)}
                />
              </div>

              <div className={`lg:basis-1/2 overflow-y-auto bg-slate-950 flex-shrink-0
                ${!selected ? "hidden lg:flex lg:flex-col" : "flex flex-col"}`}>
                {selected && selectedBreak ? (
                  <div className="p-4 flex flex-col gap-3">
                    <button
                      className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 self-start font-mono"
                      onClick={() => setSelected(null)}
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      All breaks
                    </button>
                    <BreakCard break_={selectedBreak} expanded timeWindow={timeWindow} />
                  </div>
                ) : (
                  <div className="p-3 space-y-2">
                    <p className="text-[10px] text-slate-600 px-1 py-1 font-mono uppercase tracking-wide">
                      {sortedBreaks.length} breaks — {getRegionLabel(regionFilter)} — sorted by score
                    </p>
                    {sortedBreaks.map((b) => (
                        <BreakCard
                          key={b.break_id}
                          break_={b}
                          onSelect={() => setSelected(b.break_id)}
                          timeWindow={timeWindow}
                        />
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mobile footer */}
          {data.updated_at && (
            <div className="sm:hidden flex items-center justify-center gap-2 py-2 border-t border-slate-800 text-xs text-slate-600">
              <span className={`w-1.5 h-1.5 rounded-full ${refreshing ? "bg-yellow-400 animate-pulse" : "bg-emerald-500"}`} />
              {formatAbsoluteTime(data.updated_at)}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
