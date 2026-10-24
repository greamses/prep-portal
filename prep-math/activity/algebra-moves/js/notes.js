/* ═══════════════════════════════════════════════════════════════════════════
   STICKY NOTES ON THE WORKING

   The site's one sticky note (utils/components/sticky-note*): drawn by its
   painter, written in its editor, equations and all. Used twice here — stuck
   to a line of a card, and stuck anywhere on the canvas from the rail's pin —
   and both are the same note: drag it to put it somewhere else, tap it to
   write on it, × to take it off. Fetched the first time a note is made, since
   most sessions never make one.

   A note is plain data — { id, runs, paper, dx, dy } — and the face drawn for
   it reads its place from dx/dy, so whoever holds the note keeps it.
   ═══════════════════════════════════════════════════════════════════════════ */

import { UI } from "/utils/components/ui-icons.js";
import { hideTip } from "/utils/components/tooltip.js";

let kit = null;
export const loadNotes = () => (kit ||= (async () => {
  if (!document.querySelector('link[href$="/utils/components/sticky-note.css"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/utils/components/sticky-note.css";
    document.head.appendChild(link);
  }
  const [note, editor, math] = await Promise.all([
    import("/utils/components/sticky-note.js"),
    import("/utils/components/sticky-note-editor.js"),
    import("/utils/components/sticky-math.js"),
  ]);
  return { ...note, ...editor, whenMathDrawn: math.whenMathDrawn };
})());

/* A drawing pin, in the house's filled icon language. */
export const PIN = `<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">`
  + `<path d="M9.4 2.6h5.2l-1 5.2 3.8 3.4v2H6.6v-2l3.8-3.4z" fill="var(--accent-danger,#c0453f)"/>`
  + `<rect x="11.2" y="13.2" width="1.6" height="8.2" rx="0.8" fill="#6b6457"/></svg>`;

let seq = 0;
export const newNote = (paper = 0) => ({ id: `note${++seq}`, runs: null, paper, dx: 0, dy: 0 });

/**
 * The face of one note: the painted paper, a × to take it off, and dragging.
 *
 * `scaleOf()` says how many screen pixels one of the note's own pixels is —
 * the canvas zoom — so a drag follows the finger at any zoom. `onSized` is
 * told when the paper has been painted (the holder may need to re-measure).
 */
export function noteFace(n, { scaleOf = () => 1, onTap, onDelete, onSized, maxWidth = 240 } = {}) {
  const wrap = document.createElement("div");
  wrap.className = "am-pinned-wrap";
  wrap.dataset.pin = n.id;
  const place = () => { wrap.style.transform = `translate(${n.dx || 0}px, ${n.dy || 0}px)`; };
  place();

  const c = document.createElement("canvas");
  c.className = "am-pinned";
  c.title = "Tap to change this note, drag to move it";
  c.setAttribute("aria-label", "A note — tap to change it, drag to move it");
  c.tabIndex = 0;
  c.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onTap?.(); } });

  const bin = document.createElement("button");
  bin.type = "button";
  bin.className = "am-pinned__del";
  bin.title = "Take this note off";
  bin.setAttribute("aria-label", "Take this note off");
  bin.innerHTML = UI.close(12);
  bin.addEventListener("pointerdown", (e) => e.stopPropagation());
  bin.addEventListener("click", (e) => { e.stopPropagation(); onDelete?.(); });
  wrap.append(c, bin);

  /* Dragged, it keeps where it was put (n.dx, n.dy). A press that does not
     move is a tap. Followed on the window, not captured: whatever is under the
     note would otherwise take the moves the moment the pointer leaves it. */
  let drag = null;
  const move = (e) => {
    if (!drag) return;
    const mx = (e.clientX - drag.x) / drag.zoom, my = (e.clientY - drag.y) / drag.zoom;
    if (!drag.moved && Math.hypot(mx, my) < 4) return;
    drag.moved = true;
    wrap.classList.add("is-dragging");
    n.dx = drag.dx + mx;
    n.dy = drag.dy + my;
    place();
  };
  const end = (e) => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", end);
    window.removeEventListener("pointercancel", end);
    if (!drag) return;
    const was = drag;
    drag = null;
    wrap.classList.remove("is-dragging");
    if (e.type === "pointerup" && !was.moved) onTap?.();
  };
  c.addEventListener("pointerdown", (e) => {
    e.stopPropagation();
    e.preventDefault();
    drag = { x: e.clientX, y: e.clientY, dx: n.dx || 0, dy: n.dy || 0, zoom: scaleOf() || 1, moved: false };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  });
  c.addEventListener("click", (e) => e.stopPropagation());

  loadNotes().then((K) => {
    // An equation is drawn as its source until MathJax has set it; the painter
    // is woken then and draws it again (a few times at most).
    let tries = 0;
    const draw = () => {
      if (!c.isConnected && tries) return;
      const note = K.makeNote(n.runs ? { runs: n.runs, paper: n.paper } : { text: " ", paper: n.paper });
      const lay = K.layoutNote(note, { maxWidth });
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const pad = 8;
      c.width = Math.round((lay.width + pad * 2) * dpr);
      c.height = Math.round((lay.height + pad * 2) * dpr);
      c.style.width = `${lay.width + pad * 2}px`;
      c.style.height = `${lay.height + pad * 2}px`;
      const g = c.getContext("2d");
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.translate(pad, pad);
      K.paintSticky(g, note, lay, { ruled: true });
      onSized?.();
      if (n.runs?.some((r) => r.tex) && tries++ < 4) K.whenMathDrawn(draw);
    };
    draw();
  });
  return wrap;
}

/**
 * One editor for a whole surface (a card, or the canvas), opened over
 * whichever note is being written. `write(n, face, done)` opens it over the
 * face; `done(n, { empty })` is told when the pen is put down — a press
 * anywhere off the note puts it down.
 */
export function noteWriter(host) {
  let pad = null;
  let on = null;
  return {
    async write(n, face, done) {
      const K = await loadNotes();
      if (!pad) {
        pad = K.createStickyEditor({
          host,
          onInput: (note) => { if (on) { on.n.runs = note.runs; on.n.paper = note.paper; } },
          onDone: (note, { empty } = {}) => {
            const was = on;
            on = null;
            if (!was) return;
            was.face?.classList.remove("is-writing");
            was.n.runs = note.runs;
            was.n.paper = note.paper;
            was.done?.(was.n, { empty });
          },
        });
        pad.el.addEventListener("click", (e) => e.stopPropagation());
        pad.el.addEventListener("pointerdown", (e) => e.stopPropagation());
        document.addEventListener("pointerdown", (e) => {
          if (on && pad.isOpen() && !pad.owns(e.target)) pad.close(true);
        }, true);
      }
      if (on && on.n !== n && pad.isOpen()) pad.close(true);
      /* The face that is ON THE PAGE for this note now: the one the tap came
         from may have been redrawn in the meantime (a line repaints its notes
         whenever anything on it changes), and positioning over a face that is
         no longer there put the editor at the card's corner and hid nothing. */
      face = host.querySelector(`[data-pin="${n.id}"]`) || face;
      on = { n, done, face };
      hideTip();
      pad.open(K.makeNote(n.runs ? { runs: n.runs, paper: n.paper } : { paper: n.paper }));
      pad.el.classList.add("pp-note--onboard");
      /* ONE note on the paper while it is being written: the painted face
         steps aside (it would otherwise sit frozen under the live editor, a
         second copy drifting away from the first with every key), and the
         editor — its toolbar hangs ABOVE it, out of the layout (style.css) — is laid
         exactly where the face was. All in the host's own (unzoomed) pixels. */
      face?.classList.add("is-writing");
      /* Where the face is, in the host's own pixels. offsetLeft/offsetTop leave
         out CSS translates — the face's own drag, and the translateY(-50%) that
         centres a line's notes on it — so those are added back from the
         computed transform of every box on the way up. */
      let left = 0, top = 0;
      for (let at = face; at && at !== host; at = at.offsetParent) {
        const m = new DOMMatrix(getComputedStyle(at).transform);
        left += at.offsetLeft + m.m41;
        top += at.offsetTop + m.m42;
      }
      const canvasEl = face?.querySelector("canvas");
      const width = Math.max(220, Math.min(300, canvasEl ? canvasEl.offsetWidth : 260));
      pad.place({ left, top, width });
    },
    /** Stop writing on `n` without keeping what was typed (it is being thrown away). */
    drop(n) { if (on?.n === n) { on.face?.classList.remove("is-writing"); on = null; pad.close(false); } },
  };
}
