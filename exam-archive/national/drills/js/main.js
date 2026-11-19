/* ═══════════════════════════════════════════════════════
   DRILLS — page orchestrator
   Wires the setup form to matchmaking.js -> game.js -> leaderboard.js and
   switches between the lobby/play/results overlays. Multiplayer uses
   anonymous pool matching; Versus is always a private 1v1 via a shared
   room code (create-and-share, or join-with-code).
═══════════════════════════════════════════════════════ */
import { auth, db } from '/firebase-init.js';
import { collection, getDocs } from 'firebase/firestore';
import { UNIT_NUMBERS } from './rng.js';
import { COMPOUND_SETS, ALL_COMPOUND_SETS } from '/data/chem/rmm.js';
import { botName } from './bots.js';
import { matchmake, createCodeRoom, joinRoomByCode } from './matchmaking.js';
import { startRound, masterFinished, lastRoundTimeMs } from './game.js';
import { startGridRound } from './grid.js';
import { startBarsRound } from './bars.js';
import { startSorobanRound, lastSorobanTimeMs, speedRange, delayRange, sessionSeconds } from './soroban.js';
import { createDial } from '/utils/components/dial.js';
import { BANKS, BANK_KEYS, setCount, setId, setsLabel, roundSeconds, clockLabel, LEVELS, LEVEL_KEYS, levelOf, perMinute, wordsInSets } from './spelling.js';
import { openSpellingLibrary } from './spelling-library.js';
import { startBee, beeFullscreen, BEE_SPELLERS, BEE_SIZE, spellerPool } from './bee.js';
import { beeSeconds } from './bee-logic.js';
import { finishRound, rankDrill } from './leaderboard.js';
import { renderLeaderboard } from '/utils/games/leaderboard-view.js';
import {
  createCarousel, createSectionFlow,
  renderChoiceStep, renderMultiStep, renderCustomStep, renderComingSoon,
  playerChips, optionsChips, roomChips,
} from '/utils/components/setup-carousel.js';
import { avatarUrl, getAvatarSeed, mountAvatarPicker } from '/utils/components/avatar-picker.js';
import { createSetupMemory } from '/utils/games/setup-memory.js';

const $ = (id) => document.getElementById(id);
const stickyColor = (i) => `pp-sticky--c${i % 6}`;

// The avatar picker (drawn faces + the player's own photos) lives in
// /utils/components/avatar-picker.js, shared by every game — one player, one
// face, everywhere. Avatar choice is never synced to other players in a room
// (see leaderboard.js: other real players' rows always render a uid-derived
// DiceBear face, not their actual pick).

const NAME_KEY = 'drillGameName';

const OPERATION_LABELS = {
  add: '+ Addition', multiply: '× Multiply', divide: '÷ Divide',
  square: 'x² Square', sqrt: '√x Root',
  cube: 'x³ Cube', cuberoot: '∛x Cube Root',
  power4: 'x⁴ Power 4', fourthroot: '⁴√x Fourth Root',
  fracAdd: '+ Addition', fracSub: '− Subtraction', fracMul: '× Multiplication', fracDiv: '÷ Division',
  rmm: 'Σ Molecular Mass',
  intAdd: '+ Add Integers', intSub: '− Subtract Integers', directed: '± Directed Numbers', intMul: '× Multiply Integers', intDiv: '÷ Divide Integers',
  algDistribute: 'a(x+b) Distribution', algFactorise: 'Factorisation', algQuadExpand: '(x+a)(x+b) Quadratic Expansion', algQuadFactorise: 'x²+bx+c Quadratic Factorisation', algMixed: 'Mixed Algebra (all four)',
  geoAngLine: 'Straight line', geoAngTriangle: 'Triangle', geoAngPolygon: 'Polygons', geoAngParallel: 'Parallel lines', geoAngBend: 'Bent line (Σ)', geoAngPoint: 'Angles at a point (360°)', geoAngComp: 'Complementary (90°)',
  geoRect: 'Rectangle', geoTriangle: 'Triangle', geoTrapezium: 'Trapezium', geoParallelogram: 'Parallelogram',
  geoHyp: 'Find the hypotenuse', geoLeg: 'Find a short side', geoTrig: 'Sin, cos, tan ratios',
  geoCircumference: 'Circumference', geoCircleArea: 'Circle area', geoCuboid: 'Cuboid volume', geoCylinder: 'Cylinder volume', geoCone: 'Cone volume',
  binTo10: 'Binary to denary', binFrom10: 'Denary to binary', binAdd: 'Binary addition', binSub: 'Binary subtraction', binMul: 'Binary multiplication', binDiv: 'Binary division',
  octAdd: 'Octal addition', octSub: 'Octal subtraction', octMul: 'Octal multiplication', octDiv: 'Octal division',
  hexAdd: 'Hex addition', hexSub: 'Hex subtraction', hexMul: 'Hex multiplication', hexDiv: 'Hex division',
  romanToNum: 'Roman to number', numToRoman: 'Number to Roman',
  spellSay: 'Read out', spellIpa: 'Transcribe', spellBee: 'Spelling Bee',
  pctToDec: 'Percentages to decimals', pctToFrac: 'Percentages to fractions', fracToPct: 'Fractions to percentages',
  decToPct: 'Decimals to percentages', pctOf: 'Percentages of numbers',
  pctInc: 'Percentage increase', pctDec: 'Percentage decrease', pctIncBy: 'Increase by a percentage', pctDecBy: 'Decrease by a percentage',
  monSI: 'Simple interest', monProfitPct: 'Profit percent', monLossPct: 'Loss percent', monSP: 'Selling price from profit or loss %',
  monCP: 'Cost price from profit or loss %', monDiscount: 'Discount', monCommission: 'Commission',
  sorAdd: 'Addition', sorSub: 'Subtraction',
  subOne: 'One step', subTwo: 'Two steps', subMulti: 'Brackets and fractions', subPower: 'Powers and roots',
  eqOne: '1-Step Equations', eqTwo: '2-Step Equations', eqMulti: 'Multi-Step Equations', eqSystem: 'Simultaneous Equations',
  baseTo10: 'To Base 10', baseFrom10: 'From Base 10', baseToBase: 'Base to Base',
};

// Details shown on hover where a label is kept to a word or two.
const OPERATION_TIPS = {
  spellSay: 'The boy says the word; you spell it. Tap him or press Enter to hear it again.',
  spellIpa: "You see the word's sounds in IPA (the dictionary's phonetic letters) and spell the word.",
  spellBee: 'A bee in a hall: spellers take turns at the microphone, one word each. Spell it wrong and you leave the stage. The last one standing wins.',
};

// Category filters which operations are on offer. Basic keeps the default
// (multiply + divide ticked, addition opt-in — mirrors the old flat list's
// defaults); Exponent and Fractions start fully opt-in, same as square/sqrt
// used to be. Chemistry has exactly one thing to do — find the relative
// molecular mass — so it is ticked for the player and its step is skipped.
const CATEGORY_OPERATIONS = {
  basic: ['add', 'multiply', 'divide'],
  exponent: ['square', 'cube', 'power4', 'sqrt', 'cuberoot', 'fourthroot'],
  fractions: ['fracAdd', 'fracSub', 'fracMul', 'fracDiv'],
  chemistry: ['rmm'],
  integers: ['intAdd', 'intSub', 'intMul', 'intDiv', 'directed'],
  algebra: ['algDistribute', 'algFactorise', 'algQuadExpand', 'algQuadFactorise', 'algMixed'],
  equations: ['eqOne', 'eqTwo', 'eqMulti', 'eqSystem'],
  subject: ['subOne', 'subTwo', 'subMulti', 'subPower'],
  percent: ['pctToDec', 'pctToFrac', 'fracToPct', 'decToPct', 'pctOf', 'pctInc', 'pctDec', 'pctIncBy', 'pctDecBy'],
  money: ['monSI', 'monProfitPct', 'monLossPct', 'monSP', 'monCP', 'monDiscount', 'monCommission'],
  soroban: ['sorAdd', 'sorSub'],
  bases: ['binTo10', 'binFrom10', 'binAdd', 'binSub', 'binMul', 'binDiv',
    'octAdd', 'octSub', 'octMul', 'octDiv', 'hexAdd', 'hexSub', 'hexMul', 'hexDiv', 'baseTo10', 'baseFrom10', 'baseToBase'],
  roman: ['romanToNum', 'numToRoman'],
  spelling: ['spellSay', 'spellIpa', 'spellBee'],
  angles: ['geoAngLine', 'geoAngComp', 'geoAngPoint', 'geoAngTriangle', 'geoAngPolygon', 'geoAngParallel', 'geoAngBend'],
  areas: ['geoRect', 'geoTriangle', 'geoTrapezium', 'geoParallelogram'],
  pythag: ['geoHyp', 'geoLeg', 'geoTrig'],
  circles: ['geoCircumference', 'geoCircleArea', 'geoCuboid', 'geoCylinder', 'geoCone'],
  // Tables (the grid filler) has no operations step — 'multiply' is a harmless
  // placeholder so the room doc still carries a valid, non-empty operations
  // list; the grid round ignores it entirely (see js/grid.js).
  timestable: ['multiply'],
  // Fraction Bars adds and subtracts unlike fractions — the same two keys the
  // Fractions category uses, read by js/bars.js instead of rng.js.
  fracbars: ['fracAdd', 'fracSub'],
};
/* The Math Bee asks from any of the maths topics (the user: "the math bee isn't just for
   multiplication, it is for all the math drills in the site"): the ones picked bring all their
   question kinds. Grouped as the drills' own areas. */
const MATH_BEE_GROUPS = [
  ['Numbers', ['basic', 'integers', 'exponent', 'fractions', 'percent', 'money', 'bases', 'roman']],
  ['Algebra', ['algebra', 'equations', 'subject']],
  ['Geometry', ['angles', 'areas', 'pythag', 'circles']],
];
const MATH_BEE_TOPICS = MATH_BEE_GROUPS.flatMap(([, list]) => list);
/* each topic's question kinds, to tick one by one (the user: "I need the topics to be more
   differentiated"). A topic not listed here is one group of its drills operations. */
const MATH_BEE_KINDS = {
  bases: [
    ['Converting', ['binTo10', 'binFrom10', 'baseTo10', 'baseFrom10', 'baseToBase']],
    ['Adding in the same base', ['binAdd', 'octAdd', 'hexAdd']],
    ['Subtracting in the same base', ['binSub', 'octSub', 'hexSub']],
    ['Multiplying in the same base', ['binMul', 'octMul', 'hexMul']],
    ['Dividing in the same base', ['binDiv', 'octDiv', 'hexDiv']],
  ],
};
const kindsOf = (t) => MATH_BEE_KINDS[t] || [[null, CATEGORY_OPERATIONS[t].filter((op) => op !== 'algMixed')]];
const kindLabel = (op) => String(OPERATION_LABELS[op] || op).replace(/^[^A-Za-z0-9]*\s(?=[A-Z])/, '');   // "+ Addition" -> "Addition\"
CATEGORY_OPERATIONS.mathbee = [...new Set(MATH_BEE_TOPICS.flatMap((t) => CATEGORY_OPERATIONS[t]))];
const CATEGORY_DEFAULT_OPS = {
  mathbee: CATEGORY_OPERATIONS.basic,
  basic: ['multiply', 'divide'],
  exponent: [],
  fractions: [],
  chemistry: ['rmm'],
  integers: ['intAdd'],
  algebra: ['algDistribute'],
  equations: ['eqOne'],
  subject: ['subOne'],
  percent: ['pctToDec'],
  money: ['monProfitPct'],
  soroban: ['sorAdd'],
  bases: ['baseTo10'],
  roman: ['romanToNum'],
  spelling: ['spellSay'],
  angles: ['geoAngLine'],
  areas: ['geoRect'],
  pythag: ['geoHyp'],
  circles: ['geoCircumference'],
  timestable: ['multiply'],
  fracbars: ['fracAdd'],
};

// Fractions gets a second selector dimension — which shape of fraction
// question to draw (independent of which operation is ticked above).
const FRACTION_TYPES = ['like', 'unlike', 'wholeFraction'];
const FRACTION_TYPE_LABELS = { like: 'Like', unlike: 'Unlike', wholeFraction: 'Whole vs Fraction' };

// A question's "base" number is drawn from whichever pool these describe:
// hand-picked 1-9 numbers, or a whole decade practiced as one block ("higher
// numbers require practice through the range", not cherry-picked).
const RANGES = [
  { key: 'all', label: 'All', min: 1, max: 100 },
  { key: '1-9', label: 'Single digits', min: 1, max: 9 },
  { key: '10-99', label: 'Double digits', min: 10, max: 99 },
];

// Fractions don't use a "number range" at all — in rng.js the same pool feeds
// the DENOMINATORS (like/unlike/wholeFraction all draw from it). A range of
// 90–100 would generate ⁴⁷⁄₉₃ + ⁸⁸⁄₉₇, which is not a fraction drill. Small
// denominators are the whole point, so Fractions gets this instead.
const DENOMINATORS = Array.from({ length: 11 }, (_, i) => i + 2); // 2..12

// Chemistry has no number pool at all — a question is a compound drawn from
// the shared bank (/data/chem/rmm.js, the same compounds Vocab names), so the
// only thing to pick is which sets of it are in play.
const COMPOUND_SET_LABELS = Object.fromEntries(COMPOUND_SETS.map((s) => [s.key, s.label]));

const nameInput = $('drill-name-input');
const avatarGrid = $('drill-avatar-grid');
const avatarUploadInput = $('drill-avatar-upload-input');
const playerMount = $('drill-player-carousel');
const topicMount = $('drill-topic-carousel');
const optionsMount = $('drill-options-carousel');
const roomMount = $('drill-room-carousel');
const codeInput = $('drill-code-input');
const startBtn = $('drill-start-btn');
const startLabel = $('drill-start-label');

const lobbyBd = $('drill-lobby-bd');
const lobbyStatus = $('drill-lobby-status');
const lobbyCode = $('drill-lobby-code');
const lobbyCodeText = $('drill-lobby-code-text');
const lobbyCodeCopy = $('drill-lobby-code-copy');
const lobbySeats = $('drill-lobby-seats');
const lobbyCount = $('drill-lobby-count');
const lobbyCancel = $('drill-lobby-cancel');
const lobbyStartNow = $('drill-lobby-start-now');

const awaitingBd = $('drill-awaiting-bd');

const resultsBd = $('drill-results-bd');
const leaderboardEl = $('drill-leaderboard');
const againBtn = $('drill-again-btn');

function showAwaiting() {
  awaitingBd.classList.add('open');
  awaitingBd.setAttribute('aria-hidden', 'false');
}
function hideAwaiting() {
  awaitingBd.classList.remove('open');
  awaitingBd.setAttribute('aria-hidden', 'true');
}

let cancelled = false;
// The host's "start now" action for the current lobby snapshot — swapped out on
// every waiting tick so the button always promotes the latest player count.
let startNowFn = null;

// ── Setup state ─────────────────────────────────────────────────────────
// Owned in JS, not read back out of `input:checked` — a carousel only renders
// the step you're on, so a DOM-query getter would throw for any step the
// player never opened.
// Every field starts from the player's LAST game (setup-memory.js) so
// nothing has to be re-picked visit after visit.
const mem = createSetupMemory('drills');
let mode = mem.get('mode', 'multiplayer', ['multiplayer', 'versus', 'cup']);   // cup: the Math Bee tournament
let roomSize = mem.get('roomSize', 5, [5, 10]);
let timeLimit = mem.get('timeLimit', 60, [30, 60, 90, 120]);
let roomAction = mem.get('roomAction', 'quickfill', ['quickfill', 'create', 'join']); // multiplayer: quickfill|create|join · versus: create|join
if (mode === 'versus' && roomAction === 'quickfill') roomAction = 'create'; // Versus has no Quick Fill

let categoryValue = mem.get('category', 'basic', ['mathbee', 'basic', 'exponent', 'fractions', 'chemistry', 'integers', 'algebra', 'equations', 'subject', 'percent', 'money', 'soroban', 'bases', 'roman', 'spelling', 'angles', 'areas', 'pythag', 'circles', 'timestable', 'fracbars']);
let range = mem.get('range', 'all', RANGES.map((r) => r.key));
if (categoryValue === 'algebra' || categoryValue === 'subject' || categoryValue === 'percent' || categoryValue === 'money' || categoryValue === 'roman' || categoryValue === 'spelling') range = '1-9'; // single digits only
// Tables (grid filler) only — how much of each 5×5 grid is blank. The grid is
// always 5×5 with a fresh mix of 1..12 tables per grid, streamed one after the
// next, so there is no size dial.
let gridBlanks = mem.get('gridBlanks', 'light', ['light', 'heavy']);
// Fraction Bars only — basic: one denominator is a multiple of the other, so
// the common denominator is already on the top line; advanced: they share a
// factor but neither divides the other, so it is neither of them.
let barsLevel = mem.get('barsLevel', 'basic', ['basic', 'advanced']);
// The multi-pick sets restore from saved arrays, dropping anything that's no
// longer a valid member of its list.
const tables = new Set(mem.get('tables', [], Array.isArray).filter((n) => UNIT_NUMBERS.includes(n))); // Basic + 1-9 only — the cherry-picked number set
const operations = new Set(
  mem.get('operations', CATEGORY_DEFAULT_OPS[categoryValue], Array.isArray)
    .filter((op) => CATEGORY_OPERATIONS[categoryValue].includes(op)),
);
const fractionTypes = new Set(mem.get('fractionTypes', [], Array.isArray).filter((t) => FRACTION_TYPES.includes(t))); // Fractions only — opt-in
const savedDenoms = mem.get('denominators', DENOMINATORS, Array.isArray).filter((n) => DENOMINATORS.includes(n));
const denominators = new Set(savedDenoms.length ? savedDenoms : DENOMINATORS); // Fractions only — tick-all default
const savedSets = mem.get('compounds', ALL_COMPOUND_SETS, Array.isArray).filter((k) => ALL_COMPOUND_SETS.includes(k));
const compounds = new Set(savedSets.length ? savedSets : ALL_COMPOUND_SETS); // Chemistry only — tick-all default
// Spelling only — which sets of twenty words (set 1 = the bank's first twenty). Sent as the room's `tables`.
// Spelling: which list, which of its sets of ten (set numbers 1..n), Normal or
// Focus (one slip and you are out), whether missed words are mastered after the
// clock, and the difficulty level, which is the pace and so the clock. The sets
// go to the room as ids (list code + set number: see BANKS in spelling.js).
let spellBank = mem.get('spellBank', 'secondary', BANK_KEYS);
const spellSets = new Set(mem.get('spellSets', [1], Array.isArray).filter((n) => Number.isInteger(n) && n >= 1 && n <= setCount(spellBank)));
if (!spellSets.size) spellSets.add(1);
let spellFocus = mem.get('spellFocus', false, [true, false]);
let spellMaster = mem.get('spellMaster', true, [true, false]);
let spellLevel = mem.get('spellLevel', 'easy', LEVEL_KEYS);
const spellIds = () => [...spellSets].sort((a, b) => a - b).map((n) => setId(spellBank, n));
const spellTime = () => roundSeconds(spellIds(), spellLevel);
// The Spelling Bee: the room's clock is the seconds each speller gets at the microphone.
const isBee = () => categoryValue === 'spelling' && operations.has('spellBee');
/* The Math Bee: its own topic (Numbers > Math Bee). The bee hall, a minute each at the pulpit,
   questions from every topic ticked; the most correct answers wins. */
const isMathBee = () => categoryValue === 'mathbee';
const isAnyBee = () => isBee() || isMathBee();
const mathTopics = new Set(mem.get('mathTopics', ['basic'], Array.isArray).filter((t) => MATH_BEE_TOPICS.includes(t)));
if (!mathTopics.size) mathTopics.add('basic');
// the question kinds ticked (a topic with none ticked takes all of its own)
const mathOps = new Set(mem.get('mathOps', [], Array.isArray).filter((op) => CATEGORY_OPERATIONS.mathbee.includes(op)));
const kindsIn = (t) => kindsOf(t).flatMap(([, list]) => list);
/** The Math Bee's operations: the kinds ticked in every topic ticked. */
function syncMathOps() {
  operations.clear();
  for (const t of mathTopics) {
    let picked = kindsIn(t).filter((op) => mathOps.has(op));
    if (!picked.length) { kindsIn(t).forEach((op) => mathOps.add(op)); picked = kindsIn(t); }
    picked.forEach((op) => operations.add(op));
  }
}
if (categoryValue === 'mathbee') syncMathOps();
if (mode === 'cup' && categoryValue !== 'mathbee') mode = 'multiplayer';   // a tournament is the Math Bee's only
const isMathCup = () => isMathBee() && mode === 'cup';
/* Soroban (flash anzan): how the numbers show, the test, and the four sliders. Speed and delay
   ranges follow the digits (soroban.js speedRange / delayRange). */
const sorShow = new Set(mem.get('sorShow', ['number'], Array.isArray).filter((v) => ['tool', 'number'].includes(v)));
if (!sorShow.size) sorShow.add('number');
const sorTests = new Set(mem.get('sorTests', ['simple'], Array.isArray).filter((v) => ['simple', 'small', 'big'].includes(v)));
if (!sorTests.size) sorTests.add('simple');
let sorCount = Math.round(Math.min(100, Math.max(5, Number(mem.get('sorCount', 10)) || 10)) / 5) * 5;   // in fives
let sorTerms = Math.round(Math.min(100, Math.max(5, Number(mem.get('sorTerms', 5)) || 5)));   // numbers flashed in each sum
let sorDigits = Math.round(Math.min(6, Math.max(1, Number(mem.get('sorDigits', 1)) || 1)));
const clampTo = (v, [lo, hi]) => Math.min(hi, Math.max(lo, v));
let sorSpeed = clampTo(Number(mem.get('sorSpeed', 1.2)) || 1.2, speedRange(sorDigits));
let sorDelay = clampTo(Number(mem.get('sorDelay', 1.5)) || 1.5, delayRange(sorDigits));
/* No big friends and only one way (adding only, or taking away only): a rod can only fill to 9 (or
   empty to 0) without a carry, so a sum can hold at most 9 numbers (nine ones, with small friends) or,
   simple only, 5 (1 + 1 + 1 + 1 + 5: four to five needs a small friend). */
const sorTermsMax = () => (!sorTests.has('big') && (operations.has('sorAdd') !== operations.has('sorSub')) ? (sorTests.has('small') ? 9 : 5) : 100);
const sorobanCfg = () => ({ show: [...sorShow].sort(), tests: [...sorTests].sort(), count: sorCount, terms: Math.min(sorTerms, sorTermsMax()), digits: sorDigits, speed: +sorSpeed.toFixed(2), delay: +sorDelay.toFixed(2) });
const sorobanRoom = () => (categoryValue === 'soroban' ? { soroban: sorobanCfg() } : {});
// the speller this player chooses to be, at the Spelling Bee (remembered)
let beeKid = mem.get('beeKid', BEE_SPELLERS[0].key, BEE_SPELLERS.map((k) => k.key));
// Chemistry's single operation is never offered as a step, so a remembered
// setup that somehow lost it would leave the player unable to start.
if (categoryValue === 'chemistry') operations.add('rmm');

// One save covers this section's whole branch — called wherever it exits.
const saveContent = () => mem.save({
  category: categoryValue, range,
  tables: [...tables], operations: [...operations],
  fractionTypes: [...fractionTypes], denominators: [...denominators],
  compounds: [...compounds],
  spellSets: [...spellSets], spellBank, spellFocus, spellMaster, spellLevel,
  mathTopics: [...mathTopics], mathOps: [...mathOps],
  sorShow: [...sorShow], sorTests: [...sorTests], sorCount, sorTerms, sorDigits, sorSpeed, sorDelay,
  gridBlanks,
  barsLevel,
});

// Which play surface the room runs — 'grid' for Tables, 'bars' for Fraction
// Bars, 'drill' for everything else. Written to the room doc so a code-joiner
// plays the host's surface.
const gameActivity = () => (
  categoryValue === 'timestable' ? 'grid' : categoryValue === 'fracbars' ? 'bars' : isMathBee() ? (mode === 'cup' ? 'mathcup' : 'mathbee') : categoryValue === 'soroban' ? 'soroban' : 'drill'
);

function getCurrentUser() {
  return new Promise((resolve) => {
    if (auth.currentUser) { resolve(auth.currentUser); return; }
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) { unsub(); resolve(user); }
    });
  });
}

// Basic and Exponent both drill the full 1–100 range. Fractions has no range
// at all — its pool is the denominator set (see DENOMINATORS above).
function rangesFor() { return RANGES; }

// Only the 1-9 bucket is fine enough to cherry-pick individual numbers from
// (and only for Basic — Exponent just sticks with its ranges). Every other
// bucket is drilled as a whole block.
function isNumbersMode() { return categoryValue === 'basic' && range === '1-9'; }

// The actual pool of "base" numbers handed to questionAt(). For Fractions
// that pool IS the denominator set — there is no range to expand. Chemistry
// draws from the compound bank instead and never touches this pool, but the
// room doc's `tables` still has to be a non-empty list of numbers.
function getTablesPool() {
  // Tables (grid filler) doesn't draw from a number pool, but the room doc's
  // `tables` still has to be a non-empty list — a single placeholder does it.
  if (categoryValue === 'timestable') return [1];
  if (categoryValue === 'fracbars') return [1]; // same — the sums are dealt by js/bars.js
  if (categoryValue === 'chemistry') return [1];
  if (categoryValue === 'spelling') return spellIds(); // the sets of ten, as list code + set number
  if (categoryValue === 'mathbee') return [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  if (categoryValue === 'soroban') return [sorDigits];
  if (categoryValue === 'fractions') return [...denominators];
  if (isNumbersMode()) return [...tables];
  const list = rangesFor(categoryValue);
  const r = list.find((x) => x.key === range) || list[0];
  return Array.from({ length: r.max - r.min + 1 }, (_, i) => r.min + i);
}

function updateStartDisabled() {
  // Tables always has a valid setup (size + blanks both default to a value).
  if (categoryValue === 'timestable') { startBtn.disabled = false; return; }
  const needsNumbers = isNumbersMode() && tables.size === 0;
  const isFractions = categoryValue === 'fractions';
  const needsFractionType = isFractions && fractionTypes.size === 0;
  const needsDenominators = isFractions && denominators.size === 0;
  const needsCompounds = categoryValue === 'chemistry' && compounds.size === 0;
  const needsSets = categoryValue === 'spelling' && spellSets.size === 0;
  startBtn.disabled = operations.size === 0
    || needsNumbers || needsFractionType || needsDenominators || needsCompounds || needsSets;
}

function updateStartLabel() {
  if (mode !== 'versus') {
    startLabel.textContent =
      roomAction === 'join' ? 'Join Room' : roomAction === 'create' ? 'Create Room' : 'Find a Room';
    return;
  }
  startLabel.textContent = roomAction === 'join' ? 'Join Room' : 'Create Room';
}

// ── Game name ──────────────────────────────────
nameInput.value = localStorage.getItem(NAME_KEY) || '';
nameInput.addEventListener('input', () => localStorage.setItem(NAME_KEY, nameInput.value));
getCurrentUser().then((user) => {
  if (!nameInput.value && user.displayName) nameInput.value = user.displayName;
});

function myName() {
  return (nameInput.value || '').trim() || (auth.currentUser && auth.currentUser.displayName) || 'Player';
}

/* ── SECTION 1 — Player ─────────────────────────────────────────
   Name → Avatar. The name input and avatar grid are MOVED into the slides
   rather than re-created, so all their existing wiring still applies. */
const player = createCarousel(playerMount);
player.addSlide('name', 'Name', () => {});
player.addSlide('avatar', 'Avatar', () => {});

renderCustomStep(player, 'name', {
  title: 'What should we call you?',
  content: nameInput,
  nextLabel: 'Next',
  onNext: () => player.goTo('avatar'),
});
renderCustomStep(player, 'avatar', {
  title: 'Pick your avatar',
  content: avatarGrid,
  nextLabel: 'Next',
  onNext: () => flow.next(), // last step of this section
});

player.start('name');

/* ── SECTION 2 — What to drill ─────────────────────────────────
   Category → the settings that category actually uses. The three categories
   need different things, so none shows a step whose value the generator would
   ignore:

     Basic     → Operations → Number Range (1–100) → [1–9 only: pick numbers]
     Exponent  → Operations → Number Range (1–100)
     Fractions → Fraction Type → Operations → Denominators (2–12)
     Chemistry → Compounds (inorganic / organic)
     Tables    → Blanks (light / heavy)
     Fraction Bars → Operations (add / subtract) → Level (basic / advanced)

   Fractions has NO number range on purpose: in rng.js that same pool supplies
   the denominators, so "90–100" would mean fractions over ninety-somethings.
   Chemistry has neither range nor operations step: there is one thing to work
   out (the relative molecular mass) and the numbers are the compound's own.
   Switching category resets the whole branch, so nothing stale carries over. */
const topic = createCarousel(topicMount);
topic.addSlide('area', 'Area', () => {});
topic.addSlide('category', 'Topic', () => {});
topic.addSlide('fraction-type', 'Fraction Type', () => {});
topic.addSlide('operations', 'Operations', () => {});
topic.addSlide('mathbee-topics', 'Topics', () => {});
topic.addSlide('sor-show', 'Show', () => {});
topic.addSlide('sor-test', 'Test', () => {});
topic.addSlide('sor-settings', 'Settings', () => {});
topic.addSlide('range', 'Number Range', () => {});
topic.addSlide('numbers', 'Numbers', () => {});
topic.addSlide('denominators', 'Denominators', () => {});
topic.addSlide('compounds', 'Compounds', () => {});
topic.addSlide('grid-blanks', 'Blanks', () => {});
topic.addSlide('bars-level', 'Level', () => {});
topic.addSlide('spell-bank', 'Word List', () => {});
topic.addSlide('spell-sets', 'Word Sets', () => {});
topic.addSlide('spell-pace', 'Pace', () => {});
topic.addSlide('spell-master', 'Word Master', () => {});

/* The Spelling Bee: choose the speller you will be on the stage. */
function renderBeeKidStep() {
  const grid = document.createElement('div');
  grid.className = 'bee-pick';
  for (const k of BEE_SPELLERS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `bee-pick-kid${k.key === beeKid ? ' is-picked' : ''}`;
    b.setAttribute('aria-pressed', k.key === beeKid ? 'true' : 'false');
    b.setAttribute('aria-label', `${k.call}, ${k.name}`);
    b.dataset.tip = k.name;
    // the speller's face as their avatar
    const face = document.createElement('span');
    face.className = 'pp-face bee-pick-face';
    face.style.cssText = k.face;
    const cap = document.createElement('span');
    cap.className = 'bee-pick-name';
    cap.textContent = k.call;
    b.append(face, cap);
    b.addEventListener('click', () => {
      beeKid = k.key;
      mem.save({ beeKid });
      grid.querySelectorAll('.bee-pick-kid').forEach((x) => { const on = x === b; x.classList.toggle('is-picked', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    });
    grid.append(b);
  }
  renderCustomStep(options, 'speller', {
    title: 'Choose your speller',
    subtitle: 'This is you on the stage. Every speller in the hall is a different child.',
    content: grid,
    nextLabel: 'Next',
    onNext: () => { mem.save({ beeKid }); flow.next(); },
  });
}

function renderOperationsPick() {
  const isFractions = categoryValue === 'fractions';
  const isBars = categoryValue === 'fracbars';
  renderMultiStep(topic, 'operations', {
    title: isBars ? 'Add, subtract, or both?' : categoryValue === 'spelling' ? 'Hear the word, or read its sounds?' : `Which ${(TOPIC_LABEL[categoryValue] || categoryValue).toLowerCase()} questions?`,
    colorOffset: 3,
    options: CATEGORY_OPERATIONS[categoryValue].map((op) => ({ value: op, label: OPERATION_LABELS[op], tip: OPERATION_TIPS[op] })),
    isChecked: (v) => operations.has(v),
    onToggle: (v, checked) => {
      if (checked) operations.add(v); else operations.delete(v);
      // the Spelling Bee is a game of its own: ticking it unticks the drills, and the other way round
      if (checked && categoryValue === 'spelling') {
        const drop = v === 'spellBee' ? [...operations].filter((o) => o !== 'spellBee') : ['spellBee'];
        if (drop.some((o) => operations.has(o))) { drop.forEach((o) => operations.delete(o)); renderOperationsPick(); }
      }
      if (categoryValue === 'spelling') renderModeSize();   // the bee: five players, no Versus
      updateStartDisabled();
      if (categoryValue === 'spelling') renderTimeStep();
    },
    nextLabel: 'Next',
    onNext: () => {
      if (isFractions) { renderDenominatorsPick(); topic.goTo('denominators'); return; }
      if (isBars) { renderBarsLevelStep(); topic.goTo('bars-level'); return; }
      if (categoryValue === 'soroban') { range = '1-9'; renderSorSettingsStep(); topic.goTo('sor-settings'); return; }
      if (categoryValue === 'spelling') { renderSpellSetsPick(); topic.goTo('spell-sets'); return; }
      // Algebra is single digits only: there is nothing to choose, so no step.
      if (categoryValue === 'algebra' || categoryValue === 'subject' || categoryValue === 'percent' || categoryValue === 'money' || categoryValue === 'roman') { range = '1-9'; saveContent(); flow.next(); return; }
      renderRangePick();
      topic.goTo('range');
    },
  });
}

/* Spelling: which sets of ten words. The library (every set, with meanings
   and the boy to say each word) opens from here, on the first ticked set. */
function renderSpellBankStep() {
  renderChoiceStep(topic, 'spell-bank', {
    title: 'Which word list?',
    name: 'drill-spell-bank',
    options: BANK_KEYS.map((k) => ({ value: k, label: BANKS[k].label, tip: `${BANKS[k].rows.length} words in ${setCount(k)} sets of ten, from the most common to the rarest`, checked: spellBank === k })),
    onPick: (v) => {
      if (v !== spellBank) { spellBank = v; spellSets.clear(); spellSets.add(1); }
      saveContent();
      renderOperationsPick();
      topic.goTo('operations');
    },
  });
}

function renderSpellSetsPick() {
  const count = setCount(spellBank);
  renderMultiStep(topic, 'spell-sets', {
    title: `Which ${BANKS[spellBank].label} sets?`,
    subtitle: `Ten words a set, ${count} sets. Study a set in the library first.`,
    grid: true,
    colorOffset: 2,
    options: Array.from({ length: count }, (_, i) => ({ value: String(i + 1), label: String(i + 1) })),
    isChecked: (v) => spellSets.has(Number(v)),
    onToggle: (v, checked) => {
      const n = Number(v);
      if (checked) spellSets.add(n); else spellSets.delete(n);
      updateStartDisabled();
      if (categoryValue === 'spelling') renderTimeStep();
    },
    nextLabel: 'Next',
    onNext: () => {
      range = '1-9'; saveContent();
      if (isBee()) { flow.next(); return; }       // a bee: no Focus, no Word Master (the speller is chosen in the last section)
      renderSpellPaceStep(); topic.goTo('spell-pace');
    },
  });
  const lib = document.createElement('button');
  lib.type = 'button';
  lib.className = 'pp-sticky pp-sticky--tape pp-note-btn pp-sticky--c4 drill-spell-lib-btn';
  lib.textContent = 'Open the library';
  lib.addEventListener('click', () => openSpellingLibrary({ bank: spellBank, sets: [...spellSets] }));
  topic.getEl('spell-sets').appendChild(lib);
}

/* Normal or Focus: whether a slip puts you out. The pace is the difficulty level (the round step). */
function renderSpellPaceStep() {
  renderChoiceStep(topic, 'spell-pace', {
    title: 'Normal or Focus?',
    subtitle: 'Focus is for when you want no second chances.',
    name: 'drill-spell-pace',
    options: [
      { value: 'normal', label: 'Normal', tip: 'Skip a word if you are stuck, and carry on.', checked: !spellFocus },
      { value: 'focus', label: 'Focus', tip: 'One wrong letter (or a skip) and you are out, and off the leaderboard.', checked: spellFocus },
    ],
    onPick: (v) => {
      spellFocus = v === 'focus';
      saveContent();
      if (categoryValue === 'spelling') renderTimeStep();
      if (spellFocus) { flow.next(); return; }   // nothing to master: one slip ends a Focus round
      renderSpellMasterStep();
      topic.goTo('spell-master');
    },
  });
}

function renderSpellMasterStep() {
  renderChoiceStep(topic, 'spell-master', {
    title: 'When the round ends',
    name: 'drill-spell-master',
    options: [
      { value: 'on', label: 'Master', tip: 'Word Master: after the round, every word you skipped comes back until you can spell it. Then the results.', checked: spellMaster },
      { value: 'off', label: 'Results', tip: 'Go straight to the leaderboard when the round ends.', checked: !spellMaster },
    ],
    onPick: (v) => { spellMaster = v === 'on'; saveContent(); flow.next(); }, // last step of this section
  });
}

function renderFractionTypePick() {
  renderMultiStep(topic, 'fraction-type', {
    title: 'Which fraction type?',
    colorOffset: 9,
    options: FRACTION_TYPES.map((t) => ({ value: t, label: FRACTION_TYPE_LABELS[t] })),
    isChecked: (v) => fractionTypes.has(v),
    onToggle: (v, checked) => {
      if (checked) fractionTypes.add(v); else fractionTypes.delete(v);
      updateStartDisabled();
    },
    nextLabel: 'Next',
    onNext: () => { renderOperationsPick(); topic.goTo('operations'); },
  });
}

function renderDenominatorsPick() {
  renderMultiStep(topic, 'denominators', {
    title: 'Which denominators?',
    subtitle: 'Fractions are built from these — keep them small and they stay drillable.',
    grid: true,
    colorOffset: 0,
    options: DENOMINATORS.map((n) => ({ value: String(n), label: String(n) })),
    isChecked: (v) => denominators.has(Number(v)),
    onToggle: (v, checked) => {
      const n = Number(v);
      if (checked) denominators.add(n); else denominators.delete(n);
      updateStartDisabled();
    },
    nextLabel: 'Next',
    onNext: () => { saveContent(); flow.next(); }, // last step of this section
  });
}

function renderCompoundsPick() {
  renderMultiStep(topic, 'compounds', {
    title: 'Which compounds?',
    subtitle: 'You are given the atomic masses under each formula — the drill is adding them up.',
    colorOffset: 9,
    options: COMPOUND_SETS.map((s) => ({
      value: s.key,
      label: `${s.label} · ${s.compounds.length}`,
    })),
    isChecked: (v) => compounds.has(v),
    onToggle: (v, checked) => {
      if (checked) compounds.add(v); else compounds.delete(v);
      updateStartDisabled();
    },
    nextLabel: 'Next',
    onNext: () => { saveContent(); flow.next(); }, // last step of this section
  });
}

/* Tables (grid filler) — one step: how much of each 5×5 grid is blank (cells
   AND some header labels). Always has a value, so the section is never in an
   unstartable state. The grid itself is always 5×5 with a fresh mix of 1..12
   tables, dealt one after another until the clock runs out. */
function renderGridBlanksStep() {
  renderChoiceStep(topic, 'grid-blanks', {
    title: 'How much is blank?',
    subtitle: 'A 5×5 grid of multiples — guess the missing table numbers from them; a fresh grid follows each one.',
    name: 'drill-grid-blanks',
    colorOffset: 7,
    options: [
      { value: 'light', label: 'Light', checked: gridBlanks === 'light' },
      { value: 'heavy', label: 'Heavy', checked: gridBlanks === 'heavy' },
    ],
    onPick: (v) => {
      gridBlanks = v;
      saveContent();
      flow.next(); // last step of this section
    },
  });
}

/* Fraction Bars — how the two denominators are related. Always has a value. */
function renderBarsLevelStep() {
  renderChoiceStep(topic, 'bars-level', {
    title: 'How hard?',
    subtitle: 'Basic: the bar that fits is one of the two you are given (1/4 and 1/8 → eighths). Advanced: it is neither (1/4 and 1/6 → twelfths).',
    name: 'drill-bars-level',
    colorOffset: 7,
    options: [
      { value: 'basic', label: 'Basic', checked: barsLevel === 'basic' },
      { value: 'advanced', label: 'Advanced', checked: barsLevel === 'advanced' },
    ],
    onPick: (v) => {
      barsLevel = v;
      saveContent();
      flow.next(); // last step of this section
    },
  });
}

function renderRangePick() {
  renderChoiceStep(topic, 'range', {
    title: 'Which number range?',
    name: 'drill-range',
    colorOffset: 6,
    options: rangesFor().map((r) => ({ value: r.key, label: r.label, checked: r.key === range })),
    onPick: (v) => {
      range = v;
      updateStartDisabled();
      // 1–9 is the one bucket you can cherry-pick from; every other range is
      // drilled whole, so the range IS the last step of this section.
      if (isNumbersMode()) { renderNumbersPick(); topic.goTo('numbers'); }
      else { saveContent(); flow.next(); }
    },
  });
}

function renderNumbersPick() {
  renderMultiStep(topic, 'numbers', {
    title: 'Which numbers (1–9)?',
    grid: true,
    colorOffset: 0,
    options: UNIT_NUMBERS.map((n) => ({ value: String(n), label: String(n) })),
    isChecked: (v) => tables.has(Number(v)),
    onToggle: (v, checked) => {
      const n = Number(v);
      if (checked) tables.add(n); else tables.delete(n);
      updateStartDisabled();
    },
    nextLabel: 'Next',
    onNext: () => { saveContent(); flow.next(); }, // last step of this section
  });
}

/* Area → Topic. The four areas group the topics; a topic is what used to be
   the flat "category" (its own operations, level and content steps follow). */
const AREAS = [
  { value: 'numbers', label: 'Numbers' },
  { value: 'algebra', label: 'Algebra' },
  { value: 'geometry', label: 'Geometry' },
  { value: 'science', label: 'Science' },
  { value: 'words', label: 'Word Speed' },
];
const AREA_TOPICS = {
  numbers: [
    ['mathbee', 'Math Bee'], ['basic', 'Arithmetic'], ['integers', 'Integers'], ['exponent', 'Powers & Roots'],
    ['fractions', 'Fractions'], ['percent', 'Percentages'], ['money', 'Commercial Maths'], ['soroban', 'Soroban'], ['bases', 'Number Bases'], ['roman', 'Roman Numerals'], ['timestable', 'Times Tables Grid'], ['fracbars', 'Fraction Bars'], ['planner', 'Planner'],
  ],
  algebra: [['algebra', 'Expressions'], ['equations', 'Equations'], ['subject', 'Change of Subject']],
  geometry: [['angles', 'Angles'], ['areas', 'Area & Perimeter'], ['pythag', 'Pythagoras & Trig'], ['circles', 'Circles & Volume']],
  science: [['chemistry', 'Molecular Mass']],
  words: [['spelling', 'Spelling'], ['vocab', 'Vocab'], ['grammar', 'Grammar']],
};
const AREA_OF = {};
Object.entries(AREA_TOPICS).forEach(([area, list]) => list.forEach(([v]) => { AREA_OF[v] = area; }));
const TOPIC_LABEL = {};
Object.values(AREA_TOPICS).forEach((list) => list.forEach(([v, l]) => { TOPIC_LABEL[v] = l; }));
let areaValue = AREA_OF[categoryValue] || 'numbers';

// Topics that are whole games of their own: picking one opens that game (its
// setup, rooms and scoring live on its page).
const GAME_PAGES = {
  vocab: '/exam-archive/national/vocab/',
  grammar: '/exam-archive/national/grammar/',
  planner: '/exam-archive/national/planner/',
};

function pickCategory(v) {
  if (GAME_PAGES[v]) { window.location.href = GAME_PAGES[v]; return; }
  queueMicrotask(renderTimeStep);   // spelling's clock comes from its words, every other topic's is chosen
  queueMicrotask(renderModeSize);   // the Math Bee is offered for the number topics only
  if (v !== 'mathbee' && mode === 'cup') { mode = 'multiplayer'; mem.save({ mode }); }
  if (v !== categoryValue) {
    // Reset the whole branch — a range picked under Basic must not survive
    // into Fractions (which has no range at all). Re-picking the SAME
    // topic keeps the remembered picks.
    categoryValue = v;
    operations.clear();
    CATEGORY_DEFAULT_OPS[v].forEach((op) => operations.add(op));
    fractionTypes.clear();
    tables.clear();
    range = 'all';
    denominators.clear();
    DENOMINATORS.forEach((n) => denominators.add(n));
    compounds.clear();
    ALL_COMPOUND_SETS.forEach((k) => compounds.add(k));
    updateStartDisabled();
  }

  if (v === 'timestable') { renderGridBlanksStep(); topic.goTo('grid-blanks'); }
  else if (v === 'chemistry') { renderCompoundsPick(); topic.goTo('compounds'); }
  else if (v === 'fractions') { renderFractionTypePick(); topic.goTo('fraction-type'); }
  else if (v === 'spelling') { renderSpellBankStep(); topic.goTo('spell-bank'); }
  else if (v === 'mathbee') { syncMathOps(); updateStartDisabled(); renderMathTopicsStep(); topic.goTo('mathbee-topics'); }
  else if (v === 'soroban') { renderSorShowStep(); topic.goTo('sor-show'); }
  else { renderOperationsPick(); topic.goTo('operations'); }
}

/* The Math Bee: which topics its questions come from, grouped as the drills' areas. */
/* ── Soroban: show, test, (add / subtract: the operations step), the sliders ── */
function renderSorShowStep() {
  renderMultiStep(topic, 'sor-show', {
    title: 'Show the numbers as',
    subtitle: 'Tool flashes each number on a soroban; Number flashes the figures. Tick both for both.',
    options: [
      { value: 'tool', label: 'Tool (soroban)', tip: 'Each number set on a soroban, beads and all' },
      { value: 'number', label: 'Number', tip: 'Each number in figures' },
    ],
    isChecked: (v) => sorShow.has(v),
    onToggle: (v, on) => { if (on) sorShow.add(v); else if (sorShow.size > 1) sorShow.delete(v); else renderSorShowStep(); saveContent(); },
    nextLabel: 'Next',
    onNext: () => { saveContent(); renderSorTestStep(); topic.goTo('sor-test'); },
  });
}
function renderSorTestStep() {
  renderMultiStep(topic, 'sor-test', {
    title: 'Which test?',
    colorOffset: 2,
    options: [
      { value: 'simple', label: 'Simple', tip: 'Beads straight on and off: no five, no ten (1 + 3, 5 + 2)' },
      { value: 'small', label: 'Small friends', tip: 'The friends of five: 3 + 4 is 3 + 5 − 1' },
      { value: 'big', label: 'Big friends', tip: 'The friends of ten: 7 + 5 is 7 + 10 − 5' },
    ],
    isChecked: (v) => sorTests.has(v),
    onToggle: (v, on) => { if (on) sorTests.add(v); else if (sorTests.size > 1) sorTests.delete(v); else renderSorTestStep(); saveContent(); },
    nextLabel: 'Next',
    onNext: () => { saveContent(); renderOperationsPick(); topic.goTo('operations'); },
  });
}
function renderSorSettingsStep() {
  // five dials, two to a line: roll one round and its reading shows in the middle
  const box = document.createElement('div');
  box.className = 'pp-dials sor-dials';
  const secs = (v) => `${v.toFixed(v < 1 ? 2 : 1)} s`;
  const dial = (opts, onInput) => {
    const d = createDial({ ...opts, onInput: (v) => { onInput(v); saveContent(); } });
    box.append(d.el);
    return d;
  };
  dial({ label: 'Sums', min: 5, max: 100, step: 5, value: sorCount }, (v) => { sorCount = v; });
  const tMax = sorTermsMax();
  dial({ label: 'Numbers in each sum', min: 5, max: tMax, step: tMax < 100 ? 1 : 5, value: Math.min(sorTerms, tMax) }, (v) => { sorTerms = v; });
  if (tMax < 100) {
    const note = document.createElement('p');
    note.className = 'sor-note';
    note.textContent = `Without big friends, a sum that only ${operations.has('sorAdd') ? 'adds' : 'takes away'} can hold at most ${tMax} numbers: the rods ${operations.has('sorAdd') ? 'fill up' : 'run empty'}. Tick Big friends, or both Addition and Subtraction, for longer sums.`;
    box.append(note);
  }
  let speed, delay;
  // more digits: slower ranges for speed and delay (each value keeps its place in its range)
  dial({ label: 'Digits', min: 1, max: 6, step: 1, value: sorDigits }, (v) => {
    const sOld = speedRange(sorDigits), dOld = delayRange(sorDigits);
    const fs = (sorSpeed - sOld[0]) / (sOld[1] - sOld[0] || 1), fd = (sorDelay - dOld[0]) / (dOld[1] - dOld[0] || 1);
    sorDigits = v;
    const sNew = speedRange(v), dNew = delayRange(v);
    sorSpeed = +(sNew[0] + fs * (sNew[1] - sNew[0])).toFixed(2);
    sorDelay = +(dNew[0] + fd * (dNew[1] - dNew[0])).toFixed(2);
    speed.setRange(sNew[0], sNew[1], sorSpeed);
    delay.setRange(dNew[0], dNew[1], sorDelay);
    sorSpeed = speed.value; sorDelay = delay.value;
  });
  speed = dial({ label: 'Speed (each number shows)', min: speedRange(sorDigits)[0], max: speedRange(sorDigits)[1], step: 0.05, value: sorSpeed, format: secs, unit: 's' }, (v) => { sorSpeed = v; });
  delay = dial({ label: 'Delay (the gap between numbers)', min: delayRange(sorDigits)[0], max: delayRange(sorDigits)[1], step: 0.05, value: sorDelay, format: secs, unit: 's' }, (v) => { sorDelay = v; });
  delay.el.classList.add('is-alone');                      // the fifth: a line to itself, in the middle
  renderCustomStep(topic, 'sor-settings', {
    title: 'Sums, digits, speed and delay',
    subtitle: 'Roll a dial (drag it round, or the mouse wheel over it). The numbers of each sum flash one by one; type the total when the last one has gone.',
    content: box,
    nextLabel: 'Next',
    onNext: () => { saveContent(); updateStartDisabled(); flow.next(); },
  });
}

/* The Math Bee's topics, grouped as the drills' areas. Clicking a topic opens its kinds of question
   under its row to tick one by one (number bases: converting, adding in the same base...); its own
   box ticks or unticks the whole topic. Every topic ticked keeps at least one kind. */
const mathOpen = new Set();          // the topics whose kinds are showing
function renderMathTopicsStep() {
  const box = document.createElement('div');
  box.className = 'mb-topics';
  let n = 0;
  const kindsPanel = (t) => {
    const panel = document.createElement('div');
    panel.className = 'mb-opts';
    const title = document.createElement('p');
    title.className = 'mb-opts__title';
    title.textContent = `${TOPIC_LABEL[t] || t}: which questions?`;
    panel.append(title);
    let k = 0;
    for (const [sub, ops] of kindsOf(t)) {
      if (sub) {
        const h = document.createElement('p');
        h.className = 'mb-kinds__sub';
        h.textContent = sub;
        panel.append(h);
      }
      const wrap = document.createElement('div');
      wrap.className = 'pp-carousel-choices sticky-row mb-opts__row';
      for (const op of ops) {
        const label = document.createElement('label');
        label.className = `pp-sticky sticky-choice mb-opt pp-sticky--c${(1 + k++) % 6}`;
        label.innerHTML = `<input type="checkbox" value="${op}" ${mathOps.has(op) ? 'checked' : ''} /><span>${kindLabel(op)}</span>`;
        label.querySelector('input').addEventListener('change', (e) => {
          if (e.target.checked) mathOps.add(op);
          else if (kindsIn(t).some((o) => o !== op && mathOps.has(o))) mathOps.delete(op);
          else e.target.checked = true;                       // every topic keeps at least one kind
          syncMathOps(); saveContent(); updateStartDisabled();
          renderMathTopicsStep();
        });
        wrap.append(label);
      }
      panel.append(wrap);
    }
    return panel;
  };
  for (const [group, list] of MATH_BEE_GROUPS) {
    const head = document.createElement('p');
    head.className = 'mb-topics__head';
    head.textContent = group;
    const wrap = document.createElement('div');
    wrap.className = 'pp-carousel-choices sticky-row';
    for (const t of list) {
      const on = mathTopics.has(t), open = mathOpen.has(t);
      const all = kindsIn(t), some = all.filter((op) => mathOps.has(op)).length;
      const chip = document.createElement('div');
      chip.className = `pp-sticky pp-sticky--tape sticky-choice mb-topic pp-sticky--c${(3 + n++) % 6}${open ? ' is-open' : ''}`;
      chip.setAttribute('role', 'button');
      chip.tabIndex = 0;
      chip.setAttribute('aria-expanded', open ? 'true' : 'false');
      chip.dataset.tip = open ? 'Hide its kinds of question' : 'Choose its kinds of question';
      chip.innerHTML = `<input type="checkbox" value="${t}" ${on ? 'checked' : ''} aria-label="Ask ${TOPIC_LABEL[t] || t}" /><span>${TOPIC_LABEL[t] || t}</span>`
        + `${on && some < all.length ? `<em class="mb-topic__n">${some}/${all.length}</em>` : ''}`
        + `<svg class="mb-topic__caret" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      // the box: the whole topic in or out
      const tick = chip.querySelector('input');
      tick.addEventListener('click', (e) => e.stopPropagation());
      tick.addEventListener('change', (e) => {
        if (e.target.checked) { mathTopics.add(t); mathOpen.add(t); }
        else if (mathTopics.size > 1) { mathTopics.delete(t); mathOpen.delete(t); }
        else e.target.checked = true;                         // at least one topic stays ticked
        syncMathOps(); saveContent(); updateStartDisabled();
        renderMathTopicsStep();
      });
      // the topic itself: its kinds of question open and close (ticked first if it was not)
      const toggle = () => {
        if (!mathTopics.has(t)) { mathTopics.add(t); mathOpen.add(t); syncMathOps(); saveContent(); updateStartDisabled(); }
        else if (mathOpen.has(t)) mathOpen.delete(t); else mathOpen.add(t);
        renderMathTopicsStep();
      };
      chip.addEventListener('click', toggle);
      chip.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
      wrap.append(chip);
    }
    box.append(head, wrap);
    // the open topics of this row, under it
    for (const t of list) if (mathOpen.has(t) && mathTopics.has(t)) box.append(kindsPanel(t));
  }
  renderCustomStep(topic, 'mathbee-topics', {
    title: 'Which topics?',
    subtitle: 'Tick the topics to ask from. Click a topic to choose its kinds of question.',
    content: box,
    nextLabel: 'Next',
    onNext: () => { syncMathOps(); saveContent(); updateStartDisabled(); flow.next(); },
  });
}

function renderTopicPick() {
  renderChoiceStep(topic, 'category', {
    title: `Which ${AREAS.find((a) => a.value === areaValue).label.toLowerCase()} topic?`,
    name: 'drill-category',
    options: AREA_TOPICS[areaValue].map(([value, label]) => ({ value, label, checked: categoryValue === value })),
    onPick: pickCategory,
  });
}

renderChoiceStep(topic, 'area', {
  title: 'What do you want to practise?',
  name: 'drill-area',
  options: AREAS.map((a) => ({ ...a, checked: areaValue === a.value })),
  onPick: (v) => {
    areaValue = v;
    // A one-topic area has nothing to choose between.
    if (AREA_TOPICS[v].length === 1) { pickCategory(AREA_TOPICS[v][0][0]); return; }
    renderTopicPick();
    topic.goTo('category');
  },
});
renderTopicPick();

topic.start('area');

/* ── SECTION 3 — Game Options ─────────────────────────────────
   Mode → Room Size → Time Limit. Versus skips Room Size — it's always 1v1. */
const options = createCarousel(optionsMount);
options.addSlide('mode', 'Mode', () => {});
options.addSlide('size', 'Room Size', () => {});
options.addSlide('time', 'Time Limit', () => {});
options.addSlide('speller', 'Your Speller', () => {});

/* The Spelling Bee is for five players: no Versus, no room of ten (renderModeSize). */
function renderModeSize() {
if (mode === 'mathbee') mode = 'multiplayer';      // the Math Bee was a mode once; it is a topic now
renderChoiceStep(options, 'mode', {
  title: 'How do you want to play?',
  subtitle: isBee() ? 'The Spelling Bee is held for five spellers.' : isMathBee() ? 'The Math Bee is held for five contestants.' : undefined,
  name: 'drill-mode',
  options: isMathBee() ? [
    { value: 'multiplayer', label: 'Classic', checked: mode !== 'cup', tip: 'One minute each at the pulpit; the most correct answers wins.' },
    { value: 'cup', label: 'Tournament', checked: mode === 'cup', tip: 'A qualifying minute for everyone at once, ranked in a table; then the top four race head to head, two at a time on the stage, the same questions, first to five, until the final.' },
  ] : isBee() ? [{ value: 'multiplayer', label: 'Multiplayer', checked: true }] : [
    { value: 'multiplayer', label: 'Multiplayer', checked: mode === 'multiplayer' },
    { value: 'versus', label: 'Versus', checked: mode === 'versus' },
  ],
  onPick: (v) => {
    mode = v;
    if (mode === 'versus' && roomAction === 'quickfill') roomAction = 'create';
    mem.save({ mode, roomAction });
    renderRoomEntry();
    roomCarousel.start('entry');
    codeInput.hidden = roomAction !== 'join';
    updateStartLabel();
    renderSizeStep();                              // a Math Bee is five players: the size step follows the mode
    if (mode === 'versus' && categoryValue === 'soroban') { flow.next(); return; }
    options.goTo(mode === 'versus' && !isAnyBee() ? 'time' : 'size');
  },
});
renderSizeStep();
}
function renderSizeStep() {
renderChoiceStep(options, 'size', {
  title: 'How many players?',
  name: 'drill-size',
  colorOffset: 2,
  options: isAnyBee() ? [{ value: '5', label: '5 players', checked: true }] : [
    { value: '5', label: '5 players', checked: roomSize === 5 },
    { value: '10', label: '10 players', checked: roomSize === 10 },
  ],
  onPick: (v) => {
    if (!isAnyBee()) { roomSize = Number(v); mem.save({ roomSize }); }
    // the Math Bee's minute is fixed: next, the speller
    if (isMathBee()) { renderBeeKidStep(); options.goTo('speller'); return; }
    if (categoryValue === 'soroban') { flow.next(); return; }   // the session's length comes from its sliders
    options.goTo('time');
  },
});
}
renderModeSize();
/* The round's length. Spelling picks a difficulty level instead: its pace, so
   its clock is the number of words times the level's seconds a word. */
function renderTimeStep() {
  if (categoryValue === 'spelling') {
    const words = wordsInSets(spellIds());
    renderChoiceStep(options, 'time', {
      title: 'Difficulty level',
      subtitle: isBee() ? 'How long each speller has at the microphone.' : `${words} words. The round ends sooner if you finish them.`,
      name: 'drill-spell-level',
      colorOffset: 4,
      options: LEVELS.map((l) => ({
        value: l.key, label: l.label, checked: spellLevel === l.key,
        tip: isBee() ? `${beeSeconds(l.key)} seconds for each word.` : `${perMinute(l.key)} words a minute: ${clockLabel(roundSeconds(spellIds(), l.key))}.`,
      })),
      // the Spelling Bee: next, choose your speller; otherwise this is the section's last step
      onPick: (v) => { spellLevel = levelOf(v).key; saveContent(); if (isBee()) { renderBeeKidStep(); options.goTo('speller'); } else flow.next(); },
    });
    return;
  }
  renderChoiceStep(options, 'time', {
    title: 'How long is the round?',
    name: 'drill-time',
    colorOffset: 4,
    options: [
      { value: '30', label: '30s', checked: timeLimit === 30 },
      { value: '60', label: '60s', checked: timeLimit === 60 },
      { value: '90', label: '90s', checked: timeLimit === 90 },
      { value: '120', label: '120s', checked: timeLimit === 120 },
    ],
    onPick: (v) => { timeLimit = Number(v); mem.save({ timeLimit }); flow.next(); }, // last step of this section
  });
}
renderTimeStep();

options.start('mode');

/* ── SECTION 4 — Room ─────────────────────────────────────── */
const roomCarousel = createCarousel(roomMount);
roomCarousel.addSlide('entry', 'Room', () => {});
roomCarousel.addSlide('code', 'Code', () => {});

function renderRoomEntry() {
  const choices =
    mode !== 'versus'
      ? [
          { value: 'quickfill', label: 'Quickfill', checked: roomAction === 'quickfill' },
          { value: 'create', label: 'Create', checked: roomAction === 'create' },
          { value: 'join', label: 'Join', checked: roomAction === 'join' },
        ]
      : [
          { value: 'create', label: 'Create', checked: roomAction === 'create' },
          { value: 'join', label: 'Join', checked: roomAction === 'join' },
        ];

  renderChoiceStep(roomCarousel, 'entry', {
    title: mode !== 'versus' ? 'How do you want to join?' : 'Create or join the 1v1?',
    name: 'drill-room-action',
    colorOffset: 2,
    options: choices,
    onPick: (v) => {
      roomAction = v;
      mem.save({ roomAction });
      codeInput.hidden = v !== 'join';
      updateStartLabel();
      if (v === 'join') roomCarousel.goTo('code');
    },
  });
}

renderCustomStep(roomCarousel, 'code', {
  title: 'Enter the room code',
  subtitle: 'The 6-character code your friend shared.',
  content: codeInput,
});

renderRoomEntry();
roomCarousel.start('entry');

/* ── One selector on screen at a time ───────────────────────── */
const opName = (o) => (OPERATION_LABELS[o] || o).split(' ').slice(1).join(' ') || o;
const flow = createSectionFlow([
  {
    el: $('drill-section-player'),
    chips: () => (isAnyBee() ? [{ label: `${myName()} as ${spellerOf(beeKid).call}`, face: spellerOf(beeKid).face }] : playerChips(myName(), avatarUrl(getAvatarSeed()))),
  },
  {
    el: $('drill-section-topic'),
    chips: () => {
      const cat = TOPIC_LABEL[categoryValue] || categoryValue;
      if (categoryValue === 'soroban') return [{ label: 'Soroban' }, { label: [...sorShow].map((v) => (v === 'tool' ? 'Tool' : 'Number')).join(' + ') }, { label: [...sorTests].map((v) => ({ simple: 'Simple', small: 'Small friends', big: 'Big friends' }[v])).join(', ') }, ...[...operations].map((o) => ({ label: OPERATION_LABELS[o] })), { label: `${sorCount} sums of ${Math.min(sorTerms, sorTermsMax())}, ${sorDigits} digit${sorDigits > 1 ? 's' : ''}` }];
      if (categoryValue === 'mathbee') return [{ label: 'Math Bee' }, ...[...mathTopics].map((t) => { const all = kindsIn(t), on = all.filter((op) => mathOps.has(op)).length; return { label: `${TOPIC_LABEL[t] || t}${on && on < all.length ? ` (${on} of ${all.length})` : ''}` }; })];
      // Tables (grid filler) recaps its two dials: size and blank density.
      if (categoryValue === 'timestable') {
        return [
          { label: 'Tables' },
          { label: '5×5' },
          { label: gridBlanks === 'heavy' ? 'Heavy' : 'Light' },
        ];
      }
      if (categoryValue === 'fracbars') {
        return [
          { label: 'Fraction Bars' },
          ...[...operations].map((o) => ({ label: opName(o) })),
          { label: barsLevel === 'advanced' ? 'Advanced' : 'Basic' },
        ];
      }
      // Chemistry's one operation IS the category — "Chemistry · Molecular
      // Mass · Inorganic" says it without repeating itself.
      if (categoryValue === 'chemistry') {
        return [
          { label: cat }, { label: opName('rmm') },
          ...[...compounds].map((k) => ({ label: COMPOUND_SET_LABELS[k] })),
        ];
      }
      const out = [{ label: cat }, ...[...operations].map((o) => ({ label: opName(o) }))];
      // Spelling has no number range (the words are the content), and its labels are words, not "+ Addition".
      if (categoryValue === 'spelling') {
        return [{ label: cat }, { label: BANKS[spellBank].label }, ...[...operations].map((o) => ({ label: OPERATION_LABELS[o] })), { label: `Sets ${setsLabel([...spellSets])}` }, ...(isBee() ? [] : [{ label: spellFocus ? 'Focus' : spellMaster ? 'Word Master' : 'Normal' }])];
      }
      if (categoryValue === 'fractions') out.push({ label: `${denominators.size} denominators` });
      else if (isNumbersMode()) out.push({ label: `${tables.size} numbers` });
      else {
        const r = RANGES.find((x) => x.key === range);
        out.push({ label: r ? r.label : range });
      }
      return out;
    },
  },
  {
    el: $('drill-section-options'),
    chips: () => isMathBee() ? [{ label: isMathCup() ? 'Tournament' : 'Math Bee' }, { label: '5 players' }, { label: isMathCup() ? 'Qualifier, then knockout' : '1 minute each' }, { label: (BEE_SPELLERS.find((k) => k.key === beeKid) || {}).name || 'Speller' }] : [...optionsChips({ mode: isBee() ? 'multiplayer' : mode, roomSize: isBee() ? BEE_SIZE : roomSize, timeLabel: isBee() ? `${levelOf(spellLevel).label} ${beeSeconds(spellLevel)}s a word` : categoryValue === 'spelling' ? `${levelOf(spellLevel).label} ${clockLabel(spellTime())}` : categoryValue === 'soroban' ? `${sorSpeed}s on, ${sorDelay}s gap` : `${timeLimit}s` }), ...(isBee() ? [{ label: (BEE_SPELLERS.find((k) => k.key === beeKid) || {}).name || 'Speller' }] : [])],
  },
  {
    el: $('drill-section-room'),
    chips: () => roomChips(roomAction),
  },
], {
  onChange: (_i, isLast) => { startBtn.hidden = !isLast; },
});

updateStartDisabled();
updateStartLabel();

// ── Avatar picker ────────────────────────────────────────────────────────
// Drawn faces plus the player's own photos, kept as a list they can pick
// between and delete from. Shared with every other game — same module, same
// storage, so one player wears one face everywhere.
mountAvatarPicker({
  grid: avatarGrid,
  uploadInput: avatarUploadInput,
  radioName: 'drill-avatar',
});

// ── Lobby ────────────────────────────────────────────────────────────────
// Each seat is its own small sticky note carrying an avatar — filled seats
// (you, then any other real joiners) pop in as playerCount changes; empty
// seats stay blank placeholders until either a real player or a bot claims
// them.
let lobbyRevealTimers = [];
function clearLobbyReveal() {
  lobbyRevealTimers.forEach((t) => clearTimeout(t));
  lobbyRevealTimers = [];
}

function seatSticker(i, avatarSeed, label, face = null) {
  const el = document.createElement('span');
  const empty = !avatarSeed && !face;
  el.className = `pp-sticky pp-sticky--tape pp-lobby-seat ${empty ? 'is-empty' : stickyColor(i)}`;
  el.innerHTML = empty
    ? '<span class="pp-lobby-seat-mark">?</span>'
    : face ? `<span class="pp-face" style="${face}"></span><span>${label}</span>`
      : `<img src="${avatarUrl(avatarSeed)}" alt="" loading="lazy" /><span>${label}</span>`;
  return el;
}
// the Spelling Bee: a sticker is the speller (their picture and name), not the profile avatar
const spellerOf = (key) => BEE_SPELLERS.find((k) => k.key === key) || BEE_SPELLERS[0];

function renderLobbySeats(playerCount, size) {
  lobbySeats.innerHTML = '';
  for (let i = 0; i < size; i++) {
    if (i === 0 && isAnyBee()) { const k = spellerOf(beeKid); lobbySeats.appendChild(seatSticker(i, null, myName(), k.face)); }
    else if (i === 0) lobbySeats.appendChild(seatSticker(i, getAvatarSeed(), 'You'));
    else if (i < playerCount) lobbySeats.appendChild(seatSticker(i, `Guest${i}`, 'Player'));
    else lobbySeats.appendChild(seatSticker(i, null));
  }
}

// Bots don't land all at once — they claim the remaining empty seats one at
// a time over `revealMs`, at randomized intervals, so the lobby reads like
// people actually trickling in rather than an instant bulk-fill.
function revealBotsStaggered(size, botsNeeded, seed, revealMs) {
  clearLobbyReveal();
  if (!botsNeeded) return;
  const realFilled = size - botsNeeded;
  const weights = Array.from({ length: botsNeeded }, () => 0.5 + Math.random());
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const budget = Math.max(300, revealMs - 150);
  let elapsed = 0;
  weights.forEach((w, i) => {
    elapsed += (w / weightSum) * budget;
    const seatIndex = realFilled + i;
    const timer = setTimeout(() => {
      const seatEl = lobbySeats.children[seatIndex];
      if (!seatEl) return;
      if (isAnyBee()) {                 // the child this bot will be in the hall
        const k = spellerOf(spellerPool(seed).filter((x) => x !== beeKid)[i]);
        seatEl.replaceWith(seatSticker(seatIndex, null, k.call, k.face));
        return;
      }
      const name = botName(seed, i);
      seatEl.replaceWith(seatSticker(seatIndex, name, name));
    }, elapsed);
    lobbyRevealTimers.push(timer);
  });
}

function showLobby(size) {
  cancelled = false;
  clearLobbyReveal();
  startNowFn = null;
  lobbyStartNow.hidden = true;
  lobbyStartNow.disabled = false;
  lobbyCode.hidden = true;
  lobbyStatus.textContent = 'Waiting for other players…';
  lobbyCount.textContent = `1 / ${size}`;
  renderLobbySeats(1, size);
  lobbyBd.classList.add('open');
  lobbyBd.setAttribute('aria-hidden', 'false');
  document.body.classList.add('drill-nav-hidden'); // game mode starts at the lobby
}
function hideLobby() {
  clearLobbyReveal();
  lobbyBd.classList.remove('open');
  lobbyBd.setAttribute('aria-hidden', 'true');
}
function showLobbyCode(code) {
  lobbyCode.hidden = false;
  lobbyCodeText.textContent = code;
}
lobbyCodeCopy.addEventListener('click', () => {
  const code = lobbyCodeText.textContent || '';
  if (!code || !navigator.clipboard) return;
  navigator.clipboard.writeText(code).then(() => {
    lobbyCodeCopy.textContent = 'Copied!';
    setTimeout(() => { lobbyCodeCopy.textContent = 'Copy'; }, 1500);
  }).catch(() => {}); // clipboard permission can be denied by the browser — the code is still visible to copy by hand
});

// Builds the room-entry roster shown during the "get ready" beat: you,
// other real players (names aren't known until the round-end read, so they
// show generically), and bots — who get real names, indistinguishable from
// a human opponent at a glance.
function buildRoster({ size, botsNeeded, seed }, myName) {
  const realOthers = Math.max(0, size - botsNeeded - 1);
  const roster = [{ name: myName, isSelf: true }];
  for (let i = 0; i < realOthers; i++) roster.push({ name: 'Player', isSelf: false });
  for (let i = 0; i < botsNeeded; i++) roster.push({ name: botName(seed, i), isSelf: false });
  return roster;
}

// ── Results ──────────────────────────────────────────────────────────────
// Reveals from last place up to the winner, one row at a time, for a bit of
// suspense — each row is its own sticky note (same component as the setup
// screen's selectors), and the winner's note is gold, upright and carries
// a trophy instead of a rank number.
/* `settled` is false while the room is still finishing. The board is painted
   live from the moment YOU submit — finishers ranked, everyone still playing
   shown as pending — so nobody watches a spinner wondering if it broke. Until
   it settles there is no winner, no trophy and no confetti: leading a race
   half the room hasn't finished isn't winning it. */
function renderResults(ranked, settled = true) {
  const repaint = resultsBd.classList.contains('open');
  // A Focus drop-out is handed in as -1 and does not make the board. If that
  // was you, the board says so above the others.
  const outSelf = ranked.some((r) => r.isSelf && !r.pending && r.score < 0);
  const shown = ranked.filter((r) => r.pending || r.score >= 0);
  renderLeaderboard(leaderboardEl, shown, {
    settled, repaint,
    compare: rankDrill,
    meta: (row) => (row.timeMs != null ? `in ${clockLabel(Math.round(row.timeMs / 1000))}` : null),
    pendingLabel: (s) => (s ? 'no score' : 'still playing…'),
    metaClass: 'pp-lb-pending',
  });
  if (outSelf) {
    const note = document.createElement('li');
    note.className = 'drill-out-note';
    note.textContent = 'You dropped out: in Focus mode one wrong letter ends your round, and you are left off the board.';
    leaderboardEl.prepend(note);
  }
  resultsBd.classList.add('open');
  resultsBd.setAttribute('aria-hidden', 'false');
  document.body.classList.add('drill-nav-hidden');
}
function hideResults() {
  resultsBd.classList.remove('open');
  resultsBd.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('drill-nav-hidden');
}

// ── Round orchestration (shared by all three matchmaking paths) ─────────
const isSpellingRoom = (room) => (room.operations || []).some((o) => /^spell/.test(o));
/* The Spelling Bee runs in its own hall (js/bee.js) and shows its own placings. It needs
   every real player's uid, so all devices seat them alike: read once from the room. */
async function playBee(room, myName, extra = {}) {
  const uid = auth.currentUser.uid;
  const want = Math.max(1, room.size - (room.botsNeeded || 0));
  let humans = [];
  for (let tries = 0; tries < 3; tries++) {
    try {
      const snap = await getDocs(collection(db, 'drillRooms', room.roomId, 'players'));
      humans = snap.docs.map((d) => ({ uid: d.id, name: (d.data().displayName || 'Player').slice(0, 20) }));
    } catch (e) { console.warn('[bee] could not read the players:', e); }
    if (humans.length >= want) break;
    await new Promise((r) => setTimeout(r, 700));
  }
  if (!humans.some((h) => h.uid === uid)) humans.push({ uid, name: myName });
  humans = humans.sort((a, b) => (a.uid < b.uid ? -1 : 1)).slice(0, room.size);
  await startBee({
    roomId: room.roomId, seed: room.seed, sets: room.tables, turnSeconds: room.timeLimit,
    humans, botsNeeded: Math.max(0, room.size - humans.length), me: { uid, name: myName, kid: beeKid }, ...extra,
  });
  startBtn.disabled = false;
}

async function playRoundAndShowResults(room, myName) {
  if ((room.operations || []).includes('spellBee')) { await playBee(room, myName); return; }
  if (room.activity === 'mathbee') { await playBee(room, myName, { mode: 'math', operations: room.operations }); return; }
  if (room.activity === 'mathcup') { await playBee(room, myName, { mode: 'math', operations: room.operations, cup: true }); return; }
  const roster = buildRoster(room, myName);
  // The ROOM decides which surface plays — a grid room predates nothing here,
  // but a joiner who came by code never touched this client's setup, so read it
  // off the room (mirrors the Grammar page's proofread/upgrade dispatch).
  const myScore = room.activity === 'grid'
    ? await startGridRound({
        seed: room.seed,
        timeLimit: room.timeLimit,
        startAt: room.startAt,
        blanks: room.gridBlanks,
        roster,
      })
    : room.activity === 'soroban'
    ? await startSorobanRound({
        seed: room.seed,
        timeLimit: room.timeLimit,
        startAt: room.startAt,
        cfg: room.soroban,
        operations: room.operations,
        roster,
      })
    : room.activity === 'bars'
    ? await startBarsRound({
        seed: room.seed,
        timeLimit: room.timeLimit,
        startAt: room.startAt,
        operations: room.operations,
        level: room.barsLevel,
        roster,
      })
    : await startRound({
        seed: room.seed,
        timeLimit: room.timeLimit,
        startAt: room.startAt,
        operations: room.operations,
        tables: room.tables,
        fractionTypes: room.fractionTypes,
        compounds: room.compounds,
        roster,
        // Word Master is this player's own choice; Focus is the room's rule.
        master: isSpellingRoom(room) && !room.spellFocus && spellMaster,
        focus: isSpellingRoom(room) && !!room.spellFocus,
      });
  const spelling = isSpellingRoom(room);
  // The score is handed in now (so the room's board is never held up); this
  // player's own results wait until Word Master is done.
  let mastered = false;
  let liveRows = null;
  const masterP = spelling ? masterFinished() : Promise.resolve();
  masterP.then(() => { mastered = true; });

  let ranked;
  const board = (async () => { try { return await finishRound({
      roomId: room.roomId,
      seed: room.seed,
      timeLimit: room.timeLimit,
      // Ranking waits for the ROUND's clock, not for our own submit — see
      // deadlineFor() in /utils/games/leaderboard.js.
      startAt: room.startAt,
      botsNeeded: room.botsNeeded,
      // A bot's pace depends on what the room is drilling — see js/bots.js.
      // Read off the ROOM, so a joiner scores the host's bots the same way.
      operations: room.operations,
      // Grid rooms score bots on cells filled (a cell is a times-table
      // product), bars rooms on sums lined up — leaderboard.js branches on
      // activity.
      activity: room.activity,
      gridBlanks: room.gridBlanks,
      // Spelling bots work through the room's own word list, at its pace.
      tables: room.tables,
      spellFocus: !!room.spellFocus,
      // Spelling ranks words right, then time: how long this player took.
      myMetrics: spelling ? { timeMs: lastRoundTimeMs() } : room.activity === 'soroban' ? { timeMs: lastSorobanTimeMs() } : undefined,
      soroban: room.soroban,
      // The board goes up straight away and fills in as the room finishes,
      // instead of holding everyone behind the awaiting overlay.
      onUpdate: (rows) => {
        liveRows = rows;
        if (!mastered) return;      // still mastering words: the board waits
        hideAwaiting();
        // Same avatar override the settled board applies, or your own face
        // would swap out from under you when the last player lands.
        const me = rows.find((r) => r.isSelf);
        if (me) me.avatarSeed = getAvatarSeed();
        renderResults(rows, false);
      },
      myScore,
    }); } catch (e) {
      // Silent here meant a broken leaderboard looked like a working one.
      console.error('[drills] finishRound failed — showing a local-only board:', e);
      return [{ name: myName, score: myScore, isBot: false, isSelf: true, avatarSeed: getAvatarSeed() }];
    } })();
  await masterP;
  // The round overlay just closed but the leaderboard read (grace delay +
  // one getDocs) hasn't landed yet — show a small "tallying" modal instead
  // of letting the bare setup page show through in between.
  showAwaiting();
  if (liveRows) {
    hideAwaiting();
    const me = liveRows.find((r) => r.isSelf);
    if (me) me.avatarSeed = getAvatarSeed();
    renderResults(liveRows, false);
  }
  ranked = await board;
  // Show the player's own chosen avatar on the leaderboard, not the
  // uid-derived one leaderboard.js falls back to.
  const selfRow = ranked.find((r) => r.isSelf);
  if (selfRow) selfRow.avatarSeed = getAvatarSeed();

  hideAwaiting();

  startBtn.disabled = false;
  renderResults(ranked);
}

// Shared onWaiting handler for every matchmaking path: updates the count +
// seat stickers while real players trickle in, then hands off to the
// staggered bot reveal the instant the room activates.
function makeOnWaiting(waitingStatusText) {
  return (state) => {
    if (state.phase === 'activated') {
      startNowFn = null;
      lobbyStartNow.hidden = true;
      lobbyStatus.textContent = 'Room ready!';
      lobbyCount.textContent = `${state.size} / ${state.size}`;
      revealBotsStaggered(state.size, state.botsNeeded, state.seed, state.revealMs);
      return;
    }
    if (waitingStatusText) lobbyStatus.textContent = waitingStatusText;
    lobbyCount.textContent = `${state.playerCount} / ${state.size}`;
    renderLobbySeats(state.playerCount, state.size);
    // Only the host is handed a startNow, and only once a real second player is
    // here — no point offering "start now" for a room that's just you and bots
    // (the wait fills those seats anyway). The empty seats become bots on click.
    startNowFn = state.startNow || null;
    lobbyStartNow.hidden = !(startNowFn && state.playerCount >= 2 && state.playerCount < state.size);
  };
}

async function runMultiplayer({ timeLimit, operationsList, tablesList, fractionTypesList, compoundsList, myName }) {
  const size = isAnyBee() ? BEE_SIZE : roomSize;     // a Spelling Bee is for five
  showLobby(size);
  let room;
  try {
    room = await matchmake(
      { mode: 'multiplayer', size, timeLimit, operations: operationsList, tables: tablesList, fractionTypes: fractionTypesList, compounds: compoundsList, activity: gameActivity(), ...sorobanRoom(), gridBlanks, barsLevel, spellFocus: categoryValue === 'spelling' && spellFocus && !isBee(), displayName: myName },
      { onWaiting: makeOnWaiting() },
    );
  } catch (e) {
    hideLobby();
    startBtn.disabled = false;
    alert(e && e.quotaBlocked ? e.message : "Couldn't start a room — please try again.");
    return;
  }
  if (cancelled) return;
  hideLobby();
  await playRoundAndShowResults(room, myName);
}

async function runMultiplayerCreate({ timeLimit, operationsList, tablesList, fractionTypesList, compoundsList, myName }) {
  const size = isAnyBee() ? BEE_SIZE : roomSize;     // a Spelling Bee is for five
  showLobby(size);
  lobbyStatus.textContent = 'Creating your room…';
  let created;
  try {
    created = await createCodeRoom(
      { mode: 'multiplayer', size, timeLimit, operations: operationsList, tables: tablesList, fractionTypes: fractionTypesList, compounds: compoundsList, activity: gameActivity(), ...sorobanRoom(), gridBlanks, barsLevel, spellFocus: categoryValue === 'spelling' && spellFocus && !isBee(), displayName: myName },
      { onWaiting: makeOnWaiting('Waiting for other players…') },
    );
  } catch (e) {
    hideLobby();
    startBtn.disabled = false;
    alert(e && e.quotaBlocked ? e.message : "Couldn't create a room — please try again.");
    return;
  }
  showLobbyCode(created.code);

  let room;
  try {
    room = await created.roundReady;
  } catch (e) {
    hideLobby();
    startBtn.disabled = false;
    alert('Something went wrong waiting for other players — please try again.');
    return;
  }
  if (cancelled) return;
  hideLobby();
  await playRoundAndShowResults(room, myName);
}

// Joining is the same act however you got here — Versus, Multiplayer or the
// quick-join box at the top of the page. You bring a code; the host's room
// brings everything else. `fallbackSize` only sizes the lobby's empty seats
// until the room's real size arrives with the first snapshot.
async function joinWithCode(code, fallbackSize, myName) {
  if (code.length !== 6) {
    alert('Enter the 6-character room code your friend shared.');
    startBtn.disabled = false;
    return;
  }
  showLobby(fallbackSize);
  lobbyStatus.textContent = 'Joining room…';
  let room;
  try {
    room = await joinRoomByCode(code, {
      displayName: myName,
      onWaiting: makeOnWaiting('Waiting for the round to start…'),
    });
  } catch (e) {
    hideLobby();
    startBtn.disabled = false;
    alert((e && e.message) || "Couldn't join that room.");
    return;
  }
  if (cancelled) return;
  hideLobby();
  await playRoundAndShowResults(room, myName);
}

const codeFromInput = () => (codeInput.value || '').trim().toUpperCase();

async function runMultiplayerJoin({ myName }) {
  await joinWithCode(codeFromInput(), roomSize, myName);
}

async function runVersusCreate({ timeLimit, operationsList, tablesList, fractionTypesList, compoundsList, myName }) {
  showLobby(2);
  lobbyStatus.textContent = 'Creating your room…';
  let created;
  try {
    created = await createCodeRoom(
      { mode: 'versus', size: 2, timeLimit, operations: operationsList, tables: tablesList, fractionTypes: fractionTypesList, compounds: compoundsList, activity: gameActivity(), ...sorobanRoom(), gridBlanks, barsLevel, spellFocus: categoryValue === 'spelling' && spellFocus && !isBee(), displayName: myName },
      { onWaiting: makeOnWaiting('Waiting for your opponent…') },
    );
  } catch (e) {
    hideLobby();
    startBtn.disabled = false;
    alert(e && e.quotaBlocked ? e.message : "Couldn't create a room — please try again.");
    return;
  }
  showLobbyCode(created.code);

  let room;
  try {
    room = await created.roundReady;
  } catch (e) {
    hideLobby();
    startBtn.disabled = false;
    alert("Something went wrong waiting for your opponent — please try again.");
    return;
  }
  if (cancelled) return;
  hideLobby();
  await playRoundAndShowResults(room, myName);
}

async function runVersusJoin({ myName }) {
  await joinWithCode(codeFromInput(), 2, myName);
}

async function runDrill() {
  // the Spelling Bee is held on the whole screen; a browser allows that only inside this tap
  if (isAnyBee()) beeFullscreen();
  startBtn.disabled = true;
  // The setup is proven good the moment a round starts with it — next visit
  // jumps straight to the last section with these picks as chips.
  saveContent();
  mem.save({ done: true });
  await getCurrentUser();

  const operationsList = [...operations];
  const tablesList = getTablesPool(); // for Fractions this IS the denominator set
  const fractionTypesList = categoryValue === 'fractions' ? [...fractionTypes] : [];
  const compoundsList = categoryValue === 'chemistry' ? [...compounds] : [];
  const myName = (nameInput.value || '').trim() || auth.currentUser.displayName || 'Player';
  // Spelling's clock is the words' own (10 a minute, 20 in Focus), not the chosen time.
  const roundTime = isBee() ? beeSeconds(spellLevel) : isMathBee() ? 60 : categoryValue === 'soroban' ? sessionSeconds(sorobanCfg()) : categoryValue === 'spelling' ? spellTime() : timeLimit;

  if (mode === 'versus' && !isBee()) {
    if (roomAction === 'join') await runVersusJoin({ timeLimit: roundTime, myName });
    else await runVersusCreate({ timeLimit: roundTime, operationsList, tablesList, fractionTypesList, compoundsList, myName });
    return;
  }

  if (roomAction === 'join') await runMultiplayerJoin({ timeLimit: roundTime, myName });
  else if (roomAction === 'create') await runMultiplayerCreate({ timeLimit: roundTime, operationsList, tablesList, fractionTypesList, compoundsList, myName });
  else await runMultiplayer({ timeLimit: roundTime, operationsList, tablesList, fractionTypesList, compoundsList, myName });
}

startBtn.addEventListener('click', runDrill);

/* ── Quick join ─────────────────────────────────────────────────
   Somebody arriving with a friend's code has nothing to set up: the room's
   content, size and clock all come from the host, and every answer they'd give
   in the sections below would be thrown away. So the code box sits at the top
   of the page and goes straight to the lobby, wearing the name and avatar from
   the last game they played. */
const quickJoinInput = $('drill-quickjoin-input');
const quickJoinBtn = $('drill-quickjoin-btn');

quickJoinInput.addEventListener('input', () => {
  quickJoinInput.value = quickJoinInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
});
quickJoinInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); quickJoinBtn.click(); }
});
quickJoinBtn.addEventListener('click', async () => {
  const code = quickJoinInput.value.trim();
  if (code.length !== 6) { quickJoinInput.focus(); return; }
  quickJoinBtn.disabled = true;
  startBtn.disabled = true;
  await getCurrentUser();
  await joinWithCode(code, 2, myName()); // 2 only seeds the lobby; the room's real size arrives with it
  quickJoinBtn.disabled = false;
});
lobbyStartNow.addEventListener('click', () => {
  if (!startNowFn) return;
  lobbyStartNow.disabled = true;
  lobbyStartNow.hidden = true;
  lobbyStatus.textContent = 'Starting…';
  startNowFn(); // promotes the room now; the onSnapshot picks up 'active' and plays
});
lobbyCancel.addEventListener('click', () => {
  // v1 doesn't retract the Firestore join/room-create on cancel — the
  // abandon-fallback timers on other clients (or a solo bot-fill) resolve
  // an orphaned room naturally, and unread docs aren't billed.
  cancelled = true;
  hideLobby();
  document.body.classList.remove('drill-nav-hidden'); // back out of game mode
  startBtn.disabled = false;
});
againBtn.addEventListener('click', hideResults);

// Preselect mode from nav links like ?mode=versus
const initialMode = new URLSearchParams(location.search).get('mode');
if (initialMode === 'versus') {
  mode = 'versus';
  if (roomAction === 'quickfill') roomAction = 'create'; // Versus has no Quick Fill
  renderRoomEntry();
  updateStartLabel();
}

// A returning player's whole setup is already restored — skip the wizard and
// land on the final section, previous picks shown as chips (tap any to change).
if (mem.isReturning()) {
  codeInput.hidden = roomAction !== 'join';
  flow.goTo(3);
}
