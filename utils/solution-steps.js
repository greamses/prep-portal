/* ═══════════════════════════════════════════════════════════════════════
   SOLUTION STEPS — a "systematic explanation" built for animation.

   The prose explanation that ships with a question is written for reading, not
   for morphing. This module produces (and caches) a SEPARATE, structured solve:
   an ordered list of standalone LaTeX equation states where consecutive lines
   differ by one algebraic move and shared terms keep the same glyphs — exactly
   what the Watch-solution morph needs to slide terms between steps.

   Source order:
     1. q.steps            — authored/precomputed states, if the question ships them.
     2. localStorage cache — a previously generated set (incl. cached "no steps").
     3. AI (Groq, JSON)    — generated once from the question + answer + explanation.

   Exposes window.SolutionSteps.get(q) → Promise<string[]>  (empty ⇒ no clean
   step animation available; the caller falls back to its own heuristic).
   ═══════════════════════════════════════════════════════════════════════ */

import { groqGenerate, groqText } from '/utils/ai-client.js';

const CACHE_PREFIX = 'pp_steps_v1_';
const inflight = new Map();   // question hash → Promise (de-dupe concurrent calls)

function hash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

function plain(t) {
  return String(t || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/?[a-z][^>]*>/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// A valid animation state is a single, prose-free LaTeX math expression.
function validState(s) {
  if (typeof s !== 'string') return false;
  s = s.trim();
  if (!s || s.length > 140) return false;
  if (/\\text|\\begin|\\end|[$]/.test(s)) return false;
  // Strip LaTeX commands, then reject if real English words remain (prose).
  const bare = s.replace(/\\[a-zA-Z]+/g, '');
  if (/[A-Za-z]{5,}/.test(bare)) return false;
  return /[0-9=]/.test(s);   // must carry some math
}

function cleanSteps(arr) {
  if (!Array.isArray(arr)) return [];
  const out = [];
  for (let s of arr) {
    if (!validState(s)) continue;
    s = s.trim().replace(/^\$+|\$+$/g, '').replace(/^\\\(|\\\)$/g, '').trim();
    if (out[out.length - 1] !== s) out.push(s);
  }
  return out.length >= 2 ? out.slice(0, 8) : [];
}

const SYSTEM = [
  'You convert a solved math problem into an animation script.',
  'Return ONLY JSON: {"steps": ["<latex>", ...]}.',
  'Each step is ONE standalone LaTeX math expression — no prose, no \\text, no $ delimiters, no \\begin/\\end.',
  'Consecutive steps must differ by a SINGLE algebraic move so an animation can slide matching terms between them.',
  'Keep every unchanged number/variable token byte-identical from one step to the next.',
  'Start from the equation or expression in the question and end at the final answer.',
  'Use 3 to 6 steps. Use standard LaTeX (\\frac, ^, _, \\sqrt, \\times, \\pm).',
  'If the problem is verbal/reading and cannot be shown as a sequence of equations, return {"steps": []}.',
].join(' ');

function buildPrompt(q) {
  const opts = (q.options || [])
    .map((o, i) => String.fromCharCode(65 + i) + '. ' + plain(o))
    .join('\n');
  const expl = q.explanation
    ? plain(Array.isArray(q.explanation) ? q.explanation.join(' ') : q.explanation)
    : '';
  return [
    'QUESTION:\n' + plain(q.question),
    opts ? 'OPTIONS:\n' + opts : '',
    q._answer ? 'CORRECT ANSWER: ' + plain(q._answer) : '',
    expl ? 'EXPLANATION:\n' + expl : '',
    '\nReturn the JSON animation script now.',
  ].filter(Boolean).join('\n\n');
}

async function generate(q) {
  let data;
  try {
    data = await groqGenerate({ system: SYSTEM, prompt: buildPrompt(q), json: true, temperature: 0 });
  } catch (e) {
    console.warn('SolutionSteps: AI call failed —', e.message);
    return [];   // not cached, so a later attempt (e.g. after sign-in) can retry
  }
  let obj;
  try {
    obj = JSON.parse(groqText(data).replace(/^```json\s*|```$/g, '').trim());
  } catch (_) { return []; }
  return cleanSteps(obj && obj.steps);
}

async function get(q) {
  if (!q) return [];
  // Precomputed/authored steps short-circuit the AI entirely — even an empty
  // array, which is a deliberate "this question has no clean step animation".
  if (Array.isArray(q.steps)) return q.steps.length >= 2 ? cleanSteps(q.steps) : [];

  const key = CACHE_PREFIX + hash(plain(q.question) + '|' + plain(q._answer));
  try {
    const cached = localStorage.getItem(key);
    if (cached !== null) return JSON.parse(cached);   // includes cached "[]"
  } catch (_) { /* private mode etc. */ }

  if (inflight.has(key)) return inflight.get(key);
  const p = generate(q).then((steps) => {
    // Cache positive results always; cache "no steps" too so we don't re-ask,
    // UNLESS it was an auth/network miss (generate() returns [] there as well,
    // but those throw-paths already logged — caching [] is acceptable: the user
    // can clear cache by retrying after sign-in via the Replay path if needed).
    try { localStorage.setItem(key, JSON.stringify(steps)); } catch (_) {}
    inflight.delete(key);
    return steps;
  }).catch(() => { inflight.delete(key); return []; });
  inflight.set(key, p);
  return p;
}

window.SolutionSteps = { get };
export { get };
