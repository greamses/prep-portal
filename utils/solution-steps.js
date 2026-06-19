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
     3. AI (Gemini→Groq)   — generated once from the question + answer + explanation.

   Exposes window.SolutionSteps.get(q) → Promise<string[]>  (empty ⇒ no clean
   step animation available; the caller falls back to its own heuristic).
   ═══════════════════════════════════════════════════════════════════════ */

import { geminiGenerate, geminiText, groqGenerate, groqText } from '/utils/ai-client.js';
import { GEMINI_MODELS_UI } from '/utils/ai-models.js';
import { auth } from '/firebase-init.js';

// Deriving a solution + translating a word problem is a REASONING task, and it
// only runs once per question (then it's cached / admin-approved). So override
// the site-wide "cheapest first" Gemini order with a quality-first chain:
// Pro → Flash → Lite/older as last-resort fallback.
const _rank = (label) => (/pro/i.test(label) ? 0 : /lite/i.test(label) ? 2 : 1);
const GEMINI_SOLVE_MODELS = GEMINI_MODELS_UI
  .slice()
  .sort((a, b) => _rank(a.label) - _rank(b.label))
  .map((m) => m.url);

const CACHE_PREFIX = 'pp_steps_v2_';   // v2: {states, notes} (was bare string[])
const inflight = new Map();   // question hash → Promise (de-dupe concurrent calls)

// Dev: static site on :5500, API on :5000; same origin in production.
const API_BASE =
  (typeof window !== 'undefined' && window.location.port === '5500')
    ? 'http://127.0.0.1:5000'
    : '';

function hash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
// The Firestore doc id for a question's approved override.
function docHash(q) { return hash(plain(q.question) + '|' + plain(q && q._answer)); }

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

// The action vocabulary the model must choose from. These line up 1:1 with the
// animator's GLOSSARY, so the pen note's leading word is always hoverable.
const ACTIONS = [
  'given', 'simplify', 'evaluate', 'substitute', 'factorise', 'expand',
  'distribute', 'subtract', 'add', 'divide', 'multiply', 'isolate',
  'square root', 'fraction',
];

// Normalise one tex value into a clean, prose-free state string (or '').
function cleanTex(s) {
  if (!validState(s)) return '';
  return s.trim().replace(/^\$+|\$+$/g, '').replace(/^\\\(|\\\)$/g, '').trim();
}

// Turn the model's (or an author's) steps into aligned {states, notes}.
// Accepts both the new [{tex, action, note}] objects and legacy ["<latex>", …].
function cleanStructured(arr) {
  if (!Array.isArray(arr)) return { states: [], notes: [] };
  const states = [], notes = [];
  for (const raw of arr) {
    const tex = cleanTex(typeof raw === 'string' ? raw : raw && raw.tex);
    if (!tex) continue;
    if (states[states.length - 1] === tex) continue;   // dedupe consecutive
    const o = (raw && typeof raw === 'object') ? raw : {};
    const action = String(o.action || '').toLowerCase().trim();
    const note = String(o.note || '').trim();
    let disp = '';
    if (states.length === 0) disp = '';                 // first state: nothing moved into it
    else if (action && action !== 'given' && note) disp = `${action} — ${note}`;
    else if (action && action !== 'given') disp = action;
    else disp = note;
    states.push(tex); notes.push(disp);
  }
  if (states.length < 2) return { states: [], notes: [] };
  return { states: states.slice(0, 8), notes: notes.slice(0, 8) };
}

// A word problem's "translation" map: each phrase of the prose paired with the
// algebra it becomes. Plain-text phrase + prose-free LaTeX. Empty for problems
// that already state the equation. (Animator renders this above the solving.)
function cleanSetup(arr) {
  if (!Array.isArray(arr)) return [];
  const out = [];
  for (const raw of arr) {
    if (!raw || typeof raw !== 'object') continue;
    const phrase = plain(raw.phrase).slice(0, 120);
    let tex = String(raw.tex || '').trim()
      .replace(/^\$+|\$+$/g, '').replace(/^\\\(|\\\)$/g, '').trim();
    if (/\\text|\\begin|\\end|[$]/.test(tex)) tex = '';
    tex = tex.slice(0, 120);
    if (!phrase && !tex) continue;
    out.push({ phrase, tex });
  }
  return out.slice(0, 8);
}

// Build the array the animator expects (states), with notes + setup + provenance
// riding along as properties so Array.isArray() stays true (legacy shape works).
//   source: 'authored' | 'override' | 'cache' | 'ai'
function pack(states, notes, source, setup) {
  const arr = Array.isArray(states) ? states.slice() : [];
  if (notes && notes.some(Boolean)) arr.notes = notes.slice();
  if (setup && setup.length) arr.setup = setup.slice();
  if (source) arr.source = source;
  return arr;
}

const SYSTEM = [
  'You are an expert maths teacher. You turn a solved problem into a clear, gap-free animation script that a student can follow.',
  'Work the problem out correctly FIRST, then describe each move. Accuracy is paramount: the final state must equal the correct answer, and every step must follow validly from the one before it.',
  'Return ONLY JSON: {"setup": [{"phrase": "<words from the problem>", "tex": "<algebra>"}, ...], "steps": [{"tex": "<latex>", "action": "<verb>", "note": "<short reason>"}, ...]}.',
  'setup: ONLY for WORD PROBLEMS stated in prose. It explains the TRANSLATION from words to algebra. Break the problem into its real parts and translate EACH part on its own row — never lump the whole sentence into one row; the point is to show HOW each phrase becomes algebra. Order: first define the unknown(s), e.g. {"phrase": "Let x be the number", "tex": "x"}; then build up phrase by phrase, e.g. {"phrase": "twice the number", "tex": "2x"}, {"phrase": "increased by 5", "tex": "2x + 5"}, {"phrase": "is 20", "tex": "2x + 5 = 20"}. phrase: the exact wording (or a faithful paraphrase) from the problem. tex: the LaTeX it becomes (no prose/$/\\text). If the problem already gives the equation directly (not prose), return "setup": [].',
  'tex (in steps): ONE standalone LaTeX math expression — no prose, no \\text, no $ delimiters, no \\begin/\\end.',
  'Consecutive tex values must differ by a SINGLE algebraic move so an animation can slide matching terms between them. Do NOT combine two moves into one step.',
  'Keep every unchanged number/variable token byte-identical from one step to the next.',
  'action: choose EXACTLY ONE word from this list: ' + ACTIONS.join(', ') + '. Use "given" for the FIRST step only.',
  'note: the specific reason for THIS step — say WHAT you do and WHY it helps, but do NOT repeat the action verb (the action word already supplies it). Examples: action "subtract" -> note "5 from both sides to isolate the 2x term"; action "divide" -> note "by 2 so x stands alone"; action "substitute" -> note "x = 3 into the original equation". Keep it under 14 words.',
  'Start from the equation/expression in the question (for a word problem, the equation your setup ends with) and end at the final answer.',
  'Use as many steps as the solution genuinely needs to be followed without leaps (typically 3 to 7). Show every meaningful move; never skip one. Use standard LaTeX (\\frac, ^, _, \\sqrt, \\times, \\pm).',
  'If the problem is purely verbal/reading and truly cannot be shown as a sequence of equations, return {"steps": []}.',
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

// Providers tried in order — the first to return usable steps wins. This gives
// resilience when one provider is down, rate-limited, or returns junk.
const PROVIDERS = [
  {
    name: 'gemini',
    call: (q) => geminiGenerate({
      models: GEMINI_SOLVE_MODELS,   // quality-first chain (Pro → Flash → Lite)
      body: {
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: 'user', parts: [{ text: buildPrompt(q) }] }],
        generationConfig: { temperature: 0, responseMimeType: 'application/json' },
      },
    }).then(geminiText),
  },
  {
    name: 'groq',
    call: (q) => groqGenerate({ system: SYSTEM, prompt: buildPrompt(q), json: true, temperature: 0 })
      .then(groqText),
  },
];

// Parse a model's raw text into {states, notes, setup} (tolerates code fences).
function parseSteps(text) {
  let obj;
  try { obj = JSON.parse(String(text || '').replace(/^```json\s*|```$/g, '').trim()); }
  catch (_) { return { states: [], notes: [], setup: [] }; }
  const { states, notes } = cleanStructured(obj && obj.steps);
  return { states, notes, setup: cleanSetup(obj && obj.setup) };
}

async function generate(q) {
  for (const p of PROVIDERS) {
    try {
      const res = parseSteps(await p.call(q));
      if (res.states.length >= 2) return res;
      console.warn(`SolutionSteps: ${p.name} returned no usable steps — trying next provider.`);
    } catch (e) {
      console.warn(`SolutionSteps: ${p.name} failed — ${e.message} — trying next provider.`);
    }
  }
  return { states: [], notes: [], setup: [] };   // not cached → a later attempt can retry
}

// GET an admin-approved override (short timeout so a missing API never hangs).
async function fetchOverride(h) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 3500);
  try {
    const res = await fetch(`${API_BASE}/api/ai/steps/${encodeURIComponent(h)}`, { signal: ctrl.signal });
    if (!res.ok) return null;
    const d = await res.json();
    return d && d.found ? d : null;
  } finally { clearTimeout(t); }
}

async function get(q) {
  if (!q) return [];
  // Precomputed/authored steps short-circuit everything — even an empty array,
  // which is a deliberate "this question has no clean step animation".
  if (Array.isArray(q.steps)) {
    const { states, notes } = cleanStructured(q.steps);
    return pack(states, notes, 'authored', cleanSetup(q.setup));
  }

  const h = docHash(q);
  const key = CACHE_PREFIX + h;

  // 1) Admin-approved override is authoritative — and refreshes the local cache.
  try {
    const ov = await fetchOverride(h);
    if (ov && Array.isArray(ov.states) && ov.states.length >= 2) {
      const setup = cleanSetup(ov.setup);
      try { localStorage.setItem(key, JSON.stringify({ states: ov.states, notes: ov.notes, setup, source: 'override' })); } catch (_) {}
      return pack(ov.states, ov.notes, 'override', setup);
    }
  } catch (_) { /* offline / API down → fall through to cache or generation */ }

  // 2) Local cache (a previous generation, or a previously-seen override).
  try {
    const cached = localStorage.getItem(key);
    if (cached !== null) { const o = JSON.parse(cached); return pack(o.states, o.notes, o.source || 'cache', o.setup); }
  } catch (_) { /* private mode etc. */ }

  // 3) Generate with the model.
  if (inflight.has(key)) return inflight.get(key);
  const p = generate(q).then((res) => {
    try { localStorage.setItem(key, JSON.stringify(res)); } catch (_) {}
    inflight.delete(key);
    return pack(res.states, res.notes, 'ai', res.setup);
  }).catch(() => { inflight.delete(key); return pack([], [], 'ai'); });
  inflight.set(key, p);
  return p;
}

// ── Admin curation ─────────────────────────────────────────────────────────
let _adminCache = { uid: null, val: false };
async function isAdmin() {
  const user = auth.currentUser;
  if (!user) return false;
  if (_adminCache.uid === user.uid) return _adminCache.val;
  let val = false;
  try {
    const token = await user.getIdToken();
    const res = await fetch(`${API_BASE}/api/ai/whoami`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) val = !!(await res.json()).admin;
  } catch (_) { val = false; }
  _adminCache = { uid: user.uid, val };
  return val;
}

// Store the current animation as the approved override for this question.
async function approve(q, states, notes, setup) {
  const user = auth.currentUser;
  if (!user) throw new Error('Sign in as admin to approve.');
  const token = await user.getIdToken();
  const h = docHash(q);
  const clean = cleanSetup(setup);
  const res = await fetch(`${API_BASE}/api/ai/steps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ hash: h, question: plain(q.question), answer: plain(q && q._answer), states, notes, setup: clean }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || `Approve failed (${res.status})`);
  }
  try { localStorage.setItem(CACHE_PREFIX + h, JSON.stringify({ states, notes, setup: clean, source: 'override' })); } catch (_) {}
  return true;
}

// Discard the cached/generated steps and ask the model again.
async function regenerate(q) {
  const h = docHash(q);
  const key = CACHE_PREFIX + h;
  try { localStorage.removeItem(key); } catch (_) {}
  inflight.delete(key);
  const res = await generate(q);
  try { localStorage.setItem(key, JSON.stringify(res)); } catch (_) {}
  return pack(res.states, res.notes, 'ai', res.setup);
}

// ── GM solver expressions (admin-curated math to load into the scratchpad) ───
// Read the saved expressions for a question (null when none saved).
async function getExpression(q) {
  if (!q) return null;
  const h = docHash(q);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 3500);
  try {
    const res = await fetch(`${API_BASE}/api/ai/solver/${encodeURIComponent(h)}`, { signal: ctrl.signal });
    if (!res.ok) return null;
    const d = await res.json();
    return d && d.found ? (d.expressions || []) : null;
  } catch (_) { return null; } finally { clearTimeout(t); }
}

// Admin: save the expressions a learner should load for this question.
async function saveExpression(q, expressions) {
  const user = auth.currentUser;
  if (!user) throw new Error('Sign in as admin to save.');
  const token = await user.getIdToken();
  const h = docHash(q);
  const res = await fetch(`${API_BASE}/api/ai/solver`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ hash: h, question: plain(q.question), answer: plain(q && q._answer), expressions }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || `Save failed (${res.status})`);
  }
  return true;
}

window.SolutionSteps = { get, isAdmin, approve, regenerate, getExpression, saveExpression };
export { get, isAdmin, approve, regenerate, getExpression, saveExpression };
