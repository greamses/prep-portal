#!/usr/bin/env bash
# Push firestore.rules to Firebase.
#
# Usage:  npm run deploy:rules
#
# For most of this project's life the rules were deployed by PASTING them into
# the Firebase Console, which is why they kept drifting behind the clients that
# depend on them. They no longer have to be: the Firebase CLI authenticates
# non-interactively with the Admin SDK service account the server already uses
# (server/serviceAccountKey.json, gitignored), so deploying is one command and
# nobody has to remember a browser tab.
#
# It runs `npm run check:rules` first. That script compares the rules against
# what every game client actually writes, and a rules file that would lock out
# a live client is worse than one that is merely out of date — so a failure
# there stops the deploy rather than warning about it.
set -euo pipefail

cd "$(dirname "$0")/.."

KEY="server/serviceAccountKey.json"
# Read, not require: .firebaserc has no .json extension, so require() would
# hand it to the JavaScript parser and it would die on the first brace.
PROJECT="$(node -p "JSON.parse(require('fs').readFileSync('.firebaserc','utf8')).projects.default")"

if [ ! -f "$KEY" ]; then
  echo "✗ $KEY not found — the CLI has no credentials to deploy with."
  echo "  Either restore it, or run 'firebase login' and deploy interactively."
  exit 1
fi

# The key names the project it belongs to. Deploying rules written for one
# project into another is the kind of mistake worth one line of arithmetic.
KEY_PROJECT="$(node -p "require('./$KEY').project_id")"
if [ "$KEY_PROJECT" != "$PROJECT" ]; then
  echo "✗ .firebaserc says '$PROJECT' but the service account is for '$KEY_PROJECT'."
  exit 1
fi

echo "→ checking the rules against what the clients write…"
npm run --silent check:rules

echo
echo "→ deploying firestore.rules to $PROJECT…"
GOOGLE_APPLICATION_CREDENTIALS="$PWD/$KEY" \
  firebase deploy --only firestore:rules --project "$PROJECT" --non-interactive

# The live rooms' rules, if there is a database to put them on. The Realtime
# Database has to be created in the console before this can work, and not
# having one yet must never stop the Firestore rules going out — so a failure
# here is said out loud and shrugged off.
if [ -f database.rules.json ]; then
  echo
  echo "→ deploying database.rules.json to $PROJECT…"
  if GOOGLE_APPLICATION_CREDENTIALS="$PWD/$KEY"       firebase deploy --only database --project "$PROJECT" --non-interactive; then
    echo "✓ live-room rules deployed."
  else
    echo "⚠  the database rules did not go out — most likely there is no Realtime"
    echo "   Database in this project yet. Make one in the console (see docs/live.md)"
    echo "   and run this again. The Firestore rules above DID deploy."
  fi
fi

echo
echo "✓ deployed. Read it back with: node scripts/show-live-rules.mjs"
