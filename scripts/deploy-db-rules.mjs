/* ============================================================================
   Push database.rules.json to the Realtime Database
   ----------------------------------------------------------------------------
   Usage:  node scripts/deploy-db-rules.mjs [--check]

   Why this exists rather than `firebase deploy --only database`: that command
   cannot do it with a SERVICE ACCOUNT. It fails with "An unexpected error has
   occurred", and the deploy script then guessed — wrongly — that the project
   had no database. The REST endpoint the console itself uses works fine with
   the same credentials the Firestore rules already deploy with, so nobody has
   to keep a browser login alive.

   It also FINDS the database rather than assuming where it is. A database made
   outside the United States answers on its own hostname — this project's is on
   europe-west1.firebasedatabase.app, not firebaseio.com — and a guessed URL is
   a 404 that looks exactly like "the feature is broken".

   --check reads the live rules and compares, changing nothing.
   ========================================================================== */

import { readFileSync } from "node:fs";
import { createSign } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const KEY = join(ROOT, "server/serviceAccountKey.json");
const RULES = join(ROOT, "database.rules.json");
const CHECK = process.argv.includes("--check");

/* TWO tokens, and the difference is not decorative. The database's own
   /.settings/rules.json accepts a token scoped to firebase.database and REFUSES
   one that also carries cloud-platform — the same service account, the same
   request, 200 with the narrow scope and 401 with the broad one (measured).
   The management API that lists the databases wants the broad one. */
const DB_SCOPES = [
  "https://www.googleapis.com/auth/firebase.database",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");
const ADMIN_SCOPES = "https://www.googleapis.com/auth/cloud-platform";

/* The network here drops connections often enough that a one-shot fetch made
   this script fail for reasons that had nothing to do with rules. */
async function get(url, init, tries = 4) {
  for (let i = 0; ; i++) {
    try { return await fetch(url, init); } catch (e) {
      if (i === tries - 1) throw e;
      await new Promise((r) => setTimeout(r, 1200 * (i + 1)));
    }
  }
}

/** An access token for the service account — the same one the CLI would use. */
async function token(key, scope) {
  const b64 = (o) => Buffer.from(typeof o === "string" ? o : JSON.stringify(o)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const body = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({
    iss: key.client_email, scope, aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600,
  })}`;
  const jwt = `${body}.${createSign("RSA-SHA256").update(body).sign(key.private_key, "base64url")}`;
  const r = await get("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error(`no access token: ${j.error || ""} ${j.error_description || ""}`);
  return j.access_token;
}

/** Every Realtime Database in the project, wherever it was made. */
async function instances(project, tok) {
  const r = await get(
    `https://firebasedatabase.googleapis.com/v1beta/projects/${project}/locations/-/instances`,
    { headers: { authorization: `Bearer ${tok}` } }
  );
  const j = await r.json();
  if (!r.ok) throw new Error(`could not list databases: ${j.error?.message || r.status}`);
  return j.instances || [];
}

/* Firebase reads any key that is not a rule name as a child path, so the
   comments in database.rules.json have to come off before it is sent. */
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

const key = JSON.parse(readFileSync(KEY, "utf8"));
const project = JSON.parse(readFileSync(join(ROOT, ".firebaserc"), "utf8")).projects.default;
if (key.project_id !== project) {
  console.error(`✗ .firebaserc says '${project}' but the service account is for '${key.project_id}'.`);
  process.exit(1);
}

const tok = await token(key, DB_SCOPES);          // reads and writes rules
const admin = await token(key, ADMIN_SCOPES);    // finds the databases
const all = await instances(project, admin);
if (!all.length) {
  console.error("✗ this project has no Realtime Database. Make one in the console — see docs/live.md.");
  process.exit(1);
}

const mine = JSON.parse(strip(readFileSync(RULES, "utf8")));
let bad = 0;

for (const db of all) {
  const url = db.databaseUrl;
  const live = await get(`${url}/.settings/rules.json?access_token=${tok}`);
  const text = await live.text();
  let running = null;
  try { running = JSON.parse(strip(text)); } catch { /* the console writes its own comments */ }
  const same = JSON.stringify(running) === JSON.stringify(mine);

  if (CHECK) {
    console.log(`${url}\n  rules ${same ? "match database.rules.json" : "DIFFER from database.rules.json"}`);
    if (!same) bad++;
    continue;
  }
  if (same) { console.log(`${url}\n  ✓ already up to date`); continue; }

  const put = await get(`${url}/.settings/rules.json?access_token=${tok}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(mine, null, 2),
  });
  if (!put.ok) {
    console.error(`${url}\n  ✗ ${put.status}: ${(await put.text()).slice(0, 300)}`);
    bad++;
    continue;
  }
  /* read it back: a deploy nobody verified is a deploy nobody did */
  const after = await get(`${url}/.settings/rules.json?access_token=${tok}`);
  const ok = JSON.stringify(JSON.parse(strip(await after.text()))) === JSON.stringify(mine);
  console.log(`${url}\n  ${ok ? "✓ rules deployed and read back" : "✗ deployed but read back different"}`);
  if (!ok) bad++;
}

process.exit(bad ? 1 : 0);
