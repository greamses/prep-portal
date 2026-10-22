/* ============================================================================
   THE FILM EDITOR — a lesson laid out, beat by beat
   ----------------------------------------------------------------------------
   A cutting room for PrepBot's films (./filmdoc.js), open to the admin alone.
   Four parts, and they are the four questions you ask about a lesson:

     the STAGE       what is on the screen — drag a thing to move it, pull the
                     corner to size it, nudge it with the arrow keys, and it is
                     shown exactly as the television will show it, at the
                     television's own 16:9
     the INSPECTOR   what the selected thing IS: its words, its colour, its
                     parts; or, with nothing selected, what the step says
     the TIMELINE    a row per thing and a column per BEAT, so you can see at
                     a glance when each thing arrives, moves and goes; a cell
                     is clicked to give that thing something to do on that beat
     the SCRIPT      the line PrepBot speaks on the beat, which is the one
                     part of a film that children actually take away

   THE RULER IS BEATS, NOT SECONDS, and that is a decision rather than a
   shortcut. A step ends when PrepBot stops talking: lengthen a line and
   everything after it moves, which is what you want. Seconds live inside a
   beat — each act has its own small delay — and that is where fine timing
   belongs.

   A COACH AND HORSES CAN BE DRIVEN THROUGH AN AFTERNOON'S WORK by one press
   of Delete, or one Trace over a layout, so every change can be stepped back
   — Ctrl+Z, or the key in the bar. The document is small and is written down
   anyway, so the honest undo is a stack of whole documents, kept BEFORE each
   change. A field is one step however much is typed into it, and a run of
   nudges is one step rather than twenty.

   NOTHING HERE REACHES A CHILD UNTIL IT IS PUBLISHED. Save keeps a draft that
   only this account is served; Publish makes it the lesson for everybody.
   Preview plays the draft on the real television, with the real voice, which
   is the only honest way to judge a script that is going to be read aloud.
   ========================================================================== */

import {
  blankDoc, blankEl, blankStep, normalise, playable, mountEl, elHtml,
  INKS, TONES, TYPES, VERBS, VERB_IDS,
} from "./filmdoc.js";
import { filmBoth, saveDraft, publish, unpublish, forget } from "./film-store.js";
import { needCss } from "./panels.js";
import { mountWheel } from "/utils/components/colour-wheel.js";
import { UI } from "/utils/components/ui-icons.js";
import { mountTooltips } from "/utils/components/tooltip.js";

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/* a rough reading pace, only ever used to show how long a beat will run:
   160 words a minute is what the voice actually averages */
const secondsOf = (say) => Math.max(1, Math.round((String(say || "").trim().split(/\s+/).filter(Boolean).length / 160) * 60));

let live = null;      // one cutting room at a time

/**
 * Open the editor on a film.
 *
 *   id      the film's key — the same one the lesson strip plays
 *   title   what it is called, for a blank document
 *   coded   the coded film, if there is one — { build, steps }. Its SCRIPT is
 *           offered as a starting point so a lesson is never retyped, and its
 *           drawing can be traced from it (./film-trace.js)
 *   onPlay  how to play a document on the television (preview)
 */
export async function openFilmEditor({ id, title = "", coded = null, onPlay = null } = {}) {
  if (live) return live;
  needCss("/utils/components/workbook/film-editor.css");
  needCss("/utils/components/colour-wheel.css");

  const both = await filmBoth(id);
  let doc = both.draft || both.published || startFrom(coded?.steps, title);
  let step = 0;
  let picked = null;        // the selected element's id
  let dirty = false;

  /* ONE STEP BACK, like every other board on the bench. The document is
     small and is written down anyway, so the cheapest honest undo is a stack
     of whole documents: `remember()` is called BEFORE a change, never after,
     which is the only way to keep the state that is being left. Sixty is
     about an afternoon's work and a few hundred kilobytes. */
  const history = [];
  const remember = () => {
    history.push(JSON.stringify(doc));
    if (history.length > 60) history.shift();
    box.querySelector('[data-f="undo"]').disabled = false;
  };
  function stepBack() {
    const was = history.pop();
    if (!was) return;
    doc = normalise(JSON.parse(was), title);
    picked = null;
    step = Math.min(step, doc.steps.length - 1);
    dirty = true;
    paintAll();
    box.querySelector('[data-f="undo"]').disabled = !history.length;
    say(history.length ? "Stepped back" : "Back to where you started");
  }

  /* WHAT EACH KIND OF THING LOOKS LIKE, as a key. Our own glyphs rather than
     borrowed ones: there is no icon in the site's set for "a bar model bar"
     or "a line of words", and a palette of five that nearly fit is worse than
     five that do. Filled shapes, like every other icon here. */
  const g = (inner) => `<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">${inner}</svg>`;
  const TYPE_ICON = {
    /* three lines of writing, the last one short */
    text: g(`<rect x="3" y="5" width="18" height="3" rx="1.5" fill="var(--ink,#2a2723)"/>`
      + `<rect x="3" y="10.5" width="18" height="3" rx="1.5" fill="var(--accent-secondary,#2f6ea8)"/>`
      + `<rect x="3" y="16" width="11" height="3" rx="1.5" fill="var(--accent-primary,#f4c95d)"/>`),
    /* a bar cut into parts, with its brace under it */
    bar: g(`<rect x="2.5" y="6" width="9" height="7" fill="var(--accent-secondary,#bfe3ff)" stroke="var(--ink,#2a2723)" stroke-width="1.2"/>`
      + `<rect x="11.5" y="6" width="10" height="7" fill="var(--accent-primary,#fff3a8)" stroke="var(--ink,#2a2723)" stroke-width="1.2"/>`
      + `<rect x="2.5" y="16" width="19" height="2" rx="1" fill="var(--text-tertiary,#6f685f)"/>`
      + `<path d="M10.4 18h3.2L12 21Z" fill="var(--text-tertiary,#6f685f)"/>`),
    /* a box and a ring: the two shapes a lesson points with */
    shape: g(`<rect x="2.5" y="8" width="11" height="11" fill="var(--accent-success,#2e8b46)"/>`
      + `<circle cx="16" cy="9" r="6" fill="var(--accent-warning,#d9632b)"/>`),
    /* a picture: a frame with a hill and a sun in it */
    image: g(`<rect x="2.5" y="4.5" width="19" height="15" fill="var(--accent-secondary,#2f6ea8)"/>`
      + `<circle cx="8" cy="9.5" r="2.2" fill="#fffdf8"/>`
      + `<path d="M3.5 19 10 12l4.5 4.5L18 13l3.5 6Z" fill="var(--accent-success,#2e8b46)"/>`),
    /* a drawing: a nib with its line */
    svg: g(`<path d="M4 20 6 14l9.5-9.5 4 4L10 18Z" fill="var(--accent-primary,#f4c95d)"/>`
      + `<path d="M15.5 4.5 17 3a2.1 2.1 0 0 1 3 3l-1.5 1.5Z" fill="var(--accent-danger,#c0453f)"/>`
      + `<rect x="3" y="20.5" width="18" height="2" rx="1" fill="var(--text-tertiary,#6f685f)"/>`),
  };

  /* A KEY IS AN ICON WITH ITS NAME IN A TOOLTIP. Six words of button across
     the top is six words of stage lost, and the stage is the thing being
     worked on — so the chrome says what it is the way the rest of the bench
     does (tooltip.js), and gets out of the way. */
  const key = (k, icon, name, tint = "1", extra = "") =>
    `<button type="button" class="pp-btn wb-tint-${tint} fe__key" data-f="${k}"${extra}`
    + ` aria-label="${esc(name)}" data-tip="${esc(name)}" data-tip-side="down">${icon}</button>`;

  /* ── the room ────────────────────────────────────────────────────────── */
  const box = document.createElement("div");
  box.className = "fe";
  box.innerHTML = `
    <header class="fe__bar">
      <span class="fe__name">
        <input class="fe__title" value="${esc(doc.title || title)}" aria-label="What the film is called">
        <em class="fe__id">${esc(id)}</em>
      </span>
      <span class="fe__state" role="status"></span>
      <span class="fe__keys">
        ${key("undo", UI.undo(20), "Step back (Ctrl+Z)", "1", ' disabled')}
        ${key("trace", UI.layers(20), "Trace the coded film", "2", " hidden")}
        ${key("preview", UI.again(20), "Watch it on the real set", "2")}
        ${key("save", UI.edit(20), "Save the draft", "1")}
        ${key("publish", UI.share(20), "Publish it to everybody", "3")}
        ${key("down", UI.noFill(20), "Take it down", "1", " hidden")}
        ${key("close", UI.close(20), "Close the editor", "4")}
      </span>
    </header>
    <div class="fe__work">
      <section class="fe__left">
        <div class="fe__stagewrap"><div class="fe__stage" data-f="stage"></div></div>
        <div class="fe__add">
          <span class="fe__add-say">Put on the stage:</span>
          ${Object.entries(TYPES).map(([t, v]) => `<button type="button" class="pp-btn wb-tint-2 fe__key" data-add="${t}"`
            + ` aria-label="${esc(v.label)}" data-tip="${esc(v.label)}" data-tip-side="up">${TYPE_ICON[t] || TYPE_ICON.shape}</button>`).join("")}
        </div>
      </section>
      <aside class="fe__side">
        ${key("fold-side", UI.shrink(16), "Fold the inspector away", "1")}
        <div class="fe__side-in" data-f="side"></div>
      </aside>

    </div>
    <section class="fe__time">
      <div class="fe__time-head">
        ${key("fold-time", UI.shrink(16), "Fold the beats away", "1")}
        <h2>The beats</h2>
        <span class="fe__time-keys">
          ${key("step-add", UI.plus(18), "Add a beat after this one", "2")}
          ${key("step-left", UI.arrowLeft(18), "Move this beat back", "1")}
          ${key("step-right", UI.arrowRight(18), "Move this beat on", "1")}
          ${key("step-del", UI.trash(18), "Take this beat out", "4")}
        </span>
      </div>
      <div class="fe__grid" data-f="grid"></div>
    </section>
    <button type="button" class="pp-btn wb-tint-1 fe__unfold fe__unfold--side" data-f="fold-side"
            aria-label="Bring the inspector back" data-tip="Bring the inspector back" data-tip-side="left">${UI.menu(18)}</button>`;
  document.body.appendChild(box);
  live = { close };

  const q = (k) => box.querySelector(`[data-f="${k}"]`);
  const stage = q("stage");
  const side = q("side");
  const grid = q("grid");
  const state = box.querySelector(".fe__state");

  const say = (words, loud = false) => {
    state.textContent = words;
    state.classList.toggle("is-loud", loud);
  };
  const touched = () => { dirty = true; say("Not saved yet"); };

  /* ── the stage, drawn as the television draws it ─────────────────────── */

  /**
   * A HUNDREDTH OF THE STAGE'S WIDTH, WHATEVER THAT IS NOW.
   *
   * Every film is measured in `--u`, and it used to be set at the moment the
   * stage was painted. That is too early and too seldom: the stage is sized
   * by a container query, so on the first paint it has not settled, and when
   * a panel folds away it changes without anything being painted. One stale
   * reading and the whole film is drawn to the wrong scale — measured at
   * 12.37px on a stage 928px across, which is a third too big, which is why
   * a traced film ran off both edges of the screen it fitted on the
   * television. So the box is watched instead of asked.
   */
  function measure() {
    const tv = stage.querySelector(".vm-tv");
    const w = stage.clientWidth;
    if (tv && w) tv.style.setProperty("--u", `${w / 100}px`);
  }
  const watchSize = new ResizeObserver(measure);
  watchSize.observe(stage);


  /** Every element, then every act up to and including the beat on show. */
  function paintStage() {
    stage.innerHTML = "";
    const tv = document.createElement("div");
    tv.className = "vm-tv";
    stage.appendChild(tv);
    measure();
    doc.els.forEach((el) => mountEl(stage, el));
    const film = playable(doc);
    for (let k = 0; k <= step && k < film.steps.length; k++) {
      film.steps[k].show(stage, { gsap: null, instant: true });
    }
    /* WHAT IS SHOWN FAINTLY, AND WHAT IS NOT SHOWN AT ALL.
       A thing that has not come on yet is INVISIBLE here, because that is the
       truth of the film at this beat and a stage with every later mark
       ghosted over it is unreadable the moment a film has a dozen of them.
       Two exceptions, both so that a thing can be got hold of: the one that
       is selected, and one that has no act anywhere in the film — which has
       no beat to be seen on at all, and would otherwise be unplaceable. */
    const used = new Set(doc.steps.flatMap((s) => s.acts.map((a) => a.el)));
    doc.els.forEach((el) => {
      const node = stage.querySelector(`[data-t="${el.id}"]`);
      if (!node) return;
      node.classList.add("fe-el");
      node.dataset.feId = el.id;
      const inner = node.firstChild;
      const hidden = inner && Number(getComputedStyle(inner).opacity) < 0.02;
      if (hidden && (el.id === picked || !used.has(el.id))) {
        node.classList.add("is-ghost");
        inner.style.opacity = "0.3";
      } else if (hidden) {
        node.style.pointerEvents = "none";
      }
      node.classList.toggle("is-picked", el.id === picked);
      /* THE CORNER. Words are sized small / middling / large, like every
         other piece of writing on the site, so they have none; everything
         drawn has a width, and a width is a thing you pull rather than type. */
      if (el.id === picked && el.type !== "text") {
        const grip = document.createElement("span");
        grip.className = "fe-el__grip";
        grip.dataset.grip = el.id;
        grip.title = "Pull to size it";
        node.appendChild(grip);
      }
    });
  }

  /* DRAGGING. The stage is the ruler: a drag is turned into a percentage of
     its width and height, which is exactly what the film stores, so what you
     drag to is what plays. */
  let drag = null;
  stage.addEventListener("pointerdown", (e) => {
    const grip = e.target.closest?.("[data-grip]");
    const node = e.target.closest?.(".fe-el");
    if (!node) { pick(null); return; }
    const el = doc.els.find((x) => x.id === node.dataset.feId);
    if (!el) return;
    e.preventDefault();
    pick(el.id);
    remember();
    const r = stage.getBoundingClientRect();
    /* A WIDTH IS PULLED FROM THE LEFT EDGE, which stays where it is. A tile
       is placed by its MIDDLE, so growing it about that middle would walk its
       left edge away from whatever it was lined up against — and lining a
       drawing up against the one above it is most of laying a film out. */
    drag = grip
      ? { el, r, grip: true, left: el.x - el.w / 2, moved: false }
      : { el, r, fromX: e.clientX, fromY: e.clientY, x: el.x, y: el.y, moved: false };
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener("pointermove", (e) => {
    if (!drag) return;
    if (drag.grip) {
      const at = ((e.clientX - drag.r.left) / drag.r.width) * 100;
      const w = Math.max(2, Math.min(100, Math.round((at - drag.left) * 2) / 2));
      drag.el.w = w;
      drag.el.x = Math.min(100, Math.max(0, drag.left + w / 2));
      drag.moved = true;
      paintStage();
      paintSide();
      return;
    }
    const dx = ((e.clientX - drag.fromX) / drag.r.width) * 100;
    const dy = ((e.clientY - drag.fromY) / drag.r.height) * 100;
    if (!drag.moved && Math.abs(dx) < 0.3 && Math.abs(dy) < 0.3) return;
    drag.moved = true;
    const snap = (v) => (e.shiftKey ? v : Math.round(v * 2) / 2);
    drag.el.x = Math.max(0, Math.min(100, snap(drag.x + dx)));
    drag.el.y = Math.max(0, Math.min(100, snap(drag.y + dy)));
    const node = stage.querySelector(`[data-t="${drag.el.id}"]`);
    if (node) { node.style.left = `${drag.el.x}%`; node.style.top = `${drag.el.y}%`; }
    paintSide();
  });
  const dropped = () => {
    if (!drag) return;
    const moved = drag.moved;
    drag = null;
    if (moved) { touched(); paintStage(); }
  };
  stage.addEventListener("pointerup", dropped);
  stage.addEventListener("pointercancel", dropped);

  function pick(elId) {
    if (elId) box.classList.remove("fe--noside");
    picked = elId;
    stage.querySelectorAll(".fe-el").forEach((n) => n.classList.toggle("is-picked", n.dataset.feId === elId));
    paintSide();
    paintGrid();
  }

  /* ── the inspector ───────────────────────────────────────────────────── */

  const row = (label, body) => `<label class="fe-row"><span>${label}</span>${body}</label>`;
  const numIn = (k, v, min, max, stp = 1) =>
    `<input type="number" data-p="${k}" value="${v}" min="${min}" max="${max}" step="${stp}">`;
  const pickOne = (k, v, opts) =>
    `<select data-p="${k}">${opts.map(([val, name]) => `<option value="${esc(val)}"${String(val) === String(v) ? " selected" : ""}>${esc(name)}</option>`).join("")}</select>`;

  let wheel = null;
  function paintSide() {
    const el = doc.els.find((x) => x.id === picked);
    wheel = null;
    side.innerHTML = el ? elPanel(el) : stepPanel();
    const spot = side.querySelector('[data-f="wheel"]');
    if (spot && el) {
      /* OUR OWN WHEEL, not the operating system's button. It is always open,
         beside the words it is colouring, so a colour is judged against the
         drawing rather than in a dialog over the top of it. */
      wheel = mountWheel(spot, {
        value: el.ink,
        inks: INKS.map((i) => ({ name: i.name, hex: i.hex })),
        onChange: (hex) => {
          const now = doc.els.find((x) => x.id === picked);
          if (!now || now.ink === hex) return;
          now.ink = hex;
          touched();
          paintStage();
        },
      });
    }
    mountTooltips();
  }

  function stepPanel() {
    const s = doc.steps[step];
    return `<h2 class="fe-side__h">Beat ${step + 1} of ${doc.steps.length}</h2>
      <p class="fe-side__say">What PrepBot says here. It is read out loud, so write it the way you would say
        it — and listen to it with <b>Watch it</b> before you publish.</p>
      ${row("The line", `<textarea data-p="say" rows="7" placeholder="Say it the way you would say it to a child in front of you.">${esc(s.say)}</textarea>`)}
      <p class="fe-side__len">About ${secondsOf(s.say)} seconds spoken</p>
      ${row("Then wait (seconds)", numIn("hold", s.hold || 0, 0, 60))}
      <p class="fe-side__tip">A beat that hands the work over waits: give the child the seconds to try it
        before the answer arrives.</p>`;
  }

  function elPanel(el) {
    const common = row("Name", `<input data-p="name" value="${esc(el.name)}">`)
      + `<div class="fe-row fe-row--pair"><label><span>Across %</span>${numIn("x", el.x, 0, 100, 0.5)}</label>`
      + `<label><span>Down %</span>${numIn("y", el.y, 0, 100, 0.5)}</label></div>`;
    let own = "";
    if (el.type === "text") {
      /* A SIZE IS A NUMBER and a colour is a colour. The number is in stage
         units — the same ruler everything else on the stage is measured in,
         so 4.2 is the size the films are written at — and the wheel is the
         browser's own. The six house inks are kept beside it as a row of
         swatches, because they are the right answer most of the time and
         matching one by eye on a wheel is a job nobody should have. */
      own = row("Words <em>(Enter breaks the line)</em>", `<textarea data-p="text" rows="3">${esc(el.text)}</textarea>`)
        + `<div class="fe-row fe-row--pair">`
        + `<label><span>Size</span>${numIn("fs", el.fs, 0.5, 24, 0.1)}</label>`
        + `<label><span>Wrap at %</span>${numIn("tw", el.tw, 0, 100, 1)}</label></div>`
        + (Number(el.tw) > 0 ? row("Lines sit", pickOne("align", el.align, [["center", "Centred"], ["left", "Left"], ["right", "Right"]])) : "")
        + `<p class="fe-side__tip">Wrap at 0 lets a line run as far as it likes — right for a number,
           wrong for a sentence. Give a sentence a width and it folds inside it.</p>`
;
    } else if (el.type === "bar") {
      own = row("Width %", numIn("w", el.w, 4, 100, 0.5))
        + `<div class="fe-parts"><span class="fe-parts__h">Its parts</span>`
        + el.parts.map((p, i) => `<div class="fe-part" data-part="${i}">`
          + `<input data-pp="label" value="${esc(p.label)}" placeholder="label" aria-label="What this part says">`
          + `<input type="number" data-pp="n" value="${p.n}" min="1" max="20" aria-label="How many units wide">`
          + `<select data-pp="tone" aria-label="Its colour">${Object.keys(TONES).map((t) => `<option value="${t}"${t === p.tone ? " selected" : ""}>${t}</option>`).join("")}</select>`
          + `<button type="button" class="pp-btn wb-tint-4" data-part-del="${i}" aria-label="Take this part out">&times;</button></div>`).join("")
        + `<button type="button" class="pp-btn wb-tint-2" data-part-add="1">Add a part</button></div>`;
    } else if (el.type === "shape") {
      own = row("Width %", numIn("w", el.w, 2, 100, 0.5))
        + row("Shape", pickOne("shape", el.shape, [["rect", "Box"], ["ellipse", "Ring"], ["line", "Line"], ["arrow", "Arrow"]]))
        + row("Fill", `<input type="color" data-p="fill" value="${esc(el.fill || "#bfe3ff")}">`)
        + row("Line", `<input type="color" data-p="stroke" value="${esc(el.stroke || "#2a2723")}">`);
    } else if (el.type === "image") {
      own = row("Width %", numIn("w", el.w, 2, 100, 0.5))
        + row("Address", `<input data-p="src" value="${esc(el.src)}" placeholder="https://…">`)
        + `<div class="fe-row"><span>Or from this machine</span><input type="file" accept="image/*" data-f="pic"></div>`;
    } else if (el.type === "svg") {
      own = row("Width %", numIn("w", el.w, 2, 100, 0.5))
        + row("The drawing (SVG)", `<textarea data-p="svg" rows="6" placeholder="&lt;svg viewBox=…&gt;">${esc(el.svg)}</textarea>`);
    }
    /* THE WHEEL GOES LAST. It is the tallest thing in the panel, and what a
       thing DOES was the part nobody could find — so the animations sit above
       it, in sight the moment something is picked, and the colour is at the
       bottom where scrolling to it costs nothing. */
    const colour = el.type === "text"
      ? `<div class="fe-row"><span>Colour</span><div class="fe-wheel" data-f="wheel"></div></div>` : "";
    return `<h2 class="fe-side__h">${esc(TYPES[el.type]?.label || "Thing")}</h2>
      ${common}${own}
      ${actPanel(el)}
      ${colour}
      <div class="fe-side__keys">
        <button type="button" class="pp-btn wb-tint-1" data-f="el-done">Done</button>
        <button type="button" class="pp-btn wb-tint-4" data-f="el-del">Take it off the stage</button>
      </div>`;
  }

  /* ── the timeline ────────────────────────────────────────────────────── */

  function paintGrid() {
    const head = `<div class="fe-g__row fe-g__row--head"><span class="fe-g__name">Beat</span>`
      + doc.steps.map((s, i) => `<button type="button" class="pp-plain fe-g__beat${i === step ? " is-now" : ""}" data-step="${i}">`
        + `<b>${i + 1}</b><em>${secondsOf(s.say)}s${s.hold ? ` +${s.hold}` : ""}</em></button>`).join("")
      + `</div>`;
    const rows = doc.els.map((el) => `<div class="fe-g__row${el.id === picked ? " is-picked" : ""}">`
      + `<button type="button" class="pp-plain fe-g__name" data-pick="${el.id}" title="${esc(el.name)}">${esc(el.name)}</button>`
      + doc.steps.map((s, i) => {
        const a = s.acts.find((x) => x.el === el.id);
        return `<button type="button" class="pp-plain fe-g__cell${a ? " has-act" : ""}" data-cell="${el.id}:${i}"`
          + ` title="${a ? esc(VERBS[a.do].label) : "Nothing on this beat"}">${a ? esc(VERBS[a.do].label) : ""}</button>`;
      }).join("")
      + `</div>`).join("");
    const script = `<div class="fe-g__row fe-g__row--script"><span class="fe-g__name">The line</span>`
      + doc.steps.map((s, i) => `<button type="button" class="pp-plain fe-g__line${i === step ? " is-now" : ""}" data-step="${i}">`
        + `${s.say ? esc(s.say.slice(0, 90)) : "<em>nothing said yet</em>"}</button>`).join("")
      + `</div>`;
    grid.innerHTML = head + (rows || `<p class="fe-g__empty">Nothing on the stage yet — put something on it above.</p>`) + script;
    grid.style.setProperty("--beats", String(doc.steps.length));
  }

  /**
   * WHAT THIS THING DOES ON THIS BEAT — in the panel, not behind a modal.
   *
   * The animations used to live in a sheet that opened when you clicked a
   * square of the timeline, which meant the one part of a film editor
   * everybody comes for was the one part nothing on the screen mentioned. It
   * is now a section of the inspector, under the thing it belongs to: pick
   * something, step to a beat, and there is the verb list, already pointed at
   * the right thing on the right beat.
   */
  function actPanel(el) {
    const a = doc.steps[step].acts.find((x) => x.el === el.id);
    const needs = VERBS[a?.do]?.needs || [];
    const arg = (n) => {
      if (n === "from") return `<div class="fe-row fe-row--pair"><label><span>From across %</span><input type="number" data-ac="fx" value="${a?.fx ?? 50}" step="0.5"></label>`
        + `<label><span>From down %</span><input type="number" data-ac="fy" value="${a?.fy ?? 110}" step="0.5"></label></div>`;
      if (n === "to") return `<div class="fe-row fe-row--pair"><label><span>To across %</span><input type="number" data-ac="tx" value="${a?.tx ?? el.x}" step="0.5"></label>`
        + `<label><span>To down %</span><input type="number" data-ac="ty" value="${a?.ty ?? el.y}" step="0.5"></label></div>`;
      if (n === "text") return row("Now says", `<input data-ac="text" value="${esc(a?.text ?? el.text ?? "")}">`)
        + row("And goes", `<input type="color" data-ac="ink" value="${esc(a?.ink || el.ink)}">`);
      if (n === "amount") return row("Down to", `<input type="number" data-ac="amount" value="${a?.amount ?? 0.35}" min="0" max="1" step="0.05">`);
      if (n === "degrees") return row("Degrees", `<input type="number" data-ac="deg" value="${a?.deg ?? 0}" step="5">`);
      return "";
    };
    return `<div class="fe-acts">
      <h3 class="fe-acts__h">On beat ${step + 1}, it&hellip;</h3>
      ${row("Does", `<select data-ac="do"><option value="">&mdash; nothing &mdash;</option>`
        + VERB_IDS.map((k) => `<option value="${k}"${k === (a?.do || "") ? " selected" : ""}>${esc(VERBS[k].label)}</option>`).join("")
        + `</select>`)}
      ${needs.map(arg).join("")}
      ${a ? row("After (seconds)", `<input type="number" data-ac="delay" value="${a.delay || 0}" min="0" max="20" step="0.1">`) : ""}
      <p class="fe-side__tip">Every beat rebuilds the screen from the start, so a thing
        stays as the last beat left it until another beat moves it.</p>
    </div>`;
  }

  /** Read the act controls back into the document. */
  function readAct() {
    const el = doc.els.find((x) => x.id === picked);
    if (!el) return;
    const verb = side.querySelector('[data-ac="do"]')?.value || "";
    const rest = doc.steps[step].acts.filter((x) => x.el !== el.id);
    if (verb) {
      const made = { el: el.id, do: verb, delay: Number(side.querySelector('[data-ac="delay"]')?.value) || 0 };
      side.querySelectorAll("[data-ac]").forEach((inp) => {
        if (inp.dataset.ac === "do" || inp.dataset.ac === "delay") return;
        made[inp.dataset.ac] = inp.type === "number" ? Number(inp.value) : inp.value;
      });
      rest.push(made);
    }
    doc.steps[step].acts = rest;
    touched();
  }

  /* ── what the keys do ────────────────────────────────────────────────── */

  box.addEventListener("click", async (e) => {
    const add = e.target.closest("[data-add]")?.dataset.add;
    if (add) {
      remember();
      const el = blankEl(add);
      el.name = `${TYPES[add].label} ${doc.els.filter((x) => x.type === add).length + 1}`;
      /* a new thing lands just clear of the last one: dropped on the same
         spot every time, the second one hides the first and looks like
         nothing happened */
      const nudge = doc.els.length % 8;
      el.x = Math.min(92, el.x + nudge * 3);
      el.y = Math.min(88, el.y + nudge * 6);
      doc.els.push(el);
      /* a thing put on the stage comes on at the beat you are looking at —
         which is almost always what was meant, and is one click instead of two */
      doc.steps[step].acts.push({ el: el.id, do: "pop", delay: 0 });
      touched();
      picked = el.id;
      paintAll();
      return;
    }
    const cell = e.target.closest("[data-cell]")?.dataset.cell;
    if (cell) {
      /* a square of the timeline is a place, not a dialog: it takes you to
         that thing on that beat, and the inspector says what it does there */
      const [elId, i] = cell.split(":");
      step = Number(i);
      pick(elId);
      paintStage();
      paintGrid();
      return;
    }
    const toStep = e.target.closest("[data-step]")?.dataset.step;
    if (toStep != null) { step = Number(toStep); picked = null; paintAll(); return; }
    const toPick = e.target.closest("[data-pick]")?.dataset.pick;
    if (toPick) { pick(toPick); return; }
    const ink = e.target.closest("[data-ink]")?.dataset.ink;
    if (ink) {
      const el = doc.els.find((x) => x.id === picked);
      if (el) { remember(); el.ink = ink; touched(); paintAll(); }
      return;
    }
    const partDel = e.target.closest("[data-part-del]")?.dataset.partDel;
    if (partDel != null) {
      remember();
      const el = doc.els.find((x) => x.id === picked);
      el.parts.splice(Number(partDel), 1);
      touched(); paintAll(); return;
    }
    if (e.target.closest("[data-part-add]")) {
      remember();
      const el = doc.els.find((x) => x.id === picked);
      el.parts.push({ n: 1, tone: "sky", label: "" });
      touched(); paintAll(); return;
    }

    const k = e.target.closest("[data-f]")?.dataset.f;
    if (!k) return;
    if (k === "close") {
      if (dirty && !confirm("Close the editor? What is not saved is lost.")) return;
      close();
    } else if (k === "el-done") {
      pick(null);
    } else if (k === "fold-side" || k === "fold-time") {
      /* MORE STAGE. The inspector and the beats both fold away, because for
         long stretches of laying a film out you want neither: you want the
         screen as big as the window will give it. The stage is measured by a
         ResizeObserver, so it takes the room back the moment it appears. */
      box.classList.toggle(k === "fold-side" ? "fe--noside" : "fe--notime");
      e.target.closest("[data-f]").setAttribute("aria-pressed",
        String(box.classList.contains(k === "fold-side" ? "fe--noside" : "fe--notime")));
    } else if (k === "undo") {
      stepBack();
    } else if (k === "el-del") {
      remember();
      doc.els = doc.els.filter((x) => x.id !== picked);
      doc.steps.forEach((s) => { s.acts = s.acts.filter((a) => a.el !== picked); });
      picked = null; touched(); paintAll();
    } else if (k === "step-add") {
      remember();
      doc.steps.splice(step + 1, 0, blankStep());
      step += 1; touched(); paintAll();
    } else if (k === "step-del") {
      if (doc.steps.length < 2) { say("A film needs at least one beat", true); return; }
      remember();
      doc.steps.splice(step, 1);
      step = Math.max(0, step - 1); touched(); paintAll();
    } else if (k === "step-left" || k === "step-right") {
      const to = step + (k === "step-left" ? -1 : 1);
      if (to < 0 || to >= doc.steps.length) return;
      remember();
      [doc.steps[step], doc.steps[to]] = [doc.steps[to], doc.steps[step]];
      step = to; touched(); paintAll();
    } else if (k === "save") {
      await keep(saveDraft, "Draft saved — only you are served this");
    } else if (k === "publish") {
      if (!confirm("Publish? Everybody gets this lesson from now on.")) return;
      await keep(publish, "Published — this is the lesson now");
      box.querySelector('[data-f="down"]').hidden = false;
    } else if (k === "trace") {
      /* THE DRAWING, READ OFF THE CODED FILM. The script comes across the
         moment the room is opened; this brings the pictures too, by running
         the coded film into a stage off the screen and reading what it puts
         there (film-trace.js). It is a starting point: the places and the
         order are right, the entrances are all plain ones to be chosen again. */
      if (doc.els.length && !confirm("Trace the coded film? What is on the stage now is replaced.")) return;
      remember();
      say("Reading the coded film…");
      try {
        const { traceFilm } = await import("./film-trace.js");
        const traced = traceFilm(coded, doc.title || title);
        /* the words that have been worked on here are kept: a trace is about
           the drawing, and overwriting an edited script with the old one is
           exactly the thing this editor exists to stop */
        traced.steps.forEach((st, i) => { if (doc.steps[i]?.say) st.say = doc.steps[i].say; });
        doc = normalise(traced, doc.title || title);
        picked = null;
        step = 0;
        touched();
        paintAll();
        say(`Traced — ${doc.els.length} things over ${doc.steps.length} beats`);
      } catch (err) {
        say("The coded film would not trace", true);
        console.error("film trace failed", err);
      }
    } else if (k === "down") {
      /* THE WAY BACK. A film that is worse than the one it replaced must be
         removable in one press — the coded lesson is still there and starts
         playing again the moment this document stops being published. The
         draft is kept, so the work is not lost. */
      if (!confirm("Take it down? The written-in-code lesson plays again, and your draft is kept.")) return;
      say("Taking it down…");
      try {
        await unpublish(id);
        forget(id);
        box.querySelector('[data-f="down"]').hidden = true;
        say("Taken down — the coded lesson is playing again");
      } catch (err) {
        say("It would not come down", true);
        console.error("film unpublish failed", err);
      }
    } else if (k === "preview") {
      doc.title = box.querySelector(".fe__title").value.trim() || doc.title;
      box.classList.add("is-away");
      try { await onPlay?.(doc); } finally { box.classList.remove("is-away"); }
    }
  });

  async function keep(fn, done) {
    doc.title = box.querySelector(".fe__title").value.trim() || doc.title;
    say("Saving…");
    try {
      await fn(id, doc);
      forget(id);
      dirty = false;
      say(done);
    } catch (err) {
      say("It would not save — are you still signed in?", true);
      console.error("film save failed", err);
    }
  }

  /* ONE STEP BACK PER FIELD, not per keystroke: the state is kept when a box
     is first touched, so undo takes back the whole of what was typed into it
     rather than one letter. */
  side.addEventListener("focusin", (e) => {
    if (e.target.matches("input, textarea, select")) remember();
  });

  /* typing in the inspector writes straight through to the document */
  side.addEventListener("input", (e) => {
    const el = doc.els.find((x) => x.id === picked);
    if (e.target.dataset.ac) {
      readAct();
      /* the verb decides which questions are asked, so changing it redraws
         the panel; everything else just writes through */
      if (e.target.dataset.ac === "do") paintAll(); else { paintStage(); paintGrid(); }
      return;
    }
    const p = e.target.dataset.p;
    if (p) {
      const target = el || doc.steps[step];
      target[p] = e.target.type === "number" ? Number(e.target.value) : e.target.value;
      touched();
      if (el) paintStage(); else paintGrid();
      /* turning wrapping on and off adds or removes the alignment question */
      if (p === "tw" && (Number(e.target.value) > 0) !== Boolean(side.querySelector('[data-p="align"]'))) paintSide();
      if (p === "say") side.querySelector(".fe-side__len").textContent = `About ${secondsOf(doc.steps[step].say)} seconds spoken`;
      return;
    }
    const pp = e.target.dataset.pp;
    if (pp && el) {
      const i = Number(e.target.closest("[data-part]").dataset.part);
      el.parts[i][pp] = e.target.type === "number" ? Number(e.target.value) : e.target.value;
      touched(); paintStage();
    }
  });

  /* a picture from this machine goes where every other image on the site goes */
  side.addEventListener("change", async (e) => {
    if (e.target.dataset.f !== "pic") return;
    const file = e.target.files?.[0];
    const el = doc.els.find((x) => x.id === picked);
    if (!file || !el) return;
    say("Sending the picture…");
    try {
      const b64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result));
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      const { imageStore } = await import("/utils/ai-client.js");
      const out = await imageStore({ imageBase64: b64 });
      const url = out?.url || out?.secure_url || "";
      if (!url) throw new Error("no url came back");
      el.src = url;
      touched(); paintAll(); say("Picture in");
    } catch (err) {
      say("The picture would not go up", true);
      console.error("film picture upload failed", err);
    }
  });

  box.querySelector(".fe__title").addEventListener("input", touched);

  const ARROWS = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  /* a run of nudges is ONE step back, not twenty */
  let nudging = false;
  let nudgeRest = 0;
  const onKey = (e) => {
    if (e.key === "Escape" && !box.querySelector(".fe-sheet")) { e.preventDefault(); box.querySelector('[data-f="close"]').click(); return; }
    if ((e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "Z")) {
      if (e.target.closest("input, textarea")) return;    // the box has its own undo
      e.preventDefault();
      stepBack();
      return;
    }
    /* NUDGING. Half a percent a press, two with shift — a drag gets a mark
       roughly where it goes and the arrows put it exactly there, which is the
       difference between a layout that nearly lines up and one that does. */
    const way = ARROWS[e.key];
    if (!way || !picked || e.target.closest("input, textarea, select") || box.querySelector(".fe-sheet")) return;
    const el = doc.els.find((x) => x.id === picked);
    if (!el) return;
    e.preventDefault();
    if (!nudging) { remember(); nudging = true; }
    clearTimeout(nudgeRest);
    nudgeRest = setTimeout(() => { nudging = false; }, 900);
    const by = e.shiftKey ? 2 : 0.5;
    el.x = Math.max(0, Math.min(100, Math.round((el.x + way[0] * by) * 2) / 2));
    el.y = Math.max(0, Math.min(100, Math.round((el.y + way[1] * by) * 2) / 2));
    touched();
    paintStage();
    paintSide();
  };
  document.addEventListener("keydown", onKey);

  function paintAll() { paintStage(); paintSide(); paintGrid(); mountTooltips(); }
  function close() {
    document.removeEventListener("keydown", onKey);
    watchSize.disconnect();
    box.remove();
    live = null;
  }

  paintAll();
  box.querySelector('[data-f="down"]').hidden = !both.published;
  box.querySelector('[data-f="trace"]').hidden = !(coded && coded.build);
  say(both.draft ? "A draft is open" : both.published ? "Opened from what is published" : "A new film");
  return live;
}

/**
 * A DOCUMENT TO START FROM. When a film already exists in code, its SCRIPT is
 * what the admin wants to keep — the words took the longest to get right and
 * they are what a child takes away. So the beats and their lines come across
 * and the stage starts empty, ready to be laid out. The coded film goes on
 * playing for everybody until this one is published.
 */
function startFrom(coded, title) {
  const doc = blankDoc(title);
  const steps = (coded || []).filter((s) => s && typeof s.say === "string");
  if (steps.length) doc.steps = steps.map((s) => ({ say: s.say, hold: Number(s.hold) || 0, acts: [] }));
  return normalise(doc, title);
}

export { normalise, playable, elHtml };
