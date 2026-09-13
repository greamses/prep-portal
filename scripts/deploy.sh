#!/usr/bin/env bash
# Deploy to production, then purge Cloudflare's edge cache.
#
# The domain is proxied through Cloudflare in front of Vercel, so a deploy isn't
# fully "live" until Cloudflare stops answering from its own copy. Browser Cache
# TTL is set to "Respect Existing Headers" and app code is served max-age=0, so
# the edge revalidates anyway — this purge just makes it immediate rather than
# on-next-revalidate, and covers assets that don't carry those headers.
#
# Usage:  npm run deploy
#
# The token is looked for in a gitignored .env at the repo root and then in the
# Vercel project's production environment — see scripts/cf-token.sh. Without one
# the deploy still runs and only the purge is skipped: a missing token must
# never block shipping.
set -euo pipefail

cd "$(dirname "$0")/.."

DEFAULT_ZONE_ID="d00c024daea9b2b2206bc8891662210f" # prepportal.com.ng

# shellcheck disable=SC1091
. scripts/cf-token.sh

# Stamp content-hash versions onto the game pages' module URLs BEFORE deploying.
# index.html is always fresh (max-age=0) but the JS it points at can come from a
# stale cache — new markup + old code is the worst failure mode. Versioned URLs
# make it impossible: changed code means a changed URL, and a URL that was never
# requested cannot be stale anywhere.
echo "🔖 Versioning module URLs…"
node scripts/version-assets.mjs

# The stamping above REWRITES index.html. If those rewrites are still sitting
# uncommitted when we deploy, production ends up serving the PREVIOUS deploy's
# import map — new code behind old hashed URLs, one deploy behind for ever.
# So: refuse to deploy a dirty tree, and say exactly what to do about it.
if [ -n "$(git status --porcelain)" ]; then
  echo ""
  echo "✗ Working tree is dirty — commit before deploying, or production will"
  echo "  ship the last commit's asset hashes instead of these:"
  git status --short
  echo ""
  echo "   git add -A && git commit -m '…' && git push && npm run deploy"
  exit 1
fi

echo ""
echo "▲ Deploying to production…"
vercel --prod

find_cloudflare_token || true
ZONE_ID="${CLOUDFLARE_ZONE_ID:-$DEFAULT_ZONE_ID}"

if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
  echo ""
  echo "⚠  No Cloudflare API token — skipping the edge purge."
  echo "   Looked in .env at the repo root and in the Vercel project's"
  echo "   production environment. Put it in EITHER and this runs by itself:"
  echo "     vercel env add CLOUDFLARE_API_TOKEN production"
  echo "     …or a gitignored .env:  CLOUDFLARE_API_TOKEN=your_token_here"
  exit 0
fi

echo ""
echo "☁  Purging Cloudflare edge cache…"

# --fail-with-body so a 4xx/5xx is a real failure, not a silently-ignored body.
# The token is only ever read from the environment; it is never echoed.
response=$(curl -sS --fail-with-body -X POST \
  "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}') || {
    echo "✗ Purge failed:"
    echo "$response"
    echo "  (The deploy itself succeeded — only the purge failed.)"
    exit 1
  }

if printf '%s' "$response" | grep -q '"success":true'; then
  echo "✓ Cloudflare cache purged."
else
  echo "✗ Purge returned an unexpected response:"
  echo "$response"
  exit 1
fi
