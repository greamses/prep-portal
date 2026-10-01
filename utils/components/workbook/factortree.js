/* ============================================================================
   THE FACTOR TREE — shared by any workbook that splits a number up
   ----------------------------------------------------------------------------
   A number at the top, two factors under it, and each of those split again
   until every branch ends on a prime.

        36
       /  \
      4    9
     / \  / \
    2  2 3   3

   THERE IS NO SINGLE RIGHT TREE, and that is the whole point of the picture.
   36 splits as 4 × 9 or 6 × 6 or 2 × 18, and every one of them ends on the
   same primes — which is the theorem the tree exists to show. So nothing here
   is marked by POSITION. A tree is right when

     every node with branches has exactly two, and they multiply to it,
     every branch ends on a prime,
     and the top of it is the number that was asked for.

   `treeRight` is pure and has no DOM in it, so the Node checks run it over
   thousands of trees without a browser.

   TWO WAYS TO BUILD ONE, because they teach different halves of it:

     drag   the shape is drawn empty. Tap a circle and ITS OWN FACTORS swing
            out and stand round it, and the child drags two of them down into
            the circles underneath. They are CHOOSING from what will go, which
            is the easier half, and they cannot be stuck — but they can still
            choose a pair that does not multiply back, and the marking will
            say so.
     grow   only the top number is drawn. Tapping a circle sprouts two empty
            ones under it and the child types the factors, and keeps going
            until nothing left will split. They are FINDING the pairs, and
            deciding for themselves when a branch is finished.

   On paper both print as a drawn tree with empty rings to write in — a
   worksheet cannot be dragged or tapped, and a child with a pencil is doing
   the same thinking either way.
   ========================================================================== */

/* ── the arithmetic, which the drawing never does ────────────────────────── */

export const isPrime = (n) => {
  if (!Number.isInteger(n) || n < 2) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
};

/** The prime factors of n, smallest first: 60 → [2, 2, 3, 5]. */
export function primesOf(n) {
  const out = [];
  let v = Math.abs(Math.round(n));
  for (let d = 2; d * d <= v; d++) while (v % d === 0) { out.push(d); v /= d; }
  if (v > 1) out.push(v);
  return out;
}

/** The prime factors gathered up: 60 → [[2, 2], [3, 1], [5, 1]]. */
export function indexOf_(n) {
  const out = [];
  primesOf(n).forEach((p) => {
    const last = out[out.length - 1];
    if (last && last[0] === p) last[1] += 1;
    else out.push([p, 1]);
  });
  return out;
}

/**
 * WHAT TWO NUMBERS HAVE BETWEEN THEM, as primes.
 *
 *   sharedPrimes(36, 48) → [2, 2, 3]    what is in both lists
 *   ownPrimes(36, 48)    → [3]          what 36 has and 48 has not
 *
 * Multisets, not sets: 36 is 2 × 2 × 3 × 3 and 48 is 2 × 2 × 2 × 2 × 3, and
 * what they share is TWO 2s and one 3 — the smaller count of each prime, not
 * merely the fact that both have some. That counting is the whole of the
 * highest common factor, and the thing a child gets wrong when they are told
 * "the primes they both have" without being told how many.
 */
export function sharedPrimes(a, b) {
  const left = primesOf(b);
  const out = [];
  primesOf(a).forEach((p) => {
    const at = left.indexOf(p);
    if (at >= 0) { out.push(p); left.splice(at, 1); }
  });
  return out;
}

/** The primes of `a` that are not shared with `b`. */
export function ownPrimes(a, b) {
  const left = primesOf(a);
  sharedPrimes(a, b).forEach((p) => {
    const at = left.indexOf(p);
    if (at >= 0) left.splice(at, 1);
  });
  return left;
}

/** The highest number that divides both: everything they share, multiplied. */
export const hcfOf = (a, b) => sharedPrimes(a, b).reduce((t, p) => t * p, 1);

/** The lowest number both divide into: everything in the picture, multiplied. */
export const lcmOf = (a, b) =>
  ownPrimes(a, b).concat(sharedPrimes(a, b), ownPrimes(b, a)).reduce((t, p) => t * p, 1);

/** How many factors a number has, from its index form: (a+1)(b+1)… */
export const factorCount = (n) => indexOf_(n).reduce((t, [, k]) => t * (k + 1), 1);

/** Every factor of n, in order. */
export const factorsOf = (n) => {
  const out = [];
  for (let d = 1; d * d <= n; d++) {
    if (n % d) continue;
    out.push(d);
    if (d !== n / d) out.push(n / d);
  }
  return out.sort((a, b) => a - b);
};

/**
 * ONE tree of a number, chosen so the picture is a balanced one: the pair
 * closest to a square root, split the same way again. It is the shape the
 * paper prints; a child on screen may build any other and still be right.
 */
export function treeOf(n) {
  if (!isPrime(n) && n > 1) {
    let best = null;
    for (let a = 2; a * a <= n; a++) {
      if (n % a) continue;
      const b = n / a;
      if (!best || Math.abs(a - b) < Math.abs(best[0] - best[1])) best = [a, b];
    }
    if (best) return { v: n, kids: [treeOf(best[0]), treeOf(best[1])] };
  }
  return { v: n, kids: null };
}

/**
 * WHAT SWINGS OUT ROUND A CIRCLE when it is tapped: everything that divides
 * it except 1 and itself, which are the two factors that get you nowhere —
 * splitting 12 into 1 and 12 is not splitting 12.
 */
export const ringOf = (v) => {
  const out = [];
  for (let d = 2; d < v; d++) if (v % d === 0) out.push(d);
  return out;
};

/** How many rows of circles a tree needs. */
export const depthOf = (t) => (t.kids ? 1 + Math.max(...t.kids.map(depthOf)) : 1);

/** Every node of a tree, in drawing order. */
const walk = (t, at = "", out = []) => {
  out.push({ at, node: t });
  if (t.kids) t.kids.forEach((k, i) => walk(k, at + i, out));
  return out;
};

/**
 * Is what the child built a true factor tree of `entry.n`?
 *
 * `state` is what the two live modes save:
 *   drag  { slots: { "01": 9, … } } against the shape the question drew
 *   grow  { tree: { v, kids } } as the child grew it
 */
export function treeRight(state, entry, shape = null) {
  const n = entry.n;
  let tree = null;
  if (state && state.tree) tree = state.tree;
  else if (state && state.slots && shape) tree = fill(shape, state.slots);
  if (!tree) return false;
  if (Number(tree.v) !== n) return false;

  let sound = true;
  let split = false;
  walk(tree).forEach(({ node }) => {
    const v = Number(node.v);
    if (!Number.isInteger(v) || v < 2) { sound = false; return; }
    if (node.kids) {
      split = true;
      if (node.kids.length !== 2) { sound = false; return; }
      const [a, b] = node.kids.map((k) => Number(k.v));
      if (!Number.isInteger(a) || !Number.isInteger(b) || a < 2 || b < 2) { sound = false; return; }
      if (a * b !== v) sound = false;
    } else if (!isPrime(v)) {
      /* a branch that stops on something that still splits is not finished */
      sound = false;
    }
  });
  /* a composite number that was never split at all is not a tree */
  if (!isPrime(n) && !split) sound = false;
  return sound;
}

/** The shape with the child's numbers written into it. */
const fill = (shape, slots) => {
  const one = (t, at) => ({
    v: at === "" ? t.v : (slots[at] ?? null),
    kids: t.kids ? t.kids.map((k, i) => one(k, at + i)) : null,
  });
  return one(shape, "");
};

/* ── the drawing ─────────────────────────────────────────────────────────── */

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* Millimetres, like every other drawing in these workbooks, so the paper and
   the screen are the same size and the tree fits a printed column. */
const R = 6.4;           // a circle's radius
const ROW = 19;          // down from one row of circles to the next
const GAP = 15;          // the narrowest two circles may stand apart

/**
 * Where every node goes. The leaves are laid out evenly along the bottom of
 * their own subtree and each parent stands over the middle of its children,
 * which is the one layout that never crosses a branch over another.
 */
function layout(tree) {
  const places = new Map();
  let x = 0;
  const put = (t, at, row) => {
    if (!t.kids) {
      places.set(at, { x, y: row, node: t });
      x += GAP;
      return places.get(at);
    }
    const kids = t.kids.map((k, i) => put(k, at + i, row + 1));
    const mid = (kids[0].x + kids[kids.length - 1].x) / 2;
    places.set(at, { x: mid, y: row, node: t });
    return places.get(at);
  };
  put(tree, "", 0);
  return places;
}

/**
 * A factor tree on the paper.
 *
 *   tree    the shape to draw (treeOf(n), or any shape the question chose)
 *   mode    "drag" | "grow" | "answer"
 *   show    which nodes are printed rather than left empty. "answer" prints
 *           them all; otherwise only the top one is.
 *   chips   the numbers laid out beside a drag tree
 */
export function treeHtml({ tree, mode = "grow", answer = false, chips = null, label = "" } = {}) {
  const places = layout(tree);
  const xs = [...places.values()].map((p) => p.x);
  const rows = depthOf(tree);
  const wide = Math.max(...xs) + GAP;
  const tall = (rows - 1) * ROW + R * 2 + 6;
  const mid = (wide - GAP) / 2;

  const lines = [];
  const knobs = [];
  places.forEach((p, at) => {
    const cx = p.x - mid + wide / 2;
    const cy = R + 3 + p.y * ROW;
    if (p.node.kids) {
      p.node.kids.forEach((_, i) => {
        const k = places.get(at + i);
        const kx = k.x - mid + wide / 2;
        const ky = R + 3 + k.y * ROW;
        lines.push(`<line x1="${cx.toFixed(1)}" y1="${(cy + R).toFixed(1)}" x2="${kx.toFixed(1)}" y2="${(ky - R).toFixed(1)}"/>`);
      });
    }
    const top = at === "";
    const shown = answer || top;
    /* a colour per row, so a tree reads as rows of the same thing rather than
       as a heap of circles — and so a child can say "the green ones" */
    knobs.push(
      `<span class="ft-node ft-row${p.y % 4}${top ? " is-top" : ""}${p.node.kids ? "" : " is-leaf"}${shown ? " is-said" : ""}"`
      + ` data-at="${at}" data-v="${p.node.v}" data-row="${p.y}"`
      + ` style="left:${cx.toFixed(1)}mm;top:${cy.toFixed(1)}mm">`
      + `${shown ? p.node.v : ""}</span>`
    );
  });

  /* ON PAPER the factors that would swing out of the top circle are printed
     under the tree instead, because a sheet of paper cannot be tapped and a
     child with a pencil should still be told what they have to choose from.
     The screen hides this row and swings the factors out of each circle in
     turn (see mountTree). */
  const tray = chips && chips.length
    ? `<p class="ft-tray"><em>the numbers that go into it:</em> `
      + chips.map((v, i) => `<span class="ft-chip ft-tint${i % 6}" data-chip="${i}" data-v="${v}">${v}</span>`).join("")
      + `</p>`
    : "";

  /* `wb-nomath`: the numbers in the circles are FIGURES in a picture, not an
     expression to be typeset. Left to itself the typesetter replaces each one
     with a drawing of it, which is both slower and, in a circle 12mm across,
     wrong — see mathify.js. */
  return `<div class="ft wb-nomath" data-tree="${esc(JSON.stringify({ n: tree.v, mode }))}"`
    + `${label ? ` aria-label="${esc(label)}"` : ""} style="--ft-w:${wide.toFixed(1)}mm;--ft-h:${tall.toFixed(1)}mm">`
    + `<div class="ft-stage">`
    + `<svg class="ft-lines" viewBox="0 0 ${wide.toFixed(1)} ${tall.toFixed(1)}" width="${wide.toFixed(1)}mm" height="${tall.toFixed(1)}mm" aria-hidden="true">${lines.join("")}</svg>`
    + knobs.join("")
    + `</div>${tray}</div>`;
}

/* ── on screen ───────────────────────────────────────────────────────────── */

/**
 * mountTree(el, { shape, mode, saved, onChange })
 *   → { state(), set(s), clear(), dispose() }
 *
 * DRAG: the chips are carried into the circles with pointer events, the same
 * way a figure is brought down in a long division — HTML drag-and-drop does
 * not exist on a tablet. A chip already placed can be dragged out again.
 *
 * GROW: tapping an empty-handed circle sprouts two circles under it; typing
 * fills them; tapping a sprouted circle again takes its branches off, because
 * a child who split 12 into 2 and 6 and then wanted 3 and 4 must be able to
 * change their mind without starting the whole tree again.
 */
export function mountTree(el, { shape, mode = "grow", saved = null, onChange = () => {} } = {}) {
  const n = Number(el.dataset.tree ? JSON.parse(el.dataset.tree).n : shape.v);
  let state = saved && (saved.slots || saved.tree)
    ? JSON.parse(JSON.stringify(saved))
    : (mode === "drag" ? { slots: {} } : { tree: { v: n, kids: null } });

  el.classList.add("is-live");
  const stage = el.querySelector(".ft-stage");
  let bin = [];

  const tell = () => onChange(JSON.parse(JSON.stringify(state)));

  /* ── the drag tree ─────────────────────────────────────────────────────
     Nothing is laid out underneath. Tap a circle and the numbers that go into
     IT swing out and stand round it; drag two of them into the circles below.
     The ring is the question — "what goes into 36?" — asked in the one place
     where the answer is about to be used. */
  const valueAt = (at) => {
    if (at === "") return Number(shape.v);
    const v = state.slots[at];
    return v == null ? null : Number(v);
  };
  /** The circles hanging under this one. */
  const kidsOf = (at) => [...stage.querySelectorAll(".ft-node")]
    .filter((nd) => nd.dataset.at.length === at.length + 1 && nd.dataset.at.startsWith(at));

  function paintDrag() {
    stage.querySelectorAll(".ft-node").forEach((node) => {
      const at = node.dataset.at;
      if (at === "") return;
      const v = state.slots[at];
      node.textContent = v == null ? "" : v;
      node.classList.toggle("is-said", v != null);
      node.classList.toggle("is-empty", v == null);
    });
  }

  /** The factors of a circle, swung out round it. */
  function openRing(node) {
    closeRing();
    const at = node.dataset.at;
    const v = valueAt(at);
    if (v == null || !Number.isFinite(v)) return;
    const kids = [...stage.querySelectorAll(".ft-node")]
      .filter((nd) => nd.dataset.at.length === at.length + 1 && nd.dataset.at.startsWith(at));
    if (!kids.length) return;              // a leaf has nothing to split into
    const fs = ringOf(v);
    if (!fs.length) {
      /* a prime, and that IS the answer: it does not split */
      node.classList.remove("is-stuck");
      void node.offsetWidth;
      node.classList.add("is-stuck");
      return;
    }
    const ring = document.createElement("div");
    ring.className = "ft-ring";
    ring.dataset.at = at;
    ring.style.left = node.style.left;
    ring.style.top = node.style.top;
    /* ROUND THE CIRCUMFERENCE, but not straight down: that is where the
       branches go, and a chip sitting on the circle it is about to be dropped
       into is a chip nobody can aim at. So they spread over 300° centred on
       straight up, leaving the way down clear. The ring also grows with the
       number of factors — 96 has ten of them, and ten on a small circle is a
       heap, not a ring. */
    const wide = Math.max(19, Math.min(30, 3.6 * fs.length));
    ring.style.setProperty("--r", `${wide.toFixed(1)}mm`);
    /* the spread is CENTRED on straight up, so one factor stands over the
       circle rather than off at the end of an arc — where, with one chip, it
       lands exactly on the circle it is about to be dropped into */
    const spread = 300;
    const step = spread / fs.length;
    fs.forEach((f, i) => {
      const chip = document.createElement("span");
      chip.className = `ft-chip ft-tint${i % 6}`;
      chip.dataset.v = String(f);
      chip.dataset.from = at;
      chip.textContent = String(f);
      /* the angle is the chip's own; the spread is animated, so they swing
         out one after another round the circumference */
      chip.style.setProperty("--a", `${(-90 - spread / 2 + step / 2 + i * step).toFixed(1)}deg`);
      /* they swing out one after another, but the last one must not keep a
         child waiting: ten factors at 35ms each is most of a second before
         the ring is all there, so the stagger is capped */
      chip.style.setProperty("--d", `${Math.min(i * 30, 240)}ms`);
      ring.appendChild(chip);
    });
    stage.appendChild(ring);
    node.classList.add("is-open");
    requestAnimationFrame(() => ring.classList.add("is-out"));
    wireChips(ring);
  }

  function closeRing() {
    stage.querySelectorAll(".ft-ring").forEach((r) => r.remove());
    stage.querySelectorAll(".ft-node.is-open").forEach((n) => n.classList.remove("is-open"));
  }

  function wireChips(ring) {
    ring.querySelectorAll(".ft-chip").forEach((chip) => {
      chip.addEventListener("pointerdown", (e) => {
        try { chip.setPointerCapture?.(e.pointerId); } catch { /* carry on */ }
        lift(chip, chip.dataset.v, e);
      });
    });
  }

  function lift(from, value) {
    /* WHILE A NUMBER IS IN THE AIR the ring stops answering the pointer, so
       what is under the finger at the end is a circle of the tree and never
       one of the chips standing over it. */
    stage.querySelectorAll(".ft-ring").forEach((r) => r.classList.add("is-carrying"));
    const ghost = document.createElement("span");
    ghost.className = `ft-carry ${[...from.classList].find((c) => c.startsWith("ft-tint")) || ""}`;
    ghost.textContent = value;
    document.body.appendChild(ghost);
    const move = (ev) => {
      ghost.style.left = `${ev.clientX}px`;
      ghost.style.top = `${ev.clientY}px`;
      const over = document.elementFromPoint(ev.clientX, ev.clientY)?.closest(".ft-node");
      stage.querySelectorAll(".ft-node").forEach((nd) => nd.classList.toggle("is-catching", nd === over && nd.dataset.at !== ""));
      ev.preventDefault();
    };
    const up = (ev) => {
      from.removeEventListener("pointermove", move);
      from.removeEventListener("pointerup", up);
      from.removeEventListener("pointercancel", up);
      ghost.remove();
      stage.querySelectorAll(".ft-ring").forEach((r) => r.classList.remove("is-carrying"));
      stage.querySelectorAll(".ft-node").forEach((nd) => nd.classList.remove("is-catching"));
      const drop = document.elementFromPoint(ev.clientX, ev.clientY)?.closest(".ft-node");
      const at = drop?.dataset.at;
      if (at != null && at !== "") {
        state.slots[at] = Number(value);
        paintDrag();
        /* THE RING STAYS UP while the pair it was opened for is unfinished.
           A split is two numbers, and closing after the first would make the
           child tap the same circle again to say the same thing. */
        const ring = stage.querySelector(".ft-ring");
        const owner = ring?.dataset.at;
        const more = owner != null && kidsOf(owner).some((k) => state.slots[k.dataset.at] == null);
        if (!more) closeRing();
        tell();
      }
    };
    from.addEventListener("pointermove", move);
    from.addEventListener("pointerup", up);
    from.addEventListener("pointercancel", up);
  }

  function wireDrag() {
    stage.querySelectorAll(".ft-node").forEach((node) => {
      node.addEventListener("click", (e) => {
        if (e.target.closest(".ft-chip")) return;
        if (node.classList.contains("is-open")) { closeRing(); return; }
        const at = node.dataset.at;
        const v = valueAt(at);
        /* WHAT A TAP MEANS depends on where the circle is in the tree, and
           each of the three answers is something worth saying:

             it has circles under it   what goes into it swings out, to be
                                       dragged down into them
             it is a prime at the end  nothing goes into it — it shakes its
                                       head, which is the whole lesson
             it is anything else       take it out and think again */
        if (kidsOf(at).length) { openRing(node); return; }
        if (v != null && isPrime(v)) {
          node.classList.remove("is-stuck");
          void node.offsetWidth;
          node.classList.add("is-stuck");
          return;
        }
        if (at !== "" && state.slots[at] != null) {
          delete state.slots[at];
          paintDrag();
          tell();
        }
      });
    });
    /* a tap anywhere else puts the ring away */
    el.addEventListener("pointerdown", (e) => {
      if (!e.target.closest(".ft-node") && !e.target.closest(".ft-chip")) closeRing();
    });
  }

  /* ── the growing tree ──────────────────────────────────────────────────*/
  const nodeAt = (at) => {
    let t = state.tree;
    for (const step of at) t = t.kids[Number(step)];
    return t;
  };

  function paintGrow() {
    const drawn = treeHtml({ tree: state.tree, mode: "grow" });
    const holder = document.createElement("div");
    holder.innerHTML = drawn;
    const fresh = holder.querySelector(".ft-stage");
    stage.replaceChildren(...fresh.childNodes);
    el.style.setProperty("--ft-w", holder.querySelector(".ft").style.getPropertyValue("--ft-w"));
    el.style.setProperty("--ft-h", holder.querySelector(".ft").style.getPropertyValue("--ft-h"));
    stage.querySelectorAll(".ft-node").forEach((node) => {
      const at = node.dataset.at;
      const t = nodeAt(at);
      const top = at === "";
      node.textContent = "";
      node.classList.toggle("is-empty", !top && t.v == null);
      if (top) {
        node.textContent = state.tree.v;
        node.classList.add("is-said");
      } else {
        const input = document.createElement("input");
        input.className = "ft-in";
        input.type = "text";
        input.inputMode = "numeric";
        input.maxLength = 4;
        input.value = t.v == null ? "" : t.v;
        input.setAttribute("aria-label", "a factor");
        input.addEventListener("input", () => {
          const v = input.value.trim();
          t.v = v === "" ? null : Number(v);
          tell();
        });
        node.appendChild(input);
      }
      /* the circle itself sprouts or un-sprouts; the input inside it does not */
      node.addEventListener("click", (e) => {
        if (e.target.classList.contains("ft-in")) return;
        const me = nodeAt(at);
        if (me.kids) { me.kids = null; bin.push(at); }
        else me.kids = [{ v: null, kids: null }, { v: null, kids: null }];
        paintGrow();
        tell();
      });
    });
  }

  if (mode === "drag") { paintDrag(); wireDrag(); }
  else paintGrow();

  return {
    state: () => JSON.parse(JSON.stringify(state)),
    set(s) {
      state = s && (s.slots || s.tree) ? JSON.parse(JSON.stringify(s))
        : (mode === "drag" ? { slots: {} } : { tree: { v: n, kids: null } });
      if (mode === "drag") { closeRing(); paintDrag(); } else paintGrow();
    },
    clear() { this.set(null); tell(); },
    dispose() { el.classList.remove("is-live"); },
  };
}
