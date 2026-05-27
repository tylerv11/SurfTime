import { NextRequest, NextResponse } from "next/server";

const NOAA_TIDES_URL = "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter";

function ymd(date: Date) {
  return `${date.getUTCFullYear()}${`${date.getUTCMonth() + 1}`.padStart(2, "0")}${`${date.getUTCDate()}`.padStart(2, "0")}`;
}

export async function GET(req: NextRequest) {
  const station = req.nextUrl.searchParams.get("station");
  if (!station) return NextResponse.json({ error: "Missing station" }, { status: 400 });

  const now = new Date();
  const end = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const baseParams = {
    product: "predictions",
    application: "surftime",
    begin_date: ymd(now),
    end_date: ymd(end),
    datum: "MLLW",
    station,
    time_zone: "lst_ldt",
    units: "english",
    format: "json",
  };

  const hourlyParams = new URLSearchParams({ ...baseParams, interval: "h" });
  const hiloParams = new URLSearchParams({ ...baseParams, interval: "hilo" });

  const [hourlyResp, hiloResp] = await Promise.all([
    fetch(`${NOAA_TIDES_URL}?${hourlyParams.toString()}`, { cache: "no-store" }),
    fetch(`${NOAA_TIDES_URL}?${hiloParams.toString()}`, { cache: "no-store" }),
  ]);

  if (!hourlyResp.ok || !hiloResp.ok) {
    return NextResponse.json({ error: "NOAA request failed" }, { status: 502 });
  }

  const [hourlyPayload, hiloPayload] = await Promise.all([hourlyResp.json(), hiloResp.json()]);
  return NextResponse.json({
    predictions: hourlyPayload.predictions ?? [],
    highs_lows: hiloPayload.predictions ?? [],
  });
}
