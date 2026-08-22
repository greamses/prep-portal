/* ═══════════════════════════════════════════════════════════════════════════
   ROWS

   One line of working, drawn as SVG. A card is a stack of these, so the unit
   here is a ROW rather than "the equation" — that is the change the canvas
   brought: a move no longer replaces what is on screen, it writes a new line
   underneath and the writing travels down into it.

   Everything is measured in CSS pixels at scale 1; the canvas does its own
   zooming with a transform higher up. That keeps every number in this file
   directly comparable between rows, which is what lets the writing be matched
   and moved between two of them without measuring anything in the DOM.
   ═══════════════════════════════════════════════════════════════════════════ */

import { layout, FONT_FAMILY } from "./layout.js";

const NS = "http://www.w3.org/2000/svg";

export const el = (name, attrs) => {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  return node;
};

/**
 * Measure one line. `eqX` is where the equals sign lands, so a stack of rows
 * can be lined up on it the way working is lined up on paper.
 */
export function buildRow(eq, size) {
  const L = layout(eq, size, 6);
  const eqAtom = L.atoms.find((a) => a.key === `${eq.id}#eq`);
  return {
    eq, size,
    atoms: L.atoms,
    boxes: L.boxes,
    w: L.w,
    h: L.h,
    eqX: eqAtom ? eqAtom.x : L.w / 2,
  };
}

const termsOfSide = (side) => (side.kind === "sum" ? side.kids : [side]);

/** Draw a row. Only a `live` row gets tappable terms; the rest is just ink. */
export function paintRow(row, { live = false, picked = null, pad = 0 } = {}) {
  const svg = el("svg", {
    class: `am-row-svg${live ? " is-live" : ""}`,
    width: row.w + pad,
    height: row.h,
    viewBox: `${-pad} 0 ${row.w + pad} ${row.h}`,
  });

  const selLayer = el("g", {});
  const ink = el("g", { class: "am-ink" });
  const hits = el("g", {});
  svg.append(selLayer, ink, hits);

  for (const a of row.atoms) {
    let node;
    if (a.kind === "rule") {
      node = el("rect", { x: a.x, y: a.y, width: a.w, height: a.h, class: "am-rule" });
    } else if (a.kind === "hole") {
      node = el("rect", { x: a.x, y: a.y, width: a.w, height: a.h, rx: 2, class: "am-hole" });
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
    ink.appendChild(node);
  }

  if (live) {
    for (const t of [...termsOfSide(row.eq.l), ...termsOfSide(row.eq.r)]) {
      const b = row.boxes.get(t.id);
      if (!b) continue;
      const grow = 6;
      const box = { x: b.x - grow, y: b.y - grow, width: b.w + grow * 2, height: b.h + grow * 2 };
      if (t.id === picked) selLayer.appendChild(el("rect", { ...box, class: "am-sel", rx: 3 }));
      const hit = el("rect", { ...box, class: "am-hit", tabindex: "0", role: "button" });
      hit.dataset.node = t.id;
      hits.appendChild(hit);
    }
  }

  return svg;
}

/* Atom keys are ours (n12#op1) and contain a #, which a selector would read as
   a fragment. */
const cssEscape = (s) => (window.CSS && CSS.escape ? CSS.escape(s) : s.replace(/["\\#]/g, "\\$&"));

/**
 * Move the writing out of the row above and into the row just added.
 *
 * `from` maps a new node id to the old node ids it was built out of. Anything
 * NOT in it kept its own id through the rewrite — see ast.js — so it matches on
 * the key alone and the movement is free.
 *
 * Offsets are the rows' positions inside the card, so the two coordinate spaces
 * line up and the delta is just arithmetic.
 */
export function flipInto({ prevRow, prevOffset, newRow, newOffset, newSvg, from = new Map() }) {
  if (!prevRow) return;

  const prevAtoms = new Map(prevRow.atoms.map((a) => [a.key, a]));
  const claimed = new Set();

  const predecessor = (a) => {
    const own = prevAtoms.get(a.key);
    if (own && !claimed.has(a.key)) { claimed.add(a.key); return own; }
    const olds = from.get(a.nodeId);
    if (!olds) return null;
    const slot = a.key.slice(a.key.indexOf("#"));
    for (const oldId of olds) {
      const key = oldId + slot;
      if (prevAtoms.has(key) && !claimed.has(key)) { claimed.add(key); return prevAtoms.get(key); }
    }
    for (const oldId of olds) {
      for (const [k, p] of prevAtoms) {
        if (p.nodeId === oldId && !claimed.has(k)) { claimed.add(k); return p; }
      }
    }
    return null;
  };

  const moves = [];
  for (const a of newRow.atoms) {
    const node = newSvg.querySelector(`[data-key="${cssEscape(a.key)}"]`);
    if (!node) continue;
    const was = predecessor(a);
    if (was) {
      moves.push({
        node,
        dx: prevOffset.x + was.x - (newOffset.x + a.x),
        dy: prevOffset.y + was.y - (newOffset.y + a.y),
        sizeFrom: was.size, sizeTo: a.size,
      });
    } else {
      moves.push({ node, enter: true });
    }
  }

  for (const m of moves) {
    if (m.enter) { m.node.style.opacity = "0"; continue; }
    m.node.style.transition = "none";
    m.node.style.transform = `translate(${m.dx}px, ${m.dy}px)`;
    if (m.sizeFrom !== m.sizeTo) m.node.setAttribute("font-size", m.sizeFrom);
  }
  newSvg.getBoundingClientRect();                    // commit the "before" frame

  requestAnimationFrame(() => {
    for (const m of moves) {
      if (m.enter) {
        m.node.style.transition = "opacity 240ms ease 220ms";
        m.node.style.opacity = "1";
      } else {
        m.node.style.transition =
          "transform 520ms cubic-bezier(.16,1,.3,1), font-size 520ms cubic-bezier(.16,1,.3,1)";
        m.node.style.transform = "translate(0, 0)";
        if (m.sizeFrom !== m.sizeTo) m.node.setAttribute("font-size", m.sizeTo);
      }
    }
  });
}

