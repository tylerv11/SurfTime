#!/bin/bash
# Loads env and runs the surf conditions orchestrator
set -e

# Load OpenClaw env (has OPENROUTER_API_KEY)
if [ -f ~/.openclaw/.env ]; then
  set -a
  source ~/.openclaw/.env
  set +a
fi

# Supabase vars
export SUPABASE_URL="https://osrrsbmkmauttirxtmdi.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zcnJzYm1rbWF1dHRpcnh0bWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTc3MzQyNiwiZXhwIjoyMDk1MzQ5NDI2fQ.rsbg7lXLLx8BKniZgzEELdvBLRUEGSjQmzrd4U8tMvc"

cd /Users/experimental/SurfTime
exec python3 python/orchestrator/run.py
