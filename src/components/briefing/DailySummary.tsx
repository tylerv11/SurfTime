"use client";

export default function DailySummary({ summary }: { summary: string }) {
  return (
    <div className="bg-blue-900/40 border-b border-blue-800/50 px-4 py-2">
      <p className="text-sm text-blue-100">
        <span className="font-semibold text-blue-300 mr-2">Today:</span>
        {summary}
      </p>
    </div>
  );
}
