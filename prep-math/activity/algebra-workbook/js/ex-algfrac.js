/* ============================================================================
   Algebra Workbook — CHAPTER 14: ALGEBRAIC FRACTIONS, in fifteen steps
   ----------------------------------------------------------------------------
   A fraction with letters in it obeys every rule a fraction of numbers does —
   cancel a factor that top and bottom SHARE, never a term; make the bottoms
   the same before adding. The chapter takes one idea at a time:

   WHAT IT IS
     1  its value            put the number in for the letter
     2  undefined            the bottom may never be 0: which x is forbidden?

   SIMPLIFYING
     3  cancel numbers       6x/9 → 2x/3
     4  cancel letters       6x²/4x → 3x/2
     5  factorise, cancel    (2x + 6)/(4x + 12) → 1/2: take out factors FIRST
     6  with a quadratic     (x² − 9)/(x + 3) → x − 3

   MULTIPLYING AND DIVIDING
     7  multiply             tops together, bottoms together, cancel
     8  divide               turn the second one over and multiply

   ADDING AND TAKING AWAY
     9  same denominator     add the tops, keep the bottom
     10 number denominators  x/2 + x/3: the lowest common denominator
     11 letter denominators  2/x + 3/(2x)
     12 bracket denominators 2/(x + 1) + 3/(x − 2): each top × the other bottom

   EQUATIONS
     13 numbers underneath   multiply every term by the LCD and they are gone
     14 letters underneath   6/x = 3; cross-multiplying
     15 word problems        parts of a number, taps and workers, a fraction
                             to be found

   A fraction printed whole is said outright to the typesetter (data-tex). An
   ANSWER that is a fraction is a stacked pair of boxes, top over bottom.
   ========================================================================== */

import { levelOf } from "./poly.js";
import { want } from "/utils/components/workbook/want.js";

const box = () => `<span class="wb-answer"></span>`;
const ask = (html) => `<p class="wb-ask">${html}</p>`;
const eq = (html) => `<p class="wb-ask ap-eq af-eq">${html}</p>`;
const worked = (body) => `<div class="wb-worked"><p class="wb-worked__tag">One done for you</p>${body}</div>`;
const say = (html) => `<p class="wb-ask wb-worked__say">${html}</p>`;
const tier = (o) => levelOf(o).id;
const num = (n) => (n < 0 ? `−${-n}` : String(n));
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));

/** A fraction printed whole: TeX for the typesetter, words for everything else. */
const F = (top, bot) => `<span class="wb-mathbox" data-tex="\\dfrac{${top}}{${bot}}">(${top})/(${bot})</span>`;
/** A fraction to FILL IN: whatever is put on top, over whatever is put underneath. */
const stack = (top, bot) => `<span class="af-stack wb-mathbox"><span class="af-top">${top}</span><span class="af-bot">${bot}</span></span>`;
/** kx as TeX: x, 2x, -x. */
const kx = (k, v = "x") => (k === 1 ? v : k === -1 ? `-${v}` : `${k}${v}`);
/** x + p as TeX: x + 3, x - 2. */
const xp = (p, k = 1) => `${kx(k)}${p === 0 ? "" : p > 0 ? ` + ${p}` : ` - ${-p}`}`;

export const AF_GROUPS = [
  { id: "af-what", chapter: "Chapter 14 · Algebraic fractions", label: "What an algebraic fraction is", blurb: "Its value, and the one x it may never have." },
  { id: "af-simplify", label: "Simplifying", blurb: "Cancel what top and bottom SHARE — factors, never terms." },
  { id: "af-times", label: "Multiplying and dividing", blurb: "Tops together, bottoms together; to divide, turn over and multiply." },
  { id: "af-add", label: "Adding and taking away", blurb: "Make the bottoms the same first." },
  { id: "af-solve", label: "Equations and word problems", blurb: "Multiply through by the LCD and the fractions are gone." },
];

const section = (id, group, spec) => ({ id, group, cols: 1, defaultCount: 4, ...spec, instruction: () => spec.instruction });

/* ═══ 1, 2 — what it is ════════════════════════════════════════════════════*/

const afValue = section("af-value", "af-what", {
  label: "1 · The value of an algebraic fraction",
  blurb: "Put the number in for x, top and bottom.",
  heading: "Step 1: the value of an algebraic fraction",
  instruction: "An algebraic fraction is a fraction with a letter in it. Swap the letter for its number in the top AND " +
    "the bottom, work each out, then divide.",
  cols: 2,
  make(r, o) {
    const t = tier(o);
    for (;;) {
      const x = r.int(1, t === "gentle" ? 6 : 9), a = r.int(1, 4), b = r.int(0, 9), d = r.int(1, t === "gentle" ? 3 : 6);
      const top = a * x + b, bot = x + d;
      if (top % bot === 0 && top / bot >= 1) return { x, a, b, d, v: top / bot };
    }
  },
  render: (it) => eq(`${F(xp(it.b, it.a), xp(it.d))} when x = ${it.x}: &nbsp; ${box()}`),
  worked: () => worked(eq(`${F("2x + 4", "x + 1")} when x = 1`) + say("Top: 2 × 1 + 4 = 6. Bottom: 1 + 1 = 2. So the value is 6 ÷ 2 = 3.")),
  key: (it) => [want.num(it.v)],
  answer: (it) => [`${it.a * it.x + it.b} ÷ ${it.x + it.d} = ${it.v}`],
});

const afUndefined = section("af-undef", "af-what", {
  label: "2 · When it is undefined",
  blurb: "The bottom may never be 0.",
  heading: "Step 2: the value x cannot take",
  instruction: "Nothing can be divided by 0, so an algebraic fraction is UNDEFINED for the value of x that makes its " +
    "bottom 0. Set the bottom equal to 0 and solve it: that is the forbidden x.",
  cols: 2,
  make(r, o) {
    const t = tier(o);
    const k = t === "gentle" ? 1 : r.int(1, 3);
    const x = t === "gentle" ? r.int(1, 9) : r.int(-8, 9);
    return { k, x, p: -k * x, a: r.int(1, 5), b: r.int(1, 9) };
  },
  render: (it) => eq(`${F(xp(it.b, it.a), xp(it.p, it.k))} is undefined when x = ${box()}`),
  worked: () => worked(eq(`${F("x + 2", "x - 5")}`) + say("The bottom is 0 when x − 5 = 0, that is x = 5. So x cannot be 5.")),
  key: (it) => [want.num(it.x)],
  answer: (it) => [`x = ${num(it.x)}`],
});

/* ═══ 3–6 — simplifying ════════════════════════════════════════════════════*/

const afNumbers = section("af-cancel-n", "af-simplify", {
  label: "3 · Cancel the numbers",
  blurb: "Divide top and bottom by the biggest number that goes into both.",
  heading: "Step 3: cancelling numbers",
  instruction: "As with ordinary fractions: divide the number on top and the number underneath by their HIGHEST COMMON " +
    "FACTOR. The letter stays where it is.",
  cols: 2,
  make(r, o) {
    const g = r.int(2, tier(o) === "gentle" ? 4 : 7);
    let p = r.int(1, 7), q = r.int(2, 9);
    while (gcd(p, q) !== 1) { p = r.int(1, 7); q = r.int(2, 9); }
    return { g, p, q };
  },
  render: (it) => eq(`${F(kx(it.g * it.p), String(it.g * it.q))} = ${stack(`${box()}x`, box())}`),
  worked: () => worked(eq(`${F("6x", "9")} = ${F("2x", "3")}`) + say("3 goes into both 6 and 9: 6 ÷ 3 = 2 and 9 ÷ 3 = 3.")),
  key: (it) => [want.num(it.p), want.num(it.q)],
  answer: (it) => [`${it.p}x/${it.q}`],
});

const afLetters = section("af-cancel-x", "af-simplify", {
  label: "4 · Cancel the letters",
  blurb: "x² over x leaves x: a letter cancels like a number.",
  heading: "Step 4: cancelling letters",
  instruction: "x² is x × x, so one x on top cancels with the x underneath, leaving x. Cancel the numbers by their " +
    "highest common factor, and the letters by crossing out as many as both have.",
  cols: 2,
  make(r) {
    const g = r.int(2, 5);
    let p = r.int(1, 7), q = r.int(2, 9);
    while (gcd(p, q) !== 1) { p = r.int(1, 7); q = r.int(2, 9); }
    return { g, p, q };
  },
  render: (it) => eq(`${F(`${it.g * it.p}x^{2}`, kx(it.g * it.q))} = ${stack(`${box()}x`, box())}`),
  worked: () => worked(eq(`${F("6x^{2}", "4x")} = ${F("3x", "2")}`) + say("2 goes into 6 and 4, and one x cancels: 6x² ÷ 2x = 3x and 4x ÷ 2x = 2.")),
  key: (it) => [want.num(it.p), want.num(it.q)],
  answer: (it) => [`${it.p}x/${it.q}`],
});

const afFactor = section("af-factor", "af-simplify", {
  label: "5 · Factorise, then cancel",
  blurb: "Only FACTORS cancel — so take them out first.",
  heading: "Step 5: factorise first",
  instruction: "You may cancel only something that MULTIPLIES the whole top and the whole bottom — never a single term. " +
    "So factorise top and bottom first: if the same bracket appears in both, it cancels, and the numbers left make " +
    "an ordinary fraction to put in its lowest terms.",
  cols: 2,
  make(r, o) {
    const t = tier(o);
    let a = r.int(1, 6), c = r.int(2, 8);
    while (gcd(a, c) !== 1 || a === c) { a = r.int(1, 6); c = r.int(2, 8); }
    const g = r.int(1, 3);
    const m = t === "gentle" ? r.int(1, 6) : r.pick([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]);
    return { a: a * g, c: c * g, m, p: a, q: c };
  },
  render: (it) => eq(`${F(xp(it.a * it.m, it.a), xp(it.c * it.m, it.c))} = ${stack(box(), box())}`),
  worked: () => worked(eq(`${F("2x + 6", "4x + 12")} = ${F("2(x + 3)", "4(x + 3)")} = ${F("1", "2")}`) +
    say("Top is 2(x + 3), bottom is 4(x + 3). The bracket (x + 3) multiplies both, so it cancels, leaving 2/4 = 1/2.")),
  key: (it) => [want.num(it.p), want.num(it.q)],
  answer: (it) => [`${it.p}/${it.q}`],
});

const afQuad = section("af-quad", "af-simplify", {
  label: "6 · Cancelling with a quadratic",
  blurb: "Factorise the quadratic: one bracket cancels.",
  heading: "Step 6: a quadratic on top",
  instruction: "Factorise the quadratic into two brackets (chapter 8). One of them is the same as the bottom, and " +
    "cancels — leaving the other bracket as the answer. A difference of two squares, x² − 9, is (x − 3)(x + 3).",
  cols: 2,
  hardest: true,
  make(r) {
    for (;;) {
      const p = r.pick([-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6]), q = r.pick([-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6]);
      return { p, q, b: p + q, c: p * q };
    }
  },
  render(it) {
    const top = `x^{2}${it.b === 0 ? "" : it.b > 0 ? ` + ${kx(it.b)}` : ` - ${kx(-it.b)}`}${it.c > 0 ? ` + ${it.c}` : ` - ${-it.c}`}`;
    return eq(`${F(top, xp(it.p))} = x + ${box()}`);
  },
  worked: () => worked(eq(`${F("x^{2} - 9", "x + 3")} = ${F("(x - 3)(x + 3)", "x + 3")}`) + say("(x + 3) cancels, leaving x − 3 — that is x + (−3).")),
  key: (it) => [want.num(it.q)],
  answer: (it) => [`x ${it.q < 0 ? "−" : "+"} ${Math.abs(it.q)}`],
});

/* ═══ 7, 8 — multiplying and dividing ══════════════════════════════════════*/

/** Two fractions kx/b-ish whose product is a plain number fraction. */
function pairOf(r) {
  for (;;) {
    const a = r.int(1, 6), b = r.int(2, 9), c = r.int(1, 9), d = r.int(1, 6);
    if (gcd(a, b) !== 1 || gcd(c, d) !== 1) continue;
    return { a, b, c, d };
  }
}
const low = (n, d) => { const g = gcd(n, d); return [n / g, d / g]; };

const afTimes = section("af-mult", "af-times", {
  label: "7 · Multiplying",
  blurb: "Top × top, bottom × bottom — cancelling first is easier.",
  heading: "Step 7: multiplying algebraic fractions",
  instruction: "Multiply the tops together and the bottoms together. It is easier to CANCEL FIRST: any factor on a top " +
    "cancels with the same factor on either bottom — here the x's cancel. Give the answer in its lowest terms.",
  make: (r) => pairOf(r),
  render: (it) => eq(`${F(kx(it.a), String(it.b))} × ${F(String(it.c), kx(it.d))} = ${stack(box(), box())}`),
  worked: () => worked(eq(`${F("2x", "3")} × ${F("9", "4x")} = ${F("18x", "12x")} = ${F("3", "2")}`) +
    say("The x's cancel. 2 × 9 = 18 over 3 × 4 = 12, and 18/12 = 3/2.")),
  key(it) { const [n, d] = low(it.a * it.c, it.b * it.d); return [want.num(n), want.num(d)]; },
  answer(it) { const [n, d] = low(it.a * it.c, it.b * it.d); return [`${n}/${d}`]; },
});

const afDivide = section("af-div", "af-times", {
  label: "8 · Dividing",
  blurb: "Turn the second fraction over, then multiply.",
  heading: "Step 8: dividing algebraic fractions",
  instruction: "Dividing by a fraction is multiplying by it TURNED OVER. Turn the second fraction upside down, change ÷ " +
    "to ×, and multiply as in step 7. Lowest terms.",
  make: (r) => pairOf(r),
  render: (it) => eq(`${F(kx(it.a), String(it.b))} ÷ ${F(kx(it.d), String(it.c))} = ${stack(box(), box())}`),
  worked: () => worked(eq(`${F("2x", "3")} ÷ ${F("4x", "9")} = ${F("2x", "3")} × ${F("9", "4x")} = ${F("3", "2")}`) +
    say("Turn 4x/9 over to get 9/4x, then multiply: 18x/12x = 3/2.")),
  key(it) { const [n, d] = low(it.a * it.c, it.b * it.d); return [want.num(n), want.num(d)]; },
  answer(it) { const [n, d] = low(it.a * it.c, it.b * it.d); return [`${n}/${d}`]; },
});

/* ═══ 9–12 — adding and taking away ════════════════════════════════════════*/

const afSame = section("af-same", "af-add", {
  label: "9 · The same denominator",
  blurb: "Add the tops; the bottom stays.",
  heading: "Step 9: adding with the same denominator",
  instruction: "When the bottoms are already the same, add (or take away) the TOPS and keep the bottom — just as 3 " +
    "sevenths and 2 sevenths make 5 sevenths.",
  cols: 2,
  make(r) {
    const n = r.int(3, 11), a = r.int(2, 9), b = r.int(1, 8), s = r.chance(0.5) && a > b ? -1 : 1;
    return { n, a, b, s };
  },
  render: (it) => eq(`${F(kx(it.a), String(it.n))} ${it.s > 0 ? "+" : "−"} ${F(kx(it.b), String(it.n))} = ${stack(`${box()}x`, String(it.n))}`),
  worked: () => worked(eq(`${F("3x", "7")} + ${F("2x", "7")} = ${F("5x", "7")}`) + say("3x + 2x = 5x, over the same 7.")),
  key: (it) => [want.num(it.a + it.s * it.b)],
  answer: (it) => [`${it.a + it.s * it.b}x/${it.n}`],
});

const afLcd = section("af-lcd", "af-add", {
  label: "10 · Number denominators",
  blurb: "x/2 + x/3: make both bottoms the LCD.",
  heading: "Step 10: different numbers underneath",
  instruction: "Find the LOWEST COMMON DENOMINATOR — the smallest number both bottoms go into. Multiply the top and " +
    "bottom of each fraction to give it that bottom, then add the tops. Lowest terms.",
  make(r, o) {
    const t = tier(o);
    for (;;) {
      const a = r.int(2, t === "gentle" ? 5 : 9), b = r.int(2, t === "gentle" ? 6 : 12), p = t === "gentle" ? 1 : r.int(1, 4), q = t === "gentle" ? 1 : r.int(1, 4);
      const s = r.chance(0.3) ? -1 : 1;
      if (a === b || gcd(p, a) !== 1 || gcd(q, b) !== 1) continue;
      const L = (a * b) / gcd(a, b);
      const top = p * (L / a) + s * q * (L / b);
      if (top <= 0) continue;
      const [n, d] = low(top, L);
      if (d === 1) continue;
      return { a, b, p, q, s, n, d };
    }
  },
  render: (it) => eq(`${F(kx(it.p), String(it.a))} ${it.s > 0 ? "+" : "−"} ${F(kx(it.q), String(it.b))} = ${stack(`${box()}x`, box())}`),
  worked: () => worked(eq(`${F("x", "2")} + ${F("x", "3")} = ${F("3x", "6")} + ${F("2x", "6")} = ${F("5x", "6")}`) +
    say("The LCD of 2 and 3 is 6. x/2 is 3x/6, and x/3 is 2x/6. Add the tops: 5x/6.")),
  key: (it) => [want.num(it.n), want.num(it.d)],
  answer: (it) => [`${it.n}x/${it.d}`],
});

const afMono = section("af-mono", "af-add", {
  label: "11 · Letter denominators",
  blurb: "2/x + 3/(2x): the LCD has the letter in it.",
  heading: "Step 11: a letter underneath",
  instruction: "The same method, with the letter in the denominator: the LCD of x and 2x is 2x. Give each fraction that " +
    "bottom, add the tops, and put the answer in its lowest terms.",
  hardest: true,
  make(r) {
    for (;;) {
      const a = r.int(1, 6), b = r.int(1, 7), k = r.int(2, 5), s = r.chance(0.3) ? -1 : 1;
      const top = a * k + s * b;
      if (top <= 0) continue;
      const [n, d] = low(top, k);
      return { a, b, k, s, n, d };
    }
  },
  render: (it) => eq(`${F(String(it.a), "x")} ${it.s > 0 ? "+" : "−"} ${F(String(it.b), kx(it.k))} = ${stack(box(), `${box()}x`)}`),
  worked: () => worked(eq(`${F("2", "x")} + ${F("3", "2x")} = ${F("4", "2x")} + ${F("3", "2x")} = ${F("7", "2x")}`) +
    say("The LCD is 2x: 2/x is 4/2x. Add the tops: 4 + 3 = 7, over 2x.")),
  key: (it) => [want.num(it.n), want.num(it.d)],
  answer: (it) => [`${it.n}/${it.d === 1 ? "" : it.d}x`],
});

const afBinomial = section("af-binom", "af-add", {
  label: "12 · Bracket denominators",
  blurb: "Each top times the OTHER bottom.",
  heading: "Step 12: brackets underneath",
  instruction: "When the bottoms are two different brackets, the LCD is the two multiplied together. Multiply each top " +
    "by the OTHER fraction's bottom, add, and collect the x's and the numbers. The bottom is left as the two brackets.",
  hardest: true,
  defaultCount: 3,
  make(r) {
    for (;;) {
      const a = r.int(1, 5), b = r.int(1, 5), p = r.pick([-4, -3, -2, -1, 1, 2, 3, 4]), q = r.pick([-4, -3, -2, -1, 1, 2, 3, 4]);
      if (p === q) continue;
      return { a, b, p, q };
    }
  },
  render: (it) => eq(`${F(String(it.a), xp(it.p))} + ${F(String(it.b), xp(it.q))} = ${stack(`${box()}x + ${box()}`, `<span data-tex="(${xp(it.p)})(${xp(it.q)})">(${xp(it.p)})(${xp(it.q)})</span>`)}`),
  worked: () => worked(eq(`${F("2", "x + 1")} + ${F("3", "x - 2")} = ${F("2(x - 2) + 3(x + 1)", "(x + 1)(x - 2)")} = ${F("5x - 1", "(x + 1)(x - 2)")}`) +
    say("2(x − 2) + 3(x + 1) = 2x − 4 + 3x + 3 = 5x − 1.")),
  key: (it) => [want.num(it.a + it.b), want.num(it.a * it.q + it.b * it.p)],
  answer: (it) => [`(${it.a + it.b}x ${it.a * it.q + it.b * it.p < 0 ? "−" : "+"} ${Math.abs(it.a * it.q + it.b * it.p)}) over the two brackets`],
});

/* ═══ 13–15 — equations and word problems ══════════════════════════════════*/

const afSolveNum = section("af-solve-n", "af-solve", {
  label: "13 · Equations with numbers underneath",
  blurb: "Multiply every term by the LCD: the fractions vanish.",
  heading: "Step 13: clearing the fractions",
  instruction: "In an EQUATION you can get rid of the fractions altogether: multiply EVERY term on both sides by the " +
    "lowest common denominator. What is left is an ordinary equation — solve it.",
  make(r, o) {
    const t = tier(o);
    for (;;) {
      const a = r.int(2, 6), b = r.int(2, 8);
      if (a === b) continue;
      const L = (a * b) / gcd(a, b);
      const s = t !== "gentle" && r.chance(0.4) ? -1 : 1;
      const k = L / a + s * (L / b);
      if (k <= 0) continue;
      const x = L * r.int(1, 3);
      return { a, b, s, x, c: (x * k) / L, L };
    }
  },
  render: (it) => eq(`${F("x", String(it.a))} ${it.s > 0 ? "+" : "−"} ${F("x", String(it.b))} = ${it.c}`) + eq(`multiply through by ${box()}: &nbsp; x = ${box()}`),
  worked: () => worked(eq(`${F("x", "2")} + ${F("x", "3")} = 5`) + say("The LCD is 6. Six times every term: 3x + 2x = 30, so 5x = 30 and x = 6.")),
  key: (it) => [want.num(it.L), want.num(it.x)],
  answer: (it) => [`× ${it.L}; x = ${it.x}`],
});

const afSolveAlg = section("af-solve-x", "af-solve", {
  label: "14 · Equations with letters underneath",
  blurb: "6/x = 3; and cross-multiplying two fractions.",
  heading: "Step 14: the letter underneath",
  instruction: "With x in a denominator, multiply both sides by that denominator to bring x up top. When ONE fraction " +
    "equals ONE fraction, CROSS-MULTIPLY: each top times the other bottom. Check that your answer does not make a " +
    "bottom 0.",
  make(r, o) {
    const t = tier(o);
    if (t === "gentle" || r.chance(0.35)) {
      const x = r.int(2, 9), b = r.int(2, 9), p = t === "gentle" ? 0 : r.int(0, 5);
      return { kind: 0, x, b, p, a: b * (x + p) };
    }
    for (;;) {
      /* a/(x + p) = b/(x + q)  →  x = (bp − aq)/(a − b) */
      const a = r.int(1, 6), b = r.int(1, 6), p = r.int(-4, 5), q = r.int(-4, 5);
      if (a === b || p === q) continue;
      const x = (b * p - a * q) / (a - b);
      if (!Number.isInteger(x) || x + p === 0 || x + q === 0 || Math.abs(x) > 12) continue;
      return { kind: 1, a, b, p, q, x };
    }
  },
  render: (it) => (it.kind === 0
    ? eq(`${F(String(it.a), xp(it.p))} = ${it.b} &nbsp; x = ${box()}`)
    : eq(`${F(String(it.a), xp(it.p))} = ${F(String(it.b), xp(it.q))} &nbsp; x = ${box()}`)),
  worked: () => worked(eq(`${F("3", "x + 1")} = ${F("2", "x - 1")}`) + say("Cross-multiply: 3(x − 1) = 2(x + 1), so 3x − 3 = 2x + 2 and x = 5. Check: 3/6 = 2/4 = ½.")),
  key: (it) => [want.num(it.x)],
  answer: (it) => [`x = ${num(it.x)}`],
});

const TAPS = [[3, 6, 2], [4, 12, 3], [6, 12, 4], [10, 15, 6], [12, 24, 8], [20, 30, 12], [6, 3, 2], [12, 6, 4]];
const WORD = [
  (r) => { const x = 6 * r.int(1, 8); return { text: `A number, half of it and a third of it add up to ${x + x / 2 + x / 3}. What is the number?`, v: x, how: `x + x/2 + x/3 = ${x + x / 2 + x / 3}: multiply by 6, 11x = ${11 * x}` }; },
  (r) => { const [a, b, tgt] = r.pick(TAPS); return { text: `One tap fills a tank in ${a} hours and another in ${b} hours. How many hours do they take to fill it together?`, v: tgt, how: `1/${a} + 1/${b} = 1/t` }; },
  (r) => { const [a, b, tgt] = r.pick(TAPS); return { text: `Ade can weed a farm in ${a} days and Bola in ${b} days. How many days will the two of them take working together?`, v: tgt, how: `1/${a} + 1/${b} = 1/t` }; },
  (r) => {
    /* (d − k + m)/(d + m) = 1/2  →  d = 2k − m */
    const k = r.int(2, 6), m = r.int(1, 3), d = 2 * k - m;
    return { text: `The top of a fraction is ${k} less than its bottom. If ${m} is added to both the top and the bottom, the fraction becomes one half. What is the bottom of the original fraction?`, v: k > m ? d : NaN, how: `(d − ${k} + ${m})/(d + ${m}) = 1/2` };
  },
  (r) => { const x = 12 * r.int(1, 5); return { text: `A third of a number is ${x / 3 - x / 4} more than a quarter of it. What is the number?`, v: x, how: `x/3 − x/4 = ${x / 3 - x / 4}: multiply by 12, x = ${x}` }; },
  (r) => { const n = r.int(4, 9), sh = r.int(2, 6) * 100; return { text: `₦${(n * sh).toLocaleString("en-NG")} is shared equally among some children, and each gets ₦${sh}. How many children are there?`, v: n, how: `${n * sh}/x = ${sh}` }; },
];

const afWord = section("af-word", "af-solve", {
  label: "15 · Word problems",
  blurb: "Parts of a number, taps and workers, a fraction to find.",
  heading: "Step 15: algebraic fractions in stories",
  instruction: "Let the unknown be x and write the story as an equation with fractions in it. For work done together: " +
    "someone who takes a days does 1/a of the job each day, so 1/a + 1/b = 1/t. Then clear the fractions and solve.",
  defaultCount: 4,
  make: (r) => { for (;;) { const s = r.pick(WORD)(r); if (Number.isInteger(s.v) && s.v > 0) return s; } },
  render: (it) => ask(`${it.text} ${box()}`),
  worked: () => worked(ask("One tap fills a tank in 3 hours and another in 6 hours. How long together?") +
    say("In one hour the first fills 1/3 and the second 1/6 — together 1/3 + 1/6 = 1/2 of the tank. So the whole tank takes 2 hours.")),
  key: (it) => [want.num(it.v)],
  answer: (it) => [`${it.how}; ${it.v}`],
});

export const AF_EXERCISES = [afValue, afUndefined, afNumbers, afLetters, afFactor, afQuad, afTimes, afDivide, afSame, afLcd, afMono, afBinomial, afSolveNum, afSolveAlg, afWord];
