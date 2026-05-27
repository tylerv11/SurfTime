import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get("lat");
  const lng = req.nextUrl.searchParams.get("lng");
  if (!lat || !lng) return NextResponse.json({ error: "Missing lat/lng" }, { status: 400 });

  const params = new URLSearchParams({
    latitude: lat,
    longitude: lng,
    hourly: "wave_height",
    forecast_days: "3",
    timezone: "auto",
  });

  const response = await fetch(`https://marine-api.open-meteo.com/v1/marine?${params.toString()}`, {
    cache: "no-store",
  });
  if (!response.ok) return NextResponse.json({ error: "Wave forecast request failed" }, { status: 502 });

  const payload = await response.json();
  const times: string[] = payload?.hourly?.time ?? [];
  const heights: Array<number | null> = payload?.hourly?.wave_height ?? [];
  const points = times.map((t, i) => ({ t, v: heights[i] })).filter((p) => p.v !== null);
  return NextResponse.json({ points });
}
