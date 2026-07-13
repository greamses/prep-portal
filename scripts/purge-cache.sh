#!/usr/bin/env bash
# Purge Cloudflare's edge cache without deploying.
#
# Usage:  npm run purge
#
# Reads CLOUDFLARE_API_TOKEN (and optionally CLOUDFLARE_ZONE_ID) from a
# gitignored .env at the repo root. `npm run deploy` already does this at the
# end of a deploy — this is for purging on its own.
set -euo pipefail

cd "$(dirname "$0")/.."

DEFAULT_ZONE_ID="d00c024daea9b2b2206bc8891662210f" # prepportal.com.ng

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

ZONE_ID="${CLOUDFLARE_ZONE_ID:-$DEFAULT_ZONE_ID}"

if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
  echo "✗ CLOUDFLARE_API_TOKEN not set."
  echo "  Add it to a gitignored .env at the repo root:"
  echo "    CLOUDFLARE_API_TOKEN=your_token_here"
  exit 1
fi

echo "☁  Purging Cloudflare edge cache…"

# The token is only ever read from the environment; it is never echoed.
response=$(curl -sS --fail-with-body -X POST \
  "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}') || {
    echo "✗ Purge failed:"
    echo "$response"
    exit 1
  }

if printf '%s' "$response" | grep -q '"success":true'; then
  echo "✓ Cloudflare cache purged."
else
  echo "✗ Purge returned an unexpected response:"
  echo "$response"
  exit 1
fi
