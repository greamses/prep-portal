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

# The live rooms' rules. NOT `firebase deploy --only database`: that cannot
# deploy with a service account — it dies with "An unexpected error has
# occurred", and this script used to blame a missing database for it, which
# sent a whole session looking for a database that was there all along. The
# REST deployer uses the same key, finds the database wherever in the world it
# was made, and reads the rules back after writing them.
#
# A failure must never stop the Firestore rules going out, so it is said out
# loud and shrugged off.
if [ -f database.rules.json ]; then
  echo
  echo "→ deploying database.rules.json to $PROJECT…"
  node scripts/deploy-db-rules.mjs || echo "⚠  the database rules did not go out. The Firestore rules above DID deploy."
fi

echo
echo "✓ deployed. Read it back with: node scripts/show-live-rules.mjs"
