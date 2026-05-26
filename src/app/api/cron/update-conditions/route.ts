import { NextRequest, NextResponse } from "next/server";

// Vercel Cron triggers this every 3 hours via vercel.json
// Also callable manually for on-demand updates
export async function POST(req: NextRequest) {
  // Verify this is from Vercel Cron (not a random POST)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Trigger the Python orchestrator via a subprocess call
    // In production: this calls a Railway/Supabase Edge Function
    // For now: returns a placeholder (Python runs separately)
    const response = await fetch(
      process.env.PYTHON_ORCHESTRATOR_URL || "http://localhost:8000/run",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response.ok) {
      throw new Error(`Orchestrator returned ${response.status}`);
    }

    return NextResponse.json({ success: true, triggered_at: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
