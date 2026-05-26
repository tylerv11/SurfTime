import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://osrrsbmkmauttirxtmdi.supabase.co";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    return NextResponse.json({ error: "Supabase service key not configured" }, { status: 503 });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const { data, error } = await supabase
    .from("conditions")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Flatten: each row has break_id and data (jsonb)
  const breaks = data.map((row) => row.data);

  // Get latest daily summary
  const { data: summaryData } = await supabase
    .from("daily_summaries")
    .select("summary, updated_at")
    .order("date", { ascending: false })
    .limit(1)
    .single();

  return NextResponse.json({
    breaks,
    daily_summary: summaryData?.summary ?? null,
    updated_at: summaryData?.updated_at ?? null,
  });
}
