#!/usr/bin/env bash
# Find the Cloudflare API token, without ever writing it to disk.
#
# Sourced by deploy.sh and purge-cache.sh. Sets CLOUDFLARE_API_TOKEN (and
# CLOUDFLARE_ZONE_ID where one is configured) if it can find them, and says
# nothing if it cannot — a missing token must never block shipping.
#
# Two places, in this order:
#
#   1. a gitignored .env at the repo root, which is what a machine that has
#      never logged into Vercel uses;
#   2. the Vercel project's PRODUCTION environment, read through
#      `vercel env run`, which hands the variables to one command and writes
#      nothing anywhere. NOT `vercel env pull`: that would dump every
#      production secret — Paystack, Firebase, the AI keys — into a plaintext
#      file on disk, to fetch one token.
#
# So adding CLOUDFLARE_API_TOKEN to the Vercel project is enough; nothing has
# to be copied onto this machine.

cf_from_env_file() {
  [ -f .env ] || return 1
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
  [ -n "${CLOUDFLARE_API_TOKEN:-}" ]
}

cf_from_vercel() {
  command -v vercel >/dev/null 2>&1 || return 1
  [ -d .vercel ] || return 1

  # One line out, and only the two names we are after: everything else the
  # project holds stays inside the child process and is never printed.
  local line
  line=$(vercel env run -e production -- bash -c \
    'printf "%s\n%s\n" "${CLOUDFLARE_API_TOKEN:-}" "${CLOUDFLARE_ZONE_ID:-}"' \
    2>/dev/null | tail -n 2) || return 1

  local token zone
  token=$(printf '%s' "$line" | sed -n '1p' | tr -d '\r')
  zone=$(printf '%s' "$line" | sed -n '2p' | tr -d '\r')
  [ -n "$token" ] || return 1

  export CLOUDFLARE_API_TOKEN="$token"
  [ -n "$zone" ] && export CLOUDFLARE_ZONE_ID="$zone"
  return 0
}

find_cloudflare_token() {
  [ -n "${CLOUDFLARE_API_TOKEN:-}" ] && return 0
  cf_from_env_file && return 0
  echo "  looking for the Cloudflare token in the Vercel project…"
  cf_from_vercel && { echo "  found it in Vercel."; return 0; }
  return 1
}
