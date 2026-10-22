/* ============================================================================
   PRINTABLE WORKBOOK — a NUMBER LINE you build
   ----------------------------------------------------------------------------
   The bar model's companion (./barmodel.js). A bar says how big a thing is
   next to another thing; a line says WHERE a number is and HOW FAR it is to
   the next one — which is a different question and the one that matters for
   counting on, counting back, rounding, negatives, decimals and fractions.

   The same bargain as the bar model board: it is WORKING, never marked. What
   the child reads off it goes in the answer boxes beside it.

     the LINE      a start, an end and a step. The ticks and their figures
                   follow from those three numbers, so changing the end
                   re-rules the line and everything on it keeps its VALUE
     a MARK        a point ON the line with a label — "23", "n", "?"
     a JUMP        an arc from one value to another with its own words
                   ("+10", "−3", "×2"), over the line or under it

   EVERYTHING IS STORED AS A VALUE, never as a pixel. Stretch the line from
   0–20 to 0–100 and the jump that went from 7 to 12 is still a jump from 7
   to 12 — drawn in its new place, saying the same thing. A board that stored
   positions would quietly turn every model on it into a different model the
   moment the range changed.

   A jump SNAPS TO THE STEP, because a jump of three and a bit is not a thing
   anybody means to draw on a number line.
   ========================================================================== */

import { mountTooltips } from "/utils/components/tooltip.js";

const VIEW = 680;          // the board's own width, as the bar model's
const PAD = 34;            // the room at each end for the first and last figure
const INK = "#2a2723";
const GREY = "#6f685f";
const TONES = [
  "#2f6ea8", "#c9922f", "#2e8b46", "#c0453f", "#7b4fa3",
  "#1f8a8a", "#d9632b", "#8a5a2b", "#5a6b8c", "#a8306c",
];

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const clone = (m) => JSON.parse(JSON.stringify(m));

export const blankLine = () => ({
  from: 0, to: 20, step: 1,
  marks: [],
  jumps: [],
});

/* ── the keys, drawn ─────────────────────────────────────────────────────*/
const G = (inner) => `<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">${inner}</svg>`;
const R = (x, y, w, h, f) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"/>`;
const SKY = "var(--accent-secondary,#2f6ea8)";
const SUN = "var(--accent-primary,#f4c95d)";
const LEAF = "var(--accent-success,#2e8b46)";
const RED = "var(--accent-danger,#c0453f)";
const rule = (y = 15) => R(2, y, 20, 1.6, INK)
  + [0, 1, 2, 3, 4].map((i) => R(2.6 + i * 4.6, y - 2.6, 1.2, 2.6, INK)).join("");

const ICON = {
  mark: G(rule() + `<circle cx="12" cy="15.8" r="3.6" fill="${SKY}" stroke="#fffdf8" stroke-width="1.2"/>`),
  jump: G(rule() + `<path d="M5 14.4q7-9 14 0" fill="none" stroke="${LEAF}" stroke-width="1.8"/>`
    + `<path d="M19 15.2 15.9 11l4.6-1.1Z" fill="${LEAF}"/>`),
  under: G(R(2, 7, 20, 1.6, INK) + [0, 1, 2, 3, 4].map((i) => R(2.6 + i * 4.6, 8.6, 1.2, 2.6, INK)).join("")
    + `<path d="M5 10.2q7 9 14 0" fill="none" stroke="${RED}" stroke-width="1.8"/>`
    + `<path d="M19 9.4 15.9 13.6l4.6 1.1Z" fill="${RED}"/>`),
  range: G(rule(11) + R(2, 18, 6.4, 3, SKY) + R(15.6, 18, 6.4, 3, SUN)),
  tone: G(`<circle cx="12" cy="12" r="9.4" fill="${SUN}"/>`
    + `<path d="M12 2.6A9.4 9.4 0 0 1 12 21.4Z" fill="${SKY}"/>`
    + `<path d="M12 2.6A9.4 9.4 0 0 0 3.4 15.6Z" fill="${LEAF}"/>`
    + `<circle cx="12" cy="12" r="3" fill="#fffdf8"/>`),
  undo: G(`<path d="M12 6.4a7.6 7.6 0 1 1-7.1 10.2" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`
    + `<path d="M4.2 3.4v6.2h6.2Z" fill="${RED}"/>`),
  del: G(R(8.6, 2.4, 6.8, 2.6, RED) + R(3, 5, 18, 3.2, RED)
    + `<rect x="5.2" y="9.4" width="13.6" height="12" fill="${SUN}" stroke="${INK}" stroke-width="1.2"/>`),
};

/**
 *   mountLineModel(el, { saved, onChange })
 *     saved                 a line from before, or null
 *     onChange(now, before)  after every change, for Undo
 *   → { get(), set(line), clear(), dispose() }
 */
export function mountLineModel(el, { saved = null, onChange = () => {} } = {}) {
  const printed = el.innerHTML;
  let line = saved && saved.marks ? clone(saved) : blankLine();
  let picked = null;             // { kind: "mark" | "jump", id, end? }
  let seq = 1 + Math.max(0, ...line.marks.map((m) => m.id), ...line.jumps.map((j) => j.id));
  let tone = 0;

  const key = (t, tint, name) =>
    `<button type="button" class="pp-btn wb-tint-${tint} lm-key" data-t="${t}"`
    + ` aria-label="${esc(name)}" data-tip="${esc(name)}" data-tip-side="down">${ICON[t]}</button>`;

  el.classList.add("is-lining");
  el.innerHTML =
    `<div class="lm-tools" role="toolbar" aria-label="Number line tools">`
    + key("mark", 2, "Put a mark on the line")
    + key("jump", 2, "A jump over the line")
    + key("under", 3, "A jump under the line")
    + key("range", 1, "What the line runs from, to, and in what steps")
    + key("tone", 2, "The colour of the picked mark or jump")
    + key("undo", 1, "Step back")
    + key("del", 4, "Take the picked one off")
    + `<div class="lm-pot" data-pot hidden><div class="pp-receipt"><div class="pp-receipt__paper">`
    + `<div class="lm-pot__in">`
    + TONES.map((hex, i) => `<button type="button" class="pp-plain lm-chip" data-tone="${i}"`
      + ` style="background:${hex}" aria-label="Colour ${i + 1}"></button>`).join("")
    + `</div></div></div></div>`
    + `<div class="lm-pot lm-pot--range" data-range hidden><div class="pp-receipt"><div class="pp-receipt__paper">`
    + `<div class="lm-range">`
    + `<label><span>From</span><input type="number" data-r="from" value="${line.from}" step="any"></label>`
    + `<label><span>To</span><input type="number" data-r="to" value="${line.to}" step="any"></label>`
    + `<label><span>In steps of</span><input type="number" data-r="step" value="${line.step}" min="0.01" step="any"></label>`
    + `</div></div></div></div>`
    + `</div>`
    + `<div class="lm-board"><svg class="lm-svg" xmlns="http://www.w3.org/2000/svg"></svg></div>`
    + `<p class="lm-hint">Drag a mark or either end of a jump along the line. Double-click one to write on it.</p>`;

  const board = el.querySelector(".lm-board");
  const svg = el.querySelector(".lm-svg");
  const tools = el.querySelector(".lm-tools");
  const pot = el.querySelector("[data-pot]");
  const rangeSheet = el.querySelector("[data-range]");

  /* ── where a value sits, and what a place is worth ───────────────────── */
  const span = () => (Number(line.to) - Number(line.from)) || 1;
  const xOf = (v) => PAD + ((v - line.from) / span()) * (VIEW - PAD * 2);
  const vOf = (x) => line.from + ((x - PAD) / (VIEW - PAD * 2)) * span();
  /** A value rounded to the line's own step — a jump of three and a bit is not a jump. */
  const onStep = (v) => {
    const st = Number(line.step) > 0 ? Number(line.step) : 1;
    const at = Math.round((v - line.from) / st) * st + Number(line.from);
    const dp = (String(st).split(".")[1] || "").length;
    return Number(Math.min(Math.max(at, Math.min(line.from, line.to)), Math.max(line.from, line.to)).toFixed(dp));
  };

  const BASE = 104;        // where the rule itself sits in the drawing
  const HEIGHT = 168;

  /* ── drawing ─────────────────────────────────────────────────────────── */
  function paint() {
    svg.setAttribute("viewBox", `0 0 ${VIEW} ${HEIGHT}`);
    const st = Number(line.step) > 0 ? Number(line.step) : 1;
    const n = Math.min(80, Math.max(1, Math.round(Math.abs(span()) / st)));
    const dp = (String(st).split(".")[1] || "").length;
    let out = `<line x1="${PAD - 14}" x2="${VIEW - PAD + 14}" y1="${BASE}" y2="${BASE}" stroke="${INK}" stroke-width="2.2"/>`
      /* an arrow at each end: a number line does not stop, it is only drawn
         as far as the question needs */
      + `<path d="M${VIEW - PAD + 14} ${BASE} ${VIEW - PAD + 4} ${BASE - 5}v10Z" fill="${INK}"/>`
      + `<path d="M${PAD - 14} ${BASE} ${PAD - 4} ${BASE - 5}v10Z" fill="${INK}"/>`;
    for (let i = 0; i <= n; i++) {
      const v = Number((line.from + i * st).toFixed(dp));
      const x = xOf(v);
      out += `<line x1="${x}" x2="${x}" y1="${BASE - 7}" y2="${BASE + 7}" stroke="${INK}" stroke-width="1.4"/>`
        + `<text x="${x}" y="${BASE + 24}" text-anchor="middle" font-family="JetBrains Mono, monospace"`
        + ` font-size="13" fill="${GREY}">${esc(v)}</text>`;
    }

    line.jumps.forEach((j) => {
      const on = picked && picked.kind === "jump" && picked.id === j.id;
      const x1 = xOf(j.from), x2 = xOf(j.to);
      const dir = j.under ? 1 : -1;
      const lift = Math.min(58, 22 + Math.abs(x2 - x1) * 0.26) * dir;
      const mid = (x1 + x2) / 2;
      const edge = BASE + (j.under ? 9 : -9);
      const col = TONES[j.tone % TONES.length];
      out += `<g class="lm-jump${on ? " is-picked" : ""}" data-jump="${j.id}">`
        + `<path d="M${x1} ${edge}Q${mid} ${edge + lift * 1.6} ${x2} ${edge}" fill="none"`
        + ` stroke="${col}" stroke-width="${on ? 3.4 : 2.2}"/>`
        /* the head says which way the jump goes, which is the whole point of
           drawing it as a jump rather than as a bracket */
        + `<path d="${head(x2, edge, x2 > x1 ? 1 : -1, j.under)}" fill="${col}"/>`
        + `<rect data-grab="${j.id}:from" x="${x1 - 9}" y="${edge + lift * 0.1 - 9}" width="18" height="18" fill="transparent"/>`
        + `<rect data-grab="${j.id}:to" x="${x2 - 9}" y="${edge + lift * 0.1 - 9}" width="18" height="18" fill="transparent"/>`
        + `<rect x="${mid - 34}" y="${edge + lift * 0.86 - 13}" width="68" height="22" fill="transparent"/>`
        + `<text x="${mid}" y="${edge + lift * 0.86 + 4}" text-anchor="middle" font-family="JetBrains Mono, monospace"`
        + ` font-size="14" font-weight="700" fill="${j.text ? col : GREY}">${esc(j.text || "…")}</text></g>`;
    });

    line.marks.forEach((m) => {
      const on = picked && picked.kind === "mark" && picked.id === m.id;
      const x = xOf(m.at);
      const col = TONES[m.tone % TONES.length];
      out += `<g class="lm-mark${on ? " is-picked" : ""}" data-mark="${m.id}">`
        + `<circle cx="${x}" cy="${BASE}" r="${on ? 8 : 6.4}" fill="${col}" stroke="#fffdf8" stroke-width="2"/>`
        + `<rect x="${x - 30}" y="${BASE - 46}" width="60" height="24" fill="transparent"/>`
        + `<text x="${x}" y="${BASE - 28}" text-anchor="middle" font-family="JetBrains Mono, monospace"`
        + ` font-size="15" font-weight="700" fill="${m.text ? col : GREY}">${esc(m.text || "…")}</text></g>`;
    });
    svg.innerHTML = out;
    tools.querySelector('[data-t="undo"]').disabled = !history.length;
  }

  /** The arrow head at the end of a jump. */
  function head(x, y, way, under) {
    const d = under ? 1 : -1;
    return `M${x} ${y} ${x - way * 9} ${y + d * 9} ${x - way * 2.5} ${y + d * 11}Z`;
  }

  /* ── changes, each one Undo step ─────────────────────────────────────── */
  const history = [];
  function change(fn) {
    const before = clone(line);
    history.push(JSON.stringify(before));
    if (history.length > 60) history.shift();
    fn();
    paint();
    if (JSON.stringify(before) !== JSON.stringify(line)) onChange(clone(line), before);
  }
  function stepBack() {
    const was = history.pop();
    if (!was) return;
    const before = clone(line);
    line = JSON.parse(was);
    picked = null;
    paint();
    onChange(clone(line), before);
  }

  let flashing = 0;
  const HINT = "Drag a mark or either end of a jump along the line. Double-click one to write on it.";
  function flash(words) {
    const hint = el.querySelector(".lm-hint");
    hint.textContent = words;
    hint.classList.add("is-loud");
    clearTimeout(flashing);
    flashing = setTimeout(() => { hint.classList.remove("is-loud"); hint.textContent = HINT; }, 2200);
  }

  /* ── tools ───────────────────────────────────────────────────────────── */
  tools.addEventListener("click", (e) => {
    const t = e.target.closest("[data-t]")?.dataset.t;
    if (!t) return;
    if (t === "undo") { stepBack(); return; }
    if (t === "range") { rangeSheet.hidden = !rangeSheet.hidden; pot.hidden = true; return; }
    if (t === "tone") {
      if (!picked) { flash("Tap a mark or a jump first."); return; }
      pot.hidden = !pot.hidden; rangeSheet.hidden = true;
      return;
    }
    if (t === "mark") {
      change(() => {
        const at = onStep(line.from + span() / 2);
        const m = { id: seq++, at, text: String(at), tone };
        line.marks.push(m);
        picked = { kind: "mark", id: m.id };
      });
      return;
    }
    if (t === "jump" || t === "under") {
      change(() => {
        const st = Number(line.step) > 0 ? Number(line.step) : 1;
        const a = onStep(line.from + span() * 0.3);
        const j = { id: seq++, from: a, to: onStep(a + st * 2), text: "", tone, under: t === "under" };
        line.jumps.push(j);
        picked = { kind: "jump", id: j.id };
      });
      return;
    }
    if (t === "del") {
      if (!picked) { flash("Tap a mark or a jump first."); return; }
      change(() => {
        if (picked.kind === "mark") line.marks = line.marks.filter((m) => m.id !== picked.id);
        else line.jumps = line.jumps.filter((j) => j.id !== picked.id);
        picked = null;
      });
    }
  });

  pot.addEventListener("click", (e) => {
    const t = e.target.closest("[data-tone]")?.dataset.tone;
    if (t == null || !picked) return;
    tone = Number(t);
    change(() => {
      const it = picked.kind === "mark"
        ? line.marks.find((m) => m.id === picked.id)
        : line.jumps.find((j) => j.id === picked.id);
      if (it) it.tone = Number(t);
    });
    pot.hidden = true;
  });

  /* THE LINE ITSELF. Everything on it is a VALUE, so re-ruling the line moves
     the drawing without changing what it says — the one rule that makes this
     board worth having over a drawing. */
  rangeSheet.addEventListener("input", (e) => {
    const k = e.target.dataset.r;
    if (!k) return;
    const v = Number(e.target.value);
    if (!Number.isFinite(v)) return;
    if (k === "step" && v <= 0) return;
    change(() => { line[k] = v; });
  });

  const shut = (e) => {
    if (!e.target.closest('.lm-tools')) { pot.hidden = true; rangeSheet.hidden = true; }
  };
  document.addEventListener("pointerdown", shut, true);

  /* ── dragging along the line ─────────────────────────────────────────── */
  const at = (e) => {
    const r = svg.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * VIEW, y: ((e.clientY - r.top) / r.height) * HEIGHT };
  };
  let drag = null;
  svg.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    const grab = e.target.closest("[data-grab]")?.dataset.grab;
    const markG = e.target.closest("[data-mark]");
    const jumpG = e.target.closest("[data-jump]");
    if (!grab && !markG && !jumpG) { picked = null; paint(); return; }
    e.preventDefault();
    if (grab) {
      const [id, end] = grab.split(":");
      picked = { kind: "jump", id: Number(id) };
      drag = { kind: "jump", id: Number(id), end, before: clone(line), moved: false };
    } else if (markG) {
      picked = { kind: "mark", id: Number(markG.dataset.mark) };
      drag = { kind: "mark", id: picked.id, before: clone(line), moved: false };
    } else {
      picked = { kind: "jump", id: Number(jumpG.dataset.jump) };
      drag = { kind: "tap", before: clone(line), moved: false };
    }
    paint();
    svg.setPointerCapture(e.pointerId);
  });
  svg.addEventListener("pointermove", (e) => {
    if (!drag || drag.kind === "tap") return;
    const v = onStep(vOf(at(e).x));
    if (drag.kind === "mark") {
      const m = line.marks.find((x) => x.id === drag.id);
      if (!m || m.at === v) return;
      /* a mark whose words ARE its value keeps saying the truth as it moves */
      if (m.text === String(m.at)) m.text = String(v);
      m.at = v;
    } else {
      const j = line.jumps.find((x) => x.id === drag.id);
      if (!j || j[drag.end] === v) return;
      j[drag.end] = v;
    }
    drag.moved = true;
    paint();
  });
  const up = (e) => {
    if (!drag) return;
    const d = drag;
    drag = null;
    if (!d.moved) {
      const what = picked ? `${picked.kind}${picked.id}` : "";
      if (twice(what)) write();
      return;
    }
    history.push(JSON.stringify(d.before));
    if (JSON.stringify(d.before) !== JSON.stringify(line)) onChange(clone(line), d.before);
    paint();
  };
  svg.addEventListener("pointerup", up);
  svg.addEventListener("pointercancel", up);

  /* a double tap is counted here, not left to the browser: the first tap
     repaints the drawing and a dblclick across two elements never fires */
  let lastTap = null;
  function twice(what) {
    const now = Date.now();
    const yes = lastTap && lastTap.what === what && now - lastTap.at < 450;
    lastTap = yes ? null : { what, at: now };
    return yes;
  }

  /* ── writing on it ───────────────────────────────────────────────────── */
  function write() {
    if (!picked) return;
    const it = picked.kind === "mark"
      ? line.marks.find((m) => m.id === picked.id)
      : line.jumps.find((j) => j.id === picked.id);
    if (!it) return;
    const r = svg.getBoundingClientRect();
    const br = board.getBoundingClientRect();
    const k = r.width / VIEW;
    const x = picked.kind === "mark" ? xOf(it.at) : (xOf(it.from) + xOf(it.to)) / 2;
    const y = picked.kind === "mark" ? BASE - 34 : BASE + (it.under ? 44 : -44);
    const input = document.createElement("input");
    input.type = "text";
    input.className = "lm-write";
    input.value = it.text || "";
    input.autocomplete = "off";
    input.spellcheck = false;
    input.setAttribute("aria-label", "write on the number line");
    input.style.left = `${r.left - br.left + x * k - 45}px`;
    input.style.top = `${r.top - br.top + y * k - 14}px`;
    board.appendChild(input);
    input.focus();
    input.select();
    let over = false;
    const done = (keep) => {
      if (over) return;
      over = true;
      const v = input.value.trim().slice(0, 18);
      input.remove();
      if (keep) change(() => { it.text = v; });
    };
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") { ev.preventDefault(); done(true); }
      if (ev.key === "Escape") { ev.preventDefault(); ev.stopPropagation(); done(false); }
    });
    input.addEventListener("blur", () => done(true));
  }

  paint();
  mountTooltips();

  return {
    get: () => clone(line),
    set(l) { line = l && l.marks ? clone(l) : blankLine(); picked = null; paint(); return clone(line); },
    clear() { line = blankLine(); picked = null; paint(); },
    dispose() {
      document.removeEventListener("pointerdown", shut, true);
      el.classList.remove("is-lining");
      el.innerHTML = printed;
    },
  };
}
