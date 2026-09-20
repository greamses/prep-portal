/* ============================================================================
   PRINTABLE WORKBOOK — two linked balance scales, with blocks you pick up
   ----------------------------------------------------------------------------
   A pair of equations, drawn as a pair of scales. Everything on a pan is a
   BLOCK, and on screen every block is a real thing to drag:

     { kind: "x" | "y", n: 1 | -1 }    one x (or one minus x)
     { kind: "n", n: 7 }              a number block, worth 7 (or −7)

   A coefficient is never written on a block — 2x is two x blocks — because
   that is what makes sharing equally something you can see.

   Four moves, and every one of them keeps both scales true, which is why the
   beams never tip:

     across      a block sent to the other pan of ITS OWN scale changes sign
     together    a block dropped on another in the same pan: numbers add up,
                 and a block on its opposite leaves nothing
     share       both pans cut into k equal helpings, one helping kept
     substitute  when one scale has a letter ON ITS OWN it says what that
                 letter is worth, and hands over a chip: drop the chip on that
                 letter on the OTHER scale and it is swapped. Solve it here,
                 put it in there.

   The rules below have no DOM in them, so the checks run them in Node. The
   markup is printable on its own (`scalesHtml`); `mountScales` makes it live,
   and READS the blocks back out of the paper, so the drawing is the state.
   ========================================================================== */

let seq = 0;
export const block = (kind, n) => ({ id: `s${++seq}`, kind, n });
export const isVar = (b) => b.kind === "x" || b.kind === "y";
/** What a block says on its face: x, −x, 7, −7. */
export const faceOf = (b) => (b.kind === "n" ? String(b.n).replace("-", "−") : `${b.n < 0 ? "−" : ""}${b.kind}`);
export const scale = (L, R) => ({ L, R });
export const other = (pan) => (pan === "L" ? "R" : "L");

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

/** What a pan is worth: the count of each letter, and the numbers. */
export function sumOf(pan) {
  const out = { x: 0, y: 0, n: 0 };
  pan.forEach((b) => { out[b.kind] += b.n; });
  return out;
}

/* ── move 1: across the scale ───────────────────────────────────────────── */

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

export function merge(st, id, onto) {
  if (id === onto) return null;
  const a = find(st, id); const b = find(st, onto);
  if (!a || !b || a.i !== b.i || a.pan !== b.pan) return null;
  if (a.b.kind !== b.b.kind) return null;
  const total = a.b.n + b.b.n;
  if (isVar(a.b) && total !== 0) return null;   // x and x stay two blocks
  const next = copy(st);
  const pan = next.scales[a.i][a.pan];
  if (total === 0) {
    next.scales[a.i][a.pan] = pan.filter((q) => q.id !== id && q.id !== onto);
  } else {
    const keep = pan.findIndex((q) => q.id === onto);
    pan[keep] = { ...pan[keep], n: total };
    next.scales[a.i][a.pan] = pan.filter((q) => q.id !== id);
  }
  return next;
}

/* ── move 3: sharing both pans equally ──────────────────────────────────── */

export function share(st, i, k) {
  if (!(k >= 2)) return null;
  const sc = st.scales[i];
  for (const pan of ["L", "R"]) {
    const s = sumOf(sc[pan]);
    /* the numbers on a pan must be one block by now: 8 shares into 2, but 5
       and 3 lying separately do not, one at a time */
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

/** The biggest helping this scale shares into (0 when it cannot be shared). */
export function sharesInto(sc) {
  let best = 0;
  for (let k = 2; k <= 12; k++) {
    let ok = true;
    for (const pan of ["L", "R"]) {
      const s = sumOf(sc[pan]);
      if (sc[pan].filter((b) => b.kind === "n").length > 1) ok = false;
      else if (s.x % k || s.y % k || s.n % k) ok = false;
      if (!s.x && !s.y && !s.n) ok = false;
    }
    if (ok) best = k;
  }
  return best;
}

/* ── move 4: substitution ───────────────────────────────────────────────── */

/** What a scale says a letter is worth: a pan holding that letter ALONE. */
export function ruleOf(sc, i = 0) {
  for (const pan of ["L", "R"]) {
    const here = sc[pan];
    if (here.length === 1 && isVar(here[0]) && here[0].n === 1) {
      const worth = sc[other(pan)];
      if (!worth.length || worth.some((b) => b.kind === here[0].kind)) return null;
      return { kind: here[0].kind, tiles: worth.map((b) => ({ ...b })), i, pan };
    }
  }
  return null;
}
export const rulesOf = (st) => st.scales.map((s, i) => ruleOf(s, i)).filter(Boolean);

export function substitute(st, rule, id) {
  const at = find(st, id);
  if (!at || !rule) return null;
  if (at.i === rule.i) return null;            // a scale cannot fill itself in
  if (at.b.kind !== rule.kind) return null;
  const next = copy(st);
  const pan = next.scales[at.i][at.pan];
  const sign = at.b.n;
  pan.splice(at.at, 1, ...rule.tiles.map((b) => block(b.kind, b.n * sign)));
  return next;
}

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

/* ── what the scales say ────────────────────────────────────────────────── */

/** The number a scale says a letter is worth, or null. */
export function valueOf(sc, kind) {
  for (const pan of ["L", "R"]) {
    const here = sc[pan]; const there = sc[other(pan)];
    if (here.length === 1 && here[0].kind === kind && here[0].n === 1 &&
      there.length === 1 && there[0].kind === "n") return there[0].n;
  }
  return null;
}

/** Everything the scales have settled so far: { x: 4, y: 9 }. */
export function found(st, want = ["x", "y"]) {
  const out = {};
  want.forEach((kind) => {
    st.scales.forEach((sc) => {
      const v = valueOf(sc, kind);
      if (v !== null) out[kind] = v;
    });
  });
  return out;
}

/** An equation written out, for the line under a scale and for the tests. */
export function say(sc) {
  const side = (pan) => {
    if (!pan.length) return "0";
    const s = sumOf(pan);
    const bits = [];
    ["x", "y"].forEach((k) => {
      if (s[k]) bits.push(`${s[k] < 0 ? "−" : ""}${Math.abs(s[k]) === 1 ? "" : Math.abs(s[k])}${k}`);
    });
    if (s.n) bits.push(String(s.n).replace("-", "−"));
    return bits.join(" + ").replace(/\+ −/g, "− ");
  };
  return `${side(sc.L)} = ${side(sc.R)}`;
}

/* ── the drawing ────────────────────────────────────────────────────────── */

const blockHtml = (b, mini = false) =>
  `<button type="button" class="sc-block sc-block--${b.kind}${b.n < 0 ? " is-minus" : ""}${mini ? " is-mini" : ""}"` +
  `${mini ? "" : ` data-id="${b.id}"`} data-kind="${b.kind}" data-n="${b.n}"` +
  `${mini ? " tabindex=\"-1\" aria-hidden=\"true\"" : ` data-tip="Tap to send it across — its sign changes"`}>${faceOf(b)}</button>`;

const chipHtml = (rule, i) =>
  `<button type="button" class="sc-rule" data-rule="${i}" data-tip="Drag this onto the same letter on the other scale">` +
  `<b>${rule.kind}</b><span>=</span>` +
  rule.tiles.map((t, j) => `${j ? `<span class="sc-rule__op">${t.n < 0 ? "−" : "+"}</span>` : ""}` +
    blockHtml(j && t.n < 0 ? { ...t, n: -t.n } : t, true)).join("") +
  `</button>`;

const oneScale = (sc, i, name) => {
  const rule = ruleOf(sc, i);
  const pan = (which) =>
    `<div class="sc-pan" data-scale="${i}" data-pan="${which}" role="group" aria-label="${name}, ${which === "L" ? "left" : "right"} pan">` +
    `<div class="sc-pan__hook"></div><div class="sc-pan__dish">${sc[which].map((b) => blockHtml(b)).join("")}</div></div>`;
  return `<section class="sc-scale" data-scale="${i}">` +
    `<header class="sc-scale__head"><span class="sc-scale__name">${name}</span>${rule ? chipHtml(rule, i) : ""}</header>` +
    `<div class="sc-frame"><div class="sc-beam" aria-hidden="true"><i class="sc-beam__bar"></i><i class="sc-beam__pivot"></i><i class="sc-beam__post"></i><i class="sc-beam__foot"></i></div>` +
    `<div class="sc-pans">${pan("L")}${pan("R")}</div></div>` +
    `<p class="sc-eq">${say(sc)}</p><div class="sc-acts" data-acts="${i}"></div></section>`;
};

/**
 * Two scales, drawn. Printable on its own; `mountScales` brings it to life.
 *   names   what each scale is called
 */
export function scalesHtml(scales, { names = ["Scale A", "Scale B"] } = {}) {
  return `<div class="sc-wrap" data-scales="1">${scales.map((sc, i) => oneScale(sc, i, names[i] || `Scale ${i + 1}`)).join("")}</div>`;
}

/** Read the blocks back off the paper: the drawing IS the state. */
export function readScales(root) {
  const scales = [...root.querySelectorAll(".sc-scale")].map((el) => {
    const pan = (which) => [...el.querySelectorAll(`.sc-pan[data-pan="${which}"] .sc-block[data-id]`)]
      .map((b) => block(b.dataset.kind, Number(b.dataset.n)));
    return scale(pan("L"), pan("R"));
  });
  return { scales };
}

/* ── on screen ──────────────────────────────────────────────────────────── */

/**
 *   mountScales(root, { names, onSay, onChange })
 * → { state(), set(st), reset(), dispose() }
 *
 * Every legal move keeps both scales true; a move that would not is refused,
 * and `onSay` is told why so the page can print it somewhere sensible.
 */
export function mountScales(root, { names = ["Scale A", "Scale B"], onSay = () => {}, onChange = () => {} } = {}) {
  const printed = root.innerHTML;
  let st = readScales(root);
  const first = copy(st);
  let held = null;
  let drag = null;
  root.dataset.scalesLive = "1";

  const nameOf = (i) => names[i] || `Scale ${i + 1}`;
  const say = (words, kind = "") => onSay(words, kind);
  const shake = (el) => {
    if (!el) return;
    el.classList.remove("is-no"); void el.offsetWidth; el.classList.add("is-no");
    setTimeout(() => el.classList.remove("is-no"), 420);
  };

  /* everything is redrawn into an inner box; whatever the page hangs on the
     outside — Undo and Clear, a line of words — is left alone */
  let inner = root.querySelector(":scope > .sc-inner");
  if (!inner) {
    inner = document.createElement("div");
    inner.className = "sc-inner";
    root.innerHTML = "";
    root.appendChild(inner);
  }

  const draw = () => {
    inner.innerHTML = scalesHtml(st.scales, { names });
    st.scales.forEach((sc, i) => {
      const k = sharesInto(sc);
      const box = root.querySelector(`[data-acts="${i}"]`);
      if (box) {
        box.innerHTML = k >= 2
          ? `<button type="button" class="sc-share" data-share="${i}" data-k="${k}" data-tip="Cut both pans into ${k} equal helpings and keep one">Share into ${k}</button>`
          : "";
      }
    });
    onChange(st);
  };

  const step = (next, words) => {
    if (!next) return false;
    st = next;
    held = null;
    /* what happened is said FIRST, so that a page watching onChange may have
       the last word — "both scales agree" should not be wiped by "put
       together" a moment later */
    if (words) say(words);
    draw();
    return true;
  };

  const ruleFor = (i) => rulesOf(st).find((r) => r.i === i) || null;

  /* a block let go over something */
  function drop(id, onBlock, onPan) {
    const from = whereIs(st, id);
    if (!from) return;
    const rule = ruleFor(from.i);
    const carries = rule && rule.pan !== from.pan && rule.tiles.length === 1;
    if (onBlock) {
      const to = whereIs(st, onBlock);
      if (to && to.i !== from.i) {
        if (!carries) {
          shake(root.querySelector(`.sc-block[data-id="${id}"]`));
          say("A block cannot jump to the other scale on its own — only what a scale says a letter is worth may travel.", "no");
          return;
        }
        if (!step(substitute(st, rule, onBlock), `Swapped ${rule.kind} for ${faceOf(rule.tiles[0])} — that is what ${nameOf(from.i)} says it is worth.`)) {
          shake(root.querySelector(`.sc-block[data-id="${onBlock}"]`));
          say(`That is not ${rule.kind}. A letter may only be swapped for what its own scale says.`, "no");
        }
        return;
      }
      if (to && to.i === from.i && to.pan === from.pan) {
        if (step(merge(st, id, onBlock), "Put together.")) return;
        shake(root.querySelector(`.sc-block[data-id="${id}"]`));
        say("Two of the same letter stay two blocks — only numbers add up, and a block and its opposite cancel.", "no");
        return;
      }
      if (to && to.i === from.i) { step(across(st, id), `${faceOf(from.b)} crossed over — it changes sign.`); return; }
    }
    if (onPan) {
      if (onPan.i !== from.i) {
        if (!carries) {
          shake(root.querySelector(`.sc-block[data-id="${id}"]`));
          say("A block cannot jump to the other scale on its own — only what a scale says a letter is worth may travel.", "no");
          return;
        }
        if (!step(substituteAll(st, rule, onPan.i, onPan.pan), `Every ${rule.kind} on that pan swapped for ${faceOf(rule.tiles[0])}.`)) {
          say(`There is no ${rule.kind} on that pan to swap.`, "no");
        }
        return;
      }
      if (onPan.pan !== from.pan) { step(across(st, id), `${faceOf(from.b)} crossed over — it changes sign.`); }
    }
  }

  /* the rule chip let go somewhere */
  function dropRule(i, onBlock, onPan) {
    const rule = ruleFor(i);
    if (!rule) return;
    if (onBlock) {
      const to = whereIs(st, onBlock);
      if (to && to.i === i) { say("A scale cannot fill itself in — carry it to the other scale.", "no"); shake(root.querySelector(`.sc-rule[data-rule="${i}"]`)); return; }
      if (!step(substitute(st, rule, onBlock), `${rule.kind} swapped for what ${nameOf(i)} says it is worth.`)) {
        shake(root.querySelector(`.sc-block[data-id="${onBlock}"]`));
        say(`That block is not ${rule.kind}.`, "no");
      }
      return;
    }
    if (onPan) {
      if (onPan.i === i) { say("A scale cannot fill itself in — carry it to the other scale.", "no"); return; }
      if (!step(substituteAll(st, rule, onPan.i, onPan.pan), `Every ${rule.kind} on that pan swapped.`)) {
        say(`There is no ${rule.kind} on that pan to swap.`, "no");
      }
    }
  }

  const under = (x, y) => {
    const stack = document.elementsFromPoint(x, y);
    let b = null; let pan = null;
    for (const el of stack) {
      if (!b && !el.closest?.(".sc-rule")) {
        const hit = el.closest?.(".sc-block[data-id]");
        if (hit && (!drag || hit.dataset.id !== drag.id)) b = hit;
      }
      if (!pan) { const p = el.closest?.(".sc-pan"); if (p && root.contains(p)) pan = p; }
    }
    return { b, pan };
  };

  const onDown = (e) => {
    const chip = e.target.closest(".sc-rule");
    const el = e.target.closest(".sc-block[data-id]");
    if (!chip && !el) return;
    e.preventDefault();
    const node = chip || el;
    const r = node.getBoundingClientRect();
    drag = {
      kind: chip ? "rule" : "block",
      id: chip ? null : el.dataset.id,
      i: chip ? Number(chip.dataset.rule) : null,
      node, x0: e.clientX, y0: e.clientY,
      dx: e.clientX - r.left, dy: e.clientY - r.top,
      w: r.width, h: r.height, moved: false, pointer: e.pointerId,
    };
  };
  const onMove = (e) => {
    if (!drag || e.pointerId !== drag.pointer) return;
    if (!drag.moved) {
      if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 6) return;
      drag.moved = true;
      drag.ghost = drag.node.cloneNode(true);
      drag.ghost.classList.add("sc-ghost");
      drag.ghost.style.width = `${drag.w}px`;
      drag.ghost.style.height = `${drag.h}px`;
      document.body.appendChild(drag.ghost);
      drag.node.classList.add("is-lifted");
    }
    drag.ghost.style.left = `${e.clientX - drag.dx}px`;
    drag.ghost.style.top = `${e.clientY - drag.dy}px`;
    const { b, pan } = under(e.clientX, e.clientY);
    root.querySelectorAll(".is-over").forEach((n) => n.classList.remove("is-over"));
    (b || pan)?.classList.add("is-over");
  };
  const onUp = (e) => {
    if (!drag || e.pointerId !== drag.pointer) return;
    const d = drag;
    drag = null;
    root.querySelectorAll(".is-over").forEach((n) => n.classList.remove("is-over"));
    d.ghost?.remove();
    d.node.classList.remove("is-lifted");
    if (!d.moved) {
      /* a tap: a block crosses over; the chip waits to be tapped onto something */
      if (d.kind === "block") {
        const at = whereIs(st, d.id);
        step(across(st, d.id), at ? `${faceOf(at.b)} crossed over — it changes sign.` : "");
      } else {
        held = held === `rule${d.i}` ? null : `rule${d.i}`;
        root.querySelectorAll(".sc-rule").forEach((c) => c.classList.toggle("is-held", held === `rule${c.dataset.rule}`));
        say(held ? "Now tap the same letter on the other scale — or a whole pan." : "");
      }
      return;
    }
    const { b, pan } = under(e.clientX, e.clientY);
    const onPan = pan ? { i: Number(pan.dataset.scale), pan: pan.dataset.pan } : null;
    if (d.kind === "rule") dropRule(d.i, b?.dataset.id || null, onPan);
    else drop(d.id, b?.dataset.id || null, onPan);
  };
  const onClick = (e) => {
    const share2 = e.target.closest(".sc-share");
    if (share2) { step(share(st, Number(share2.dataset.share), Number(share2.dataset.k)), `Both pans shared into ${share2.dataset.k}.`); return; }
    if (!held) return;
    const i = Number(held.slice(4));
    const hit = e.target.closest(".sc-block[data-id]");
    const pan = e.target.closest(".sc-pan");
    if (hit) dropRule(i, hit.dataset.id, null);
    else if (pan) dropRule(i, null, { i: Number(pan.dataset.scale), pan: pan.dataset.pan });
  };

  root.addEventListener("pointerdown", onDown);
  document.addEventListener("pointermove", onMove);
  document.addEventListener("pointerup", onUp);
  document.addEventListener("pointercancel", onUp);
  root.addEventListener("click", onClick);
  draw();

  return {
    state: () => copy(st),
    set(next) { st = copy(next); draw(); },
    reset() { st = copy(first); draw(); say(""); },
    dispose() {
      delete root.dataset.scalesLive;
      root.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
      root.removeEventListener("click", onClick);
      root.innerHTML = printed;   // back to the paper as it was printed
    },
  };
}
