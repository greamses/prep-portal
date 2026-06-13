// mathPlugins.js — Built-in question plugins.
//
// QuestionPlugin interface
// ────────────────────────
//   id          string  — unique key (matches dd-math-concept values)
//   label       string  — display name in settings dropdown
//   popupLabel  string  — heading shown inside the question popup
//
//   generate(sq)         → rawQuestion   stored verbatim in FRAC[sq]
//   renderHTML(raw)      → html string   injected into #popupEq (no button — engine adds it)
//   checkAnswer(raw)     → { isCorrect, bonusEligible, penaltyMessage }
//   cpuFill(raw)         — writes correct answer into DOM inputs
//
// Input conventions
//   All answer inputs use class="frac-input" so the numpad works automatically.
//   ID names per plugin are documented next to each plugin.

// ─── Shared helpers ────────────────────────────────────────────────────────────

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) { const t = b;
    b = a % b;
    a = t; }
  return a;
}

/** Read integer from a .frac-input div, or NaN if empty. */
function getVal(id) {
  const el = document.getElementById(id);
  return (el && el.textContent.trim() !== '') ? parseInt(el.textContent.trim(), 10) : NaN;
}

/** Write value into a .frac-input div. */
function setVal(id, v) {
  const el = document.getElementById(id);
  if (el) el.textContent = String(v);
}

function inputBox(id, large = false) {
  return `<div class="frac-input${large ? ' ans-whole' : ''}" id="${id}" tabindex="0"></div>`;
}

function fracCol(top, bot) {
  return `<div class="frac-col">${top}<div class="frac-line"></div>${bot}</div>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLUGIN 1 — Fractions (mixed ↔ improper conversions)
// Inputs: ans-num, ans-den, ans-w
// Bonus : correct AND in lowest terms (original behaviour)
// ═══════════════════════════════════════════════════════════════════════════════

const fractionsPlugin = {
  id: 'fractions',
  label: 'Fractions',
  popupLabel: 'FRACTION CONVERSION',
  
  generate(sq) {
    if (Math.random() > 0.5) {
      // Mixed number  (d:'M') — ask student: convert to improper fraction
      const dn = randomInt(3, 10);
      return { d: 'M', w: randomInt(1, 8), n: randomInt(1, dn - 1), dn };
    } else {
      // Improper fraction (d:'I') — ask student: convert to mixed number
      const dn = randomInt(2, 9);
      let n, guard = 0;
      do { n = randomInt(dn + 1, dn * 3);
        guard++; } while (n % dn === 0 && guard < 40);
      if (n % dn === 0) n++;
      return { d: 'I', n, dn };
    }
  },
  
  renderHTML(raw) {
    if (raw.d === 'M') {
      // Mixed → improper
      return `
        <div class="frac-q-row">
          <span class="frac-lg">${raw.w}</span>
          ${fracCol(`<span class="frac-md">${raw.n}</span>`, `<span class="frac-md">${raw.dn}</span>`)}
          <span class="frac-eq">=</span>
          ${fracCol(inputBox('ans-num'), inputBox('ans-den'))}
        </div>`;
    } else {
      // Improper → mixed
      const w = Math.floor(raw.n / raw.dn);
      const r = raw.n % raw.dn;
      if (r === 0) {
        // Degenerate whole number (rare fallback)
        return `
          <div class="frac-q-row">
            ${fracCol(`<span class="frac-lg">${raw.n}</span>`, `<span class="frac-lg">${raw.dn}</span>`)}
            <span class="frac-eq">=</span>
            ${inputBox('ans-w', true)}
          </div>`;
      }
      return `
        <div class="frac-q-row">
          ${fracCol(`<span class="frac-lg">${raw.n}</span>`, `<span class="frac-lg">${raw.dn}</span>`)}
          <span class="frac-eq">=</span>
          <div class="frac-q-row" style="gap:6px;">
            ${inputBox('ans-w', true)}
            ${fracCol(inputBox('ans-num'), inputBox('ans-den'))}
          </div>
        </div>`;
    }
  },
  
  checkAnswer(raw) {
    if (raw.d === 'M') {
      const tN = raw.w * raw.dn + raw.n;
      const tD = raw.dn;
      const reducible = gcd(tN, tD) > 1;
      const uN = getVal('ans-num'),
        uD = getVal('ans-den');
      if (isNaN(uN) || isNaN(uD) || uD === 0) return { isCorrect: false };
      if (uN * tD !== tN * uD) return { isCorrect: false };
      const lowestTerms = gcd(uN, uD) === 1;
      return {
        isCorrect: true,
        bonusEligible: !reducible || lowestTerms,
        penaltyMessage: (reducible && !lowestTerms) ?
          "Correct, but not in lowest terms — no bonus!" : null,
      };
    } else {
      const w = Math.floor(raw.n / raw.dn);
      const r = raw.n % raw.dn;
      if (r === 0) {
        return { isCorrect: getVal('ans-w') === w, bonusEligible: true };
      }
      const reducible = gcd(r, raw.dn) > 1;
      const uW = getVal('ans-w'),
        uN = getVal('ans-num'),
        uD = getVal('ans-den');
      if ([uW, uN, uD].some(isNaN) || uD === 0) return { isCorrect: false };
      if (uN >= uD) return { isCorrect: false };
      if ((uW * uD + uN) * raw.dn !== raw.n * uD) return { isCorrect: false };
      const lowestTerms = uN === 0 || gcd(uN, uD) === 1;
      return {
        isCorrect: true,
        bonusEligible: !reducible || lowestTerms,
        penaltyMessage: (reducible && !lowestTerms) ?
          "Correct, but not in lowest terms — no bonus!" : null,
      };
    }
  },
  
  cpuFill(raw) {
    if (raw.d === 'M') {
      const tN = raw.w * raw.dn + raw.n;
      const g = gcd(tN, raw.dn);
      setVal('ans-num', tN / g);
      setVal('ans-den', raw.dn / g);
    } else {
      const w = Math.floor(raw.n / raw.dn);
      const r = raw.n % raw.dn;
      if (r === 0) { setVal('ans-w', w); return; }
      const g = gcd(r, raw.dn);
      setVal('ans-w', w);
      setVal('ans-num', r / g);
      setVal('ans-den', raw.dn / g);
    }
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// PLUGIN 2 — Percentages
// Types:
//   pct_of  → "What is X% of Y?"  → single integer answer (ans-a)
//   what_pct→ "N is __% of Y?"    → single integer answer (ans-a)
// Bonus: always eligible (first-attempt correct)
// ═══════════════════════════════════════════════════════════════════════════════

const NICE_PCTS = [10, 20, 25, 50, 75];

const percentagesPlugin = {
  id: 'percentages',
  label: 'Percentages',
  popupLabel: 'PERCENTAGE PROBLEM',
  
  generate() {
    const pct = NICE_PCTS[randomInt(0, NICE_PCTS.length - 1)];
    if (Math.random() > 0.5) {
      // "X% of Y = ?"  — Y chosen so answer is integer
      const divisor = 100 / gcd(pct, 100);
      const multiplier = randomInt(1, Math.floor(100 / divisor));
      const Y = divisor * multiplier;
      const ans = Math.round(pct * Y / 100);
      return { t: 'pct_of', pct, Y, ans };
    } else {
      // "N is __% of Y?" — pick Y then pick a nice divisor
      const pct2 = NICE_PCTS[randomInt(0, NICE_PCTS.length - 1)];
      const div2 = 100 / gcd(pct2, 100);
      const mul2 = randomInt(1, Math.floor(100 / div2));
      const Y = div2 * mul2;
      const N = Math.round(pct2 * Y / 100);
      return { t: 'what_pct', N, Y, ans: pct2 };
    }
  },
  
  renderHTML(raw) {
    const word = (s) => `<span style="color:rgba(255,255,255,.75);font-size:20px;margin:0 6px;">${s}</span>`;
    if (raw.t === 'pct_of') {
      return `
        <div class="frac-q-row" style="flex-wrap:wrap;gap:8px;">
          <span class="frac-lg">${raw.pct}%</span>
          ${word('of')}
          <span class="frac-lg">${raw.Y}</span>
          <span class="frac-eq">=</span>
          ${inputBox('ans-a', true)}
        </div>`;
    } else {
      return `
        <div class="frac-q-row" style="flex-wrap:wrap;gap:8px;">
          <span class="frac-lg">${raw.N}</span>
          ${word('is')}
          ${inputBox('ans-a')}
          ${word('%')}
          ${word('of')}
          <span class="frac-lg">${raw.Y}</span>
        </div>`;
    }
  },
  
  checkAnswer(raw) {
    const uA = getVal('ans-a');
    if (isNaN(uA)) return { isCorrect: false };
    return { isCorrect: uA === raw.ans, bonusEligible: true };
  },
  
  cpuFill(raw) { setVal('ans-a', raw.ans); },
  
  cellText(raw) {
    if (raw.t === 'pct_of') return { line1: `${raw.pct}% of`, line2: `${raw.Y}` };
    return { line1: `${raw.N} is ?%`, line2: `of ${raw.Y}` };
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// PLUGIN 3 — Decimals (fractions ↔ hundredths/decimals)
// Types:
//   frac_to_hund → "3/4 = __ hundredths"   → integer answer in [0,100] (ans-a)
//   dec_to_frac  → "0.75 = __/__"           → two integer inputs (ans-n, ans-d)
// Bonus: eligible if answer is in lowest terms (dec_to_frac), or always (frac_to_hund)
// ═══════════════════════════════════════════════════════════════════════════════

// Curated terminating fractions (n, dn, hundredths)
const TERM_FRACS = [
  [1, 2, 50],
  [1, 4, 25],
  [3, 4, 75],
  [1, 5, 20],
  [2, 5, 40],
  [3, 5, 60],
  [4, 5, 80],
  [1, 10, 10],
  [3, 10, 30],
  [7, 10, 70],
  [9, 10, 90],
  [1, 20, 5],
  [3, 20, 15],
  [7, 20, 35],
  [9, 20, 45],
  [1, 25, 4],
  [3, 25, 12],
  [7, 25, 28],
  [2, 25, 8],
];

const decimalsPlugin = {
  id: 'decimals',
  label: 'Decimals',
  popupLabel: 'DECIMAL CONVERSION',
  
  generate() {
    const [n, dn, hund] = TERM_FRACS[randomInt(0, TERM_FRACS.length - 1)];
    if (Math.random() > 0.5) {
      return { t: 'frac_to_hund', n, dn, ans: hund };
    } else {
      const g = gcd(hund, 100);
      return { t: 'dec_to_frac', dec: hund / 100, n: hund / g, dn: 100 / g, ans: { n: hund / g, dn: 100 / g } };
    }
  },
  
  renderHTML(raw) {
    const word = (s) => `<span style="color:rgba(255,255,255,.6);font-size:16px;margin:0 4px;">${s}</span>`;
    if (raw.t === 'frac_to_hund') {
      return `
        <div class="frac-q-row">
          ${fracCol(`<span class="frac-lg">${raw.n}</span>`, `<span class="frac-lg">${raw.dn}</span>`)}
          <span class="frac-eq">=</span>
          ${inputBox('ans-a', true)}
          ${word('hundredths')}
        </div>`;
    } else {
      // Format decimal with leading zero
      const decStr = raw.dec.toFixed(2).replace(/\.?0+$/, '') || '0';
      return `
        <div class="frac-q-row">
          <span class="frac-lg">${decStr}</span>
          <span class="frac-eq">=</span>
          ${fracCol(inputBox('ans-n'), inputBox('ans-d'))}
        </div>`;
    }
  },
  
  checkAnswer(raw) {
    if (raw.t === 'frac_to_hund') {
      const uA = getVal('ans-a');
      return { isCorrect: uA === raw.ans, bonusEligible: true };
    } else {
      const uN = getVal('ans-n'),
        uD = getVal('ans-d');
      if (isNaN(uN) || isNaN(uD) || uD === 0) return { isCorrect: false };
      // Check equivalent fraction
      if (uN * raw.ans.dn !== raw.ans.n * uD) return { isCorrect: false };
      const lowestTerms = gcd(uN, uD) === 1;
      return {
        isCorrect: true,
        bonusEligible: lowestTerms,
        penaltyMessage: lowestTerms ? null : "Correct, but not in lowest terms — no bonus!",
      };
    }
  },
  
  cpuFill(raw) {
    if (raw.t === 'frac_to_hund') {
      setVal('ans-a', raw.ans);
    } else {
      setVal('ans-n', raw.ans.n);
      setVal('ans-d', raw.ans.dn);
    }
  },
  
  cellText(raw) {
    if (raw.t === 'frac_to_hund') return { line1: `${raw.n}/${raw.dn}`, line2: `=?¢` };
    const decStr = raw.dec.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
    return { line1: decStr, line2: `= ?/?` };
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// PLUGIN 4 — Basic Algebra (linear equations: ax + b = c)
// Input: ans-a (value of x)
// Bonus: always eligible
// ═══════════════════════════════════════════════════════════════════════════════

const algebraPlugin = {
  id: 'algebra',
  label: 'Basic Algebra',
  popupLabel: 'SOLVE FOR X',
  
  generate() {
    const x = randomInt(1, 12);
    const a = randomInt(2, 9);
    // 50% chance of having a constant b (harder), 50% pure ax=c (simpler)
    const b = Math.random() > 0.5 ? randomInt(1, 20) : 0;
    const c = a * x + b;
    return { a, b, c, ans: x };
  },
  
  renderHTML(raw) {
    // Build equation string: "ax + b = c" or "ax = c"
    const eq = raw.b > 0 ?
      `${raw.a}x + ${raw.b} = ${raw.c}` :
      `${raw.a}x = ${raw.c}`;
    return `
      <div style="text-align:center;">
        <div class="frac-lg" style="margin-bottom:16px;letter-spacing:1px;">${eq}</div>
        <div class="frac-q-row" style="justify-content:center;">
          <span style="color:rgba(255,255,255,.8);font-size:22px;margin-right:10px;">x =</span>
          ${inputBox('ans-a', true)}
        </div>
      </div>`;
  },
  
  checkAnswer(raw) {
    const uA = getVal('ans-a');
    return { isCorrect: uA === raw.ans, bonusEligible: true };
  },
  
  cpuFill(raw) { setVal('ans-a', raw.ans); },
  
  cellText(raw) {
    const line1 = raw.b > 0 ? `${raw.a}x+${raw.b}` : `${raw.a}x`;
    return { line1, line2: `=${raw.c}` };
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// PLUGIN 5 — Times Tables (multiplication and division)
// Input: ans-a
// Bonus: always eligible
// ═══════════════════════════════════════════════════════════════════════════════

const timesTablesPlugin = {
  id: 'times-tables',
  label: 'Times Tables',
  popupLabel: 'MENTAL ARITHMETIC',
  
  generate() {
    if (Math.random() > 0.45) {
      const a = randomInt(2, 12),
        b = randomInt(2, 12);
      return { t: 'mult', a, b, ans: a * b };
    } else {
      const ans = randomInt(2, 12),
        b = randomInt(2, 12);
      return { t: 'div', product: ans * b, b, ans };
    }
  },
  
  renderHTML(raw) {
    if (raw.t === 'mult') {
      return `
        <div class="frac-q-row">
          <span class="frac-lg">${raw.a}</span>
          <span class="frac-eq">×</span>
          <span class="frac-lg">${raw.b}</span>
          <span class="frac-eq">=</span>
          ${inputBox('ans-a', true)}
        </div>`;
    } else {
      return `
        <div class="frac-q-row">
          <span class="frac-lg">${raw.product}</span>
          <span class="frac-eq">÷</span>
          <span class="frac-lg">${raw.b}</span>
          <span class="frac-eq">=</span>
          ${inputBox('ans-a', true)}
        </div>`;
    }
  },
  
  checkAnswer(raw) {
    const uA = getVal('ans-a');
    return { isCorrect: uA === raw.ans, bonusEligible: true };
  },
  
  cpuFill(raw) { setVal('ans-a', raw.ans); },
  
  cellText(raw) {
    if (raw.t === 'mult') return { line1: `${raw.a}×${raw.b}`, line2: `= ?` };
    return { line1: `${raw.product}÷${raw.b}`, line2: `= ?` };
  },
};

// ═══════════════════════════════════════════════════════════════════════════════

const _REGISTRY = new Map([
  [fractionsPlugin.id, fractionsPlugin],
  [percentagesPlugin.id, percentagesPlugin],
  [decimalsPlugin.id, decimalsPlugin],
  [algebraPlugin.id, algebraPlugin],
  [timesTablesPlugin.id, timesTablesPlugin],
]);

let _activeId = 'fractions';

export function getAllPlugins() { return [..._REGISTRY.values()]; }
export function getPlugin(id) { return _REGISTRY.get(id) ?? fractionsPlugin; }
export function setActivePlugin(id) { if (_REGISTRY.has(id)) _activeId = id; }
export function getActivePlugin() { return _REGISTRY.get(_activeId); }