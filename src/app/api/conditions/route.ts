import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import breaksConfig from "../../../../config/breaks.json";

const breakMetadata = new Map(
  breaksConfig.breaks.map((break_) => [
    break_.id,
    {
      region: break_.region,
      break_name: break_.name,
      lat: break_.lat,
      lng: break_.lng,
      tide_station: break_.tide_station,
    },
  ])
);

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
  const breaks = data.map((row) => {
    const metadata = breakMetadata.get(row.break_id);
    return {
      ...metadata,
      ...row.data,
      region: row.data.region ?? metadata?.region,
      break_name: row.data.break_name ?? metadata?.break_name,
      lat: row.data.lat ?? metadata?.lat,
      lng: row.data.lng ?? metadata?.lng,
    };
  });

  // Most recent conditions row updated_at is the authoritative "last pull" time
  // (data is already ordered by updated_at DESC, so data[0] is the freshest row)
  const conditionsUpdatedAt = data.length > 0 ? (data[0] as Record<string, unknown>).updated_at as string | null : null;

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
    updated_at: conditionsUpdatedAt ?? summaryData?.updated_at ?? null,
  });
}
