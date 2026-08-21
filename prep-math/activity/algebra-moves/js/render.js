/* ═══════════════════════════════════════════════════════════════════════════
   THE STAGE

   Draws the equation as SVG and, when it changes, MOVES the writing from where
   it was to where it now is. This file is the reason ast.js and layout.js are
   built the way they are, and it is the part of the spike that was actually in
   doubt: if a term cannot be matched between the two pictures, it can only
   blink out and blink back somewhere else, and the tool stops teaching that
   the equation is one object being rearranged.

   The match is by atom key (nodeId#slot). An atom whose key is in both
   pictures is the same writing and gets a FLIP: draw it at its new home,
   shove it back to its old one, then let it travel. An atom that is only in
   the new picture fades in. An atom that is only in the old one fades out —
   and if the move said it was absorbed into something (two terms folding into
   one), it flies into whatever ate it on the way out.

   A fixed viewBox keeps the scale constant between steps, so nothing rescales
   mid-flight; long equations shrink their font instead.
   ═══════════════════════════════════════════════════════════════════════════ */

import { layout, FONT_FAMILY } from "./layout.js";

const NS = "http://www.w3.org/2000/svg";
const VB_W = 760;
const VB_H = 200;
const BASE_SIZE = 62;
const MOVE_MS = 560;

const el = (name, attrs) => {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  return node;
};

/** Lay the equation out at the biggest size that still fits the fixed stage. */
function fit(eq) {
  let size = BASE_SIZE;
  let L = layout(eq, size, 0);
  const k = Math.min(1, (VB_W - 40) / L.w, (VB_H - 40) / L.h);
  if (k < 0.999) {
    size = Math.max(16, size * k);
    L = layout(eq, size, 0);
  }
  return { L, dx: (VB_W - L.w) / 2, dy: (VB_H - L.h) / 2 };
}

export function createStage(host, { onPick } = {}) {
  const svg = el("svg", {
    viewBox: `0 0 ${VB_W} ${VB_H}`,
    class: "am-svg",
    role: "img",
    "aria-label": "The equation",
  });
  host.appendChild(svg);

  let prev = null;     // { atoms: Map(key -> {x, y, size}), boxes: Map(id -> box) }
  let current = null;  // { eq, L, dx, dy }
  let picked = null;

  function draw(eq, { from = new Map(), animate = true } = {}) {
    const { L, dx, dy } = fit(eq);
    const shift = (a) => ({ ...a, x: a.x + dx, y: a.y + dy });
    const atoms = L.atoms.map(shift);
    const boxes = new Map();
    for (const [id, b] of L.boxes) boxes.set(id, { ...b, x: b.x + dx, y: b.y + dy });

    // Which old node ended up inside which new node.
    const absorbedBy = new Map();
    for (const [newId, olds] of from) for (const o of olds) absorbedBy.set(o, newId);

    const byKey = new Map(atoms.map((a) => [a.key, a]));
    const claimed = new Set();

    // Where an atom was last time — under its own key, or under the key of a
    // node this one was built from.
    const findPrev = (a) => {
      if (!prev) return null;
      const own = prev.atoms.get(a.key);
      if (own) { claimed.add(a.key); return own; }
      const olds = from.get(a.nodeId);
      if (!olds) return null;
      const slot = a.key.slice(a.key.indexOf("#"));
      for (const oldId of olds) {
        const hit = prev.atoms.get(oldId + slot);
        if (hit) { claimed.add(oldId + slot); return hit; }
      }
      for (const oldId of olds) {
        for (const [k, p] of prev.atoms) {
          if (p.nodeId === oldId && !claimed.has(k)) { claimed.add(k); return p; }
        }
      }
      return null;
    };

    svg.textContent = "";

    const selLayer = el("g", { class: "am-sel-layer" });
    const inkLayer = el("g", { class: "am-ink" });
    const hitLayer = el("g", { class: "am-hits" });
    svg.append(selLayer, inkLayer, hitLayer);

    /* ── The writing ─────────────────────────────────────────────────────── */
    const flips = [];
    for (const a of atoms) {
      let node;
      if (a.kind === "rule") {
        node = el("rect", { x: a.x, y: a.y, width: a.w, height: a.h, class: "am-rule" });
      } else {
        node = el("text", {
          x: a.x, y: a.y,
          "font-size": a.size,
          "font-family": FONT_FAMILY,
          "font-style": a.italic ? "italic" : "normal",
          class: "am-glyph",
        });
        node.textContent = a.text;
      }
      node.dataset.key = a.key;
      node.dataset.node = a.nodeId;
      inkLayer.appendChild(node);

      const was = animate ? findPrev(a) : null;
      if (!animate) continue;
      if (was) {
        const ox = was.x - a.x;
        const oy = was.y - a.y;
        if (ox || oy || was.size !== a.size) flips.push({ node, ox, oy, size: was.size, to: a.size });
      } else if (prev) {
        node.classList.add("am-enter");
        flips.push({ node, enter: true });
      }
    }

    /* ── What is leaving ─────────────────────────────────────────────────── */
    if (animate && prev) {
      for (const [key, p] of prev.atoms) {
        if (claimed.has(key) || byKey.has(key)) continue;
        const ghost = p.kind === "rule"
          ? el("rect", { x: p.x, y: p.y, width: p.w, height: p.h, class: "am-rule am-ghost" })
          : el("text", { x: p.x, y: p.y, "font-size": p.size, "font-family": FONT_FAMILY,
                         "font-style": p.italic ? "italic" : "normal", class: "am-glyph am-ghost" });
        if (p.kind !== "rule") ghost.textContent = p.text;
        inkLayer.appendChild(ghost);

        // If this atom's node was folded into another, send it there as it goes.
        const target = absorbedBy.get(p.nodeId);
        const box = target && boxes.get(target);
        const to = box ? { x: box.x + box.w / 2 - p.x, y: box.y + box.h / 2 - p.y } : { x: 0, y: 0 };
        flips.push({ node: ghost, exit: true, to });
      }
    }

    /* ── What can be tapped ──────────────────────────────────────────────── */
    const targets = [];
    for (const side of [eq.l, eq.r]) {
      const terms = side.kind === "sum" ? side.kids : [side];
      for (const t of terms) if (boxes.has(t.id)) targets.push(t.id);
    }
    for (const id of targets) {
      const b = boxes.get(id);
      const pad = 8;
      const rect = el("rect", {
        x: b.x - pad, y: b.y - pad, width: b.w + pad * 2, height: b.h + pad * 2,
        class: "am-hit", tabindex: "0", role: "button",
      });
      rect.dataset.node = id;
      hitLayer.appendChild(rect);
      if (id === picked) {
        const sel = el("rect", {
          x: b.x - pad, y: b.y - pad, width: b.w + pad * 2, height: b.h + pad * 2,
          class: "am-sel", rx: 4,
        });
        selLayer.appendChild(sel);
      }
    }

    /* ── Let it travel ───────────────────────────────────────────────────── */
    if (flips.length) {
      for (const f of flips) {
        if (f.enter) { f.node.style.opacity = "0"; continue; }
        if (f.exit) { f.node.style.opacity = "1"; continue; }
        f.node.style.transition = "none";
        f.node.style.transform = `translate(${f.ox}px, ${f.oy}px)`;
        if (f.size !== f.to) f.node.setAttribute("font-size", f.size);
      }
      svg.getBoundingClientRect();          // commit the "before" frame
      requestAnimationFrame(() => {
        for (const f of flips) {
          if (f.enter) {
            f.node.style.transition = `opacity 260ms ease ${Math.round(MOVE_MS * 0.45)}ms`;
            f.node.style.opacity = "1";
          } else if (f.exit) {
            f.node.style.transition = `opacity 300ms ease, transform ${MOVE_MS}ms cubic-bezier(.16,1,.3,1)`;
            f.node.style.opacity = "0";
            f.node.style.transform = `translate(${f.to.x}px, ${f.to.y}px)`;
          } else {
            f.node.style.transition = `transform ${MOVE_MS}ms cubic-bezier(.16,1,.3,1), font-size ${MOVE_MS}ms cubic-bezier(.16,1,.3,1)`;
            f.node.style.transform = "translate(0, 0)";
            if (f.size !== f.to) f.node.setAttribute("font-size", f.to);
          }
        }
      });
      setTimeout(() => {
        for (const g of svg.querySelectorAll(".am-ghost")) g.remove();
      }, MOVE_MS + 60);
    }

    prev = { atoms: new Map(atoms.map((a) => [a.key, a])), boxes };
    current = { eq, L, dx, dy, boxes };
  }

  svg.addEventListener("click", (e) => {
    const hit = e.target.closest(".am-hit");
    if (!hit) { if (picked) { picked = null; onPick?.(null); redraw(); } return; }
    picked = hit.dataset.node === picked ? null : hit.dataset.node;
    onPick?.(picked);
    redraw();
  });

  svg.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const hit = e.target.closest?.(".am-hit");
    if (!hit) return;
    e.preventDefault();
    picked = hit.dataset.node === picked ? null : hit.dataset.node;
    onPick?.(picked);
    redraw();
  });

  const redraw = () => current && draw(current.eq, { animate: false });

  return {
    show(eq, opts) { draw(eq, opts); },
    /** Selection is the stage's own business; callers only ever clear it. */
    clearPick() { if (picked !== null) { picked = null; redraw(); } },
    get picked() { return picked; },
    /** Reset the memory of the last picture, so the next draw does not animate. */
    forget() { prev = null; picked = null; },
  };
}
