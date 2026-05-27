"use client";

interface Props {
  summary: string;
  updatedAt?: string | null;
}

export default function DailySummary({ summary }: Props) {
  return (
    <div className="border-b border-slate-800 px-4 py-2.5 flex-shrink-0 bg-slate-900/60">
      <div className="flex items-start gap-3 max-w-4xl">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-0.5 flex-shrink-0">Brief</span>
        <div className="min-w-0">
          <p className="text-xs text-slate-300 leading-relaxed">{summary}</p>
          <p className="mt-2 text-[10px] text-slate-600 leading-relaxed">
            SurfTime pulls buoy, wind, and tide data into Supabase, refreshes daily at 6:00 AM Pacific, and renders the live map from one public URL. Feature ideas: tylervincent@alumni.usc.edu.
          </p>
        </div>
      </div>
    </div>
  );
}
