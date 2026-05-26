# SurfTime

```text
     |\            SurfTime
    /|.\           California surf conditions
   /_|_\\          built from live forecasts,
 ____|____         scored by break, served on Vercel
 \_o_o_o_/
```

SurfTime is a California surf dashboard that pulls raw marine/weather inputs, scores each break, stores the latest conditions in Supabase, and serves the map/list UI from Next.js.

## Canonical URL

Single public production URL:

`https://surftimeca.vercel.app`

This is the only SurfTime alias that should be used going forward.

## How It Works

1. Python fetchers collect buoy, tide, and wind inputs for configured breaks.
2. The orchestrator calculates surf scores and writes `conditions` plus `daily_summaries` into Supabase.
3. `src/app/api/conditions/route.ts` reads the latest rows at request time and enriches them with break metadata from `config/breaks.json`.
4. The frontend renders a split map/list experience with region filters and time-of-day scoring.

## Stack

- Next.js 16 App Router with TypeScript
- Supabase Postgres for `conditions` and `daily_summaries`
- Python pipeline in `python/`
- Vercel for production hosting
- GitHub `main` branch connected to Vercel production deploys

## Project Structure

- `src/app/page.tsx`: app shell, filters, split view, and state
- `src/components/map/BreakMap.tsx`: Leaflet map, pin rendering, fly-to behavior
- `src/components/breaks/BreakCard.tsx`: break cards for list/detail views
- `src/app/api/conditions/route.ts`: runtime API route for live conditions
- `config/breaks.json`: break metadata and coordinates
- `python/orchestrator/run.py`: fetch/score/write pipeline

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment

See `.env.example` for the expected shape.

Required local env vars:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENROUTER_API_KEY`
- `CRON_SECRET`
- `NEXT_PUBLIC_SITE_URL=https://surftimeca.vercel.app`

## Deployment

- Push to `main` for production deploys.
- Vercel project: `surftime`
- Public production alias: `surftimeca.vercel.app`
- Avoid ad hoc aliases so the public link stays stable.

## Notes

- Recent deploy failures were caused by a non-GitHub commit email; use a GitHub-recognized email for future commits.
- Deployment protection is disabled so the production URL is publicly reachable.
