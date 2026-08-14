/**
 * What Firestore is ACTUALLY enforcing right now.
 *
 *   node scripts/show-live-rules.mjs          — compare live against the repo
 *   node scripts/show-live-rules.mjs --print  — …and print the live source
 *
 * scripts/check-rules.mjs answers "do the rules on disk match what the clients
 * write?". This answers the other half, and the half that actually bit us:
 * "are the rules on disk the rules that are live?" For years they were
 * deployed by hand into a console, so the two could differ by months with
 * nothing on either side saying so.
 *
 * Authenticates with the Admin SDK service account the server already uses.
 * Read-only — it deploys nothing.
 */
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const require = createRequire(join(root, "server", "index.js"));

const KEY = join(root, "server", "serviceAccountKey.json");
let key;
try {
  key = require(KEY);
} catch (_) {
  console.error(`✗ ${KEY} not found — nothing to authenticate with.`);
  process.exit(1);
}

const admin = require("firebase-admin");
const { access_token: token } = await admin.credential.cert(key).getAccessToken();

async function api(path) {
  const res = await fetch(`https://firebaserules.googleapis.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`${path} → ${res.status} ${await res.text()}`);
  return res.json();
}

// Read rather than require: .firebaserc has no .json extension, so require()
// hands it to the JavaScript parser and it dies on the first brace.
const project = JSON.parse(readFileSync(join(root, ".firebaserc"), "utf8")).projects.default;
const release = await api(`projects/${project}/releases/cloud.firestore`);
const ruleset = await api(release.rulesetName);
const live = ruleset.source.files.map((f) => f.content).join("\n");
const local = readFileSync(join(root, "firestore.rules"), "utf8");

const norm = (s) => s.replace(/\r\n/g, "\n").trim();
const same = norm(live) === norm(local);

console.log(`project  : ${project}`);
console.log(`ruleset  : ${release.rulesetName.split("/").pop()}`);
console.log(`deployed : ${release.updateTime}`);
console.log(`live     : ${live.length} bytes`);
console.log(`on disk  : ${local.length} bytes`);
console.log();
console.log(same
  ? "✓ live rules match firestore.rules"
  : "✗ DRIFT — firestore.rules has not been deployed. Run: npm run deploy:rules");

if (process.argv.includes("--print")) console.log(`\n${live}`);
process.exit(same ? 0 : 1);
