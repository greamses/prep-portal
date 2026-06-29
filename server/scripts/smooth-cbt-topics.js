/**
 * smooth-cbt-topics.js — make the AI topic assignment BATCH-COHERENT.
 *
 * Questions were generated in contiguous, topic-coherent batches (same grade +
 * topic), so the per-question classifier over-fragments a single batch into many
 * alternating sub-topics. This collapses that noise: within each class+subject
 * bucket (assignments are in generation order), short runs are merged into their
 * larger neighbour until every surviving topic-run is a real batch. It also
 * clears the class-move flags (grades were set per batch = ground truth).
 *
 * Operates on server/scripts/cbt-reclassify.json in place (no AI, no Firestore).
 *   node server/scripts/smooth-cbt-topics.js
 */
const fs = require("fs");
const path = require("path");
const FILE = path.join(__dirname, "cbt-reclassify.json");

// Greedily merge the shortest run into its larger neighbour until no run is
// below `threshold`. Returns a new per-question topic array (same length/order).
function smooth(topics, threshold) {
  let seq = topics.slice();
  while (true) {
    // run-length encode
    const runs = [];
    for (let i = 0; i < seq.length; i++) {
      const last = runs[runs.length - 1];
      if (last && last.topic === seq[i]) last.len++;
      else runs.push({ topic: seq[i], start: i, len: 1 });
    }
    if (runs.length <= 1) break;
    // shortest run
    let si = 0;
    for (let i = 1; i < runs.length; i++) if (runs[i].len < runs[si].len) si = i;
    if (runs[si].len >= threshold) break;
    const left = runs[si - 1], right = runs[si + 1];
    const into = (!right || (left && left.len >= right.len)) ? left : right; // larger neighbour
    for (let i = runs[si].start; i < runs[si].start + runs[si].len; i++) seq[i] = into.topic;
  }
  return seq;
}

// Merge near-duplicate topic NAMES within a bucket (e.g. "States of Matter" ⊆
// "States of Matter and Their Characteristics"): fold the smaller into the
// larger when one's significant words are a subset of the other's.
const STOP = new Set(["and", "or", "of", "the", "in", "to", "for", "with", "a", "an", "their", "its", "on", "into", "basic", "understanding", "introduction", "concepts"]);
const toks = (t) => new Set(String(t).toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w && !STOP.has(w)));
const subset = (a, b) => { for (const x of a) if (!b.has(x)) return false; return a.size > 0; };
function nameMerge(seq) {
  while (true) {
    const counts = {}; seq.forEach((t) => (counts[t] = (counts[t] || 0) + 1));
    const names = Object.keys(counts);
    let did = false;
    for (let i = 0; i < names.length && !did; i++) {
      for (let j = 0; j < names.length && !did; j++) {
        if (i === j) continue;
        const ti = toks(names[i]), tj = toks(names[j]);
        if (subset(ti, tj)) { // names[i] is a subset of names[j] → merge into the bigger-count one
          const big = counts[names[i]] >= counts[names[j]] ? names[i] : names[j];
          const small = big === names[i] ? names[j] : names[i];
          seq = seq.map((t) => (t === small ? big : t));
          did = true;
        }
      }
    }
    if (!did) break;
  }
  return seq;
}

const o = JSON.parse(fs.readFileSync(FILE, "utf8"));
// group assignments per bucket, preserving order
const order = [];
const groups = new Map();
o.assignments.forEach((a, idx) => {
  const k = `${a.oldClass}__${a.subject}`;
  if (!groups.has(k)) { groups.set(k, []); order.push(k); }
  groups.get(k).push({ a, idx });
});

let movedBack = 0, before = 0, after = 0;
for (const k of order) {
  const items = groups.get(k);
  const n = items.length;
  const threshold = Math.max(5, Math.round(n * 0.04));
  const seq = nameMerge(items.map((it) => it.a.newTopic));
  const sm = smooth(seq, threshold);
  // count runs before/after for reporting
  const runs = (arr) => arr.reduce((c, t, i) => c + (i === 0 || arr[i - 1] !== t ? 1 : 0), 0);
  before += runs(seq); after += runs(sm);
  items.forEach((it, i) => {
    it.a.newTopic = sm[i];
    // grades are ground truth → drop the class move
    if (it.a.classChanged) { it.a.newClass = it.a.oldClass; it.a.classChanged = false; movedBack++; }
  });
  // refresh bucket taxonomy + counts from the smoothed result
  const counts = {};
  sm.forEach((t) => (counts[t] = (counts[t] || 0) + 1));
  o.buckets[k] = o.buckets[k] || { classLevel: items[0].a.oldClass, subject: items[0].a.subject };
  o.buckets[k].taxonomy = Object.keys(counts);
  o.buckets[k].topicCounts = counts;
  o.buckets[k].unresolved = 0;
}
o.classChanges = []; // all reverted — grades kept as generated
fs.writeFileSync(FILE, JSON.stringify(o, null, 2));

console.log(`Smoothed ${order.length} buckets. Topic runs: ${before} → ${after}. Class moves reverted: ${movedBack}.`);
console.log("\nTopics per bucket now:");
for (const k of order) {
  const c = o.buckets[k].topicCounts;
  const parts = Object.entries(c).sort((a, b) => b[1] - a[1]);
  console.log(`\n  ${k}  (${parts.reduce((s, [, n]) => s + n, 0)} Qs, ${parts.length} topics)`);
  parts.forEach(([t, n]) => console.log(`     ${String(n).padStart(3)}  ${t}`));
}
