/* ═══════════════════════════════════════════════════════
   FIRESTORE RULES CHECKER  —  `npm run check:rules`

   Does firestore.rules still describe what the game clients actually write?

   WHY THIS EXISTS. Rules deploy is a MANUAL `firebase deploy --only
   firestore:rules`, outside `npm run deploy`. So the rules file drifts behind
   the code silently, and the drift is invisible until it reaches production —
   at which point it does not look like a rules problem. It looks like a game
   that mostly works:

     · a create rule that rejects the room means "couldn't start a room —
       please try again", with nothing in the console about why;
     · a players-update rule missing a metric field means the score write is
       refused, the client falls back to score-only (see utils/games/
       leaderboard.js), and every opponent reads that player as unranked.

   Both were live at once in July 2026: Vocab's clock became DERIVED (an
   arbitrary integer) while its rule still demanded `timeLimit in [60, 120,
   180, 300]`, and its players rule allowed only ['score', 'finishedAt'] while
   the client wrote timeMs and wrong too.

   WHAT IT CHECKS. Three things, one per way the drift happens:

     1. timeLimit    a game whose clock is DERIVED must have a RANGE rule, not
                     an enum — and the client's clamp must fit inside it. A
                     game with fixed options must have every option allowed.
     2. metrics      every key the client writes at round end must appear in
                     the players-update hasOnly() allowlist.
     3. contentKeys  every field matchmaking.js declares must be validated by
                     the create rule (a field nothing checks is a field that
                     can arrive as anything).

   It parses both sides with regexes rather than a real grammar. That is a
   deliberate trade: a rules parser is a project, and the point here is to
   catch the one shape of mistake that has actually shipped. Anything it
   cannot read with confidence it reports as a WARNING rather than guessing —
   see the `unreadable` cases below.

   ERRORS (exit 1) would break a game in production.
   WARNINGS are gaps this script cannot settle — read each one.
═══════════════════════════════════════════════════════ */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/* The games, and where each one's two halves live. `rules` is the match block
   in firestore.rules; `dir` is the page under exam-archive/national. */
const GAMES = [
  { name: 'drills',   rules: 'drillRooms',   dir: 'drills' },
  { name: 'puzzles',  rules: 'puzzleRooms',  dir: 'puzzles' },
  { name: 'geometry', rules: 'geometryRooms', dir: 'geometry' },
  { name: 'vocab',    rules: 'vocabRooms',   dir: 'vocab' },
  { name: 'grammar',  rules: 'grammarRooms', dir: 'grammar' },
];

const errors = [];
const warnings = [];
const err = (id, msg) => errors.push(`${id}: ${msg}`);
const warn = (id, msg) => warnings.push(`${id}: ${msg}`);

/* Comments are stripped before anything is parsed. They are not decoration
   here: a clause is read as "up to the first `;`", and firestore.rules is
   heavily commented with prose that contains semicolons — one such comment
   inside Grammar's create rule truncated the clause and made a correct rule
   look like a missing one. */
const rulesSrc = readFileSync(join(ROOT, 'firestore.rules'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/[^\n]*/g, '');

/* ── Slicing one game's block out of firestore.rules ──────────────────────
   Brace-counting from `match /<collection>/{...} {` to its closing brace. A
   regex cannot do this — the block contains nested `match` blocks (the
   players subcollection) and braces inside strings.

   The header itself contains braces — `match /drillRooms/{roomId} {` — so
   counting from the first `{` after the collection name would latch onto the
   wildcard and close again immediately. The header regex consumes it. */
function blockAfter(src, headerRe) {
  const m = src.match(headerRe);
  if (!m) return null;
  const open = m.index + m[0].length - 1; // the `{` the header regex ends on
  let depth = 0;
  for (let j = open; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}' && --depth === 0) return src.slice(m.index, j + 1);
  }
  return null;
}

const ruleBlock = (collection) =>
  blockAfter(rulesSrc, new RegExp(`match\\s+/${collection}/\\{\\w+\\}\\s*\\{`));

// The `players` subcollection block, nested inside a game's block.
const playersBlock = (block) =>
  blockAfter(block, /match\s+\/players\/\{\w+\}\s*\{/);

// Just the `allow create` clause — so a `>=` in the update clause is never
// mistaken for a bound on the room's timeLimit.
function createClause(block) {
  const m = block.match(/allow\s+create\s*:[\s\S]*?;/);
  return m ? m[0] : null;
}

const readFile = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : null);
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

for (const game of GAMES) {
  const id = game.name;
  const block = ruleBlock(game.rules);
  if (!block) { err(id, `no "match /${game.rules}/" block in firestore.rules`); continue; }

  const mainSrc = readFile(join(ROOT, 'exam-archive/national', game.dir, 'js/main.js'));
  const matchSrc = readFile(join(ROOT, 'exam-archive/national', game.dir, 'js/matchmaking.js'));
  if (!mainSrc) { err(id, `no main.js under exam-archive/national/${game.dir}/js`); continue; }

  const create = createClause(block);
  if (!create) { err(id, 'rules have no `allow create` clause'); continue; }
  const code = strip(mainSrc);

  /* ── 1. timeLimit ──────────────────────────────────────────────────────
     The Vocab bug. A clock computed at runtime cannot satisfy an enum. */
  const enumMatch = create.match(/timeLimit\s+in\s+\[([^\]]*)\]/);
  const lowMatch = create.match(/timeLimit\s*>=\s*(\d+)/);
  const highMatch = create.match(/timeLimit\s*<=\s*(\d+)/);
  const derived = /function\s+computeTimeLimit|const\s+computeTimeLimit/.test(code);

  if (derived && enumMatch) {
    err(id, `clock is derived (computeTimeLimit) but the rule demands an enum `
      + `timeLimit in [${enumMatch[1].trim()}] — almost every room creation would be denied`);
  } else if (derived) {
    if (!lowMatch || !highMatch) {
      err(id, 'clock is derived but the rule has no `timeLimit >= … && <= …` range');
    } else {
      // The client's own clamp must fit inside what the rule permits.
      const lo = Number(lowMatch[1]), hi = Number(highMatch[1]);
      const cMin = code.match(/MIN_ROUND_SEC\s*=\s*(\d+)/);
      const cMax = code.match(/MAX_ROUND_SEC\s*=\s*(\d+)/);
      if (!cMin || !cMax) {
        warn(id, 'clock is derived but MIN_ROUND_SEC/MAX_ROUND_SEC could not be read — '
          + `check the clamp fits the rule's ${lo}–${hi} by hand`);
      } else {
        if (Number(cMin[1]) < lo) err(id, `clamps timeLimit down to ${cMin[1]}s but the rule floor is ${lo}s`);
        if (Number(cMax[1]) > hi) err(id, `clamps timeLimit up to ${cMax[1]}s but the rule ceiling is ${hi}s`);
      }
    }
  } else if (enumMatch) {
    // Fixed options: every value the setup offers must be allowed.
    const allowed = new Set(enumMatch[1].split(',').map((s) => s.trim()).filter(Boolean));
    const declared = code.match(/let\s+timeLimit\s*=\s*mem\.get\([^,]+,\s*\d+\s*,\s*\[([^\]]*)\]/);
    if (!declared) {
      warn(id, 'timeLimit is an enum in the rules but the client\'s option list could not be read');
    } else {
      const offered = declared[1].split(',').map((s) => s.trim()).filter(Boolean);
      const bad = offered.filter((v) => !allowed.has(v));
      if (bad.length) err(id, `setup offers timeLimit ${bad.join(', ')} which the rule denies `
        + `(allows ${[...allowed].join(', ')})`);
    }
  } else {
    warn(id, 'no timeLimit check in the create rule — any integer is accepted');
  }

  /* ── 2. metrics ────────────────────────────────────────────────────────
     Everything finishRound writes must be whitelisted, or the score write is
     refused and the player silently ranks last. */
  const players = playersBlock(block);
  if (!players) {
    err(id, 'rules have no players subcollection block');
  } else {
    const update = players.match(/allow\s+update\s*:[\s\S]*?;/);
    const allowList = update && update[0].match(/hasOnly\(\[([^\]]*)\]\)/);
    if (!allowList) {
      warn(id, 'players-update allowlist could not be read — check the metric fields by hand');
    } else {
      const allowed = new Set(
        allowList[1].split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean),
      );
      // The shared writer always sends these two (utils/games/leaderboard.js).
      const written = new Set(['score', 'finishedAt']);
      const metrics = code.match(/myMetrics\s*:\s*\{([^}]*)\}/);
      if (metrics) {
        for (const part of metrics[1].split(',')) {
          const k = part.split(':')[0].trim();
          if (/^[A-Za-z_$][\w$]*$/.test(k)) written.add(k);
        }
      }
      const missing = [...written].filter((k) => !allowed.has(k));
      if (missing.length) {
        err(id, `writes ${missing.join(', ')} at round end but the players-update rule allows only `
          + `${[...allowed].join(', ')} — the score write is refused and the player ranks last`);
      }
      const unused = [...allowed].filter((k) => !written.has(k));
      if (unused.length) warn(id, `players-update allows ${unused.join(', ')}, which the client never writes`);
    }
  }

  /* ── 3. contentKeys ────────────────────────────────────────────────────
     A declared content field that no rule mentions can arrive as anything. */
  if (!matchSrc) {
    warn(id, 'no matchmaking.js — content fields not checked');
  } else {
    const keys = strip(matchSrc).match(/contentKeys\s*:\s*\[([^\]]*)\]/);
    if (!keys) {
      warn(id, 'contentKeys could not be read from matchmaking.js');
    } else {
      const declared = keys[1].split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
      const unchecked = declared.filter((k) => !new RegExp(`data\\.${k}\\b`).test(create));
      if (unchecked.length) {
        warn(id, `create rule never validates ${unchecked.join(', ')} — declared in contentKeys, `
          + 'so it is written to the room doc unchecked');
      }
    }
  }
}

// ── Report ───────────────────────────────────────────────────────────────
console.log(`Checked ${GAMES.length} game(s) against firestore.rules.\n`);
if (warnings.length) {
  console.log(`⚠  ${warnings.length} warning(s) — gaps this script can't settle, read each one:\n`);
  warnings.forEach((w) => console.log(`   • ${w}\n`));
}
if (errors.length) {
  console.log(`✗ ${errors.length} error(s) — deploying these rules would break a live game:\n`);
  errors.forEach((e) => console.log(`   • ${e}\n`));
  process.exit(1);
}
console.log('✓ firestore.rules matches what every game client writes.');
