/* ============================================================================
   PRINTABLE WORKBOOK — the digit shift: × and ÷ by powers of ten
   ----------------------------------------------------------------------------
   A board of places with the figures of a number standing in them, and a
   DECIMAL POINT THAT DOES NOT MOVE. You take hold of the figures and slide them
   left or right; the point stays where it is, nailed between the units and the
   tenths, and the number changes because its figures are standing somewhere
   else.

   THAT IS THE WHOLE LESSON. "Move the point two places" is how most of us were
   taught and it is the wrong way round: the point is part of the paper, not
   part of the number. A figure is worth ten times more one place to the left
   because that is what a place IS. A child who has slid the figures and watched
   a nought come in to hold an empty place has seen why 3.4 × 100 is 340 and not
   3.400, which is the mistake that sentence produces.

   WHAT IT DOES:
     slide      drag the figures, or the arrows, or the arrow keys. It snaps to
                whole columns, because half a place is not a place.
     hold       a place left empty between the figures and the point fills with
                a nought — drawn FAINT, because it is holding the place rather
                than counting anything. Those are the noughts people forget.
     read       the number is read back off the board wherever the figures are
                standing, and the board says which sum that slide just did.
     stop       figures cannot slide off the end of the board. There is no
                column past the ten thousands on this card and the card says so
                rather than quietly losing a figure.

   WHICH WAY A SUM GOES, which is the other thing this is for:

     × 10ⁿ   n places to the LEFT        every figure worth ten times more
     ÷ 10ⁿ   n places to the RIGHT       every figure worth ten times less

   and a NEGATIVE power turns that round, whichever sum it is: × 10⁻² is ÷ 100
   and goes right, ÷ 10⁻² is × 100 and goes left. One line of arithmetic says
   all four (`shiftFor`), and the board says it in words when the power is
   negative, because that is the case nobody believes the first time.

   IT IS NEVER MARKED. It is working, like the counters and the dice: what the
   child reads off it goes in an answer box beside it.
   ========================================================================== */

/* THE BOARD IS AS WIDE AS THE SUM NEEDS, and no wider. A fixed board has to be
   either too narrow for 3.45 ÷ 1000 or too wide to read, so it is cut to the
   places this number visits on its way to this answer, plus one spare column at
   each end to overshoot into. The columns do not move WHILE you slide — only
   when a new sum is set — so the point and the places are still fixed, which is
   the only promise this tool makes. */
export const MAX_COLS = 13;

/** What a place is worth, written out — the heading of its column. */
export function worthOf(p) {
  if (p >= 0) return String(10 ** p);
  return `0.${"0".repeat(-p - 1)}1`;
}

/* The place tints of the whole site: units, tens and hundreds OF ANY PERIOD,
   butter / sky / leaf, so a column here is the same column as a column on a
   place-value chart or a written sum. (Stated in maths-workbook/js/blocks.js
   and base-blocks/js/config.js too — the three agree on purpose.) */
const PERIOD = ["#f4c95d", "#6fb7e8", "#7cc47c"];
export const placeFill = (p) => PERIOD[((p % 3) + 3) % 3];

/**
 * The places this board shows: everywhere the figures stand now, everywhere
 * they will stand when the sum is done, the units and the tenths either way
 * (the point has to have a column on each side of it), and one spare at each
 * end so that going too far is something you can see yourself do.
 */
export function windowFor(figs, want = 0) {
  const ps = [...figs.keys()];
  const all = ps.length ? ps.concat(ps.map((p) => p + want)) : [0];
  const needHi = Math.max(0, ...all);
  const needLo = Math.min(-1, ...all);
  let hi = needHi + 1;
  let lo = needLo - 1;
  /* the spare columns are the first thing to go when it will not all fit */
  while (hi - lo + 1 > MAX_COLS && (hi > needHi || lo < needLo)) {
    if (hi > needHi) hi -= 1;
    else lo += 1;
  }
  return { hi, lo, cols: hi - lo + 1 };
}

/** The column a place is drawn in, counting from the left of the board. */
export const colOf = (win, p) => win.hi - p;

const SUP = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
/** "10⁻²" — the power written the way it is written. */
export const sayPower = (n) => `10${[...String(n)].map((c) => SUP[c] || c).join("")}`;

/* ── the number ────────────────────────────────────────────────────────────*/

/**
 * The FIGURES of a typed number, by the place each one stands in: "3.45" is
 * 3 at the units, 4 at the tenths, 5 at the hundredths.
 *
 * THE FIGURES ARE THE DIGITS FROM THE FIRST ONE THAT COUNTS TO THE LAST ONE
 * THAT COUNTS. A nought outside that span is not a figure at all — it is
 * already holding a place, and the board puts its own holding noughts back
 * wherever they are needed. Carried along as a figure it would be carried into
 * a place where it means something else: the nought of 0.07 slid two places
 * left would print itself as "07", and the three noughts of 1000 would make
 * 1000 ÷ 10 come out as "1000" with the figures merely further over.
 *
 * Noughts BETWEEN two figures stay — they are part of the shape of the number
 * and the whole run slides as one, which is what a track of figures is.
 *
 * → a Map of place → figure, or null if that is not a number.
 */
export function figuresOf(text) {
  const t = String(text ?? "").trim().replace(/\s|,/g, "");
  if (!/^\d{1,6}(\.\d{1,6})?$|^\.\d{1,6}$/.test(t)) return null;
  const [whole = "", frac = ""] = t.split(".");
  const digits = [];
  [...whole].forEach((ch, i) => digits.push({ p: whole.length - 1 - i, d: Number(ch) }));
  [...frac].forEach((ch, i) => digits.push({ p: -1 - i, d: Number(ch) }));
  let a = 0;
  let b = digits.length - 1;
  while (a <= b && digits[a].d === 0) a += 1;
  while (b >= a && digits[b].d === 0) b -= 1;
  const figs = new Map();
  for (let i = a; i <= b; i += 1) figs.set(digits[i].p, digits[i].d);
  return figs;
}

/**
 * What the board READS as, with the figures standing `shift` places over.
 *
 * → { text, cells } where a cell is { p, ch, hold } — `hold` for a nought that
 *   is only holding the place, which is drawn faint and is the whole point.
 */
export function reading(figs, shift) {
  const cur = new Map();
  figs.forEach((d, p) => cur.set(p + shift, d));
  const ps = [...cur.keys()];
  /* always written as far as the units, from either side: 45 ÷ 100 is 0.45 and
     not .45, and 0.45 × 100 is 45 and not 45. */
  const top = ps.length ? Math.max(0, ...ps) : 0;
  const bottom = ps.length ? Math.min(0, ...ps) : 0;

  const whole = [];
  for (let p = top; p >= 0; p--) {
    whole.push(cur.has(p) ? { p, ch: String(cur.get(p)), hold: false } : { p, ch: "0", hold: true });
  }
  const frac = [];
  for (let p = -1; p >= bottom; p--) {
    frac.push(cur.has(p) ? { p, ch: String(cur.get(p)), hold: false } : { p, ch: "0", hold: true });
  }
  /* A nought past the last figure is not written at all: 34.0 is 34. It does
     not matter whether it was typed or held — nothing is standing after it. */
  while (frac.length && frac[frac.length - 1].ch === "0") frac.pop();

  const text = whole.map((c) => c.ch).join("") + (frac.length ? `.${frac.map((c) => c.ch).join("")}` : "");
  return { text, cells: whole.concat(frac) };
}

/* ── the sum ───────────────────────────────────────────────────────────────*/

/**
 * HOW FAR THE FIGURES GO, and which way. Positive is LEFT.
 *
 * Multiplying moves them left and dividing moves them right — and a negative
 * power turns it round, whichever of the two it is, because 10⁻² is 1/100 and
 * multiplying by a hundredth is dividing by a hundred.
 */
export const shiftFor = (op, power) => (op === "÷" ? -power : power);

/** How far the figures CAN go before one falls off the board. */
export function limits(figs, win) {
  const ps = [...figs.keys()];
  if (!ps.length) return { min: 0, max: 0 };
  return { min: win.lo - Math.min(...ps), max: win.hi - Math.max(...ps) };
}

/**
 * Whether a sum can be done on this board, and why not when it cannot. The
 * same shape every written board uses: refuse in words, never silently.
 */
export function checkSum(figs, op, power) {
  if (!figs) return { ok: false, message: "Write a number — figures, and a point if it has one." };
  if (!figs.size) return { ok: false, message: "That is nought, and nought stays nought wherever you slide it." };
  if (!Number.isInteger(power) || Math.abs(power) > 6) {
    return { ok: false, message: "A whole power of ten, from −6 to 6." };
  }
  const want = shiftFor(op, power);
  const ps = [...figs.keys()];
  const all = ps.concat(ps.map((p) => p + want));
  const span = Math.max(0, ...all) - Math.min(-1, ...all) + 1;
  if (span > MAX_COLS) {
    return {
      ok: false,
      message: `That sum runs across ${span} places — more than a card this size can show. `
        + "Try a smaller power, or a shorter number.",
    };
  }
  return { ok: true };
}

/** The sum said in one line: "3.45 × 10² = 345". */
export function saySum(figs, op, power) {
  const from = reading(figs, 0).text;
  const to = reading(figs, shiftFor(op, power)).text;
  return `${from} ${op} ${sayPower(power)} = ${to}`;
}

/** What a slide of `shift` places DID, said as a sum by itself. */
export function sayShift(shift) {
  if (!shift) return "They are back where they started.";
  const n = Math.abs(shift);
  const places = n === 1 ? "One place" : `${n} places`;
  return shift > 0
    ? `${places} to the LEFT — that is × ${10 ** n}.`
    : `${places} to the RIGHT — that is ÷ ${10 ** n}.`;
}

/* ── the card ──────────────────────────────────────────────────────────────*/

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/**
 * Put the card in `host`.
 *
 *   saved     what it was showing last time, if anything
 *   onChange  told whenever the sum or the slide changes, so the page can keep it
 *
 * → { el, destroy() }
 */
export function mountShift(host, { saved = null, onChange = null } = {}) {
  const el = document.createElement("div");
  /* NOT `.wb-tool`: that name is claimed twice in workbook.css and the LATER
     rule is the one for an instrument lying on the paper — `position: absolute`,
     and an absolutely positioned board has no width to divide into columns, so
     the places size themselves to their headings and the card walks off the
     side of the panel (measured: 1036px of board in a 480px panel). */
  el.className = "wb-shift";
  el.innerHTML = `
    <div class="wb-shift__sum">
      <label class="wb-shift__field">
        <span>Number</span>
        <input class="wb-shift__n" type="text" inputmode="decimal" autocomplete="off"
               spellcheck="false" maxlength="9" aria-label="The number to slide">
      </label>
      <div class="wb-shift__ops" role="group" aria-label="Multiply or divide">
        <button type="button" class="wb-shift__op" data-op="×" aria-pressed="true">×</button>
        <button type="button" class="wb-shift__op" data-op="÷" aria-pressed="false">÷</button>
      </div>
      <label class="wb-shift__field wb-shift__field--p">
        <span>10 to the</span>
        <input class="wb-shift__p" type="text" inputmode="numeric" autocomplete="off"
               spellcheck="false" maxlength="2" aria-label="The power of ten, which may be negative">
      </label>
    </div>

    <div class="wb-shift__board">
      <div class="wb-shift__heads" aria-hidden="true"></div>
      <div class="wb-shift__lane" tabindex="0" role="slider" aria-label="Slide the figures"
           aria-valuemin="0" aria-valuemax="0" aria-valuenow="0">
        <div class="wb-shift__holds" aria-hidden="true"></div>
        <div class="wb-shift__track"></div>
        <div class="wb-shift__point" aria-hidden="true"></div>
      </div>
    </div>

    <p class="wb-shift__read" aria-live="polite"></p>
    <p class="wb-shift__say" aria-live="polite"></p>

    <div class="wb-shift__moves">
      <button type="button" class="pp-btn wb-shift__go" data-go="1" aria-label="Slide the figures one place to the left">◀</button>
      <button type="button" class="pp-btn wb-shift__back">Back to the start</button>
      <button type="button" class="pp-btn wb-shift__go" data-go="-1" aria-label="Slide the figures one place to the right">▶</button>
    </div>`;
  host.appendChild(el);

  const q = (s) => el.querySelector(s);
  const nIn = q(".wb-shift__n");
  const pIn = q(".wb-shift__p");
  const heads = q(".wb-shift__heads");
  const lane = q(".wb-shift__lane");
  const holds = q(".wb-shift__holds");
  const track = q(".wb-shift__track");
  const point = q(".wb-shift__point");
  const readEl = q(".wb-shift__read");
  const sayEl = q(".wb-shift__say");

  let state = { n: "3.45", op: "×", power: 2, shift: 0 };
  if (saved && typeof saved === "object") state = { ...state, ...saved };

  let figs = figuresOf(state.n) || figuresOf("3.45");

  let win = windowFor(figs, shiftFor(state.op, state.power));

  const cw = () => lane.clientWidth / win.cols;

  /* ── the board ─────────────────────────────────────────────────────────── */

  /**
   * Cut the board to the sum. This is the ONLY thing that moves a heading or
   * the point, and it runs when a new sum is set — never while the figures are
   * being slid, which is when the places have to be able to be trusted.
   */
  function layout() {
    win = windowFor(figs, shiftFor(state.op, state.power));
    el.style.setProperty("--sh-cols", String(win.cols));
    heads.innerHTML = Array.from({ length: win.cols }, (_, i) => {
      const p = win.hi - i;
      return `<span class="wb-shift__head" style="--sh-fill:${placeFill(p)}">${worthOf(p)}</span>`;
    }).join("");
    /* the point, on the line between the units column and the tenths column —
       the entire tool is the claim that it stays there */
    point.style.left = `${((colOf(win, 0) + 1) / win.cols) * 100}%`;
    draw();
  }

  /* ── drawing ───────────────────────────────────────────────────────────── */

  function draw(dragPx = null) {
    const edge = limits(figs, win);
    state.shift = Math.min(edge.max, Math.max(edge.min, state.shift));

    /* the figures themselves, each in the column it was typed into — the whole
       row then slides, which is the only thing that ever moves */
    track.innerHTML = [...figs.entries()]
      .map(([p, d]) => `<span class="wb-shift__fig" style="grid-column:${colOf(win, p) + 1}">${d}</span>`)
      .join("");
    track.style.transform = `translateX(${dragPx == null ? -state.shift * cw() : dragPx}px)`;
    track.classList.toggle("is-dragging", dragPx != null);

    /* the noughts that hold a place, in the FIXED layer: they belong to the
       board and not to the number, which is exactly what they are for */
    const at = dragPx == null ? state.shift : Math.round(-dragPx / cw());
    const out = reading(figs, at);
    holds.innerHTML = out.cells.filter((c) => c.hold)
      .map((c) => `<span class="wb-shift__hold" style="grid-column:${colOf(win, c.p) + 1}">0</span>`)
      .join("");

    lane.setAttribute("aria-valuemin", String(edge.min));
    lane.setAttribute("aria-valuemax", String(edge.max));
    lane.setAttribute("aria-valuenow", String(at));
    lane.setAttribute("aria-valuetext", `${out.text}, ${sayShift(at).toLowerCase()}`);

    readEl.innerHTML = `<b>${esc(out.text)}</b>`;
    say(at, out);
  }

  /* ── what it is telling you ────────────────────────────────────────────── */

  function say(at, out) {
    const check = checkSum(figs, state.op, state.power);
    if (!check.ok) {
      sayEl.textContent = check.message;
      sayEl.className = "wb-shift__say is-no";
      return;
    }
    const want = shiftFor(state.op, state.power);
    const turned = state.power < 0
      ? ` A negative power turns it round: ${state.op} ${sayPower(state.power)} is `
        + `${state.op === "×" ? "÷" : "×"} ${10 ** Math.abs(state.power)}.`
      : "";

    if (at === want) {
      sayEl.textContent = `${saySum(figs, state.op, state.power)}. The point never moved — the figures did.`;
      sayEl.className = "wb-shift__say is-ok";
      return;
    }
    const to = Math.abs(want) === 1 ? "one place" : `${Math.abs(want)} places`;
    const way = want === 0 ? "nowhere at all" : `${to} to the ${want > 0 ? "LEFT" : "RIGHT"}`;
    sayEl.textContent = at === 0
      ? `Slide the figures ${way}.${turned}`
      : `${sayShift(at)} Not this sum yet — it wants ${way}.${turned}`;
    sayEl.className = "wb-shift__say";
  }

  const keep = () => {
    onChange?.({ ...state });
  };

  /* ── sliding ───────────────────────────────────────────────────────────── */

  function moveBy(by) {
    const edge = limits(figs, win);
    const was = state.shift;
    state.shift = Math.min(edge.max, Math.max(edge.min, state.shift + by));
    if (state.shift === was && by) {
      sayEl.textContent = `There is no column past ${worthOf(by > 0 ? win.hi : win.lo)} on this board.`;
      sayEl.className = "wb-shift__say is-no";
      return;
    }
    draw();
    keep();
  }

  let drag = null;
  lane.addEventListener("pointerdown", (e) => {
    if (e.button != null && e.button !== 0) return;
    drag = { x: e.clientX, from: state.shift };
    lane.setPointerCapture?.(e.pointerId);
    lane.classList.add("is-held");
  });
  lane.addEventListener("pointermove", (e) => {
    if (!drag) return;
    e.preventDefault();
    const edge = limits(figs, win);
    const px = -drag.from * cw() + (e.clientX - drag.x);
    /* never past the ends, even mid-drag: the board has no more columns */
    const lo = -edge.max * cw();
    const hi = -edge.min * cw();
    draw(Math.max(lo, Math.min(hi, px)));
  });
  const letGo = (e) => {
    if (!drag) return;
    const { from, x } = drag;
    drag = null;
    lane.classList.remove("is-held");
    /* Snap to whole columns: half a place is not a place. Sliding one column to
       the left is one place fewer to carry, hence the minus. */
    const edge = limits(figs, win);
    const want = Math.round(from - (e.clientX - x) / cw());
    state.shift = Math.min(edge.max, Math.max(edge.min, want));
    draw();
    keep();
  };
  lane.addEventListener("pointerup", letGo);
  lane.addEventListener("pointercancel", letGo);

  lane.addEventListener("keydown", (e) => {
    const by = e.key === "ArrowLeft" ? 1 : e.key === "ArrowRight" ? -1 : 0;
    if (!by) return;
    e.preventDefault();
    moveBy(by);
  });

  el.querySelectorAll(".wb-shift__go").forEach((b) => {
    b.addEventListener("click", () => moveBy(Number(b.dataset.go)));
  });
  el.querySelector(".wb-shift__back").addEventListener("click", () => {
    state.shift = 0;
    draw();
    keep();
  });

  /* ── setting the sum ───────────────────────────────────────────────────── */

  function setNumber() {
    const got = figuresOf(nIn.value);
    if (!got) {
      sayEl.textContent = "Write a number — figures, and a point if it has one.";
      sayEl.className = "wb-shift__say is-no";
      return;
    }
    figs = got;
    state.n = nIn.value.trim();
    state.shift = 0;
    layout();
    keep();
  }
  nIn.addEventListener("input", setNumber);

  pIn.addEventListener("input", () => {
    /* figures and ONE minus in front of them: the negative powers are the point */
    const t = pIn.value.replace(/[^0-9-]/g, "").replace(/(?!^)-/g, "");
    if (t !== pIn.value) pIn.value = t;
    const n = Number(t);
    if (t === "" || t === "-" || !Number.isFinite(n)) return;
    state.power = n;
    layout();
    keep();
  });

  el.querySelectorAll(".wb-shift__op").forEach((b) => {
    b.addEventListener("click", () => {
      state.op = b.dataset.op;
      el.querySelectorAll(".wb-shift__op").forEach((o) =>
        o.setAttribute("aria-pressed", String(o === b)));
      layout();
      keep();
    });
  });

  /* ── start it ──────────────────────────────────────────────────────────── */

  nIn.value = state.n;
  pIn.value = String(state.power);
  el.querySelectorAll(".wb-shift__op").forEach((o) =>
    o.setAttribute("aria-pressed", String(o.dataset.op === state.op)));
  layout();

  const refit = () => draw();
  window.addEventListener("resize", refit);

  return {
    el,
    destroy() {
      window.removeEventListener("resize", refit);
      el.remove();
    },
  };
}
