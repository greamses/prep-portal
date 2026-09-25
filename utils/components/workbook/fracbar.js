/* ============================================================================
   PRINTABLE WORKBOOK — fraction bars you cut up yourself
   ----------------------------------------------------------------------------
   Two thirds and one quarter cannot be added, and a child who is told to
   "find the common denominator" has been given the answer to a question they
   have not felt yet. So here they do the thing itself: each fraction is a bar,
   and every part of a bar can be CUT — in half, in three, in five — which
   changes what the parts are called without changing how much is coloured.
   Cut both bars until the parts match, and the adding is counting again.

     1/2  ▓▓▓▓▓▓░░░░░░        cut in 3   ▓▓░▓▓░▓▓░░░░░░  → 3/6
     1/3  ▓▓▓▓░░░░░░░░        cut in 2   ▓▓░▓▓░░░░░░░░░  → 2/6

   Nothing may be added until the two bars agree, and that is what is marked:
   `want.split` checks the two denominators are the same, and only then do the
   boxes beside them count for anything. The point of the exercise is the
   cutting, not the arithmetic that follows it.

   `splitRight` and `cutsFor` have no DOM in them, so the checks run in Node.
   ========================================================================== */

const BAR_MM = 76;
const BAR_H = 10;
const GAP = 4;
const INK = "#2a2723";
const PAPER = "#fffdf8";
const SHADE = "#bfe3ff";
const FAINT = "#b8b0a3";

/** The cuts a bar offers: ×2, ×3, ×4, ×5 — and back to how it started. */
export const CUTS = [2, 3, 4, 5];

/** Every denominator a bar of `den` can be cut into with one cut of each size. */
export const cutsFor = (den) => CUTS.map((k) => den * k);

/** The lowest denominator both fractions can be cut to. */
export function commonDen(a, b) {
  const gcd = (x, y) => (y ? gcd(y, x % y) : x);
  return (a * b) / gcd(a, b);
}

/**
 * Are the bars ready to be added? `state` is { a: cutsA, b: cutsB }, each the
 * multiplier the child has cut that bar by (1 = untouched).
 *   right when   a.den × cutsA === b.den × cutsB
 */
export function splitRight(state, { a, b } = {}) {
  if (!state || !a || !b) return false;
  const ka = Number(state.a) || 1;
  const kb = Number(state.b) || 1;
  if (ka < 1 || kb < 1) return false;
  return a.den * ka === b.den * kb;
}

/** What the two bars say once they have been cut. */
export function splitState(state, { a, b } = {}) {
  const ka = Number(state?.a) || 1;
  const kb = Number(state?.b) || 1;
  return {
    a: { num: a.num * ka, den: a.den * ka },
    b: { num: b.num * kb, den: b.den * kb },
    same: a.den * ka === b.den * kb,
  };
}

/* ── the drawing ─────────────────────────────────────────────────────────── */

const f = (n) => Number(n.toFixed(2));

/**
 * One bar: `den` parts, `num` of them coloured. `cut` draws the new lines
 * inside each part faintly, so the child can see the old parts under the new.
 */
export function barSvg({ num, den, was = 0, label = "" } = {}) {
  const cell = BAR_MM / den;
  let body = "";
  for (let c = 0; c < den; c++) {
    body += `<rect class="fb-part" data-part="${c}"${c < num ? ' data-shaded="1"' : ""} x="${f(c * cell)}" y="0"` +
      ` width="${f(cell)}" height="${BAR_H}" fill="${c < num ? SHADE : PAPER}" stroke="${INK}" stroke-width="0.4"/>`;
  }
  /* the parts it was cut FROM, drawn over the top as a heavier line, so the
     child can still see the half that became three sixths */
  if (was && was < den) {
    const step = BAR_MM / was;
    for (let c = 1; c < was; c++) {
      body += `<line x1="${f(c * step)}" y1="0" x2="${f(c * step)}" y2="${BAR_H}" stroke="${INK}" stroke-width="0.9"/>`;
    }
  }
  body += `<rect x="0" y="0" width="${BAR_MM}" height="${BAR_H}" fill="none" stroke="${INK}" stroke-width="0.9"/>`;
  return `<svg class="fb-bar" viewBox="-0.6 -0.6 ${BAR_MM + 1.2} ${BAR_H + 1.2}" width="${BAR_MM}mm" height="${BAR_H}mm"` +
    ` role="img" aria-label="${label || `${num} out of ${den}`}" data-num="${num}" data-den="${den}">${body}</svg>`;
}

const nameOf = (num, den) => `<span class="fb-name"><b>${num}</b><i></i><b>${den}</b></span>`;

/**
 * Two fractions as bars, to be cut until they match.
 *   a, b   { num, den }
 *   op     "+" or "−" — what will be done once they agree
 */
export function splitHtml({ a, b, op = "+", label = "" } = {}) {
  const row = (side, fr) =>
    `<div class="fb-row" data-side="${side}">` +
    `<span class="fb-face">${nameOf(fr.num, fr.den)}</span>` +
    `<span class="fb-stage">${barSvg({ ...fr, label: `${fr.num} out of ${fr.den}` })}</span>` +
    `<span class="fb-cuts"></span></div>`;
  return `<div class="fb-wrap wb-nomath" data-split="1" data-a="${a.num},${a.den}" data-b="${b.num},${b.den}"` +
    ` data-op="${op}"${label ? ` aria-label="${label}"` : ""}>` +
    row("a", a) + `<div class="fb-op">${op}</div>` + row("b", b) +
    `<p class="fb-say" data-say>Cut both bars until the parts are the same size.</p></div>`;
}

/* ── on screen ───────────────────────────────────────────────────────────── */

const SCISSORS = `<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path d="M7 4 17 17M17 4 7 17" stroke="#2a2723" stroke-width="2" stroke-linecap="round" fill="none"/><circle cx="6" cy="19" r="2.6" fill="none" stroke="#2a2723" stroke-width="2"/><circle cx="18" cy="19" r="2.6" fill="none" stroke="#2a2723" stroke-width="2"/></svg>`;

/**
 *   mountSplit(wrap, { saved, onChange })
 *     saved   { a, b } — how many times each bar has been cut
 *   → { state(), set(), clear(), dispose() }
 */
export function mountSplit(wrap, { saved = null, onChange = () => {} } = {}) {
  const printed = wrap.innerHTML;
  const read = (s) => { const [num, den] = String(s).split(",").map(Number); return { num, den }; };
  const A = read(wrap.dataset.a);
  const B = read(wrap.dataset.b);
  const op = wrap.dataset.op || "+";
  let cuts = saved && saved.a ? { a: Number(saved.a) || 1, b: Number(saved.b) || 1 } : { a: 1, b: 1 };

  wrap.classList.add("is-live");

  const paint = () => {
    ["a", "b"].forEach((side) => {
      const fr = side === "a" ? A : B;
      const k = cuts[side];
      const row = wrap.querySelector(`.fb-row[data-side="${side}"]`);
      row.querySelector(".fb-face").innerHTML = nameOf(fr.num * k, fr.den * k);
      row.querySelector(".fb-stage").innerHTML = barSvg({
        num: fr.num * k, den: fr.den * k, was: k > 1 ? fr.den : 0,
        label: `${fr.num * k} out of ${fr.den * k}`,
      });
      row.querySelector(".fb-cuts").innerHTML =
        CUTS.map((c) => `<button class="fb-cut" type="button" data-side="${side}" data-cut="${c}"` +
          ` data-tip="Cut every part into ${c}">${SCISSORS}<b>×${c}</b></button>`).join("") +
        `<button class="fb-cut fb-cut--undo" type="button" data-side="${side}" data-cut="0" data-tip="Put this bar back">↺</button>`;
    });
    const same = A.den * cuts.a === B.den * cuts.b;
    wrap.classList.toggle("is-same", same);
    const say = wrap.querySelector("[data-say]");
    if (same && (cuts.a > 1 || cuts.b > 1)) {
      const d = A.den * cuts.a;
      say.innerHTML = `Both bars are in <b>${d}</b>ths now — ${A.num * cuts.a} and ${B.num * cuts.b}, ` +
        `so you can ${op === "+" ? "add" : "take away"}.`;
    } else if (same) {
      say.textContent = "These parts are already the same size.";
    } else {
      say.textContent = "Cut both bars until the parts are the same size.";
    }
  };

  const onClick = (e) => {
    const btn = e.target.closest(".fb-cut");
    if (!btn) return;
    const side = btn.dataset.side;
    const c = Number(btn.dataset.cut);
    const before = { ...cuts };
    cuts[side] = c === 0 ? 1 : cuts[side] * c;
    /* a bar cut past a hundred parts is a smear, not a lesson */
    const fr = side === "a" ? A : B;
    if (fr.den * cuts[side] > 60) { cuts[side] = before[side]; wobble(btn); return; }
    paint();
    onChange({ ...cuts }, before);
  };
  const wobble = (el) => {
    el.classList.remove("is-no"); void el.offsetWidth; el.classList.add("is-no");
    setTimeout(() => el.classList.remove("is-no"), 420);
  };

  wrap.addEventListener("click", onClick);
  paint();

  return {
    state: () => ({ ...cuts }),
    right: () => splitRight(cuts, { a: A, b: B }),
    set(next) { cuts = next && next.a ? { a: Number(next.a) || 1, b: Number(next.b) || 1 } : { a: 1, b: 1 }; paint(); },
    clear() {
      const before = { ...cuts };
      cuts = { a: 1, b: 1 };
      paint();
      onChange({ ...cuts }, before);
    },
    dispose() {
      wrap.removeEventListener("click", onClick);
      wrap.classList.remove("is-live", "is-same");
      wrap.innerHTML = printed;
    },
  };
}
