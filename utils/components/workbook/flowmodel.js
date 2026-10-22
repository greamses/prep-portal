/* ============================================================================
   A FLOW CHART YOU BUILD
   ----------------------------------------------------------------------------
   The fifth of the "Models" family (./barmodel.js, ./linemodel.js,
   ./vennmodel.js, ./nodesmodel.js).

   A GENERAL TOOL, with a PRESET on top of it — the same bargain the Venn
   diagram's and the table organiser's presets make. Blank is the three
   shapes a flow chart is built from: a STADIUM is where it starts or stops,
   a BOX is something you DO, a DIAMOND is a question with two ways out — and
   the shape is the meaning, the way it is on paper (see organiser.js's own
   FLOW shape, which this model generalises into something built rather than
   drawn once). "Function machine" pours a question onto the same tool: an
   input, a chain of operations, an output, already joined — the picture a
   child uses for inverse operations and solving for an unknown.

   Joining two shapes is a toggled tool, like the nodes model's: tap the
   key, tap a shape, tap a second shape. Every line has a direction (an
   arrowhead), because a flow chart only runs one way; a diamond's two ways
   out are told apart by writing "yes" / "no" on the lines themselves
   (double-click a line, the same as everywhere else).
   ========================================================================== */

import { mountTooltips } from "/utils/components/tooltip.js";

const VIEW = 680;
const HEIGHT = 420;
const INK = "#2a2723";
const PAPER = "#fffdf8";
const TONES = [
  "#bfe3ff", "#fff3a8", "#d6f0cf", "#ffd9cf", "#fffdf8",
  "#ffd0e0", "#e2d6f8", "#cdeeea", "#ffe6b8", "#dfe6ef",
  "#c9e9c2", "#ffc9c2", "#d8e8ff", "#f6e2c0", "#e8f0b8",
  "#f0d4ef", "#c6e7f5", "#ffdfa8", "#d4dcc4", "#eadfd2",
];

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const clone = (m) => JSON.parse(JSON.stringify(m));

/* ── the three shapes a flow chart is built from ──────────────────────────
   Fixed size per kind — a shape's SIZE is not the lesson, its KIND is. */
const DIMS = {
  stadium: { w: 110, h: 40 },
  box: { w: 120, h: 48 },
  diamond: { w: 130, h: 82 },
};

function shapePath(kind, cx, cy, fill) {
  const { w, h } = DIMS[kind];
  const x = cx - w / 2, y = cy - h / 2;
  if (kind === "stadium") {
    const r = h / 2;
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w}" height="${h}" rx="${r}" ry="${r}" fill="${fill}" stroke="${INK}" stroke-width="1.8"/>`;
  }
  if (kind === "diamond") {
    return `<path d="M${cx} ${y.toFixed(1)}L${(cx + w / 2).toFixed(1)} ${cy}L${cx} ${(y + h).toFixed(1)}L${(cx - w / 2).toFixed(1)} ${cy}Z" fill="${fill}" stroke="${INK}" stroke-width="1.8"/>`;
  }
  return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w}" height="${h}" fill="${fill}" stroke="${INK}" stroke-width="1.8"/>`;
}

/** The point on a shape's own edge closest to `toward`, for a line to start
    or end AT the shape rather than at its centre, buried under the text. */
function edgeOf(kind, cx, cy, tx, ty) {
  const { w, h } = DIMS[kind];
  const dx = tx - cx, dy = ty - cy;
  if (!dx && !dy) return [cx, cy];
  if (kind === "diamond") {
    const t = 1 / (Math.abs(dx) / (w / 2) + Math.abs(dy) / (h / 2) || 1);
    return [cx + dx * t, cy + dy * t];
  }
  const t = Math.min(Math.abs((w / 2) / (dx || 1e-6)), Math.abs((h / 2) / (dy || 1e-6)));
  return [cx + dx * t, cy + dy * t];
}

function head(x2, y2, ux, uy, fill, size = 9) {
  const bx = x2 - ux * size, by = y2 - uy * size;
  const sx = -uy * size * 0.55, sy = ux * size * 0.55;
  return `<path d="M${x2.toFixed(1)} ${y2.toFixed(1)}L${(bx + sx).toFixed(1)} ${(by + sy).toFixed(1)}`
    + `L${(bx - sx).toFixed(1)} ${(by - sy).toFixed(1)}Z" fill="${fill}"/>`;
}

export const blankFlow = () => ({ preset: "blank", nodes: [], links: [] });

/* ── the keys, drawn ─────────────────────────────────────────────────────── */
const G = (inner) => `<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">${inner}</svg>`;
const SKY = "var(--accent-secondary,#2f6ea8)";
const SUN = "var(--accent-primary,#f4c95d)";
const LEAF = "var(--accent-success,#2e8b46)";
const RED = "var(--accent-danger,#c0453f)";
const ICON = {
  stadium: G(`<rect x="3" y="8" width="18" height="8" rx="4" ry="4" fill="${SKY}" stroke="#fffdf8" stroke-width="1"/>`),
  box: G(`<rect x="3.4" y="7.4" width="17.2" height="9.2" fill="${SUN}" stroke="${INK}" stroke-width="1.2"/>`),
  diamond: G(`<path d="M12 3 20.6 12 12 21 3.4 12Z" fill="${LEAF}" stroke="${INK}" stroke-width="1.2"/>`),
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
 *   mountFlowModel(el, { saved, onChange })
 *     saved                  a chart from before, or null
 *     onChange(now, before)  after every change, for Undo
 *   → { get(), set(v), clear(), dispose() }
 */
export function mountFlowModel(el, { saved = null, onChange = () => {} } = {}) {
  const printed = el.innerHTML;
  let model = saved && saved.nodes ? clone(saved) : blankFlow();
  let picked = null;        // { kind: "node" | "link", id }
  let seq = 1 + Math.max(0, ...model.nodes.map((n) => n.id), ...model.links.map((l) => l.id));
  let tone = 0;
  let linking = false;
  let pendingA = null;

  const key = (t, tint, name) =>
    `<button type="button" class="pp-btn wb-tint-${tint} fl-key" data-t="${t}"`
    + ` aria-label="${esc(name)}" data-tip="${esc(name)}" data-tip-side="down">${ICON[t]}</button>`;

  el.classList.add("is-flowing");
  el.innerHTML =
    `<div class="fl-tools" role="toolbar" aria-label="Flow chart tools">`
    + `<span class="fl-sets">`
    + `<button type="button" class="pp-plain fl-set" data-set="blank" aria-pressed="false">Blank</button>`
    + `<button type="button" class="pp-plain fl-set" data-set="machine" aria-pressed="false">Function machine</button>`
    + `</span>`
    + key("stadium", 2, "Start or end")
    + key("box", 2, "Something you do")
    + key("diamond", 2, "A question, with two ways out")
    + `<button type="button" class="pp-btn wb-tint-1 fl-key" data-t="link" aria-label="Join two shapes"`
    + ` aria-pressed="false" data-tip="Join two shapes — tap one, then the other" data-tip-side="down">${ICON.link}</button>`
    + key("tone", 3, "The colour of the picked shape or line")
    + key("undo", 1, "Step back")
    + key("del", 4, "Take the picked one off")
    + `<div class="fl-pot" data-pot hidden><div class="pp-receipt"><div class="pp-receipt__paper">`
    + `<div class="fl-pot__in">`
    + TONES.map((hex, i) => `<button type="button" class="pp-plain fl-chip" data-tone="${i}"`
      + ` style="background:${hex}" aria-label="Colour ${i + 1}"></button>`).join("")
    + `</div></div></div></div>`
    + `</div>`
    + `<div class="fl-board"><svg class="fl-svg" viewBox="0 0 ${VIEW} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg"></svg></div>`
    + `<p class="fl-hint">Drag a shape anywhere. Join: tap the key, then tap two shapes. Double-click a shape, or a line, to write on it.</p>`;

  const board = el.querySelector(".fl-board");
  const svg = el.querySelector(".fl-svg");
  const tools = el.querySelector(".fl-tools");
  const pot = el.querySelector("[data-pot]");

  const tell = () => onChange(clone(model), undefined);
  const px = (v) => (v / 100) * VIEW;
  const py = (v) => (v / 100) * HEIGHT;

  /* ── drawing ─────────────────────────────────────────────────────────── */
  function paint() {
    let out = model.links.map((l) => {
      const a = model.nodes.find((n) => n.id === l.a), b = model.nodes.find((n) => n.id === l.b);
      if (!a || !b) return "";
      const on = picked && picked.kind === "link" && picked.id === l.id;
      const cax = px(a.x), cay = py(a.y), cbx = px(b.x), cby = py(b.y);
      const [x1, y1] = edgeOf(a.kind, cax, cay, cbx, cby);
      const [x2, y2] = edgeOf(b.kind, cbx, cby, cax, cay);
      const col = l.tone ? TONES[l.tone % TONES.length] : INK;
      const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      return `<g class="fl-link${on ? " is-picked" : ""}">`
        + `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"`
        + ` stroke="${col}" stroke-width="${on ? 2.8 : 1.8}"/>`
        + head(x2, y2, dx / len, dy / len, col)
        + `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"`
        + ` stroke="transparent" stroke-width="16" data-hit="${l.id}" style="pointer-events:stroke"/>`
        + (l.text ? `<rect x="${(mx - 17).toFixed(1)}" y="${(my - 11).toFixed(1)}" width="34" height="20" fill="${PAPER}"/>`
          + `<text x="${mx.toFixed(1)}" y="${(my + 4).toFixed(1)}" text-anchor="middle" font-family="JetBrains Mono, monospace"`
          + ` font-size="13" font-weight="700" fill="${col}">${esc(l.text)}</text>` : "")
        + `</g>`;
    }).join("");

    out += model.nodes.map((n) => {
      const on = picked && picked.kind === "node" && picked.id === n.id;
      const onPend = pendingA === n.id;
      const cx = px(n.x), cy = py(n.y);
      const { w, h } = DIMS[n.kind];
      const fill = n.tone ? TONES[n.tone % TONES.length] : PAPER;
      return `<g class="fl-node${on ? " is-picked" : ""}${onPend ? " is-pending" : ""}" data-node="${n.id}">`
        + shapePath(n.kind, cx, cy, fill)
        + `<text x="${cx}" y="${(cy + 4.5).toFixed(1)}" text-anchor="middle" font-family="JetBrains Mono, monospace"`
        + ` font-size="13" font-weight="700" fill="${INK}">${esc(n.text || "…")}</text>`
        + `<rect x="${(cx - w / 2).toFixed(1)}" y="${(cy - h / 2).toFixed(1)}" width="${w}" height="${h}" fill="transparent"`
        + ` data-hit="${n.id}" style="pointer-events:all"/>`
        + `</g>`;
    }).join("");

    svg.innerHTML = out;
  }

  /* ── changes, one Undo step each ─────────────────────────────────────── */
  const history = [];
  function change(fn) {
    const before = clone(model);
    history.push(JSON.stringify(before));
    if (history.length > 60) history.shift();
    fn();
    paint();
    if (JSON.stringify(before) !== JSON.stringify(model)) onChange(clone(model), before);
    tools.querySelector('[data-t="undo"]').disabled = !history.length;
  }
  function stepBack() {
    const was = history.pop();
    if (!was) return;
    const before = clone(model);
    model = JSON.parse(was);
    picked = null;
    paint();
    onChange(clone(model), before);
    tools.querySelector('[data-t="undo"]').disabled = !history.length;
  }

  function addNode(kind, x, y) {
    const n = { id: seq++, kind, text: "", x, y, tone: 0 };
    model.nodes.push(n);
    return n;
  }
  function addLink(a, b) {
    if (a === b) return;
    if (model.links.some((l) => l.a === a && l.b === b)) return;
    model.links.push({ id: seq++, a, b, text: "", tone: 0 });
  }

  function buildMachine() {
    model.nodes = [];
    model.links = [];
    const input = addNode("stadium", 8, 50);
    input.text = "Input";
    const steps = [32, 50, 68].map((x) => addNode("box", x, 50));
    const output = addNode("stadium", 92, 50);
    output.text = "Output";
    const row = [input, ...steps, output];
    for (let i = 0; i < row.length - 1; i++) addLink(row[i].id, row[i + 1].id);
  }

  function setLinking(on) {
    linking = on;
    pendingA = null;
    tools.querySelector('[data-t="link"]').setAttribute("aria-pressed", String(on));
    board.classList.toggle("is-linking", on);
  }

  /* ── tools ───────────────────────────────────────────────────────────── */
  tools.addEventListener("click", (e) => {
    const set = e.target.closest("[data-set]")?.dataset.set;
    if (set) {
      change(() => {
        model.preset = set;
        if (set === "machine") buildMachine();
      });
      syncTabs();
      return;
    }
    const t = e.target.closest("[data-t]")?.dataset.t;
    if (!t) return;
    if (t === "undo") { stepBack(); return; }
    if (t === "tone") {
      if (!picked) { flash("Tap a shape or a line first."); return; }
      show(pot, e.target.closest("[data-t]"));
      return;
    }
    if (t === "link") { setLinking(!linking); return; }
    if (t === "stadium" || t === "box" || t === "diamond") {
      change(() => {
        /* a new shape lands clear of whatever is already there — three in a
           row at the same spot is one shape, not three, with the others
           buried under it and invisible */
        const i = model.nodes.length;
        const n = addNode(t, 20 + (i % 4) * 20, 22 + Math.floor(i / 4) * 24);
        picked = { kind: "node", id: n.id };
      });
      writeNode(picked.id);
      return;
    }
    if (t === "del") {
      if (!picked) { flash("Tap a shape or a line first."); return; }
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
    el.querySelectorAll("[data-set]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.set === model.preset)));
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
  const HINT = "Drag a shape anywhere. Join: tap the key, then tap two shapes. Double-click a shape, or a line, to write on it.";
  function flash(words) {
    const hint = el.querySelector(".fl-hint");
    hint.textContent = words;
    hint.classList.add("is-loud");
    clearTimeout(flashing);
    flashing = setTimeout(() => { hint.classList.remove("is-loud"); hint.textContent = HINT; }, 2200);
  }

  /** Portaled to document.body the first time it opens — a filter on the
      floating panel's own "paper" wrapper makes IT, not the window, the
      containing block for position:fixed; see linemodel.js's show(), the
      first place this was found. */
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
    if (!e.target.closest(".fl-tools") && !e.target.closest(".fl-pot")) pot.hidden = true;
  };
  document.addEventListener("pointerdown", shut, true);

  /* ── writing ─────────────────────────────────────────────────────────── */
  function inputAt(x, y, w, value, done) {
    el.querySelector(".fl-write")?.remove();
    const r = board.getBoundingClientRect();
    const input = document.createElement("input");
    input.type = "text";
    input.className = "fl-write";
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
      const v = input.value.trim().slice(0, 24);
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
    inputAt(n.x, n.y, DIMS[n.kind].w * 0.82, n.text, (v) => change(() => { const now = model.nodes.find((x) => x.id === id); if (now) now.text = v; }));
  }
  function writeLink(id) {
    const l = model.links.find((x) => x.id === id);
    if (!l) return;
    const a = model.nodes.find((n) => n.id === l.a), b = model.nodes.find((n) => n.id === l.b);
    if (!a || !b) return;
    inputAt((a.x + b.x) / 2, (a.y + b.y) / 2, 60, l.text, (v) => change(() => { const now = model.links.find((x) => x.id === id); if (now) now.text = v; }));
  }

  /* ── dragging a shape — and, while linking, the two taps that join two ──
     NOT `e.target` once a drag has set pointer capture: every later event
     for that pointer reports the CAPTURING element, not what's really under
     the finger (see vennmodel.js — the bug that cost the most time there,
     and nodesmodel.js, built with this already fixed). `picked`/`drag.id`,
     captured at pointerdown, are what every later handler here reads. */
  let drag = null;
  let dragged = false;
  svg.addEventListener("pointerdown", (e) => {
    const id = Number(e.target.closest("[data-node]")?.dataset.node);
    if (id) {
      e.preventDefault();
      if (linking) {
        if (pendingA == null) { pendingA = id; paint(); return; }
        if (pendingA !== id) change(() => addLink(pendingA, id));
        pendingA = null;
        paint();
        return;
      }
      picked = { kind: "node", id };
      dragged = false;
      drag = { id, r: board.getBoundingClientRect() };
      svg.setPointerCapture(e.pointerId);
      paint();
      return;
    }
    const lid = Number(e.target.closest("[data-hit]")?.dataset.hit);
    if (lid && !e.target.closest("[data-node]")) { picked = { kind: "link", id: lid }; paint(); }
  });
  svg.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const x = ((e.clientX - drag.r.left) / drag.r.width) * 100;
    const y = ((e.clientY - drag.r.top) / drag.r.height) * 100;
    const n = model.nodes.find((x2) => x2.id === drag.id);
    if (!n) return;
    if (Math.abs(x - n.x) < 0.3 && Math.abs(y - n.y) < 0.3 && !dragged) return;
    dragged = true;
    n.x = Math.max(4, Math.min(96, x));
    n.y = Math.max(4, Math.min(96, y));
    paint();
  });
  const drop = () => {
    if (!drag) return;
    drag = null;
    if (dragged) tell();
    setTimeout(() => { dragged = false; }, 0);
  };
  svg.addEventListener("pointerup", drop);
  svg.addEventListener("pointercancel", drop);

  let lastTap = null;
  function twice(id) {
    const now = Date.now();
    const yes = lastTap && lastTap.id === id && now - lastTap.at < 450;
    lastTap = yes ? null : { id, at: now };
    return yes;
  }
  /* NOT `e.target.closest("[data-node]")` for the node case — the node's
     own pointerdown set svg.setPointerCapture(), so this event's target has
     already been retargeted to `svg` itself (see the note above drag/drop).
     `picked` is what pointerdown actually saw, before capture moved it. */
  svg.addEventListener("pointerup", (e) => {
    if (linking || dragged) return;
    if (picked?.kind === "node") {
      if (twice(`n${picked.id}`)) writeNode(picked.id);
      return;
    }
    const lid = Number(e.target.closest("[data-hit]")?.dataset.hit);
    if (lid && picked?.kind === "link" && picked.id === lid) {
      if (twice(`l${lid}`)) writeLink(lid);
    }
  });

  paint();
  syncTabs();
  mountTooltips();
  tools.querySelector('[data-t="undo"]').disabled = true;

  return {
    get: () => clone(model),
    set(v) { model = v && v.nodes ? clone(v) : blankFlow(); picked = null; paint(); syncTabs(); return clone(model); },
    clear() { model = blankFlow(); picked = null; paint(); syncTabs(); },
    dispose() {
      document.removeEventListener("pointerdown", shut, true);
      pot.remove();
      el.classList.remove("is-flowing");
      el.innerHTML = printed;
    },
  };
}
