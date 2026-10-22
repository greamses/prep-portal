/* ============================================================================
   NODES AND THE LINES BETWEEN THEM
   ----------------------------------------------------------------------------
   The third of the "Models" family alongside the bar model, the number line
   and the Venn diagram (./barmodel.js, ./linemodel.js, ./vennmodel.js).

   A GENERAL TOOL, with a MODE on top of it — the same bargain the Venn
   diagram's presets make. "Graph" is nodes placed anywhere, joined to
   anything, for a mind map or a concept map — what connects to what, and
   nothing says which way. "Tree" is the same tool with one rule added: a
   node may have only ONE line coming IN, because that is what makes it a
   factor tree or a probability tree rather than a web — the shape the
   Primes and Statistics chapters already draw by hand, generalised into a
   board a child can build on any page. Connecting a node that already had a
   parent simply MOVES the line rather than adding a second one; the child
   is never told their tree is wrong, the tool just keeps it one.

   THE SAME BARGAIN AS EVERY OTHER MODEL: working, never marked.
   ========================================================================== */

import { mountTooltips } from "/utils/components/tooltip.js";

const VIEW = 680;
const HEIGHT = 440;
const INK = "#2a2723";
const GREY = "#6f685f";
const TONES = [
  "#bfe3ff", "#fff3a8", "#d6f0cf", "#ffd9cf", "#fffdf8",
  "#ffd0e0", "#e2d6f8", "#cdeeea", "#ffe6b8", "#dfe6ef",
  "#c9e9c2", "#ffc9c2", "#d8e8ff", "#f6e2c0", "#e8f0b8",
  "#f0d4ef", "#c6e7f5", "#ffdfa8", "#d4dcc4", "#eadfd2",
];

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const clone = (m) => JSON.parse(JSON.stringify(m));

/** An arrowhead at the END of a line — only drawn in tree mode, where a
    line has a direction (parent to child) worth saying. */
function head(x1, y1, x2, y2, fill = INK, size = 8) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const bx = x2 - ux * size, by = y2 - uy * size;
  const sx = -uy * size * 0.55, sy = ux * size * 0.55;
  return `<path d="M${x2.toFixed(1)} ${y2.toFixed(1)}L${(bx + sx).toFixed(1)} ${(by + sy).toFixed(1)}`
    + `L${(bx - sx).toFixed(1)} ${(by - sy).toFixed(1)}Z" fill="${fill}"/>`;
}

export const blankNodes = () => ({ mode: "graph", nodes: [], links: [] });

/* ── the keys, drawn ─────────────────────────────────────────────────────── */
const G = (inner) => `<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">${inner}</svg>`;
const SKY = "var(--accent-secondary,#2f6ea8)";
const SUN = "var(--accent-primary,#f4c95d)";
const LEAF = "var(--accent-success,#2e8b46)";
const RED = "var(--accent-danger,#c0453f)";
const ICON = {
  node: G(`<circle cx="12" cy="12" r="7.4" fill="${SKY}" stroke="#fffdf8" stroke-width="1.4"/>`),
  link: G(`<circle cx="5.4" cy="18.6" r="3.4" fill="${SKY}"/>` + `<circle cx="18.6" cy="5.4" r="3.4" fill="${LEAF}"/>`
    + `<path d="M7.8 16.2 16.2 7.8" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>`),
  tone: G(`<circle cx="12" cy="12" r="9.4" fill="${SUN}"/>`
    + `<path d="M12 2.6A9.4 9.4 0 0 1 12 21.4Z" fill="${SKY}"/>`
    + `<path d="M12 2.6A9.4 9.4 0 0 0 3.4 15.6Z" fill="${LEAF}"/>`
    + `<circle cx="12" cy="12" r="3" fill="#fffdf8"/>`),
  undo: G(`<path d="M12 6.4a7.6 7.6 0 1 1-7.1 10.2" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`
    + `<path d="M4.2 3.4v6.2h6.2Z" fill="${RED}"/>`),
  del: G(`<rect x="8.6" y="2.4" width="6.8" height="2.6" fill="${RED}"/>` + `<rect x="3" y="5" width="18" height="3.2" fill="${RED}"/>`
    + `<rect x="5.2" y="9.4" width="13.6" height="12" fill="${SUN}" stroke="${INK}" stroke-width="1.2"/>`),
};

/**
 *   mountNodesModel(el, { saved, onChange })
 *     saved                  a board from before, or null
 *     onChange(now, before)  after every change, for Undo
 *   → { get(), set(v), clear(), dispose() }
 */
export function mountNodesModel(el, { saved = null, onChange = () => {} } = {}) {
  const printed = el.innerHTML;
  let model = saved && saved.nodes ? clone(saved) : blankNodes();
  let picked = null;        // { kind: "node" | "link", id }
  let seq = 1 + Math.max(0, ...model.nodes.map((n) => n.id), ...model.links.map((l) => l.id));
  let tone = 0;
  let linking = false;
  let pendingA = null;      // a node waiting for its second tap, while linking

  const key = (t, tint, name) =>
    `<button type="button" class="pp-btn wb-tint-${tint} nd-key" data-t="${t}"`
    + ` aria-label="${esc(name)}" data-tip="${esc(name)}" data-tip-side="down">${ICON[t]}</button>`;

  el.classList.add("is-noding");
  el.innerHTML =
    `<div class="nd-tools" role="toolbar" aria-label="Nodes tools">`
    + `<span class="nd-sets">`
    + `<button type="button" class="pp-plain nd-set" data-mode="graph" aria-pressed="false">Graph</button>`
    + `<button type="button" class="pp-plain nd-set" data-mode="tree" aria-pressed="false">Tree</button>`
    + `</span>`
    + key("node", 2, "Add a node")
    + `<button type="button" class="pp-btn wb-tint-1 nd-key" data-t="link" aria-label="Join two nodes"`
    + ` aria-pressed="false" data-tip="Join two nodes — tap one, then the other" data-tip-side="down">${ICON.link}</button>`
    + key("tone", 2, "The colour of the picked node or line")
    + key("undo", 1, "Step back")
    + key("del", 4, "Take the picked one off")
    + `<div class="nd-pot" data-pot hidden><div class="pp-receipt"><div class="pp-receipt__paper">`
    + `<div class="nd-pot__in">`
    + TONES.map((hex, i) => `<button type="button" class="pp-plain nd-chip" data-tone="${i}"`
      + ` style="background:${hex}" aria-label="Colour ${i + 1}"></button>`).join("")
    + `</div></div></div></div>`
    + `</div>`
    + `<div class="nd-board"><svg class="nd-svg" viewBox="0 0 ${VIEW} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg"></svg>`
    + `<div class="nd-nodes"></div></div>`
    + `<p class="nd-hint">Drag a node anywhere. Join: tap the key, then tap two nodes. Double-click a node, or a line, to write on it.</p>`;

  const board = el.querySelector(".nd-board");
  const svg = el.querySelector(".nd-svg");
  const nodesEl = el.querySelector(".nd-nodes");
  const tools = el.querySelector(".nd-tools");
  const pot = el.querySelector("[data-pot]");

  const tell = () => onChange(clone(model), undefined);

  /* ── drawing ─────────────────────────────────────────────────────────── */
  const px = (v) => (v / 100) * VIEW;
  const py = (v) => (v / 100) * HEIGHT;

  function paintLinks() {
    svg.innerHTML = model.links.map((l) => {
      const a = model.nodes.find((n) => n.id === l.a);
      const b = model.nodes.find((n) => n.id === l.b);
      if (!a || !b) return "";
      const on = picked && picked.kind === "link" && picked.id === l.id;
      const x1 = px(a.x), y1 = py(a.y), x2 = px(b.x), y2 = py(b.y);
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      /* the DEFAULT tone (index 0, a pale sky) reads as "no colour chosen" —
         drawn as plain ink, the way an un-coloured mark does everywhere else
         on this site, with a picked colour taking over once one is set */
      const col = l.tone ? TONES[l.tone % TONES.length] : INK;
      return `<g class="nd-link${on ? " is-picked" : ""}" data-link="${l.id}">`
        + `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"`
        + ` stroke="${col}" stroke-width="${on ? 2.8 : 1.6}"/>`
        + `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"`
        + ` stroke="transparent" stroke-width="16" data-hit="${l.id}" style="pointer-events:stroke"/>`
        + (model.mode === "tree" ? head(x1, y1, x2, y2, col) : "")
        + (l.text ? `<rect x="${(mx - 16).toFixed(1)}" y="${(my - 11).toFixed(1)}" width="32" height="20" fill="#fffdf8"/>`
          + `<text x="${mx.toFixed(1)}" y="${(my + 4).toFixed(1)}" text-anchor="middle" font-family="JetBrains Mono, monospace"`
          + ` font-size="13" font-weight="700" fill="${col}">${esc(l.text)}</text>` : "")
        + `</g>`;
    }).join("");
  }

  function paintNodes() {
    nodesEl.innerHTML = model.nodes.map((n) => {
      const onPick = picked && picked.kind === "node" && picked.id === n.id;
      const onPend = pendingA === n.id;
      return `<button type="button" class="pp-plain nd-node${onPick ? " is-picked" : ""}${onPend ? " is-pending" : ""}" data-node="${n.id}"
              style="left:${n.x}%;top:${n.y}%;background:${TONES[n.tone % TONES.length]}">${esc(n.text || "…")}</button>`;
    }).join("");
  }

  const paintAll = () => { paintLinks(); paintNodes(); };

  /* ── changes, one Undo step each ─────────────────────────────────────── */
  const history = [];
  function change(fn) {
    const before = clone(model);
    history.push(JSON.stringify(before));
    if (history.length > 60) history.shift();
    fn();
    paintAll();
    if (JSON.stringify(before) !== JSON.stringify(model)) onChange(clone(model), before);
    tools.querySelector('[data-t="undo"]').disabled = !history.length;
  }
  function stepBack() {
    const was = history.pop();
    if (!was) return;
    const before = clone(model);
    model = JSON.parse(was);
    picked = null;
    paintAll();
    onChange(clone(model), before);
    tools.querySelector('[data-t="undo"]').disabled = !history.length;
  }

  /** Join a to b. In tree mode b may have only one line in, so any line
      already feeding it is taken off first — moved, not doubled. */
  function addLink(a, b) {
    if (a === b) return;
    if (model.mode === "tree") {
      model.links = model.links.filter((l) => l.b !== b);
    } else if (model.links.some((l) => (l.a === a && l.b === b) || (l.a === b && l.b === a))) {
      return;
    }
    model.links.push({ id: seq++, a, b, text: "", tone });
  }

  function setLinking(on) {
    linking = on;
    pendingA = null;
    tools.querySelector('[data-t="link"]').setAttribute("aria-pressed", String(on));
    board.classList.toggle("is-linking", on);
  }

  /* ── tools ───────────────────────────────────────────────────────────── */
  tools.addEventListener("click", (e) => {
    const mode = e.target.closest("[data-mode]")?.dataset.mode;
    if (mode) {
      change(() => {
        model.mode = mode;
        if (mode === "tree" && !model.nodes.length) model.nodes.push({ id: seq++, text: "Start", x: 50, y: 14, tone: 0 });
      });
      syncTabs();
      return;
    }
    const t = e.target.closest("[data-t]")?.dataset.t;
    if (!t) return;
    if (t === "undo") { stepBack(); return; }
    if (t === "tone") {
      if (!picked) { flash("Tap a node or a line first."); return; }
      show(pot, e.target.closest("[data-t]"));
      return;
    }
    if (t === "link") { setLinking(!linking); return; }
    if (t === "node") {
      change(() => {
        const n = { id: seq++, text: "", x: 48 + (model.nodes.length % 5) * 2, y: 48 + (model.nodes.length % 3) * 2, tone };
        model.nodes.push(n);
        picked = { kind: "node", id: n.id };
      });
      writeNode(picked.id);
      return;
    }
    if (t === "del") {
      if (!picked) { flash("Tap a node or a line first."); return; }
      change(() => {
        if (picked.kind === "node") {
          model.nodes = model.nodes.filter((n) => n.id !== picked.id);
          model.links = model.links.filter((l) => l.a !== picked.id && l.b !== picked.id);
        } else {
          model.links = model.links.filter((l) => l.id !== picked.id);
        }
        picked = null;
      });
    }
  });

  function syncTabs() {
    el.querySelectorAll("[data-mode]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === model.mode)));
  }

  pot.addEventListener("click", (e) => {
    const t = e.target.closest("[data-tone]")?.dataset.tone;
    if (t == null || !picked) return;
    tone = Number(t);
    change(() => {
      const it = picked.kind === "node" ? model.nodes.find((n) => n.id === picked.id) : model.links.find((l) => l.id === picked.id);
      if (it) it.tone = tone;
    });
    pot.hidden = true;
  });

  let flashing = 0;
  const HINT = "Drag a node anywhere. Join: tap the key, then tap two nodes. Double-click a node, or a line, to write on it.";
  function flash(words) {
    const hint = el.querySelector(".nd-hint");
    hint.textContent = words;
    hint.classList.add("is-loud");
    clearTimeout(flashing);
    flashing = setTimeout(() => { hint.classList.remove("is-loud"); hint.textContent = HINT; }, 2200);
  }

  /** Portaled to document.body the first time it opens — see vennmodel.js /
      linemodel.js show(), where `position: fixed` inside a floating panel
      that carries its own drop-shadow filter was found to compute against
      the real window and then render nowhere near it. */
  function show(sheet, keyEl) {
    if (!sheet.hidden) { sheet.hidden = true; return; }
    if (sheet.parentElement !== document.body) document.body.appendChild(sheet);
    sheet.hidden = false;
    const k = keyEl.getBoundingClientRect();
    const b = sheet.getBoundingClientRect();
    const left = Math.max(6, Math.min(window.innerWidth - b.width - 6, k.left));
    const room = window.innerHeight - k.bottom - 10;
    const top = b.height > room && k.top > b.height + 10 ? k.top - b.height - 6 : k.bottom + 6;
    sheet.style.left = `${left}px`;
    sheet.style.top = `${Math.max(6, top)}px`;
  }
  const shut = (e) => {
    if (!e.target.closest(".nd-tools") && !e.target.closest(".nd-pot")) pot.hidden = true;
  };
  document.addEventListener("pointerdown", shut, true);

  /* ── writing ─────────────────────────────────────────────────────────── */
  function inputAt(x, y, w, value, done) {
    el.querySelector(".nd-write")?.remove();
    const r = board.getBoundingClientRect();
    const input = document.createElement("input");
    input.type = "text";
    input.className = "nd-write";
    input.value = value;
    input.autocomplete = "off";
    input.spellcheck = false;
    const width = Math.max(64, w);
    input.style.left = `${(x / 100) * r.width - width / 2}px`;
    input.style.top = `${(y / 100) * r.height - 14}px`;
    input.style.width = `${width}px`;
    board.appendChild(input);
    input.focus();
    input.select();
    let over = false;
    const finish = (keep) => {
      if (over) return;
      over = true;
      const v = input.value.trim().slice(0, 20);
      input.remove();
      if (keep) done(v);
    };
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") { ev.preventDefault(); finish(true); }
      if (ev.key === "Escape") finish(false);
    });
    input.addEventListener("blur", () => finish(true));
  }

  function writeNode(id) {
    const n = model.nodes.find((x) => x.id === id);
    if (!n) return;
    inputAt(n.x, n.y, 90, n.text, (v) => change(() => { const now = model.nodes.find((x) => x.id === id); if (now) now.text = v; }));
  }
  function writeLink(id) {
    const l = model.links.find((x) => x.id === id);
    if (!l) return;
    const a = model.nodes.find((n) => n.id === l.a), b = model.nodes.find((n) => n.id === l.b);
    if (!a || !b) return;
    inputAt((a.x + b.x) / 2, (a.y + b.y) / 2, 60, l.text, (v) => change(() => { const now = model.links.find((x) => x.id === id); if (now) now.text = v; }));
  }

  /* ── dragging a node — and, while linking, the two taps that join two ───
     NOT `e.target` once a drag has set pointer capture: every later event
     for that pointer reports the CAPTURING element, not what's really under
     the finger (see vennmodel.js — the bug that cost the most time there).
     `picked`/`drag.id`, captured at pointerdown, are what every later
     handler here reads. */
  let drag = null;
  let dragged = false;
  nodesEl.addEventListener("pointerdown", (e) => {
    const id = Number(e.target.closest("[data-node]")?.dataset.node);
    if (!id) return;
    e.preventDefault();
    if (linking) {
      if (pendingA == null) { pendingA = id; paintNodes(); return; }
      if (pendingA !== id) change(() => addLink(pendingA, id));
      pendingA = null;
      paintNodes();
      return;
    }
    picked = { kind: "node", id };
    dragged = false;
    drag = { id, r: board.getBoundingClientRect() };
    nodesEl.setPointerCapture(e.pointerId);
    paintAll();
  });
  nodesEl.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const x = ((e.clientX - drag.r.left) / drag.r.width) * 100;
    const y = ((e.clientY - drag.r.top) / drag.r.height) * 100;
    const n = model.nodes.find((x2) => x2.id === drag.id);
    if (!n) return;
    if (Math.abs(x - n.x) < 0.3 && Math.abs(y - n.y) < 0.3 && !dragged) return;
    dragged = true;
    n.x = Math.max(2, Math.min(98, x));
    n.y = Math.max(2, Math.min(98, y));
    paintAll();
  });
  const drop = () => {
    if (!drag) return;
    drag = null;
    if (dragged) tell();
    setTimeout(() => { dragged = false; }, 0);
  };
  nodesEl.addEventListener("pointerup", drop);
  nodesEl.addEventListener("pointercancel", drop);

  let lastTap = null;
  function twice(id) {
    const now = Date.now();
    const yes = lastTap && lastTap.id === id && now - lastTap.at < 450;
    lastTap = yes ? null : { id, at: now };
    return yes;
  }
  nodesEl.addEventListener("pointerup", (e) => {
    if (linking || dragged || picked?.kind !== "node") return;
    if (twice(`n${picked.id}`)) writeNode(picked.id);
  });

  /* a link is picked (and double-tapped) on its own hit-stroke in the svg —
     the svg itself sets no pointer capture, so `e.target` stays accurate */
  svg.addEventListener("pointerdown", (e) => {
    const id = Number(e.target.closest("[data-hit]")?.dataset.hit);
    if (!id) return;
    picked = { kind: "link", id };
    paintAll();
  });
  svg.addEventListener("pointerup", (e) => {
    const id = Number(e.target.closest("[data-hit]")?.dataset.hit);
    if (!id) return;
    if (twice(`l${id}`)) writeLink(id);
  });

  paintAll();
  syncTabs();
  mountTooltips();
  tools.querySelector('[data-t="undo"]').disabled = true;

  return {
    get: () => clone(model),
    set(v) { model = v && v.nodes ? clone(v) : blankNodes(); picked = null; paintAll(); syncTabs(); return clone(model); },
    clear() { model = blankNodes(); picked = null; paintAll(); syncTabs(); },
    dispose() {
      document.removeEventListener("pointerdown", shut, true);
      pot.remove();
      el.classList.remove("is-noding");
      el.innerHTML = printed;
    },
  };
}
