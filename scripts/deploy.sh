#!/usr/bin/env bash
set -euo pipefail

# Deploys Brief Group to Vercel with real pre-flight checks — it will not
# push a broken build. For normal day-to-day use, prefer connecting the repo
# to Vercel in the dashboard so every push to main auto-deploys; use this
# script for a manual/one-off production deploy from your machine.
#
# Usage:
#   ./scripts/deploy.sh            deploy to preview
#   ./scripts/deploy.sh --prod     deploy to production

echo "==> Checking for Vercel CLI..."
if ! command -v vercel &> /dev/null; then
  echo "Vercel CLI not found. Installing..."
  npm install -g vercel
fi

echo "==> Installing dependencies..."
npm ci

echo "==> Linting..."
npm run lint

echo "==> Building (catches errors before Vercel does)..."
npm run build

echo "==> Build succeeded. Deploying..."
if [[ "${1:-}" == "--prod" ]]; then
  vercel --prod
else
  vercel
fi

echo "==> Done. Remember: environment variables must be set in the Vercel"
echo "    dashboard (Project → Settings → Environment Variables), not just"
echo "    in your local .env.local — that file is never uploaded."
