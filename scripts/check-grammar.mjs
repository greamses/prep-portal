/* ═══════════════════════════════════════════════════════
   GRAMMAR BANK CHECKER  —  `npm run check:grammar`

   Every rule in this file exists because it was broken in the launch bank and
   a player lost points for being right. Run it before committing a passage,
   and ALWAYS run it on anything an AI generated — a model will happily produce
   a "correction" that is a comma splice, or plant an optional comma as though
   it were mandatory, and both read perfectly well until someone is marked
   wrong for correct punctuation.

   ERRORS (exit 1) are structural: the round would be broken or unfair.
   WARNINGS are judgement calls a machine cannot settle — read each one and
   either fix it or convince yourself it is genuinely mandatory.

   The bank is ESM but the repo is CommonJS, so the modules are copied to a
   temp dir as .mjs to be imported. Nothing in the repo is touched.
═══════════════════════════════════════════════════════ */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'data', 'grammar');

// ── Load the bank ────────────────────────────────────────────────────────
const TMP = join(tmpdir(), `pp-grammar-check-${process.pid}`);
function loadBank() {
  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(join(TMP, 'passages'), { recursive: true });
  const copy = (rel) => {
    const src = readFileSync(join(SRC, rel), 'utf8').replace(/(\.\/[\w/\-${}]+)\.js/g, '$1.mjs');
    writeFileSync(join(TMP, rel.replace(/\.js$/, '.mjs')), src);
  };
  ['index.js', 'themes.js', 'cups.js', 'manifest.js'].forEach(copy);
  readdirSync(join(SRC, 'passages')).filter((f) => f.endsWith('.js'))
    .forEach((f) => copy(join('passages', f)));
  return import(pathToFileURL(join(TMP, 'index.mjs')).href);
}

const errors = [];
const warnings = [];
const err = (id, msg) => errors.push(`${id}: ${msg}`);
const warn = (id, msg) => warnings.push(`${id}: ${msg}`);

const bank = await loadBank();
const {
  GRADES, THEMES, CUPS_KEYS, availableThemes, loadPassages, passagePool,
  buildPassage, normalise,
} = bank;
const { AVAILABLE } = await import(pathToFileURL(join(TMP, 'manifest.mjs')).href);

/* ── The comma rules, mechanised as far as they can be ────────────────────
   House style (also stated on the rules card, see data/grammar/cups.js):

     · and / but / or / so joining two COMPLETE SENTENCES takes a comma
     · two verbs sharing one subject do NOT
     · no serial (Oxford) comma, and no three-item lists at all

   The two checks below are the two ways that goes wrong, and both were live
   in the launch bank:

     1. CLEAN prose that omits a required comma. Worse than it sounds — the
        player who correctly adds it is charged a FALSE EDIT for being right.
     2. A planted "correction" that adds a comma between two complete
        sentences. That is a comma splice: the answer is itself an error.

   Telling those two apart needs to know whether what follows the conjunction
   is a complete sentence, which needs a subject and a finite verb. There is no
   parser here, so this approximates: a subject-ish word, then a finite verb
   within a few words. It will miss some and over-report some — these are
   WARNINGS for a human to settle, not failures. */
const SUBJECTS = new Set([
  'the', 'a', 'an', 'he', 'she', 'it', 'we', 'they', 'i', 'this', 'that', 'there',
  'my', 'his', 'her', 'their', 'our', 'its', 'nobody', 'everyone', 'everything',
  'some', 'several', 'many', 'most', 'three', 'two', 'seating', 'parents', 'students',
]);
const FINITE_VERBS = new Set([
  'is', 'are', 'was', 'were', 'has', 'have', 'had', 'will', 'would', 'can', 'could',
  'shall', 'should', 'may', 'might', 'must', 'do', 'does', 'did', 'am',
  'ran', 'came', 'went', 'took', 'made', 'lost', 'won', 'said', 'saw', 'got',
  'gave', 'found', 'felt', 'kept', 'left', 'sat', 'stood', 'began', 'brought',
  'scored', 'cheered', 'changed', 'arrived', 'carried', 'follows', 'continues',
]);
const CONJUNCTIONS = new Set(['and', 'but', 'or', 'so', 'yet', 'nor']);
/* Words that open an introductory element (comma rule 1). Bare short adverbs
   like "Then" and "Now" are left out on purpose — standard British usage does
   not comma them, and flagging them would be noise.

   Split into two kinds, because the scan for the comma has to work differently:

   SUBORDINATORS open a whole CLAUSE, which has its own verb before the comma
   ("When the nest is finished, he hangs…"). Breaking the scan at the first
   finite verb would stop at "is" and miss the comma that is correctly there.

   PREP_OPENERS open a PHRASE, which has no verb ("By midnight, the roof had
   been torn away"). Here a finite verb means the main clause has begun without
   a comma, so breaking on it is exactly right. */
const SUBORDINATORS = new Set([
  'when', 'if', 'although', 'though', 'because', 'while', 'after', 'before',
  'since', 'unless', 'as', 'once', 'whenever', 'until',
]);
const PREP_OPENERS = new Set([
  'by', 'in', 'on', 'at', 'during', 'without', 'with', 'according', 'despite',
  'instead', 'following', 'last', 'next', 'every', 'throughout', 'apart',
]);
const INTRO_STARTERS = new Set([...SUBORDINATORS, ...PREP_OPENERS]);

const bare = (s) => String(s || '').replace(/[^\w’']/g, '').toLowerCase();

const PRONOUNS = new Set(['he', 'she', 'it', 'we', 'they', 'i', 'you']);
// Verb lists can never be complete, so allow one morphological fallback: a
// word inflected like a verb (-s / -ed) sitting immediately after a PRONOUN is
// one ("he ties", "she carried"). Restricting it to pronouns keeps the guess
// honest — "the boys" would otherwise read as a verb.
function isVerbAt(tokens, k) {
  const w = bare(tokens[k].answer);
  if (FINITE_VERBS.has(w)) return true;
  const prev = k > 0 ? bare(tokens[k - 1].answer) : '';
  return PRONOUNS.has(prev) && /(?:ed|es|s)$/.test(w) && w.length > 3;
}

// Does an independent clause plausibly start at token `i`?
function looksLikeClause(tokens, i) {
  if (!tokens[i] || !SUBJECTS.has(bare(tokens[i].answer))) return false;
  for (let k = i + 1; k < Math.min(i + 6, tokens.length); k++) {
    if (isVerbAt(tokens, k)) return true;
    if (/[.!?]$/.test(tokens[k].answer)) return false; // sentence ended first
  }
  return false;
}

const seenIds = new Set();
let passageCount = 0;

for (const theme of Object.keys(THEMES)) {
  let passages;
  try {
    passages = await loadPassages(theme);
  } catch (e) {
    if (AVAILABLE[theme]) err(theme, `listed in manifest.js but failed to load: ${e.message}`);
    continue;
  }

  if (AVAILABLE[theme] !== passages.length) {
    err(theme, `manifest.js says ${AVAILABLE[theme]} passages, file has ${passages.length}`);
  }

  for (const p of passages) {
    passageCount++;
    const id = p.id;
    if (seenIds.has(id)) err(id, 'duplicate passage id');
    seenIds.add(id);

    if (!p.title) err(id, 'missing title');
    const [lo, hi] = p.band || [];
    if (!Number.isInteger(lo) || !Number.isInteger(hi) || lo > hi) err(id, `bad band ${JSON.stringify(p.band)}`);
    const [tlo, thi] = THEMES[theme].band;
    if (lo < tlo || hi > thi) err(id, `band [${lo},${hi}] falls outside its theme's [${tlo},${thi}]`);

    const tokens = buildPassage(p, 'cups');
    const errs = tokens.filter((t) => t.cat);

    // ── Structural ──────────────────────────────────────────────────────
    for (const t of tokens) {
      if (/[{}]/.test(t.shown) || /[{}]/.test(t.answer)) {
        err(id, `unparsed marker near token ${t.i}: "${t.shown}" — check the {{CAT|bad|good}} syntax`);
      }
    }
    if (tokens.length < 40) warn(id, `only ${tokens.length} words — short for a timed round`);
    if (errs.length < 5) err(id, `only ${errs.length} planted errors (want at least 5)`);

    const cats = new Set(errs.map((t) => t.cat));
    for (const k of CUPS_KEYS) {
      if (!cats.has(k)) {
        err(id, `no ${k} error — a "${k} only" focus round would deal a passage with nothing in it`);
      }
    }

    // ── Each planted error must actually BE an error ────────────────────
    for (const t of errs) {
      if (t.accept.some((a) => normalise(a) === normalise(t.shown))) {
        err(id, `token ${t.i} "${t.shown}" is listed as an error but is already an accepted answer — a careful reader who leaves it alone is marked "missed"`);
      }
      if (t.accept.length !== new Set(t.accept.map(normalise)).size) {
        warn(id, `token ${t.i} "${t.shown}" lists a duplicate answer`);
      }
      if (/\s/.test(t.shown) || t.accept.some((a) => /\s/.test(a))) {
        err(id, `token ${t.i} spans more than one word ("${t.shown}") — a marker must be a single whitespace-delimited token`);
      }
    }

    // ── Comma rule 1: CLEAN prose must not omit a required comma ────────
    // The player who correctly supplies it is charged a false edit, which is
    // the least forgivable way for this game to be wrong.
    tokens.forEach((t, i) => {
      if (!CONJUNCTIONS.has(bare(t.answer))) return;
      if (t.answer !== bare(t.answer)) return;      // already carries punctuation
      const prev = tokens[i - 1];
      if (!prev || prev.answer.endsWith(',')) return; // comma already there
      if (!looksLikeClause(tokens, i + 1)) return;    // compound predicate — correct as is
      if (prev.cat === 'P') return;                   // it IS the planted error
      warn(id, `clean prose joins two sentences with "${bare(t.answer)}" and no comma: "… ${prev.answer} ${t.answer} ${tokens[i + 1].answer} ${tokens[i + 2] ? tokens[i + 2].answer : ''} …". House style wants "${prev.answer}," — as written, a player who adds it is charged a FALSE EDIT for being right.`);
    });

    // ── Comma rule 1b: an introductory element takes a comma ────────────
    // "Last Saturday my family went…" must be "Last Saturday, my family…".
    // Same failure mode as above: the clean prose breaks the rule the player
    // is marked against, so supplying the comma costs them a false edit.
    let atSentenceStart = true;
    tokens.forEach((t, i) => {
      if (atSentenceStart && INTRO_STARTERS.has(bare(t.answer))) {
        // A clause opener gets a longer, verb-tolerant scan; a phrase opener a
        // short one that stops once the main clause has plainly started.
        const isClause = SUBORDINATORS.has(bare(t.answer));
        const span = isClause ? 12 : 7;
        let commaAt = -1;
        for (let k = i; k < Math.min(i + span, tokens.length); k++) {
          // Test for the comma FIRST: the word carrying it may itself be the
          // clause's verb ("When we arrived, I ran…"), and breaking on the
          // verb before looking would miss a comma that is correctly there.
          if (tokens[k].answer.endsWith(',')) {
            // …but not every comma in range is THIS one. A comma whose next
            // word is "and"/"but" belongs to comma rule 2, joining two
            // sentences later in the line ("When it is frightened it rolls
            // into a ball, and even a lion…"). Accepting it would declare the
            // missing introductory comma present. Keep looking.
            if (CONJUNCTIONS.has(bare(tokens[k + 1] && tokens[k + 1].answer))) continue;
            commaAt = k;
            break;
          }
          if (/[.!?]$/.test(tokens[k].answer)) break;
          // For a PHRASE opener only: a finite verb means the main clause has
          // begun with no comma. A CLAUSE opener owns a verb of its own before
          // the comma, so this test would fire on the wrong one.
          if (!isClause && k > i && isVerbAt(tokens, k)) break;
        }
        if (commaAt === -1) {
          warn(id, `introductory element with no comma: "${tokens.slice(i, i + 7).map((x) => x.answer).join(' ')} …". House style (comma rule 1) wants one before the main clause — as written, a player who adds it is charged a FALSE EDIT.`);
        }
      }
      atSentenceStart = /[.!?]$/.test(t.answer) || !!t.br;
    });

    // ── One token, one rule ─────────────────────────────────────────────
    // A word needing both a comma and an apostrophe scores nothing for the
    // player who gets one of them right.
    for (const t of errs) {
      if (t.cat !== 'P') continue;
      const gained = (re) => re.test(t.answer) && !re.test(t.shown);
      const changes = [gained(/,/), gained(/['’]/), gained(/[.!?]/), gained(/:/)].filter(Boolean).length;
      if (changes > 1) {
        err(id, `token ${t.i} "${t.shown}" → "${t.answer}" requires more than one punctuation fix at once; a player who supplies one correctly still scores nothing. Split them across two tokens.`);
      }
    }

    // ── Comma rule 2: a planted comma must not create a splice ──────────
    for (const t of errs) {
      if (t.cat !== 'P') continue;
      if (!(t.answer.endsWith(',') && !t.shown.endsWith(','))) continue;
      // A salutation or sign-off ends its line ("Dear Bola," / "Yours
      // faithfully,"). Its comma is a letter convention, not clause joining.
      if (t.br) continue;
      const nextWord = bare(tokens[t.i + 1] && tokens[t.i + 1].answer);
      if (CONJUNCTIONS.has(nextWord)) continue; // rule 2 — legitimate
      // A splice needs a complete sentence on BOTH sides. Walk back to the
      // start of the sentence to find out what precedes this comma.
      let hasVerbBefore = false;
      let sentStart = 0;
      for (let k = t.i; k >= 0; k--) {
        if (k < t.i && (/[.!?]$/.test(tokens[k].answer) || tokens[k].br)) { sentStart = k + 1; break; }
        if (isVerbAt(tokens, k)) hasVerbBefore = true;
      }
      // A sentence opening with a subordinator is an introductory CLAUSE
      // ("When the nest is finished, he hangs…"). It has a verb of its own,
      // but it is not a complete sentence — so its comma is rule 1, not a
      // splice.
      if (SUBORDINATORS.has(bare(tokens[sentStart].answer))) continue;
      // Nothing with a verb before the comma means an introductory PHRASE
      // ("By five o'clock, we were…") — rule 1 again.
      if (!hasVerbBefore) continue;
      if (looksLikeClause(tokens, t.i + 1)) {
        warn(id, `token ${t.i} "${t.shown}" → "${t.answer}" puts a comma in front of what looks like a complete sentence ("${tokens[t.i + 1].answer} …"). That is a COMMA SPLICE — the "correction" is itself an error. Use a full stop, or join the clauses with a conjunction.`);
      }
    }

    // ── Comma rule 5: lists take the serial comma ───────────────────────
    // "a, b and c" must be "a, b, and c". If the passage leaves it out in
    // CLEAN prose, the player who correctly supplies it is charged a false
    // edit — the same trap as a missing introductory comma.
    for (let i = 0; i < tokens.length - 2; i++) {
      if (!tokens[i].answer.endsWith(',')) continue;
      // A real list runs "a, b and c" — short, with no OTHER comma between.
      // A second comma means an appositive pair ("Our captain, Emeka, won…")
      // or a separate clause, neither of which is a list.
      for (let j = i + 1; j < Math.min(i + 4, tokens.length - 1); j++) {
        if (tokens[j].answer.endsWith(',') || /[.!?:;]$/.test(tokens[j].answer)) break;
        // A list's items are noun phrases. A finite verb in the span means
        // this is a predicate ("… won the toss and chose to kick"), not a list.
        if (FINITE_VERBS.has(bare(tokens[j].answer))) break;
        const w = bare(tokens[j + 1].answer);
        if (w === 'and' || w === 'or') {
          // The serial comma belongs on tokens[j] — the item before the "and".
          warn(id, `list "${tokens[i].answer} … ${tokens[j].answer} ${tokens[j + 1].answer} …" is missing the serial comma on "${tokens[j].answer}". House style (comma rule 5) wants "${tokens[j].answer}," — as written, a player who adds it is charged a FALSE EDIT. Either punctuate it, or plant it as a P error.`);
          break;
        }
      }
    }
  }
}

// ── Every grade must be dealable ─────────────────────────────────────────
const banks = {};
for (const t of Object.keys(THEMES)) {
  try { banks[t] = await loadPassages(t); } catch { banks[t] = []; }
}
for (const g of GRADES) {
  const themes = availableThemes(g);
  if (!themes.length) { err(`grade ${g}`, 'no themes offered'); continue; }
  for (const t of themes) {
    if (!passagePool(banks[t], g).length) {
      err(`grade ${g}`, `theme "${t}" is offered but has no passage in band`);
    }
  }
}

rmSync(TMP, { recursive: true, force: true });

// ── Report ───────────────────────────────────────────────────────────────
console.log(`Checked ${passageCount} passages across ${Object.keys(THEMES).length} themes.\n`);
if (warnings.length) {
  console.log(`⚠  ${warnings.length} warning(s) — judgement calls, read each one:\n`);
  warnings.forEach((w) => console.log(`   • ${w}\n`));
}
if (errors.length) {
  console.log(`✗ ${errors.length} error(s):\n`);
  errors.forEach((e) => console.log(`   • ${e}\n`));
  process.exit(1);
}
console.log('✓ Bank is structurally sound.');
