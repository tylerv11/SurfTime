"use client";

interface Props {
  summary: string;
  updatedAt?: string | null;
}

export default function DailySummary({ summary }: Props) {
  return (
    <div className="bg-gradient-to-r from-blue-950/60 to-slate-900/60 border-b border-blue-800/30 px-4 py-2.5 flex-shrink-0">
      <div className="flex items-start gap-2 max-w-4xl">
        <span className="text-blue-400 text-sm mt-0.5 flex-shrink-0">🌐</span>
        <p className="text-sm text-slate-200 leading-relaxed">
          <span className="font-semibold text-blue-300 mr-1.5">Today:</span>
          {summary}
        </p>
      </div>
    </div>
  );
}
