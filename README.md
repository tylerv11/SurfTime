# SurfTime

California surf conditions app built with Next.js, Supabase, and a daily Python data pipeline.

## Canonical URL

Production app: `https://surftimeca.vercel.app`

Use this as the single public SurfTime link going forward.

## Stack

- Next.js 16 App Router with TypeScript
- Supabase Postgres for `conditions` and `daily_summaries`
- Python fetch/orchestration pipeline in `python/`
- Vercel for hosting and production deploys
- GitHub connected to Vercel for deploys on push to `main`

## Data Flow

1. Python fetchers pull buoy, wind, and tide inputs.
2. The orchestrator scores each break and writes rows into Supabase.
3. `src/app/api/conditions/route.ts` reads live data from Supabase at runtime.
4. The Next.js frontend renders the map, list view, and daily summary.

## Local Development

```bash
npm run dev
```

Open `http://localhost:3000`.

## Environment

Required local env vars:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENROUTER_API_KEY`
- `CRON_SECRET`
- `NEXT_PUBLIC_SITE_URL=https://surftimeca.vercel.app`

## Deployment

Do not use ad hoc CLI deploys for this project.

Use GitHub pushes to `main` so Vercel handles production deploys for the linked `surftime` project.
