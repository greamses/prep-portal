/* ═══════════════════════════════════════════════════════
   VOCAB BANK GENERATOR

   Writes data/vocab/words/<subject>.js from the hand-curated outline in
   data/vocab/topics.js. The outline is the editorial decision; this only fills
   in each topic's word list.

   Run:  node scripts/gen-vocab.mjs            (fills whatever is missing)
         node scripts/gen-vocab.mjs biology    (one subject)
         node scripts/gen-vocab.mjs --check    (validate what's on disk, write nothing)

   It is RESUMABLE: a topic already on disk with enough words is skipped, so a
   failed run can just be run again.

   THE HOUSE RULE, enforced here rather than trusted: a clue may never contain
   its own word. Models break this constantly ("an EAR is the organ you hear
   with"), so every candidate is checked against the word's stem, and rejects
   are sent back for replacement. A leaked answer is not a typo — it is a
   hangman word that plays itself.
═══════════════════════════════════════════════════════ */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SUBJECTS, TARGET_WORDS } from '../data/vocab/topics.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'data', 'vocab', 'words');

const MIN_WORDS = 24;   // below this a topic is too thin to play; retry it
const MIN_LEN = 3;
const MAX_LEN = 15;

// Same providers, same keys, same fallback order as the site itself
// (server/ai-models.js). Gemini's free tier runs out of road long before 84
// topics are done, so Groq's 70B carries the run; pass --provider to force one.
const GEMINI_MODEL = 'gemini-3.5-flash';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const CLAUDE_MODEL = 'claude-haiku-4-5-20251001';

// The same gitignored server/.env the local API server reads (see
// server/index.js) — no second place to keep a key.
for (const envPath of [path.join(ROOT, 'server', '.env'), path.join(ROOT, '.env')]) {
  if (!fs.existsSync(envPath)) continue;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_0-9]+)\s*=\s*"?(.*?)"?\s*$/);
    if (m && m[2] && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GROQ_KEY = process.env.GROQ_API_KEY;
const CLAUDE_KEY = process.env.ANTHROPIC_API_KEY;
if (!GEMINI_KEY && !GROQ_KEY && !CLAUDE_KEY) throw new Error('No AI key in server/.env');

// --provider=claude|groq|gemini pins one; otherwise Gemini runs until its quota
// dies. The free tiers are slow (Groq token-rate-limits into a ~3-hour run for
// the full bank); Claude costs a little and finishes in minutes.
const FORCED_PROVIDER = (process.argv.find((a) => a.startsWith('--provider=')) || '').split('=')[1] || '';

// ── Validation ──────────────────────────────────────────────────────────
// Letters (and inner hyphens) only: the keyboard has 26 keys, so a word with a
// space or a digit in it can never be finished.
const WORD_RE = /^[a-z]+(-[a-z]+)?$/;

/** The part of a word a clue must not echo. "photosynthesis" -> "photosynth" */
const stem = (w) => w.replace(/[^a-z]/g, '').slice(0, Math.max(4, Math.ceil(w.length * 0.7)));

function rejectReason(entry, seen) {
  if (!entry || typeof entry.w !== 'string' || typeof entry.d !== 'string') return 'shape';
  const w = entry.w.trim().toLowerCase();
  const d = entry.d.trim();

  if (!WORD_RE.test(w)) return 'not-a-single-word';
  if (w.length < MIN_LEN || w.length > MAX_LEN) return 'length';
  // An acronym has no vowels to guess ("dna", "atp") — unguessable, and banned
  // in the prompt anyway.
  if (!/[aeiouy]/.test(w)) return 'acronym';
  if (seen.has(w)) return 'duplicate';

  // A clue must be a SENTENCE, not a dictionary fragment. "Cell division
  // process" tells a nine-year-old nothing; models default to it constantly.
  if (d.length < 30 || d.length > 130) return 'clue-length';
  if (!/^[A-Z]/.test(d)) return 'clue-not-a-sentence';
  if (!/[.!?]$/.test(d)) return 'clue-not-a-sentence';

  // The house rule. Compare on letters only, so "water-cycle" is caught by
  // "water" too, and stems catch plurals/gerunds ("cells", "dividing").
  const flatClue = d.toLowerCase().replace(/[^a-z]/g, '');
  if (flatClue.includes(stem(w))) return 'clue-leaks-word';
  // ...and the other way round: a clue must not be a near-copy of the word.
  for (const piece of w.split('-')) {
    if (piece.length >= 4 && flatClue.includes(piece)) return 'clue-leaks-word';
  }
  return null;
}

function validate(list, seen) {
  const kept = [];
  const rejects = [];
  for (const entry of list || []) {
    const reason = rejectReason(entry, seen);
    if (reason) { rejects.push({ entry, reason }); continue; }
    const w = entry.w.trim().toLowerCase();
    seen.add(w);
    kept.push({ w, d: entry.d.trim() });
  }
  return { kept, rejects };
}

// ── Generation ──────────────────────────────────────────────────────────
function prompt({ subjectLabel, topicLabel, lo, hi, want, avoid }) {
  const band = lo === hi ? `Grade ${lo}` : `Grades ${lo}–${hi}`;
  return `You are writing the word bank for a school HANGMAN game.

Subject: ${subjectLabel}
Topic: ${topicLabel}
Players: ${band}

Give me ${want} vocabulary words a ${band} student studying this topic should know, each with a clue.

HARD RULES — a word that breaks any of these is useless to me:
1. Each word is ONE word: letters only, no spaces, no digits, no symbols. (A hyphen is allowed only if the term is genuinely hyphenated.) ${MIN_LEN}–${MAX_LEN} letters.
2. THE CLUE MUST NEVER CONTAIN ITS OWN WORD, or any part of it, in any form.
   BAD:  word "evaporation" -> clue "when water evaporates into the air"
   GOOD: word "evaporation" -> clue "When a liquid turns into a gas as it warms up."
   BAD:  word "cell" -> clue "the smallest cell of life"
   GOOD: word "cell" -> clue "The smallest unit of life, which all living things are built from."
3. The clue is a FULL SENTENCE — it starts with a capital, ends with a full stop, and runs 30–130 characters. Write it for a ${band} reader: plain and concrete.
   BAD (a fragment, teaches nothing): "Cell division process"
   GOOD (a sentence): "The way one cell splits itself into two identical copies."
4. The word must really belong to this topic, and be pitched at ${band} — not easier, not harder.
5. Use the word's real spelling. If it is normally hyphenated, keep the hyphen ("self-pollination", never "selfpollination").
6. No proper nouns, no brand names, and NO ACRONYMS or initials (no "DNA", no "ATP") — a word with no vowels cannot be guessed.
${avoid && avoid.length ? `\nDo NOT use any of these words again: ${avoid.join(', ')}` : ''}

Return ONLY a JSON array: [{"w":"word","d":"clue"}, ...]`;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// The free tier rate-limits by the minute, and a long reply gets its connection
// reset — so keep the batches small, leave a gap between calls, and treat both
// ECONNRESET and 429 as "wait, then ask again" rather than as failure.
// Groq's free tier limits TOKENS per minute, not just calls — at ~2.5k tokens a
// call, more than about five calls a minute just buys exponential backoff and
// turns a 40-minute run into a 3-hour one. Pace to the limit instead of fighting
// it. (Claude would be far quicker, but that key has no credit balance.)
const MIN_GAP_MS = FORCED_PROVIDER === 'claude' ? 700 : 12000;
let lastCallAt = 0;

// Parses whatever the model actually sent: a bare array, a {"words":[...]}
// wrapper, a ```json fence, or a reply truncated mid-object.
function parseList(raw) {
  const text = String(raw || '').trim();
  const attempt = (t) => {
    const v = JSON.parse(t);
    return Array.isArray(v) ? v : (v.words || v.items || v.vocabulary || []);
  };
  try { return attempt(text); } catch { /* fall through */ }
  const m = text.match(/\[[\s\S]*\]/);
  if (m) {
    try { return attempt(m[0]); } catch { /* fall through */ }
    // Truncated tail: drop the half-written last object and close the array.
    try { return attempt(`${m[0].replace(/,\s*\{[^}]*$/, '')}]`.replace(/\]\]$/, ']')); } catch { /* fall through */ }
  }
  throw new Error('no usable JSON in the reply');
}

async function callGemini(text) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text }] }],
      generationConfig: { temperature: 0.8, responseMimeType: 'application/json', maxOutputTokens: 4096 },
    }),
  });
  if (!res.ok) { const e = new Error(`Gemini ${res.status}`); e.status = res.status; throw e; }
  const data = await res.json();
  return parseList(data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join(''));
}

async function callClaude(text) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      temperature: 0.8,
      messages: [{ role: 'user', content: text }],
    }),
  });
  if (!res.ok) { const e = new Error(`Claude ${res.status}`); e.status = res.status; throw e; }
  const data = await res.json();
  return parseList((data.content || []).map((c) => c.text || '').join(''));
}

async function callGroq(text) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.8,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You return only JSON: {"words":[{"w":"...","d":"..."}]}' },
        { role: 'user', content: text },
      ],
    }),
  });
  if (!res.ok) { const e = new Error(`Groq ${res.status}`); e.status = res.status; throw e; }
  const data = await res.json();
  return parseList(data?.choices?.[0]?.message?.content);
}

// Gemini's free tier runs dry long before 84 topics are done. Rather than fail
// the run, fall through to Groq the first time it says "quota" — and stay
// there, since a spent quota does not come back mid-run.
let provider = FORCED_PROVIDER || (GEMINI_KEY ? 'gemini' : 'groq');

async function ask(text, attempt = 0) {
  const wait = Math.max(0, lastCallAt + MIN_GAP_MS - Date.now());
  if (wait) await sleep(wait);
  lastCallAt = Date.now();

  try {
    if (provider === 'claude') return await callClaude(text);
    return provider === 'gemini' ? await callGemini(text) : await callGroq(text);
  } catch (e) {
    const rateLimited = e.status === 429 || (e.status >= 500 && e.status < 600);
    if (provider === 'gemini' && !FORCED_PROVIDER && e.status === 429) {
      console.log('  (Gemini quota is spent — switching to Groq for the rest of the run)');
      provider = 'groq';
      return ask(text, attempt);
    }
    if (attempt >= 4) throw e;
    await sleep((rateLimited ? 8000 : 3000) * 2 ** attempt);
    return ask(text, attempt + 1);
  }
}

// Ask in small batches (a big reply gets its connection cut), throw out the
// cheats, and ask again for what's missing — telling it which words it already
// used, so it doesn't just hand back the same twenty. Anything still short after
// the last pass ships short rather than blocking the run.
const BATCH = 20;

async function generateTopic({ subjectLabel, topic, seen }) {
  let words = [];
  let leaks = 0;

  for (let pass = 0; pass < 3 && words.length < TARGET_WORDS; pass++) {
    const list = await ask(prompt({
      subjectLabel,
      topicLabel: topic.label,
      lo: topic.lo,
      hi: topic.hi,
      want: Math.min(BATCH, TARGET_WORDS - words.length + 4),
      avoid: words.map((x) => x.w),
    }));
    const { kept, rejects } = validate(list, seen);
    leaks += rejects.filter((r) => r.reason === 'clue-leaks-word').length;
    words = words.concat(kept);
    // A pass that adds nothing means the topic is tapped out — a topic with 30
    // real words is worth more than 50 padded ones.
    if (!kept.length && words.length >= MIN_WORDS) break;
  }

  return { words: words.slice(0, TARGET_WORDS), leaks };
}

// ── Files ───────────────────────────────────────────────────────────────
const fileFor = (subjectKey) => path.join(OUT_DIR, `${subjectKey}.js`);

function readExisting(subjectKey) {
  const f = fileFor(subjectKey);
  if (!fs.existsSync(f)) return {};
  // Tolerate CRLF. Git's autocrlf rewrites these files on checkout, and a regex
  // anchored on ";\n$" matches NOTHING against ";\r\n" — which silently dropped
  // two whole subjects out of the manifest, with no error and no warning. A file
  // we cannot parse is a bug, never "a subject with no words".
  const src = fs.readFileSync(f, 'utf8');
  const m = src.match(/export const WORDS = ([\s\S]*);\s*$/);
  if (!m) throw new Error(`could not parse ${f} — refusing to treat it as empty`);
  try {
    return JSON.parse(m[1]);
  } catch (e) {
    throw new Error(`invalid JSON in ${f}: ${e.message}`);
  }
}

// The bank ships subject by subject. Rather than let the game offer a subject
// whose words don't exist yet (a round that loads nothing is worse than a
// subject that isn't there), every write refreshes a manifest of what is
// actually on disk, and the setup screen offers exactly that — see
// data/vocab/index.js.
const MIN_PLAYABLE = 12;

function writeManifest() {
  const available = {};
  for (const key of Object.keys(SUBJECTS)) {
    const byTopic = readExisting(key);
    const topics = {};
    for (const topic of SUBJECTS[key].topics) {
      const n = (byTopic[topic.key] || []).length;
      if (n >= MIN_PLAYABLE) topics[topic.key] = n;
    }
    if (Object.keys(topics).length) available[key] = topics;
  }
  const header = `/* AUTO-GENERATED by scripts/gen-vocab.mjs — do not edit by hand.
   Which subjects and topics actually HAVE words, and how many. The setup screen
   offers only what is listed here, so the bank can ship a subject at a time
   without ever offering a round it cannot deal. */
`;
  fs.writeFileSync(
    path.join(ROOT, 'data', 'vocab', 'manifest.js'),
    `${header}
export const AVAILABLE = ${JSON.stringify(available, null, 2)};
`,
  );
}

function write(subjectKey, byTopic) {
  const header = `/* AUTO-GENERATED by scripts/gen-vocab.mjs — safe to edit by hand.
   Word bank for "${SUBJECTS[subjectKey].label}", keyed by the topic keys in
   data/vocab/topics.js. { w: word, d: clue }.
   House rule, checked by the generator: a clue never contains its own word. */
`;
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(fileFor(subjectKey), `${header}\nexport const WORDS = ${JSON.stringify(byTopic, null, 2)};\n`);
}

// ── Run ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const only = args.filter((a) => !a.startsWith('--'));
const subjectKeys = only.length ? only : Object.keys(SUBJECTS);

if (checkOnly) {
  let bad = 0;
  let total = 0;
  for (const key of Object.keys(SUBJECTS)) {
    const byTopic = readExisting(key);
    for (const topic of SUBJECTS[key].topics) {
      const list = byTopic[topic.key] || [];
      const seen = new Set();
      const { rejects } = validate(list, seen);
      total += list.length;
      if (rejects.length || list.length < MIN_WORDS) {
        bad += rejects.length;
        console.log(`  ✗ ${key}/${topic.key}: ${list.length} words, ${rejects.length} invalid` +
          (rejects.length ? ` — e.g. "${rejects[0].entry?.w}" (${rejects[0].reason})` : ' (too thin)'));
      }
    }
  }
  console.log(`\n${total} words checked, ${bad} invalid.`);
  process.exit(bad ? 1 : 0);
}

for (const key of subjectKeys) {
  const subject = SUBJECTS[key];
  if (!subject) { console.log(`unknown subject "${key}"`); continue; }
  const byTopic = readExisting(key);
  console.log(`\n── ${subject.label} ──`);

  // One `seen` for the whole subject. Topics overlap ("gene" belongs to both
  // Heredity and Cells), and an A–Z round pools every topic the grade can see —
  // so a word claimed by one topic must not reappear in the next, or the pool
  // quietly stacks the odds towards the duplicates.
  const seenInSubject = new Set(Object.values(byTopic).flat().map((x) => x.w));

  for (const topic of subject.topics) {
    if ((byTopic[topic.key] || []).length >= MIN_WORDS) {
      console.log(`  · ${topic.key}: ${byTopic[topic.key].length} already on disk, skipping`);
      continue;
    }
    process.stdout.write(`  · ${topic.key}: `);
    try {
      const { words, leaks } = await generateTopic({ subjectLabel: subject.label, topic, seen: seenInSubject });
      byTopic[topic.key] = words;
      write(key, byTopic); // save after every topic — a crash costs one topic, not the run
      console.log(`${words.length} words (threw out ${leaks} that leaked their own answer)`);
    } catch (e) {
      console.log(`FAILED — ${e.message}${e.cause ? ` (${e.cause.message || e.cause})` : ''}`);
    }
  }
}

writeManifest(); // always — a partial or resumed run must still leave the game honest
console.log('\nDone. Now run: node scripts/gen-vocab.mjs --check');
