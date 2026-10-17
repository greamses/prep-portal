/* ============================================================================
   THE FILM EDITOR — a lesson laid out, beat by beat
   ----------------------------------------------------------------------------
   A cutting room for PrepBot's films (./filmdoc.js), open to the admin alone.
   Four parts, and they are the four questions you ask about a lesson:

     the STAGE       what is on the screen — drag a thing to move it, pull its
                     corner to size it, and it is shown exactly as the
                     television will show it, at the television's own 16:9
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
 *   coded   the coded film's steps, if there is one: its script is offered
 *           as a starting point so a lesson is never retyped
 *   onPlay  how to play a document on the television (preview)
 */
export async function openFilmEditor({ id, title = "", coded = null, onPlay = null } = {}) {
  if (live) return live;
  needCss("/utils/components/workbook/film-editor.css");

  const both = await filmBoth(id);
  let doc = both.draft || both.published || startFrom(coded, title);
  let step = 0;
  let picked = null;        // the selected element's id
  let dirty = false;

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
        <button type="button" class="pp-btn wb-tint-2" data-f="preview">Watch it</button>
        <button type="button" class="pp-btn wb-tint-1" data-f="save">Save draft</button>
        <button type="button" class="pp-btn wb-tint-3" data-f="publish">Publish</button>
        <button type="button" class="pp-btn wb-tint-1" data-f="down" hidden>Take it down</button>
        <button type="button" class="pp-btn wb-tint-4" data-f="close" aria-label="Close the editor">Close</button>
      </span>
    </header>
    <div class="fe__work">
      <section class="fe__left">
        <div class="fe__stagewrap"><div class="fe__stage" data-f="stage"></div></div>
        <div class="fe__add">
          <span class="fe__add-say">Put on the stage:</span>
          ${Object.entries(TYPES).map(([t, v]) => `<button type="button" class="pp-btn wb-tint-2" data-add="${t}">${esc(v.label)}</button>`).join("")}
        </div>
      </section>
      <aside class="fe__side" data-f="side"></aside>
    </div>
    <section class="fe__time">
      <div class="fe__time-head">
        <h2>The beats</h2>
        <span class="fe__time-keys">
          <button type="button" class="pp-btn wb-tint-2" data-f="step-add">Add a beat</button>
          <button type="button" class="pp-btn wb-tint-1" data-f="step-left">&larr; Move it back</button>
          <button type="button" class="pp-btn wb-tint-1" data-f="step-right">Move it on &rarr;</button>
          <button type="button" class="pp-btn wb-tint-4" data-f="step-del">Take the beat out</button>
        </span>
      </div>
      <div class="fe__grid" data-f="grid"></div>
    </section>`;
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

  /** Every element, then every act up to and including the beat on show. */
  function paintStage() {
    stage.innerHTML = "";
    const tv = document.createElement("div");
    tv.className = "vm-tv";
    stage.appendChild(tv);
    /* the films are measured in hundredths of the stage's width */
    tv.style.setProperty("--u", `${stage.clientWidth / 100}px`);
    doc.els.forEach((el) => mountEl(stage, el));
    const film = playable(doc);
    for (let k = 0; k <= step && k < film.steps.length; k++) {
      film.steps[k].show(stage, { gsap: null, instant: true });
    }
    /* anything with no act yet would be invisible and so unselectable: in the
       cutting room it is shown faintly, with a ghost ring, so it can be
       picked up and placed before it is given its entrance */
    doc.els.forEach((el) => {
      const node = stage.querySelector(`[data-t="${el.id}"]`);
      if (!node) return;
      node.classList.add("fe-el");
      node.dataset.feId = el.id;
      const inner = node.firstChild;
      if (inner && Number(getComputedStyle(inner).opacity) < 0.02) {
        node.classList.add("is-ghost");
        inner.style.opacity = "0.22";
      }
      node.classList.toggle("is-picked", el.id === picked);
    });
  }

  /* DRAGGING. The stage is the ruler: a drag is turned into a percentage of
     its width and height, which is exactly what the film stores, so what you
     drag to is what plays. */
  let drag = null;
  stage.addEventListener("pointerdown", (e) => {
    const node = e.target.closest?.(".fe-el");
    if (!node) { pick(null); return; }
    const el = doc.els.find((x) => x.id === node.dataset.feId);
    if (!el) return;
    e.preventDefault();
    pick(el.id);
    const r = stage.getBoundingClientRect();
    drag = { el, r, fromX: e.clientX, fromY: e.clientY, x: el.x, y: el.y, moved: false };
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener("pointermove", (e) => {
    if (!drag) return;
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

  function paintSide() {
    const el = doc.els.find((x) => x.id === picked);
    side.innerHTML = el ? elPanel(el) : stepPanel();
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
      own = row("Words", `<textarea data-p="text" rows="2">${esc(el.text)}</textarea>`)
        + row("Size", pickOne("size", el.size, [["s", "Small"], ["m", "Middling"], ["l", "Large"]]))
        + row("Ink", pickOne("c", el.c, INKS.map((i) => [i.c, i.name])));
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
    return `<h2 class="fe-side__h">${esc(TYPES[el.type]?.label || "Thing")}</h2>
      ${common}${own}
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

  /** The little sheet that asks what a thing does on a beat. */
  function openCell(elId, i) {
    const el = doc.els.find((x) => x.id === elId);
    const s = doc.steps[i];
    if (!el || !s) return;
    const a = s.acts.find((x) => x.el === elId);
    const sheet = document.createElement("div");
    sheet.className = "fe-sheet";
    const v = a?.do || "";
    sheet.innerHTML = `<div class="fe-sheet__card pp-receipt"><div class="pp-receipt__paper"><div class="fe-sheet__in">
      <h2>${esc(el.name)} &middot; beat ${i + 1}</h2>
      ${row("Does", `<select data-s="do"><option value="">— nothing —</option>`
        + VERB_IDS.map((k) => `<option value="${k}"${k === v ? " selected" : ""}>${esc(VERBS[k].label)}</option>`).join("")
        + `</select>`)}
      <div data-s="args"></div>
      ${row("After (seconds)", `<input type="number" data-s="delay" value="${a?.delay || 0}" min="0" max="20" step="0.1">`)}
      <div class="fe-sheet__keys">
        <button type="button" class="pp-btn wb-tint-2" data-s="ok">Done</button>
        <button type="button" class="pp-btn wb-tint-4" data-s="cancel">Leave it</button>
      </div></div></div></div>`;
    box.appendChild(sheet);
    const pickDo = sheet.querySelector('[data-s="do"]');
    const args = sheet.querySelector('[data-s="args"]');
    const paintArgs = () => {
      const needs = VERBS[pickDo.value]?.needs || [];
      args.innerHTML = needs.map((n) => {
        if (n === "from") return `<div class="fe-row fe-row--pair"><label><span>From across %</span><input type="number" data-a="fx" value="${a?.fx ?? 50}" step="0.5"></label>`
          + `<label><span>From down %</span><input type="number" data-a="fy" value="${a?.fy ?? 110}" step="0.5"></label></div>`;
        if (n === "to") return `<div class="fe-row fe-row--pair"><label><span>To across %</span><input type="number" data-a="tx" value="${a?.tx ?? el.x}" step="0.5"></label>`
          + `<label><span>To down %</span><input type="number" data-a="ty" value="${a?.ty ?? el.y}" step="0.5"></label></div>`;
        if (n === "text") return row("Now says", `<input data-a="text" value="${esc(a?.text ?? el.text ?? "")}">`);
        if (n === "amount") return row("Down to", `<input type="number" data-a="amount" value="${a?.amount ?? 0.35}" min="0" max="1" step="0.05">`);
        if (n === "degrees") return row("Degrees", `<input type="number" data-a="deg" value="${a?.deg ?? 0}" step="5">`);
        return "";
      }).join("");
    };
    paintArgs();
    pickDo.addEventListener("change", paintArgs);
    sheet.addEventListener("click", (e) => {
      const k = e.target.closest("[data-s]")?.dataset.s;
      if (k === "cancel" || e.target === sheet) { sheet.remove(); return; }
      if (k !== "ok") return;
      const rest = s.acts.filter((x) => x.el !== elId);
      if (pickDo.value) {
        const made = { el: elId, do: pickDo.value, delay: Number(sheet.querySelector('[data-s="delay"]').value) || 0 };
        sheet.querySelectorAll("[data-a]").forEach((inp) => {
          made[inp.dataset.a] = inp.type === "number" ? Number(inp.value) : inp.value;
        });
        rest.push(made);
      }
      s.acts = rest;
      sheet.remove();
      touched();
      step = i;
      paintAll();
    });
  }

  /* ── what the keys do ────────────────────────────────────────────────── */

  box.addEventListener("click", async (e) => {
    const add = e.target.closest("[data-add]")?.dataset.add;
    if (add) {
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
    if (cell) { const [elId, i] = cell.split(":"); openCell(elId, Number(i)); return; }
    const toStep = e.target.closest("[data-step]")?.dataset.step;
    if (toStep != null) { step = Number(toStep); picked = null; paintAll(); return; }
    const toPick = e.target.closest("[data-pick]")?.dataset.pick;
    if (toPick) { pick(toPick); return; }
    const partDel = e.target.closest("[data-part-del]")?.dataset.partDel;
    if (partDel != null) {
      const el = doc.els.find((x) => x.id === picked);
      el.parts.splice(Number(partDel), 1);
      touched(); paintAll(); return;
    }
    if (e.target.closest("[data-part-add]")) {
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
    } else if (k === "el-del") {
      doc.els = doc.els.filter((x) => x.id !== picked);
      doc.steps.forEach((s) => { s.acts = s.acts.filter((a) => a.el !== picked); });
      picked = null; touched(); paintAll();
    } else if (k === "step-add") {
      doc.steps.splice(step + 1, 0, blankStep());
      step += 1; touched(); paintAll();
    } else if (k === "step-del") {
      if (doc.steps.length < 2) { say("A film needs at least one beat", true); return; }
      doc.steps.splice(step, 1);
      step = Math.max(0, step - 1); touched(); paintAll();
    } else if (k === "step-left" || k === "step-right") {
      const to = step + (k === "step-left" ? -1 : 1);
      if (to < 0 || to >= doc.steps.length) return;
      [doc.steps[step], doc.steps[to]] = [doc.steps[to], doc.steps[step]];
      step = to; touched(); paintAll();
    } else if (k === "save") {
      await keep(saveDraft, "Draft saved — only you are served this");
    } else if (k === "publish") {
      if (!confirm("Publish? Everybody gets this lesson from now on.")) return;
      await keep(publish, "Published — this is the lesson now");
      box.querySelector('[data-f="down"]').hidden = false;
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

  /* typing in the inspector writes straight through to the document */
  side.addEventListener("input", (e) => {
    const el = doc.els.find((x) => x.id === picked);
    const p = e.target.dataset.p;
    if (p) {
      const target = el || doc.steps[step];
      target[p] = e.target.type === "number" ? Number(e.target.value) : e.target.value;
      touched();
      if (el) paintStage(); else paintGrid();
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

  const onKey = (e) => {
    if (e.key === "Escape" && !box.querySelector(".fe-sheet")) { e.preventDefault(); box.querySelector('[data-f="close"]').click(); }
  };
  document.addEventListener("keydown", onKey);

  function paintAll() { paintStage(); paintSide(); paintGrid(); }
  function close() {
    document.removeEventListener("keydown", onKey);
    box.remove();
    live = null;
  }

  paintAll();
  /* the stage is measured once it has a width */
  requestAnimationFrame(paintStage);
  window.addEventListener("resize", paintStage);
  box.querySelector('[data-f="down"]').hidden = !both.published;
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
