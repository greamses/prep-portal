/**
 * Free Vercel deployment storage: delete old deployments of this project.
 *
 * Keeps the newest READY production deployment (what the site serves) and the
 * one before it (a fallback to roll back to). Deletes every other deployment:
 * older production ones, previews, failed and cancelled builds.
 *
 * Uses the Vercel CLI's own login (read from its auth.json at run time; the
 * token is never printed or written anywhere) and the project in .vercel/project.json.
 *
 *   node scripts/prune-deployments.mjs          list what would go, delete nothing
 *   node scripts/prune-deployments.mjs --yes    delete them
 *   node scripts/prune-deployments.mjs --keep=3 keep three production deployments
 */
import fs from "fs";
import path from "path";
import os from "os";

const YES = process.argv.includes("--yes");
const KEEP = Number((process.argv.find((a) => a.startsWith("--keep=")) || "--keep=2").split("=")[1]) || 2;

const proj = JSON.parse(fs.readFileSync(path.join(process.cwd(), ".vercel", "project.json"), "utf8"));
const authPaths = [
  path.join(process.env.APPDATA || "", "com.vercel.cli", "Data", "auth.json"),
  path.join(os.homedir(), ".local", "share", "com.vercel.cli", "auth.json"),
  path.join(os.homedir(), "Library", "Application Support", "com.vercel.cli", "auth.json"),
];
const authFile = authPaths.find((p) => fs.existsSync(p));
if (!authFile) { console.error("No Vercel CLI login found. Run `vercel login` first."); process.exit(1); }
const token = JSON.parse(fs.readFileSync(authFile, "utf8")).token;
if (!token) { console.error("The Vercel CLI login has no token. Run `vercel login`."); process.exit(1); }

const API = "https://api.vercel.com";
const q = `teamId=${encodeURIComponent(proj.orgId)}`;
const call = async (method, url) => {
  const r = await fetch(`${API}${url}`, { method, headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`${method} ${url.split("?")[0]} -> HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return r.status === 204 ? {} : r.json();
};

const all = [];
let until = null;
for (let page = 0; page < 50; page++) {
  const d = await call("GET", `/v6/deployments?projectId=${proj.projectId}&${q}&limit=100${until ? `&until=${until}` : ""}`);
  all.push(...(d.deployments || []));
  until = d.pagination && d.pagination.next;
  if (!until) break;
}
all.sort((a, b) => (b.created || 0) - (a.created || 0));

const prodReady = all.filter((d) => d.target === "production" && (d.state || d.readyState) === "READY");
const keep = new Set(prodReady.slice(0, KEEP).map((d) => d.uid));
const drop = all.filter((d) => !keep.has(d.uid));

const when = (ms) => new Date(ms).toISOString().replace("T", " ").slice(0, 16);
console.log(`${all.length} deployments of ${proj.projectName}. Keeping ${keep.size}:`);
prodReady.slice(0, KEEP).forEach((d) => console.log(`  keep  ${when(d.created)}  ${d.url}  (production)`));
console.log(`${YES ? "Deleting" : "Would delete"} ${drop.length}:`);
drop.slice(0, 15).forEach((d) => console.log(`  drop  ${when(d.created)}  ${d.url}  (${d.target || "preview"}, ${d.state || d.readyState})`));
if (drop.length > 15) console.log(`  … and ${drop.length - 15} more`);

if (!YES) { console.log("\nDry run: nothing deleted. Add --yes to delete."); process.exit(0); }
if (!keep.size) { console.error("No READY production deployment found to keep, so nothing was deleted."); process.exit(1); }

let done = 0, failed = 0;
for (const d of drop) {
  try { await call("DELETE", `/v13/deployments/${d.uid}?${q}`); done++; }
  catch (e) { failed++; console.error(`  could not delete ${d.url}: ${e.message}`); }
}
console.log(`Deleted ${done}${failed ? `, ${failed} failed` : ""}.`);
