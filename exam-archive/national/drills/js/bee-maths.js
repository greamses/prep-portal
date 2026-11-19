/* ═══════════════════════════════════════════════════════
   THE MATH BEE'S MATHS — pure, no DOM, no imports (node-testable)
   ----------------------------------------------------------------------------
   For any drills question (rng.js questionAt):
     answerText(q)  the right answer written as the drills' checker accepts it
                    (factorised answers IN BRACKETS: 9(x + 9), (x − 9)(x + 1))
     isEasy(q)      quick arithmetic a bot answers in a second or two; the rest
                    are "difficult": at least five seconds, working shown
     working(q)     a bot's speed-maths working, TeX lines (the answer itself is then
                    typed into the answer box: game.js sanitizeFor + texFor draw it)
═══════════════════════════════════════════════════════ */

const MINUS = '−';
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
const lcm = (a, b) => Math.abs(a / gcd(a, b) * b);
const num = (s) => Number(String(s).replace(/[−–]/g, '-'));
const nums = (s) => (String(s).replace(/[−–]/g, '-').match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
const SUBS = '₀₁₂₃₄₅₆₇₈₉';
const subNum = (s) => Number([...s].map((ch) => SUBS.indexOf(ch)).join(''));

/* ── TeX pieces ── */
const T = (n) => String(n);                                   // a number (TeX minus is a hyphen)
const P = (n) => (n < 0 ? `(${n})` : `${n}`);                 // a number in brackets when negative
const frac = (n, d) => `\\frac{${n}}{${d}}`;
function simpTex(n, d) {
  const g = gcd(n, d); n /= g; d /= g;
  if (d < 0) { n = -n; d = -d; }
  if (d === 1) return T(n);
  return n < 0 ? `-${frac(-n, d)}` : frac(n, d);
}
// ax^k with its sign as a later term ("+ 3x", "- x^2", "- 5")
function term(c, k, first = false) {
  if (!c) return '';
  const a = Math.abs(c);
  const body = k === 0 ? `${a}` : `${a === 1 ? '' : a}x${k === 2 ? '^2' : ''}`;
  if (first) return `${c < 0 ? '-' : ''}${body}`;
  return ` ${c < 0 ? '-' : '+'} ${body}`;
}
function polyTex(p) {
  let s = '';
  for (let k = p.length - 1; k >= 0; k--) if (p[k]) s += term(p[k], k, !s);
  return s || '0';
}
const linTex = (a, b) => `${term(a, 1, true)}${term(b, 0)}`;

/* ── plain text (what is typed; the checker reads it) ── */
function textTerm(c, k, first) {
  if (!c) return '';
  const a = Math.abs(c);
  const body = k === 0 ? `${a}` : `${a === 1 ? '' : a}x${k === 2 ? '²' : ''}`;
  if (first) return `${c < 0 ? MINUS : ''}${body}`;
  return ` ${c < 0 ? MINUS : '+'} ${body}`;
}
function polyText(p) {
  let s = '';
  for (let k = p.length - 1; k >= 0; k--) if (p[k]) s += textTerm(p[k], k, !s);
  return s || '0';
}
const linText = (a, b) => `${textTerm(a, 1, true)}${textTerm(b, 0)}`;

/** a quadratic's two whole roots-in-brackets: x² + bx + c = (x + p)(x + r) */
function pairFor(b, c) {
  for (let p = -200; p <= 200; p++) { const r = b - p; if (p * r === c && p <= r) return [p, r]; }
  return null;
}
function factorParts(poly) {
  if (poly.length === 2) {                         // linear: g(px + q)
    const [c0, c1] = poly;
    let g = gcd(c0, c1);
    if (c1 < 0) g = -g;
    return { kind: 'lin', g, a: c1 / g, b: c0 / g };
  }
  const [c0, c1, L] = poly;                        // quadratic: L(x + p)(x + r)
  const pr = pairFor(c1 / L, c0 / L);
  return pr ? { kind: 'quad', L, p: pr[0], r: pr[1], b: c1 / L, c: c0 / L } : null;
}

/** The right answer, written as a contestant would type it (and as the drills' checker accepts it). */
export function answerText(q) {
  const a = q.answer;
  if (a && a.kind === 'pair') return `${a.x}, ${a.y}`.replace(/-/g, MINUS);
  if (a && a.kind === 'subject') return a.expr;
  if (a && a.alg && Array.isArray(a.poly)) {
    if (a.kind === 'factorise' || a.kind === 'quadFactorise') {
      const f = factorParts(a.poly);
      if (f && f.kind === 'lin') return `${f.g === 1 ? '' : f.g === -1 ? MINUS : String(f.g).replace('-', MINUS)}(${linText(f.a, f.b)})`;
      if (f && f.kind === 'quad') {
        const k = f.L === 1 ? '' : String(f.L).replace('-', MINUS);
        const br = (v) => `(x ${v < 0 ? MINUS : '+'} ${Math.abs(v)})`;
        if (f.p === f.r) return `${k}${br(f.p)}²`;
        return `${k}${br(f.p)}${br(f.r)}`;
      }
    }
    return polyText(a.poly);
  }
  return typeof a === 'number' ? String(a).replace('-', MINUS) : String(a);
}

/** Quick arithmetic (a bot answers in a second or two); everything else is "difficult". */
export function isEasy(q) {
  if (q.hint || typeof q.answer !== 'number') return false;
  if (/[³⁴∛⁄]/.test(q.text)) return false;
  return Math.abs(q.answer) < 200;
}

/* ── Roman numerals ── */
const ROMAN = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
const toRoman = (n) => { let s = ''; for (const [v, r] of ROMAN) while (n >= v) { s += r; n -= v; } return s; };
const placeParts = (n) => String(n).split('').map((d, i, a) => Number(d) * 10 ** (a.length - 1 - i)).filter(Boolean);

/** A bot's working out, as TeX lines (at most four); the answer is typed after them. */
export function working(q) {
  try { return workingLines(q).filter(Boolean).slice(-4); } catch { return []; }
}

function workingLines(q) {
  const t = String(q.text), h = String(q.hint || ''), a = q.answer;
  const ans = null;                                   // the answer itself goes in the answer box
  const vars = {};
  for (const m of t.replace(/[−–]/g, '-').matchAll(/\b([a-zA-Z])\s*=\s*(-?\d+(?:\.\d+)?)/g)) vars[m[1]] = Number(m[2]);

  /* algebra */
  if (a && a.alg) {
    if (a.kind === 'distribute') {
      const m = /^(−?\d+)\((\d*)x ([+−]) (\d+)\)$/.exec(t);
      if (!m) return [ans];
      const k = num(m[1]), b = m[2] === '' ? 1 : num(m[2]), c = (m[3] === MINUS ? -1 : 1) * num(m[4]);
      return [`${P(k)}\\times ${b === 1 ? '' : b}x + ${P(k)}\\times ${P(c)}`, ans];
    }
    if (a.kind === 'factorise') {
      const f = factorParts(a.poly);
      return [`\\text{HCF of } ${Math.abs(a.poly[1])} \\text{ and } ${Math.abs(a.poly[0])} = ${Math.abs(f.g)}`, ans];
    }
    if (a.kind === 'quadExpand') {
      const m = /^\((\d*)x ([+−]) (\d+)\)\((\d*)x ([+−]) (\d+)\)$/.exec(t);
      if (!m) return [ans];
      const p = m[1] === '' ? 1 : +m[1], x = (m[2] === MINUS ? -1 : 1) * +m[3];
      const r = m[4] === '' ? 1 : +m[4], y = (m[5] === MINUS ? -1 : 1) * +m[6];
      return [`${term(p * r, 2, true)}${term(p * y, 1)}${term(x * r, 1)}${term(x * y, 0)}`, ans];
    }
    const f = factorParts(a.poly);
    if (!f || f.kind !== 'quad') return [ans];
    const out = [];
    if (f.L !== 1) out.push(`${f.L}(${polyTex([f.c, f.b, 1])})`);
    out.push(`${P(f.p)}\\times ${P(f.r)} = ${f.c},\\;\\; ${P(f.p)} + ${P(f.r)} = ${f.b}`);
    out.push(ans);
    return out;
  }
  if (a && a.kind === 'pair') return [`\\text{eliminate one letter}`, `y = ${a.y}`, `x = ${a.x}`];
  if (a && a.kind === 'subject') return [`\\text{undo each step around } ${a.find}`];

  /* equations */
  if (/^Solve for x/.test(h)) {
    const m = /^(−?\d*)x ([+−]) (\d+) = (−?\d+)$/.exec(t);
    if (m) {
      const A = m[1] === '' ? 1 : m[1] === MINUS ? -1 : num(m[1]);
      const B = (m[2] === MINUS ? -1 : 1) * num(m[3]), C = num(m[4]);
      const ax = `${A === 1 ? '' : A === -1 ? '-' : A}x`;
      const out = [`${ax} = ${C} ${B < 0 ? '+' : '-'} ${Math.abs(B)}`, `${ax} = ${C - B}`];
      if (A !== 1) out.push(`x = ${frac(C - B, A)}`, `x = ${T(a)}`);
      return out;
    }
    return [`\\text{collect the } x \\text{ terms}`, `x = ${T(a)}`];
  }

  /* percentages */
  if (/as a decimal/.test(h)) return [`${nums(t)[0]} \\div 100`, ans];
  if (/fraction in its lowest/.test(h)) return [frac(nums(t)[0], 100), ans];
  if (/as a percentage/.test(h)) {
    if (t.includes('/')) { const [n, d] = nums(t); return [`${frac(n, d)} \\times 100`]; }
    return [`${nums(t)[0]} \\times 100`];
  }
  if (/^Work it out/.test(h) && t.includes('%')) { const [p, n] = nums(t); return [`${frac(p, 100)} \\times ${n}`, ans]; }

  /* number bases: through base ten */
  if (q.base) {
    const parts = [...t.matchAll(/([0-9A-F]+|\?)([₀-₉]+)/g)].map((m) => ({ d: m[1], b: subNum(m[2]) }));
    const target = parts.pop();
    const vals = parts.map((p) => parseInt(p.d, p.b));
    const op = (/[+−×÷]/.exec(t) || [''])[0];
    const out = [];
    if (parts.length === 1) {
      const p = parts[0];
      if (p.b !== 10) {
        const ds = [...p.d];
        out.push(ds.map((d, i) => `${parseInt(d, 16)}\\times ${p.b}^{${ds.length - 1 - i}}`).join(' + ') + ` = ${vals[0]}`);
      }
    } else {
      const sym = { '+': '+', '−': '-', '×': '\\times', '÷': '\\div' }[op] || op;
      const res = { '+': (x, y) => x + y, '−': (x, y) => x - y, '×': (x, y) => x * y, '÷': (x, y) => x / y }[op];
      const v = vals.reduce((x, y) => res(x, y));
      out.push(`${vals.join(` ${sym} `)} = ${v}`);
    }
    out.push(`= \\mathrm{${a}}_{${target.b}}`);
    return out;
  }

  /* Roman numerals */
  if (q.roman) {
    const n = nums(t)[0], ps = placeParts(n);
    return [ps.join(' + '), ps.map((p) => `\\mathrm{${toRoman(p)}}`).join(' + '), `\\mathrm{${a}}`];
  }
  if (/Write as a number/.test(h)) {
    const ps = placeParts(a);
    return [ps.map((p) => `\\mathrm{${toRoman(p)}}`).join(' + '), ps.join(' + '), T(a)];
  }

  /* angles */
  if (/straight line|in a triangle/.test(h)) {
    const given = nums(t).filter((n) => n !== 180);
    return [`x = 180 - ${given.join(' - ')}`, `x = ${a}^{\\circ}`];
  }
  if (/Sum of the interior/.test(h)) return [`(n - 2)\\times 180 = ${vars.n - 2}\\times 180`, `${a}^{\\circ}`];
  if (/One interior angle/.test(h)) return [`180 - ${frac(360, vars.n)}`, `${a}^{\\circ}`];
  if (/One exterior angle/.test(h)) return [frac(360, vars.n), `${a}^{\\circ}`];
  /* commercial maths */
  if (/Simple interest/.test(h)) return [`I = \\frac{PRT}{100}`, `I = \\frac{${vars.P} \\times ${nums(t)[1]} \\times ${nums(t)[2]}}{100}`];
  if (/^(Profit|Loss) percent/.test(h)) {
    const [cp, sp] = nums(t), gap = Math.abs(sp - cp);
    return [`${/Profit/.test(h) ? 'profit' : 'loss'} = ${gap}`, `\\frac{${gap}}{${cp}} \\times 100`];
  }
  if (/Selling price/.test(h)) { const [cp, p] = nums(t), up = /profit/.test(t); return [`\\text{SP} = ${cp} ${up ? '+' : '-'} \\frac{${p}}{100} \\times ${cp}`]; }
  if (/Cost price/.test(h)) { const [sp, p] = nums(t), up = /profit/.test(t); return [`\\text{CP} = \\frac{${sp} \\times 100}{${up ? 100 + p : 100 - p}}`]; }
  if (/Discount/.test(h)) {
    const [mp, d] = nums(t), off = (mp * d) / 100;
    return /price paid/.test(h) ? [`\\text{discount} = \\frac{${d}}{100} \\times ${mp} = ${off}`, `${mp} - ${off}`] : [`\\frac{${d}}{100} \\times ${mp}`];
  }
  if (/Commission/.test(h)) { const [s, r] = nums(t); return [`\\frac{${r}}{100} \\times ${s}`]; }
  if (/at a point/.test(h)) {
    const given = nums(t).filter((n) => n !== 360);
    return [`x = 360 - ${given.join(' - ')}`, `x = ${a}^{\\circ}`];
  }
  if (/Complementary/.test(h)) return [`x = 90 - ${nums(t).filter((n) => n !== 90)[0]}`, `x = ${a}^{\\circ}`];
  if (/bent line between parallel/i.test(h)) return [`\\text{the bend} = a + b`, `x = ${vars.a} + ${vars.b}`, `x = ${a}^{\\circ}`];
  if (/Co-interior angles/.test(h)) return [`\\text{co-interior angles add up to } 180^{\\circ}`, `x = 180 - ${vars.a}`, `x = ${a}^{\\circ}`];
  if (/angles: find x/.test(h)) {
    const kind = /([\w-]+) angles/.exec(h)[1].toLowerCase();
    return [`\\text{${kind} angles are equal}`, `x = ${a}^{\\circ}`];
  }

  /* lengths and areas */
  if (/Perimeter of a rectangle/.test(h)) return [`2(${vars.l} + ${vars.w})`, ans];
  if (/Area of a rectangle/.test(h)) return [`${vars.l} \\times ${vars.w}`, ans];
  if (/Area of a triangle/.test(h)) return [`\\tfrac12 \\times ${vars.b} \\times ${vars.h}`, ans];
  if (/Area of a trapezium/.test(h)) return [`\\tfrac12 (${vars.a} + ${vars.b}) \\times ${vars.h}`, ans];
  if (/Area of a parallelogram/.test(h)) return [`${vars.b} \\times ${vars.h}`, ans];
  if (/find the hypotenuse/.test(h)) return [`\\sqrt{${vars.a}^2 + ${vars.b}^2}`, `\\sqrt{${vars.a ** 2 + vars.b ** 2}}`, ans];
  if (/find [ab]$/.test(h)) { const o = vars.b ?? vars.a; return [`\\sqrt{${vars.c}^2 - ${o}^2}`, `\\sqrt{${vars.c ** 2 - o ** 2}}`, ans]; }
  if (/^Opposite/.test(h)) {
    const [o, ad, hy] = nums(h), fn = (/^(tan|sin|cos)/.exec(t) || ['tan'])[0];
    const pick = { tan: [o, ad, 'opp', 'adj'], sin: [o, hy, 'opp', 'hyp'], cos: [ad, hy, 'adj', 'hyp'] }[fn];
    return [`\\${fn} A = ${frac(`\\text{${pick[2]}}`, `\\text{${pick[3]}}`)} = ${frac(pick[0], pick[1])}`, ans];
  }
  const PI = frac(22, 7);
  if (/Circumference/.test(h)) return [`2 \\times ${PI} \\times ${vars.r}`, ans];
  if (/Area of a circle/.test(h)) return [`${PI} \\times ${vars.r} \\times ${vars.r}`, ans];
  if (/Volume of a cuboid/.test(h)) return [`${vars.l} \\times ${vars.w} \\times ${vars.h}`, ans];
  if (/Volume of a cylinder/.test(h)) return [`${PI} \\times ${vars.r}^2 \\times ${vars.h}`, ans];
  if (/Volume of a cone/.test(h)) return [`\\tfrac13 \\times ${PI} \\times ${vars.r}^2 \\times ${vars.h}`, ans];

  /* fractions */
  const fm = /^(\d+)(?:⁄(\d+))? ([+−×÷]) (\d+)(?:⁄(\d+))?$/.exec(t);
  if (fm && t.includes('⁄')) {
    const [n1, d1, op, n2, d2] = [+fm[1], +(fm[2] || 1), fm[3], +fm[4], +(fm[5] || 1)];
    if (op === '+' || op === '−') {
      const L = lcm(d1, d2), x = n1 * L / d1, y = n2 * L / d2, s = op === '+' ? x + y : x - y;
      const out = [`${frac(x, L)} ${op === '+' ? '+' : '-'} ${frac(y, L)}`, frac(s, L)];
      if (gcd(s, L) !== 1) out.push(simpTex(s, L));
      return out;
    }
    if (op === '×') return [frac(`${n1}\\times ${n2}`, `${d1}\\times ${d2}`), frac(n1 * n2, d1 * d2), gcd(n1 * n2, d1 * d2) !== 1 ? simpTex(n1 * n2, d1 * d2) : ''];
    return [`${frac(n1, d1)} \\times ${frac(d2, n2)}`, frac(n1 * d2, d1 * n2), gcd(n1 * d2, d1 * n2) !== 1 ? simpTex(n1 * d2, d1 * n2) : ''];
  }

  /* powers and roots */
  let m = /^(\d+)⁴$/.exec(t);
  if (m) { const b = +m[1]; return [`${b}^2 \\times ${b}^2`, `${b * b} \\times ${b * b}`, ans]; }
  m = /^(\d+)³$/.exec(t);
  if (m) { const b = +m[1]; return [`${b}^2 \\times ${b}`, `${b * b} \\times ${b}`, ans]; }
  m = /^(⁴√|∛|√)(\d+)$/.exec(t);
  if (m) { const k = m[1] === '√' ? 2 : m[1] === '∛' ? 3 : 4; return [`${a}^{${k}} = ${m[2]}`, ans]; }

  /* longer arithmetic: split the second number into tens and units */
  m = /^(−?\d+) × (−?\d+)$/.exec(t);
  if (m) {
    const x = num(m[1]), y = num(m[2]);
    if (y >= 10 && y % 10) {
      const tens = y - (y % 10), u = y % 10;
      return [`${P(x)}\\times ${tens} + ${P(x)}\\times ${u}`, `${x * tens} + ${P(x * u)}`, T(x * y)];
    }
  }
  return [];
}

/** A wrong answer a bot might give (its n-th try at one): a number put off by a little, one figure of a
 *  written answer misworked, a Roman numeral's pair turned round, a hex letter slipped. The caller
 *  checks it really is wrong. */
export function slip(q, n = 0) {
  const a = q.answer;
  if (typeof a === 'number') { const off = (n % 2 ? -1 : 1) * (1 + (n % 3)); return String(a + off).replace('-', MINUS); }
  const s = answerText(q);
  if (a && a.kind === 'subject') {              // a step undone the wrong way round
    if (s.includes('-')) return s.replace('-', '+');
    if (s.includes('/')) return s.replace('/', '*');
    if (s.includes('√')) return s.replace('√', '');
    return `${s}+1`;
  }
  if (q.base) {                                 // one figure off, but still a figure of that base
    const subs = [...String(q.text).matchAll(/[₀-₉]+/g)];
    const base = subs.length ? subNum(subs[subs.length - 1][0]) : 10;
    const DIG = '0123456789ABCDEF';
    const i = s.length - 1 - (n % Math.min(2, s.length));
    const v = DIG.indexOf(s[i].toUpperCase());
    return s.slice(0, i) + DIG[(v + 1) % base] + s.slice(i + 1);
  }
  if (q.roman) {
    for (const [x, y] of [['IX', 'XI'], ['IV', 'VI'], ['XC', 'CX'], ['XL', 'LX'], ['CM', 'MC'], ['CD', 'DC']]) if (s.includes(x)) return s.replace(x, y);
    return n % 2 ? s.slice(0, -1) || 'I' : `${s}I`;
  }
  const digits = [...s].map((ch, i) => (/\d/.test(ch) ? i : -1)).filter((i) => i >= 0);
  if (digits.length) {
    const i = digits[n % digits.length], d = Number(s[i]);
    const nd = d >= 8 ? d - 1 - (n % 2) : d + 1 + (n % 2);
    return s.slice(0, i) + nd + s.slice(i + 1);
  }
  const L = [...s].findLastIndex((ch) => /[A-F]/.test(ch));
  if (L >= 0) return s.slice(0, L) + 'ABCDEF'['ABCDEF'.indexOf(s[L]) + 1 === 6 ? 0 : 'ABCDEF'.indexOf(s[L]) + 1] + s.slice(L + 1);
  return `${s}1`;
}

/** The working a bot thinks through before it answers WRONG: the setting-up it got right (the lines
 *  before the right result shows), at most one line of it, so its last thought is its own slip. */
export function setupLines(q) {
  const flat = (x) => String(x).replace(/\\[a-zA-Z]+/g, '').replace(/[{}\s,;]/g, '').replace(/[−–]/g, '-');
  const want = flat(answerText(q));
  const out = [];
  for (const line of working(q)) {
    if (want && flat(line).includes(want)) break;
    out.push(line);
  }
  return out.slice(0, 1);
}
