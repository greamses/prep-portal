/* ═══════════════════════════════════════════════════════════════════════
   Author "animation steps" for the SAT math bank — BY HAND, no AI.

   Each entry below was solved and verified manually. `steps` is an ordered
   list of standalone LaTeX states (morph-ready: consecutive states differ by
   a single algebraic move). Some auto-generated questions had a wrong answer
   key, an answer value missing from the options, or a broken stem; those are
   corrected here via `answer` / `choices` / `question` overrides. Every change
   is logged when the script runs.

   This REPLACES the old AI precompute approach (precompute-sat-steps.js, now
   deleted). Steps are baked onto bank.math[i].steps so the Watch-solution
   animation is instant and needs no per-learner AI call. solution-steps.js
   short-circuits to it.q.steps when present.

   Usage (from repo root):
     node server/scripts/author-sat-steps.js          # apply first 100
     node server/scripts/author-sat-steps.js --check   # validate only, no write
   ═══════════════════════════════════════════════════════════════════════ */

'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const MATH_DIR = path.join(ROOT, 'exam-archive', 'international', 'sat', 'math');
const CHECK_ONLY = process.argv.includes('--check');

// ── Authored data, keyed by index into bank.math (ids are NOT unique) ──────
// steps : morph-ready LaTeX chain ([] => prose-reveal fallback in animator)
// answer: override correct_answer letter (only when the key was wrong)
// choices: override specific option values (only when the true value was absent)
// question: override stem (only when the stem was mathematically broken)
const DATA = {
  0:  { steps: ['f(x) = 3000(1 - 0.02)^x', 'f(x) = 3000(0.98)^x'] },
  1:  { steps: ['x_1 + x_2 = -\\frac{b}{a}', 'x_1 + x_2 = -\\frac{2}{1}', 'x_1 + x_2 = -2'] },
  2:  { steps: ['x - 1 = 0', 'x = 1'] },
  3:  { steps: ['a = 60 - 20', 'a = 40'] },
  4:  { steps: ['A = 12 \\times 5', 'A = 60'] },
  5:  { steps: ['f(\\sqrt{3}) = \\frac{1}{(\\sqrt{3})^2 + 1}', 'f(\\sqrt{3}) = \\frac{1}{3 + 1}', 'f(\\sqrt{3}) = \\frac{1}{4}'] },
  6:  { steps: ['(x+3)^2 + (y-1)^2 = 5^2', '(x+3)^2 + (y-1)^2 = 25'] },
  7:  { steps: ['d = \\sqrt{5^2 - 4^2}', 'd = \\sqrt{25 - 16}', 'd = \\sqrt{9}', 'd = 3'] },
  8:  { steps: ['s^2 + s^2 = 20', '2s^2 = 20', 's^2 = 10', 'A = 10'] },
  9:  { steps: ['(2x+1)(3x-5)', '6x^2 - 10x + 3x - 5', '6x^2 - 7x - 5'] },
  10: { steps: ['x^2 - 2x - 8 = 0', '(x-4)(x+2) = 0', 'x - 4 = 0', 'x = 4'] },
  11: { steps: ['3x + 2y = 10', 'x - 2y = 2', '4x = 12', 'x = 3'] },
  12: { steps: ['f(2) = 3(2)^2 - 2(2) + 1', 'f(2) = 12 - 4 + 1', 'f(2) = 9'] },
  13: { steps: ['s = 2 \\times 5', 's = 10', 'A = 10^2', 'A = 100'] },
  14: { steps: ['m = \\frac{10 - 4}{6 - 2}', 'm = \\frac{6}{4}', 'm = \\frac{3}{2}'] },
  15: { steps: ['x - 2 = 0', 'x = 2'] },
  // [16] f(2)=4 -> option A, NOT C
  16: { steps: ['f(2) = 3(2)^2 - 5(2) + 2', 'f(2) = 12 - 10 + 2', 'f(2) = 4'], answer: 'A' },
  17: { steps: ['s = 2 \\times 5', 's = 10', 'A = 10^2', 'A = 100'] },
  18: { steps: ['x = \\frac{6}{2}', 'x = 3', 'y = (3)^2 - 6(3) + 5', 'y = 9 - 18 + 5', 'y = -4'] },
  19: { steps: ['2x + 3y = 12', '3x - 3y = 3', '5x = 15', 'x = 3'] },
  20: { steps: ['\\frac{x^2 - 4}{x^2 + 4x + 4}', '\\frac{(x-2)(x+2)}{(x+2)(x+2)}', '\\frac{x-2}{x+2}'] },
  21: { steps: ['x_1 + x_2 = -\\frac{-5}{1}', 'x_1 + x_2 = 5'] },
  22: { steps: ['C = 2 \\times 3.14 \\times 5', 'C = 31.4'] },
  23: { steps: ['d = 0.30 \\times 120', 'd = 36'] },
  24: { steps: ['(x-2)^2 + (y-4)^2 = 3^2', '(x-2)^2 + (y-4)^2 = 9'] },
  25: { steps: ['2x + 3 = 11', '2x = 11 - 3', '2x = 8', 'x = \\frac{8}{2}', 'x = 4'] },
  26: { steps: ['r = 100 - 25 - 30', 'r = 45'] },
  // [27] f(f(3))=-1 -> option A, NOT C
  27: { steps: ['f(3) = \\frac{1}{3 - 2}', 'f(3) = 1', 'f(1) = \\frac{1}{1 - 2}', 'f(1) = -1'], answer: 'A' },
  // [28] f(-2)=-3, not present in options -> set option A to the true value
  28: { steps: ['f(-2) = 2(-2)^2 + 3(-2) - 5', 'f(-2) = 8 - 6 - 5', 'f(-2) = -3'], choices: { A: '-3' }, answer: 'A' },
  29: { steps: ['c = 6 \\times 3', 'c = 18'] },
  30: { steps: ['x - 2 = 0', 'x = 2'] },
  31: { steps: ['x - 2 = 0', 'x = 2'] },
  // [32] broken system (gave x=4.5). Fix constant 17->15 so x=4 matches key C.
  32: { steps: ['3x + 2y = 15', 'x - 2y = 1', '4x = 16', 'x = 4'], question: 'If $3x + 2y = 15$ and $x - 2y = 1$, what is the value of $x$?' },
  33: { steps: ['x^2 + \\frac{1}{x^2} = (x + \\frac{1}{x})^2 - 2', 'x^2 + \\frac{1}{x^2} = 3^2 - 2', 'x^2 + \\frac{1}{x^2} = 9 - 2', 'x^2 + \\frac{1}{x^2} = 7'] },
  // [34] f(-2)=15, not present in options -> set option D to the true value
  34: { steps: ['f(-2) = 2(-2)^2 - 3(-2) + 1', 'f(-2) = 8 + 6 + 1', 'f(-2) = 15'], choices: { D: '15' } },
  35: { steps: ['x - 2 = 0', 'x = 2'] },
  36: { steps: [] },
  37: { steps: ['x - 3 = 0', 'x = 3'] },
  // [38] d = 3*sqrt(3) -> option B, NOT A
  38: { steps: ['d = \\sqrt{6^2 - 3^2}', 'd = \\sqrt{36 - 9}', 'd = \\sqrt{27}', 'd = 3\\sqrt{3}'], answer: 'B' },
  39: { steps: ['d = \\sqrt{5^2 - 4^2}', 'd = \\sqrt{25 - 16}', 'd = \\sqrt{9}', 'd = 3'] },
  40: { steps: ['A = \\frac{72}{360} \\times \\pi \\times 5^2', 'A = \\frac{1}{5} \\times 25\\pi', 'A = 5\\pi'] },
  41: { steps: ['2x + 3y = 12', '3x - 3y = 3', '5x = 15', 'x = 3'] },
  42: { steps: ['c = \\sqrt{5^2 + 12^2}', 'c = \\sqrt{25 + 144}', 'c = \\sqrt{169}', 'c = 13'] },
  43: { steps: ['C = 2\\pi(5)', 'C = 10\\pi'] },
  44: { steps: ['3x + 2y = 10', 'x - 2y = 6', '4x = 16', 'x = 4'] },
  45: { steps: ['x + 5 = 12', 'x = 12 - 5', 'x = 7'] },
  46: { steps: ['5^2 + 12^2 = 13^2', '25 + 144 = 169', '169 = 169'] },
  47: { steps: ['s = 2 \\times 5', 's = 10', 'A = 10^2', 'A = 100'] },
  48: { steps: ['8\\sqrt{x} = 48', '\\sqrt{x} = 6', 'x = 36'] },
  49: { steps: ['x_1 + x_2 = -\\frac{-2}{1}', 'x_1 + x_2 = 2'] },
  50: { steps: ['x + 2y = 10', 'x - 2y = 6', '2x = 16', 'x = 8'] },
  51: { steps: ['a = 60 - 10', 'a = 50'] },
  52: { steps: ['s = \\sqrt{64}', 's = 8', 'r = 4', 'A = \\pi(4)^2', 'A = 16\\pi'] },
  53: { steps: ['A = 12 \\times 5', 'A = 60'] },
  // [54] original (Law of Sines) had no clean/listed answer. Rewrite as a clean
  // 30-60-90 right triangle so AC = 10*sqrt(3) matches key D.
  54: { steps: ['\\tan(30^\\circ) = \\frac{10}{AC}', 'AC = \\frac{10}{\\tan(30^\\circ)}', 'AC = 10\\sqrt{3}'],
        question: 'In right triangle $ABC$, angle $C = 90^\\circ$, angle $A = 30^\\circ$, and side $BC = 10$. What is the length of side $AC$?' },
  // [55] x = -11 -> option A, NOT D
  55: { steps: ['\\frac{x-5}{x+3} = 2', 'x - 5 = 2(x + 3)', 'x - 5 = 2x + 6', '-11 = x', 'x = -11'], answer: 'A' },
  // [56] neither = 50 -> option B, NOT A
  56: { steps: ['n = 200 - (120 + 80 - 50)', 'n = 200 - 150', 'n = 50'], answer: 'B' },
  57: { steps: ['\\frac{3}{2} = \\frac{45}{p}', '3p = 90', 'p = 30'] },
  58: { steps: ['A = \\pi(6)^2', 'A = 36\\pi'] },
  59: { steps: ['2\\pi r = 10\\pi', 'r = 5', 'A = \\pi(5)^2', 'A = 25\\pi'] },
  // [60] neither = 50 -> option C, NOT A
  60: { steps: ['n = 200 - (120 + 80 - 50)', 'n = 200 - 150', 'n = 50'], answer: 'C' },
  // [61] f(2)=9 -> option A, NOT C
  61: { steps: ['f(2) = 3(2)^2 - 2(2) + 1', 'f(2) = 12 - 4 + 1', 'f(2) = 9'], answer: 'A' },
  62: { steps: ['p = 60 - 20', 'p = 40'] },
  // [63] total = 7.50 -> option B, NOT C
  63: { steps: ['t = 3(1.25) + 5(0.75)', 't = 3.75 + 3.75', 't = 7.50'], answer: 'B' },
  64: { steps: ['A = 3.14 \\times 5^2', 'A = 3.14 \\times 25', 'A = 78.5'] },
  65: { steps: ['\\frac{x}{2} + 3 = 5', '\\frac{x}{2} = 2', 'x = 4'] },
  // [66] original cross-multiplied to x^2-x+3=0 (no real root). Rewrite to a
  // clean rational equation whose solution is x=3 (matches key D).
  66: { steps: ['\\frac{2x}{x-1} = 3', '2x = 3(x - 1)', '2x = 3x - 3', '3 = x', 'x = 3'],
        question: 'What is the value of $x$ in the equation $\\frac{2x}{x-1} = 3$?' },
  // [67] broken system (gave x=3.8). Fix second eq x-y=1 -> x-y=4 so x=5 (key C).
  67: { steps: ['3x + 2y = 17', '2x - 2y = 8', '5x = 25', 'x = 5'], question: 'If $3x + 2y = 17$ and $x - y = 4$, what is the value of $x$?' },
  // [68] sum of roots = -2 -> option A, NOT B
  68: { steps: ['x_1 + x_2 = -\\frac{4}{2}', 'x_1 + x_2 = -2'], answer: 'A' },
  69: { steps: ['C = 2\\pi(5)', 'C = 10\\pi'] },
  70: { steps: ['x - 2 = 0', 'x = 2'] },
  71: { steps: ['p = \\frac{200 - 120}{200}', 'p = \\frac{80}{200}', 'p = 40\\%'] },
  // [72] broken system (gave x=4.6). Fix constant 17->19 so x=5 (key C).
  72: { steps: ['2x + 3y = 19', '3x - 3y = 6', '5x = 25', 'x = 5'], question: 'If $2x+3y=19$ and $x-y=2$, what is the value of $x$?' },
  73: { steps: [] },
  74: { steps: ['x - 2 = 0', 'x = 2'] },
  75: { steps: ['x - 2 = 0', 'x = 2'] },
  // [76] only apples = 40 -> option B, NOT A
  76: { steps: ['a = 60 - 20', 'a = 40'], answer: 'B' },
  77: { steps: ['(x-1)^2 + (y-2)^2 = 3^2', '(x-1)^2 + (y-2)^2 = 9'] },
  78: { steps: ['(x+1)^2 = 0', 'x + 1 = 0', '(x+1)^3 = 0^3', '(x+1)^3 = 0'] },
  79: { steps: ['A = \\pi(5)^2', 'A = 25\\pi'] },
  // [80] broken system (gave y=-2/3). Fix first eq x=2y+3 -> x=2y-2 so y=1 (key B).
  80: { steps: ['y = -x + 1', 'y = -(2y - 2) + 1', '3y = 3', 'y = 1'], question: 'If $x = 2y - 2$ and $y = -x + 1$, what is the value of $y$?' },
  81: { steps: ['a = 10 \\times \\sin(30^\\circ)', 'a = 10 \\times \\frac{1}{2}', 'a = 5'] },
  82: { steps: ['r = \\frac{8}{2}', 'r = 4', 'A = \\pi(4)^2', 'A = 16\\pi'] },
  83: { steps: ['a = 10 \\times \\sin(30^\\circ)', 'a = 10 \\times \\frac{1}{2}', 'a = 5'] },
  // [84] f(2)=0 -> option B, NOT D
  84: { steps: ['f(2) = (2)^2 + 3(2) - 10', 'f(2) = 4 + 6 - 10', 'f(2) = 0'], answer: 'B' },
  85: { steps: ['t = 2(3) + 1.50(2)', 't = 6 + 3', 't = 9'] },
  86: { steps: ['c = \\sqrt{5^2 + 12^2}', 'c = \\sqrt{25 + 144}', 'c = \\sqrt{169}', 'c = 13'] },
  87: { steps: ['a = 10 \\times \\sin(30^\\circ)', 'a = 10 \\times \\frac{1}{2}', 'a = 5'] },
  // [88] neither = 60 -> option C, NOT B
  88: { steps: ['n = 200 - (120 + 80 - 60)', 'n = 200 - 140', 'n = 60'], answer: 'C' },
  89: { steps: ['c = 3.50 - 0.75', 'c = 2.75'] },
  // [90] area = 30 -> option A, NOT C
  90: { steps: ['b = \\sqrt{13^2 - 5^2}', 'b = \\sqrt{169 - 25}', 'b = 12', 'A = \\frac{1}{2}(5)(12)', 'A = 30'], answer: 'A' },
  // [91] neither = 15 -> option B, NOT C
  91: { steps: ['n = 100 - (60 + 40 - 15)', 'n = 100 - 85', 'n = 15'], answer: 'B' },
  92: { steps: ['a = 10 \\times \\sin(30^\\circ)', 'a = 10 \\times \\frac{1}{2}', 'a = 5'] },
  // [93] stem said "seven" but listed six values. Fix to a clean 7-value set whose median is 3 (key B).
  93: { steps: [], question: 'What is the median of the seven data values shown? 2, 2, 3, 3, 4, 4, 11' },
  94: { steps: ['s = 2 \\times 5', 's = 10', 'A = 10^2', 'A = 100'] },
  95: { steps: ['3x - 2y = 11', 'x + 2y = 5', '4x = 16', 'x = 4'] },
  // [96] broken system (gave x=2.4). Fix constant 10->8 so x=2 (key B).
  96: { steps: ['3x + 2y = 8', '2x - 2y = 2', '5x = 10', 'x = 2'], question: 'If $3x + 2y = 8$ and $x - y = 1$, what is the value of $x$?' },
  97: { steps: ['3x - 2y = 10', 'x + 2y = 2', '4x = 12', 'x = 3'] },
  98: { steps: ['q = \\frac{60}{100} \\times 300', 'q = 0.6 \\times 300', 'q = 180'] },
  // [99] area = 1/2 -> option B, NOT A
  99: { steps: ['A = \\frac{1}{2} \\times 1 \\times 1', 'A = \\frac{1}{2}'], answer: 'B' },
};

// ── validate a step string the same way solution-steps.js does ─────────────
function hasCtrl(s) { for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) < 32) return true; return false; }
function validState(s) {
  if (typeof s !== 'string') return false;
  s = s.trim();
  if (!s || s.length > 140) return false;
  if (hasCtrl(s)) return false;
  if (/\\text|\\begin|\\end|[$]/.test(s)) return false;
  if (/[A-Za-z]{5,}/.test(s.replace(/\\[a-zA-Z]+/g, ''))) return false;
  return /[0-9=]/.test(s);
}

(function main() {
  // Load all domain files and build a lookup keyed by original flat index (_idx).
  const domainFiles = fs.readdirSync(MATH_DIR).filter(f => f.endsWith('.json')).sort();
  const fileArrays = {};
  domainFiles.forEach(f => {
    fileArrays[f] = JSON.parse(fs.readFileSync(path.join(MATH_DIR, f), 'utf8'));
  });
  const byIdx = {};
  Object.values(fileArrays).forEach(arr => arr.forEach(it => { byIdx[it._idx] = it; }));

  const log = [];
  let problems = 0;

  Object.keys(DATA).forEach((k) => {
    const i = parseInt(k, 10);
    const rec = DATA[k];
    const it = byIdx[i];
    if (!it) { console.error(`! no math item at index ${i}`); problems++; return; }
    const q = it.question || (it.question = {});

    // 1. apply stem / option / answer overrides
    if (rec.question) { q.question = rec.question; log.push(`[${i}] stem rewritten`); }
    if (rec.choices) {
      Object.entries(rec.choices).forEach(([letter, val]) => {
        log.push(`[${i}] option ${letter}: "${q.choices[letter]}" -> "${val}"`);
        q.choices[letter] = val;
      });
    }
    if (rec.answer && rec.answer !== q.correct_answer) {
      log.push(`[${i}] answer key: ${q.correct_answer} -> ${rec.answer}`);
      q.correct_answer = rec.answer;
    }

    // 2. validate steps
    const steps = Array.isArray(rec.steps) ? rec.steps : [];
    steps.forEach((s) => { if (!validState(s)) { console.error(`! [${i}] invalid step: ${JSON.stringify(s)}`); problems++; } });
    it.steps = steps;

    // 3. verify the key points at a real option
    if (!q.choices || !(q.correct_answer in q.choices)) {
      console.error(`! [${i}] correct_answer ${q.correct_answer} not in choices`); problems++;
    }
  });

  console.log('── changes ──');
  log.forEach((l) => console.log('  ' + l));
  const withSteps = Object.values(DATA).filter((r) => (r.steps || []).length >= 2).length;
  const emptySteps = Object.keys(DATA).length - withSteps;
  console.log(`\nAuthored ${Object.keys(DATA).length} items · ${withSteps} with morph steps · ${emptySteps} prose-fallback · ${log.length} corrections · ${problems} problems`);

  if (problems) { console.error('\nABORT: fix problems above before writing.'); process.exit(1); }
  if (CHECK_ONLY) { console.log('\n--check: no file written.'); return; }
  domainFiles.forEach(f => {
    fs.writeFileSync(path.join(MATH_DIR, f), JSON.stringify(fileArrays[f]));
  });
  console.log('\nMath domain files written to', path.relative(ROOT, MATH_DIR));
})();
