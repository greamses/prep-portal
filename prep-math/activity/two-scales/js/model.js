/* ============================================================================
   TWO SCALES — the rules, with no page in them
   ----------------------------------------------------------------------------
   Two balance scales, each one an equation. Everything on a pan is a BLOCK:

     { kind: "x" | "y", n: 1 | -1 }    one x (or one minus x)
     { kind: "n", n: 7 }              a number block, worth 7 (or −7)

   A coefficient is not written on a block — 2x is two x blocks — because that
   is what makes sharing equally something you can see: two x blocks against
   eight, shared into two, is one x against four.

   There are four moves, and every one of them keeps both scales true, which is
   why the beams never tip:

     across      a block sent to the other pan of ITS OWN scale changes sign:
                 what was adding on one side is taking away on the other
     merge       a block dropped on another in the same pan: numbers add up,
                 and a block dropped on its opposite (x on −x, 5 on −5) leaves
                 nothing at all
     share       both pans cut into k equal helpings, one helping kept — only
                 when both pans really do cut into k
     substitute  when one scale says what a letter is worth — a pan holding
                 that letter alone — that letter may be swapped for what the
                 other pan holds, ON THE OTHER SCALE. That is the whole idea
                 of substitution: solve it here, put it in there.

   Every move returns a NEW state (so undo is just keeping the old ones) or
   null, meaning "that is not allowed" — the page says why.
   ========================================================================== */

let seq = 0;
/** A block. */
export const block = (kind, n) => ({ id: `b${++seq}`, kind, n });
export const isVar = (b) => b.kind === "x" || b.kind === "y";
/** What a block says on its face: x, −x, 7, −7. */
export const faceOf = (b) => (b.kind === "n" ? String(b.n).replace("-", "−") : `${b.n < 0 ? "−" : ""}${b.kind}`);

/** A scale: what is on each pan. */
export const scale = (L, R) => ({ L, R });
export const other = (pan) => (pan === "L" ? "R" : "L");

/** A deep copy, so a move never touches the state it was given. */
export const copy = (st) => ({
  ...st,
  scales: st.scales.map((s) => ({ L: s.L.map((b) => ({ ...b })), R: s.R.map((b) => ({ ...b })) })),
});

const find = (st, id) => {
  for (let i = 0; i < st.scales.length; i++) {
    for (const pan of ["L", "R"]) {
      const at = st.scales[i][pan].findIndex((b) => b.id === id);
      if (at >= 0) return { i, pan, at, b: st.scales[i][pan][at] };
    }
  }
  return null;
};
export const whereIs = find;

/** What a pan is worth, written out: the count of each letter and the numbers. */
export function sumOf(pan) {
  const out = { x: 0, y: 0, n: 0 };
  pan.forEach((b) => { out[b.kind] += b.n; });
  return out;
}

/* ── move 1: across the scale ───────────────────────────────────────────── */

/** Send a block to the other pan of its own scale. Its sign changes. */
export function across(st, id) {
  const at = find(st, id);
  if (!at) return null;
  const next = copy(st);
  const [b] = next.scales[at.i][at.pan].splice(at.at, 1);
  b.n = -b.n;
  next.scales[at.i][other(at.pan)].push(b);
  return next;
}

/* ── move 2: one block onto another ─────────────────────────────────────── */

/** Drop `id` on `onto`: numbers add, opposites cancel. Same pan only. */
export function merge(st, id, onto) {
  if (id === onto) return null;
  const a = find(st, id); const b = find(st, onto);
  if (!a || !b || a.i !== b.i || a.pan !== b.pan) return null;
  const same = a.b.kind === b.b.kind;
  if (!same) return null;
  const total = a.b.n + b.b.n;
  if (isVar(a.b) && total !== 0) return null;   // x and x stay two blocks
  const next = copy(st);
  const pan = next.scales[a.i][a.pan];
  const keep = pan.findIndex((q) => q.id === onto);
  const drop = pan.findIndex((q) => q.id === id);
  if (total === 0) {
    next.scales[a.i][a.pan] = pan.filter((q) => q.id !== id && q.id !== onto);
  } else {
    pan[keep] = { ...pan[keep], n: total };
    pan.splice(drop, 1);
  }
  return next;
}

/* ── move 3: sharing both pans equally ──────────────────────────────────── */

/** Every pan of the scale cut into k, one helping kept — or null. */
export function share(st, i, k) {
  if (!(k >= 2)) return null;
  const sc = st.scales[i];
  for (const pan of ["L", "R"]) {
    const s = sumOf(sc[pan]);
    /* the numbers on a pan must be one block by now: 8 shares into 2, but
       5 and 3 lying separately do not, one at a time */
    if (sc[pan].filter((b) => b.kind === "n").length > 1) return null;
    if (s.x % k || s.y % k || s.n % k) return null;
  }
  const next = copy(st);
  for (const pan of ["L", "R"]) {
    const s = sumOf(sc[pan]);
    const kept = [];
    for (const kind of ["x", "y"]) {
      const c = s[kind] / k;
      for (let j = 0; j < Math.abs(c); j++) kept.push(block(kind, Math.sign(c)));
    }
    if (s.n) kept.push(block("n", s.n / k));
    next.scales[i][pan] = kept;
  }
  return next;
}

/** The biggest helping this scale can be shared into (0 when it cannot). */
export function sharesInto(sc) {
  let best = 0;
  for (let k = 2; k <= 12; k++) {
    let ok = true;
    for (const pan of ["L", "R"]) {
      const s = sumOf(sc[pan]);
      if (sc[pan].filter((b) => b.kind === "n").length > 1) ok = false;
      else if (s.x % k || s.y % k || s.n % k) ok = false;
      /* sharing nothing into k is no move at all */
      if (!s.x && !s.y && !s.n) ok = false;
    }
    if (ok) best = k;
  }
  return best;
}

/* ── move 4: substitution ───────────────────────────────────────────────── */

/**
 * What a scale says a letter is worth: a pan holding that letter ALONE (one
 * block, not minus) — the other pan is what it may be swapped for.
 *   → { kind, tiles, i, pan } or null
 */
export function ruleOf(sc, i = 0) {
  for (const pan of ["L", "R"]) {
    const here = sc[pan];
    if (here.length === 1 && isVar(here[0]) && here[0].n === 1) {
      const worth = sc[other(pan)];
      /* "x = x" says nothing, and neither does a pan that still holds that letter */
      if (!worth.length || worth.some((b) => b.kind === here[0].kind)) return null;
      return { kind: here[0].kind, tiles: worth.map((b) => ({ ...b })), i, pan };
    }
  }
  return null;
}

/** Every rule the state has to offer, one per scale. */
export const rulesOf = (st) => st.scales.map((s, i) => ruleOf(s, i)).filter(Boolean);

/**
 * Swap a letter for what the OTHER scale says it is worth.
 *   id    the block being swapped (a letter, on a different scale from the rule)
 * A minus x becomes the rule's blocks with every sign turned over.
 */
export function substitute(st, rule, id) {
  const at = find(st, id);
  if (!at || !rule) return null;
  if (at.i === rule.i) return null;            // a scale cannot fill itself in
  if (at.b.kind !== rule.kind) return null;    // only that letter
  const next = copy(st);
  const pan = next.scales[at.i][at.pan];
  const sign = at.b.n;
  pan.splice(at.at, 1, ...rule.tiles.map((b) => block(b.kind, b.n * sign)));
  return next;
}

/** Swap every one of that letter on a pan. */
export function substituteAll(st, rule, i, pan) {
  let now = st;
  let guard = 0;
  while (guard++ < 24) {
    const hit = now.scales[i][pan].find((b) => b.kind === rule.kind);
    if (!hit) break;
    const step = substitute(now, rule, hit.id);
    if (!step) break;
    now = step;
  }
  return now === st ? null : now;
}

/* ── what counts as finished ────────────────────────────────────────────── */

/** The number a scale says a letter is worth, or null: x alone against a number. */
export function valueOf(sc, kind) {
  for (const pan of ["L", "R"]) {
    const here = sc[pan]; const there = sc[other(pan)];
    if (here.length === 1 && here[0].kind === kind && here[0].n === 1 &&
      there.length === 1 && there[0].kind === "n") return there[0].n;
  }
  return null;
}

/** Every letter the puzzle asks for, found and right. */
export function isDone(st) {
  return st.want.every((kind) => st.scales.some((sc) => valueOf(sc, kind) === st.answer[kind]));
}

/** What the state says so far, for the page to read out. */
export function found(st) {
  const out = {};
  st.want.forEach((kind) => {
    for (const sc of st.scales) {
      const v = valueOf(sc, kind);
      if (v !== null) out[kind] = v;
    }
  });
  return out;
}

/** An equation written out, for the answer line and for tests. */
export function say(sc) {
  const side = (pan) => {
    if (!pan.length) return "0";
    const s = sumOf(pan);
    const bits = [];
    ["x", "y"].forEach((k) => { if (s[k]) bits.push(`${Math.abs(s[k]) === 1 ? "" : Math.abs(s[k])}${k}`.replace(/^/, s[k] < 0 ? "−" : "")); });
    if (s.n) bits.push(String(s.n).replace("-", "−"));
    return bits.join(" + ").replace(/\+ −/g, "− ");
  };
  return `${side(sc.L)} = ${side(sc.R)}`;
}
