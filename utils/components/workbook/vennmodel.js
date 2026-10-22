/* ============================================================================
   A VENN DIAGRAM YOU BUILD
   ----------------------------------------------------------------------------
   The bar model's and the number line's companion (./barmodel.js,
   ./linemodel.js). Two or three rings, and loose items dragged into them —
   what belongs to one, what belongs to another, and what they share.

   THE SAME BARGAIN: it is WORKING, never marked. Nothing here is a tick or a
   cross — an item sits wherever it is dragged, and what the diagram says
   once it is sorted is read off it into the answer boxes beside it.

   A GENERAL TOOL, with a PRESET on top of it. Blank is two rings a child
   names and fills with whatever they are sorting. "Prime factors" is the
   same tool with a question already poured onto it: type two numbers and
   their prime factors land loose on the sheet, to be sorted into what they
   share (the middle — the HCF) and what they do not (the two outsides —
   together with the middle, the LCM). The maths is ./factortree.js, already
   used by the printed version of this same picture in the Primes chapter.
   ========================================================================== */

import { mountTooltips } from "/utils/components/tooltip.js";
import { primesOf, sharedPrimes, ownPrimes } from "./factortree.js";

const VIEW = 680;
const HEIGHT = 520;         // a touch over 3:2 — three rings want more height than two
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

/* ── the rings ─────────────────────────────────────────────────────────────
   The viewBox (680×520) is given the SAME ratio as the board's own CSS box
   (`aspect-ratio: 680 / 520`), unlike the organisers' 0–100 square stretched
   flat over a 3:2 sheet — so a plain circle is already round here, with
   nothing to correct for. */
const ring = (cx, cy, r, extra = "") =>
  `<circle cx="${cx}" cy="${cy}" r="${r.toFixed(2)}" fill="none"`
  + ` stroke="${INK}" stroke-width="1.6" vector-effect="non-scaling-stroke"${extra}/>`;

/** Where the rings stand, for 2 or 3 of them. */
function layoutOf(n) {
  if (n >= 3) return [[34, 36, 27], [66, 36, 27], [50, 66, 27]];
  return [[36, 50, 32], [64, 50, 32]];
}

/** Is the point (in the same percent space as the rings) inside this ring? */
const inRing = (px, py, [cx, cy, r]) => {
  const dx = (px - cx) / r;
  const dy = (py - cy) / r;
  return dx * dx + dy * dy <= 1;
};

/** Which rings (indices) a point sits inside. */
const ringsAt = (px, py, places) => places.map((p, i) => (inRing(px, py, p) ? i : -1)).filter((i) => i >= 0);

export const blankVenn = () => ({
  preset: "blank",
  sets: [{ id: 1, label: "This one", tone: 0 }, { id: 2, label: "That one", tone: 3 }],
  items: [],
  primes: { a: 36, b: 48 },
});

/* ── the keys, drawn ─────────────────────────────────────────────────────── */
const G = (inner) => `<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">${inner}</svg>`;
const SKY = "var(--accent-secondary,#2f6ea8)";
const SUN = "var(--accent-primary,#f4c95d)";
const LEAF = "var(--accent-success,#2e8b46)";
const RED = "var(--accent-danger,#c0453f)";
const ICON = {
  item: G(`<rect x="3" y="8.6" width="18" height="6.8" fill="${SKY}" stroke="#fffdf8" stroke-width="1"/>`
    + `<rect x="6" y="11" width="12" height="2" fill="#fffdf8" opacity="0.7"/>`),
  ring: G(`<circle cx="9.4" cy="12" r="7.4" fill="none" stroke="${INK}" stroke-width="1.6"/>`
    + `<circle cx="14.6" cy="12" r="7.4" fill="none" stroke="${INK}" stroke-width="1.6"/>`),
  ringPlus: G(`<circle cx="7.6" cy="9.4" r="5.8" fill="none" stroke="${INK}" stroke-width="1.3"/>`
    + `<circle cx="13.4" cy="9.4" r="5.8" fill="none" stroke="${INK}" stroke-width="1.3"/>`
    + `<circle cx="10.5" cy="15.6" r="5.8" fill="none" stroke="${LEAF}" stroke-width="1.3"/>`),
  ringLess: G(`<circle cx="9.4" cy="11" r="7.4" fill="none" stroke="${INK}" stroke-width="1.3"/>`
    + `<circle cx="14.6" cy="11" r="7.4" fill="none" stroke="${RED}" stroke-width="1.3" stroke-dasharray="2.4 2"/>`),
  build: G(`<rect x="3" y="3.4" width="18" height="17.2" fill="${SUN}" stroke="${INK}" stroke-width="1.2"/>`
    + `<rect x="5.6" y="6.4" width="5.6" height="5.6" fill="#fffdf8"/>` + `<rect x="12.8" y="6.4" width="5.6" height="5.6" fill="#fffdf8"/>`
    + `<rect x="5.6" y="13.6" width="12.8" height="2.6" fill="#fffdf8"/>`),
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
 *   mountVennModel(el, { saved, onChange })
 *     saved                  a diagram from before, or null
 *     onChange(now, before)  after every change, for Undo
 *   → { get(), set(v), clear(), dispose() }
 */
export function mountVennModel(el, { saved = null, onChange = () => {} } = {}) {
  const printed = el.innerHTML;
  let model = saved && saved.sets ? clone(saved) : blankVenn();
  let picked = null;        // an item's id
  let seq = 1 + Math.max(0, ...model.items.map((n) => n.id), ...model.sets.map((s) => s.id));
  let tone = 0;

  const key = (t, tint, name) =>
    `<button type="button" class="pp-btn wb-tint-${tint} vn-key" data-t="${t}"`
    + ` aria-label="${esc(name)}" data-tip="${esc(name)}" data-tip-side="down">${ICON[t]}</button>`;

  el.classList.add("is-venning");
  el.innerHTML =
    `<div class="vn-tools" role="toolbar" aria-label="Venn diagram tools">`
    + `<span class="vn-sets">`
    + `<button type="button" class="pp-plain vn-set" data-set="blank" aria-pressed="false">Blank</button>`
    + `<button type="button" class="pp-plain vn-set" data-set="primes" aria-pressed="false">Prime factors</button>`
    + `</span>`
    + key("item", 2, "Write a new item")
    + key("ringPlus", 1, "One more ring")
    + key("ringLess", 1, "Take the last ring off")
    + `<span class="vn-primeskey" hidden>` + key("build", 1, "Set the two numbers") + `</span>`
    + key("tone", 2, "The colour of the picked item")
    + key("undo", 1, "Step back")
    + key("del", 4, "Take the picked item off")
    + `<div class="vn-pot" data-pot hidden><div class="pp-receipt"><div class="pp-receipt__paper">`
    + `<div class="vn-pot__in">`
    + TONES.map((hex, i) => `<button type="button" class="pp-plain vn-chip" data-tone="${i}"`
      + ` style="background:${hex}" aria-label="Colour ${i + 1}"></button>`).join("")
    + `</div></div></div></div>`
    + `<div class="vn-pot vn-pot--nums" data-nums hidden><div class="pp-receipt"><div class="pp-receipt__paper">`
    + `<div class="vn-nums">`
    + `<label><span>First number</span><input type="text" inputmode="numeric" data-n="a" value="${esc(model.primes.a)}"></label>`
    + `<label><span>Second number</span><input type="text" inputmode="numeric" data-n="b" value="${esc(model.primes.b)}"></label>`
    + `<button type="button" class="pp-btn wb-tint-1 vn-nums__go" data-go="1">Pour their prime factors onto the sheet</button>`
    + `</div></div></div></div>`
    + `</div>`
    + `<p class="vn-say"></p>`
    + `<div class="vn-board"><svg class="vn-svg" viewBox="0 0 ${VIEW} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg"></svg>`
    + `<div class="vn-caps"></div><div class="vn-items"></div></div>`
    + `<p class="vn-hint">Drag an item into a ring, or across both where they overlap. Double-click an item, or a ring's name, to write on it.</p>`;

  const board = el.querySelector(".vn-board");
  const svg = el.querySelector(".vn-svg");
  const caps = el.querySelector(".vn-caps");
  const itemsEl = el.querySelector(".vn-items");
  const tools = el.querySelector(".vn-tools");
  const pot = el.querySelector("[data-pot]");
  const numsSheet = el.querySelector("[data-nums]");
  const sayEl = el.querySelector(".vn-say");
  const primesKey = el.querySelector(".vn-primeskey");

  const tell = () => onChange(clone(model), undefined);

  /* ── drawing ─────────────────────────────────────────────────────────── */
  const places = () => layoutOf(model.sets.length).map(([cx, cy, r]) => [
    (cx / 100) * VIEW, (cy / 100) * HEIGHT, (r / 100) * VIEW,
  ]);
  /* the ring maths above is written in 0–100, so a point off the item layer
     (also 0–100, itself a % of the board) can be tested against it straight;
     the SVG is drawn at the board's own pixel size for a crisp stroke */
  const placesPct = () => layoutOf(model.sets.length);

  function paintArt() {
    const vb = places();
    svg.innerHTML = vb.map(([cx, cy, r]) => ring(cx, cy, r)).join("");
  }

  function paintCaps() {
    const pct = layoutOf(model.sets.length);
    /* THE THIRD RING HAS NOTHING ABOVE IT — the other two are sitting there.
       Its name goes under it instead, which needs the opposite anchor (the
       label grows DOWN from its point, not up). */
    caps.innerHTML = model.sets.map((s, i) => {
      const [cx, cy, r] = pct[i];
      const below = model.sets.length >= 3 && i === 2;
      const at = below ? Math.min(97, cy + r + 6) : Math.max(1, cy - r - 6);
      return `<span class="vn-cap${below ? " vn-cap--below" : ""}" style="left:${cx}%;top:${at}%" data-set="${s.id}">${esc(s.label)}</span>`;
    }).join("");
  }

  function regionSay() {
    if (model.preset !== "primes" || model.sets.length !== 2) { sayEl.textContent = ""; return; }
    const pct = placesPct();
    const mid = [], left = [], right = [];
    model.items.forEach((it) => {
      const on = ringsAt(it.x, it.y, pct);
      if (on.length === 2) mid.push(it); else if (on[0] === 0) left.push(it); else if (on[0] === 1) right.push(it);
    });
    const prod = (list) => list.reduce((t, it) => t * (Number(it.text) || 1), 1);
    const say = (list) => (list.length ? list.map((it) => it.text).join(" × ") : "nothing yet");
    const hcf = prod(mid);
    const lcm = prod(left) * prod(mid) * prod(right);
    sayEl.textContent = `Shared so far: ${say(mid)} = ${hcf}   ·   Sorted so far, all together: `
      + `${left.length + mid.length + right.length ? lcm : "…"}`;
  }

  function paintItems() {
    itemsEl.innerHTML = model.items.map((it) => `
      <button type="button" class="pp-plain vn-item${picked === it.id ? " is-picked" : ""}" data-item="${it.id}"
              style="left:${it.x}%;top:${it.y}%;background:${TONES[it.tone % TONES.length]}">${esc(it.text)}</button>`).join("");
    regionSay();
  }

  const paintAll = () => { paintArt(); paintCaps(); paintItems(); };

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

  /* ── tools ───────────────────────────────────────────────────────────── */
  tools.addEventListener("click", (e) => {
    const set = e.target.closest("[data-set]")?.dataset.set;
    if (set) {
      change(() => {
        model.preset = set;
        if (set === "primes") {
          model.sets = [{ id: model.sets[0]?.id || 1, label: String(model.primes.a), tone: 0 },
            { id: model.sets[1]?.id || 2, label: String(model.primes.b), tone: 3 }];
          buildPrimes();
        } else if (model.sets.length !== 2 || !/^-?\d+$/.test(model.sets[0].label)) {
          model.sets = [{ id: 1, label: "This one", tone: 0 }, { id: 2, label: "That one", tone: 3 }];
        }
      });
      primesKey.hidden = set !== "primes";
      syncSetTabs();
      return;
    }
    const t = e.target.closest("[data-t]")?.dataset.t;
    if (!t) return;
    if (t === "undo") { stepBack(); return; }
    if (t === "build") { show(numsSheet, e.target.closest("[data-t]")); pot.hidden = true; return; }
    if (t === "tone") {
      if (picked == null) { flash("Tap an item first."); return; }
      show(pot, e.target.closest("[data-t]")); numsSheet.hidden = true;
      return;
    }
    if (t === "item") {
      change(() => {
        const it = { id: seq++, text: "", x: 50, y: 90, tone };
        model.items.push(it);
        picked = it.id;
      });
      writeItem(picked);
      return;
    }
    if (t === "ringPlus") {
      if (model.sets.length >= 3) return;
      change(() => { model.sets.push({ id: seq++, label: "The other one", tone: model.sets.length * 3 % TONES.length }); });
      return;
    }
    if (t === "ringLess") {
      if (model.sets.length <= 2) return;
      change(() => { model.sets.pop(); });
      return;
    }
    if (t === "del") {
      if (picked == null) { flash("Tap an item first."); return; }
      change(() => { model.items = model.items.filter((it) => it.id !== picked); picked = null; });
    }
  });

  function syncSetTabs() {
    el.querySelectorAll("[data-set]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.set === model.preset)));
    primesKey.hidden = model.preset !== "primes";
  }

  pot.addEventListener("click", (e) => {
    const t = e.target.closest("[data-tone]")?.dataset.tone;
    if (t == null || picked == null) return;
    tone = Number(t);
    change(() => { const it = model.items.find((n) => n.id === picked); if (it) it.tone = tone; });
    pot.hidden = true;
  });

  numsSheet.addEventListener("input", (e) => {
    const k = e.target.dataset.n;
    if (!k) return;
    const v = Math.max(2, Math.min(9999, Math.round(Number(e.target.value)) || 0));
    e.target.classList.toggle("is-wrong", !(Number(e.target.value) > 1));
    model.primes[k] = v || model.primes[k];
  });
  numsSheet.addEventListener("click", (e) => {
    if (!e.target.closest("[data-go]")) return;
    change(() => {
      model.sets = [{ id: model.sets[0]?.id || 1, label: String(model.primes.a), tone: 0 },
        { id: model.sets[1]?.id || 2, label: String(model.primes.b), tone: 3 }];
      buildPrimes();
    });
    numsSheet.hidden = true;
  });

  /** Every prime factor of a and b, shuffled loose onto the sheet — not
      sorted into the rings they belong to, which is the whole exercise. */
  function buildPrimes() {
    const { a, b } = model.primes;
    const tiles = ownPrimes(a, b).concat(sharedPrimes(a, b), ownPrimes(b, a));
    /* a small, stable shuffle (not Math.random — a saved board must redraw
       the same way it was saved, and a reload must not rearrange a diagram
       that is mid-sort) */
    let seed = a * 97 + b;
    const rand = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    const shuffled = [...tiles].sort(() => rand() - 0.5);
    model.items = shuffled.map((p, i) => ({
      id: seq++, text: String(p), tone: i % TONES.length,
      x: 10 + (i % 6) * 14 + rand() * 4, y: 86 + Math.floor(i / 6) * 9,
    }));
  }

  /* ── writing ─────────────────────────────────────────────────────────── */
  function inputAt(x, y, w, value, done, { select = true } = {}) {
    el.querySelector(".vn-write")?.remove();
    const r = board.getBoundingClientRect();
    const input = document.createElement("input");
    input.type = "text";
    input.className = "vn-write";
    input.value = value;
    input.autocomplete = "off";
    input.spellcheck = false;
    const width = Math.max(64, w);
    input.style.left = `${(x / 100) * r.width - width / 2}px`;
    input.style.top = `${(y / 100) * r.height - 14}px`;
    input.style.width = `${width}px`;
    board.appendChild(input);
    input.focus();
    if (select) input.select();
    let over = false;
    const finish = (keep) => {
      if (over) return;
      over = true;
      const v = input.value.trim().slice(0, 18);
      input.remove();
      if (keep) done(v);
    };
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") { ev.preventDefault(); finish(true); }
      if (ev.key === "Escape") finish(false);
    });
    input.addEventListener("blur", () => finish(true));
  }

  function writeItem(id) {
    const it = model.items.find((n) => n.id === id);
    if (!it) return;
    inputAt(it.x, it.y, 90, it.text, (v) => change(() => { const now = model.items.find((n) => n.id === id); if (now) now.text = v; }));
  }

  function writeSet(id) {
    const s = model.sets.find((x) => x.id === id);
    if (!s) return;
    const pct = layoutOf(model.sets.length);
    const i = model.sets.indexOf(s);
    const [cx, cy, r] = pct[i];
    inputAt(cx, Math.max(2, cy - r - 6), 100, s.label, (v) => change(() => { const now = model.sets.find((x) => x.id === id); if (now) now.label = v || now.label; }));
  }

  let flashing = 0;
  const HINT = "Drag an item into a ring, or across both where they overlap. Double-click an item, or a ring's name, to write on it.";
  function flash(words) {
    const hint = el.querySelector(".vn-hint");
    hint.textContent = words;
    hint.classList.add("is-loud");
    clearTimeout(flashing);
    flashing = setTimeout(() => { hint.classList.remove("is-loud"); hint.textContent = HINT; }, 2200);
  }

  /**
   * A SHEET IS PUT WHERE IT CAN BE SEEN WHOLE — portaled to document.body the
   * first time it opens. Left inside the panel, `position: fixed` is computed
   * against the true window and then rendered somewhere else entirely: the
   * floating panel's own "paper" wrapper carries a CSS filter (its drop
   * shadow), and a filter on an ancestor becomes the containing block for a
   * fixed descendant, the same as a transform would (see linemodel.js show(),
   * the first place this was found).
   */
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
    if (!e.target.closest(".vn-tools") && !e.target.closest(".vn-pot")) { pot.hidden = true; numsSheet.hidden = true; }
  };
  document.addEventListener("pointerdown", shut, true);

  /* ── dragging an item ────────────────────────────────────────────────── */
  let drag = null;
  let dragged = false;
  itemsEl.addEventListener("pointerdown", (e) => {
    const id = Number(e.target.closest("[data-item]")?.dataset.item);
    if (!id) return;
    const it = model.items.find((n) => n.id === id);
    if (!it) return;
    e.preventDefault();
    picked = id;
    dragged = false;
    drag = { it, r: board.getBoundingClientRect() };
    itemsEl.setPointerCapture(e.pointerId);
    paintItems();
  });
  itemsEl.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const x = ((e.clientX - drag.r.left) / drag.r.width) * 100;
    const y = ((e.clientY - drag.r.top) / drag.r.height) * 100;
    if (Math.abs(x - drag.it.x) < 0.3 && Math.abs(y - drag.it.y) < 0.3 && !dragged) return;
    dragged = true;
    drag.it.x = Math.max(1, Math.min(99, x));
    drag.it.y = Math.max(1, Math.min(99, y));
    paintItems();
  });
  const drop = () => {
    if (!drag) return;
    drag = null;
    if (dragged) tell();
    setTimeout(() => { dragged = false; }, 0);
  };
  itemsEl.addEventListener("pointerup", drop);
  itemsEl.addEventListener("pointercancel", drop);

  let lastTap = null;
  function twice(id) {
    const now = Date.now();
    const yes = lastTap && lastTap.id === id && now - lastTap.at < 450;
    lastTap = yes ? null : { id, at: now };
    return yes;
  }
  /* NOT `e.target` — pointer capture (set on pointerdown, above) retargets
     every later event for this pointer to the CAPTURING element (`itemsEl`
     itself), so `e.target.closest("[data-item]")` finds nothing here. What
     was pressed is `picked`, set at pointerdown, before capture moved it. */
  itemsEl.addEventListener("pointerup", (e) => {
    if (dragged || picked == null) return;
    if (twice(`i${picked}`)) writeItem(picked);
  });
  caps.addEventListener("pointerup", (e) => {
    const id = Number(e.target.closest("[data-set]")?.dataset.set);
    if (!id) return;
    if (twice(`s${id}`)) writeSet(id);
  });

  paintAll();
  syncSetTabs();
  mountTooltips();
  tools.querySelector('[data-t="undo"]').disabled = true;

  return {
    get: () => clone(model),
    set(v) { model = v && v.sets ? clone(v) : blankVenn(); picked = null; paintAll(); syncSetTabs(); return clone(model); },
    clear() { model = blankVenn(); picked = null; paintAll(); syncSetTabs(); },
    dispose() {
      document.removeEventListener("pointerdown", shut, true);
      pot.remove();
      numsSheet.remove();
      el.classList.remove("is-venning");
      el.innerHTML = printed;
    },
  };
}
