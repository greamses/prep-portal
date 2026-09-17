/* ============================================================================
   THE WRITTEN BOARDS — one of them, on a page
   ----------------------------------------------------------------------------
   The same page the manipulatives canvas paints (paint.js), built out of DOM
   instead — because in a workbook the board sits beside the questions and has
   to be typed into, read by a screen reader and printed round. Both renderers
   take the same `sheet` off the same method, so what is on the paper is decided
   in one place and drawn in two.

   Everything it shows is a cell in one grid: a figure, a carry, the line under
   a column, the point in its gap, the bus stop round a division, and the box
   the next figure is typed into. Nothing is positioned by hand.
   ========================================================================== */

import { boardFor } from "./index.js";

/* The board's buttons, in the site's one icon language — filled shapes in the
   theme's accent tokens (utils/components/workbook/icons.js states the rule). */
const SVG = (inner) =>
  `<svg viewBox="0 0 24 24" width="15" height="15" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`;

const ICONS = {
  /* set it: the green badge with the tick, as everywhere else */
  set: SVG('<circle cx="12" cy="12" r="9.6" fill="var(--accent-success)"/>'
    + '<path d="M7.4 12.4l3 3 6.2-6.7" fill="none" stroke="#fff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>'),
  /* show the working: an eye */
  show: SVG('<path d="M1.8 12S5.6 4.8 12 4.8 22.2 12 22.2 12 18.4 19.2 12 19.2 1.8 12 1.8 12z" fill="var(--accent-secondary)"/>'
    + '<circle cx="12" cy="12" r="4.4" fill="#fff"/><circle cx="12" cy="12" r="2.3" fill="var(--accent-danger)"/>'),
  /* rub it out */
  rub: SVG('<path d="M4.2 13.4 11.6 6a1.8 1.8 0 0 1 2.5 0l4.9 4.9a1.8 1.8 0 0 1 0 2.5L14 18.4H9.2z" fill="var(--accent-danger)"/>'
    + '<path d="M8 9.6 14.4 16 12 18.4H9.2l-5-5z" fill="var(--accent-secondary)"/>'
    + '<rect x="9.2" y="19.4" width="11.6" height="2" rx="1" fill="var(--text-tertiary)"/>'),
  /* bring the next figure down */
  down: SVG('<rect x="10.6" y="3" width="2.8" height="11" rx="1.4" fill="var(--accent-secondary)"/>'
    + '<path d="M5.8 12.6h12.4L12 20.6z" fill="var(--accent-danger)"/>'),
};

/**
 * Put a board on the page.
 *
 *   host      where it goes
 *   variant   "longdiv" | "column" | "times"
 *   base      the working base (ten unless you are somewhere strange)
 *
 * → { el, board, destroy() }
 */
export function mountBoard(host, { variant = "longdiv", base = 10 } = {}) {
  const kind = boardFor(variant);
  if (!kind) throw new Error(`no board called ${variant}`);
  const thing = kind.make(base);

  const el = document.createElement("div");
  el.className = `bd-board bd-board--${variant}`;
  el.innerHTML = `
    <form class="bd-sum" novalidate>
      ${kind.fields.map((f, i) => `
        ${i && kind.sign ? `<span class="bd-sum__sign" aria-hidden="true">${kind.sign}</span>` : ""}
        <label class="bd-sum__field${f.wide ? " bd-sum__field--wide" : ""}${f.pick ? " bd-sum__field--pick" : ""}">
          <span>${f.label}</span>
          ${f.pick
            ? `<select class="bd-sum__in" data-n="${f.n}" aria-label="${f.aria}">
                 ${f.pick.map(([v, t]) => `<option value="${v}">${t}</option>`).join("")}
               </select>`
            : `<input class="bd-sum__in" data-n="${f.n}" type="text" inputmode="${f.mode || "decimal"}"
                      autocomplete="off" spellcheck="false" aria-label="${f.aria}" />`}
        </label>`).join("")}
      <button class="pp-btn bd-act bd-act--set" type="submit">${ICONS.set} Set it</button>
    </form>
    <div class="bd-paper" role="group" aria-label="${kind.name}"></div>
    <p class="bd-say" role="status" aria-live="polite"></p>
    <div class="bd-acts">
      <button class="pp-btn bd-act" type="button" data-do="show">${ICONS.show} Show me one</button>
      <button class="pp-btn bd-act" type="button" data-do="rub">${ICONS.rub} Rub it out</button>
    </div>`;
  host.appendChild(el);

  const form = el.querySelector(".bd-sum");
  const paper = el.querySelector(".bd-paper");
  const say = el.querySelector(".bd-say");
  const ins = [...el.querySelectorAll(".bd-sum__in")];

  const tell = (text, tone = "") => {
    say.textContent = text || "";
    say.className = `bd-say${tone ? ` is-${tone}` : ""}`;
  };

  /* ── the sum row ───────────────────────────────────────────────────────── */

  function fillSum() {
    const v = kind.read(thing);
    ins.forEach((i) => { i.value = v[i.dataset.n] ?? ""; });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const v = {};
    ins.forEach((i) => { v[i.dataset.n] = i.value; });
    const out = kind.set(thing, v);
    if (!out.ok) return tell(out.message, "no");
    fillSum();
    draw();
    tell(out.message, "ok");
  });

  /* ── the page ──────────────────────────────────────────────────────────── */

  let boxes = [];

  function offer(text) {
    const out = kind.answer(thing, text);
    if (!out.ok) {
      tell(out.message, "no");
      boxes.forEach((b) => { b.value = ""; });
      boxes[0]?.focus();
      return;
    }
    draw();
    tell(out.message, "ok");
    boxes[0]?.focus();
  }

  function draw() {
    const sheet = kind.sheet(thing);
    const open = kind.cells ? kind.cells(thing) : null;
    const gcol = (col) => sheet.gutter + col + 1;
    const grow = (row) => row + 1;
    paper.style.setProperty("--bd-cols", String(sheet.cols));
    paper.style.setProperty("--bd-rows", String(sheet.rows));
    paper.innerHTML = "";
    boxes = [];

    /* `span` is columns across, `tall` is rows down — a sign between two
       fractions, or the whole number beside one, stands across both rows. */
    const put = (cls, row, col, span = 1, tall = 1) => {
      const n = document.createElement("div");
      n.className = cls;
      n.style.gridRow = tall > 1 ? `${grow(row)} / span ${tall}` : String(grow(row));
      n.style.gridColumn = `${gcol(col)} / span ${span}`;
      paper.appendChild(n);
      return n;
    };

    /* the bus stop, when the board is a division */
    if (sheet.bracket) {
      const n = put("bd-bracket", sheet.bracket.row, 0, sheet.bracket.to);
      n.style.gridRow = `${grow(sheet.bracket.row)} / -1`;
    }

    for (const r of sheet.rules || []) {
      put("bd-rule", r.row, r.from, r.to - r.from + 1);
    }
    if (sheet.underline) {
      put("bd-underline", sheet.underline.row, sheet.underline.from,
        sheet.underline.to - sheet.underline.from + 1);
    }

    for (const m of sheet.marks) {
      const n = put(
        `bd-mark${m.tone === "carry" ? " is-carry" : m.tone === "soft" ? " is-soft" : ""}`,
        m.row, m.col, m.cols || 1, m.span || 1,
      );
      n.textContent = m.ch;
    }
    for (const p of sheet.points || []) put("bd-point", p.row, p.col);
    /* a figure that lent one to the column on its right, crossed out */
    for (const k of sheet.strikes || []) put("bd-strike", k.row, k.col);
    /* The minus goes in FRONT of what is being taken away, in the empty column
       the bus stop leaves for it — not on top of its first figure. */
    for (const m of sheet.minus || []) put("bd-sign bd-sign--minus", m.row, m.col - 1).textContent = "−";
    for (const s of sheet.signs || []) put("bd-sign", s.row, s.col).textContent = s.ch;
    if (sheet.tail) {
      const n = put("bd-tail", 0, sheet.width, 2);
      n.textContent = sheet.tail;
    }

    /* Where the next figure goes. A figure brought down is the one step that is
       not typed — it is fetched, so it is a button on the figure itself. */
    if (open && open.mode === "bring") {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "bd-bring";
      b.innerHTML = `${ICONS.down}<em>${open.ch}</em>`;
      b.title = `Bring the ${open.ch} down`;
      b.setAttribute("aria-label", `Bring the ${open.ch} down`);
      b.style.gridRow = String(grow(open.from.row));
      b.style.gridColumn = String(gcol(open.from.col));
      b.addEventListener("click", () => {
        const out = kind.bring(thing);
        draw();
        tell(out.message, out.ok ? "ok" : "no");
      });
      paper.appendChild(b);
    } else if (open && open.cells && open.cells.length) {
      open.cells.forEach((c, i) => {
        const box = document.createElement("input");
        box.type = "text";
        box.className = `bd-in${open.count ? " bd-in--count" : ""}`;
        box.inputMode = "numeric";
        box.autocomplete = "off";
        box.spellcheck = false;
        /* one figure, unless the method says otherwise — a column that has
           been lent to holds two (7 becomes 17) */
        box.maxLength = c.len || 1;
        box.setAttribute("aria-label", open.cells.length === 1
          ? "The figure that goes here" : `Figure ${i + 1} of ${open.cells.length}`);
        box.style.gridRow = open.span > 1 ? `${grow(c.row)} / span ${open.span}` : String(grow(c.row));
        box.style.gridColumn = String(gcol(c.col));
        box.addEventListener("input", () => {
          if (!box.value) return;
          const next = boxes[i + 1];
          if (next) return next.focus();
          offer(boxes.map((b) => b.value).join(""));
        });
        box.addEventListener("keydown", (e) => {
          if (e.key === "Backspace" && !box.value && boxes[i - 1]) boxes[i - 1].focus();
          if (e.key === "Enter") { e.preventDefault(); offer(boxes.map((b) => b.value).join("")); }
        });
        box.addEventListener("focus", () => box.select());
        paper.appendChild(box);
        boxes.push(box);
      });
    }

    el.querySelector('[data-do="show"]').disabled = !!sheet.finished;
  }

  el.querySelector(".bd-acts").addEventListener("click", (e) => {
    const what = e.target.closest("[data-do]")?.dataset.do;
    if (!what) return;
    const out = what === "show" ? kind.showNext(thing) : kind.reset(thing);
    draw();
    tell(out.message, out.changed ? "ok" : "");
    boxes[0]?.focus();
  });

  fillSum();
  draw();
  tell(kind.ask(thing).text);

  /* The board itself, on its own element — so a test can work the sum through
     from outside without guessing what it is being asked for. */
  el.__board = { thing, kind, draw };

  return {
    el,
    thing,
    kind,
    focus: () => boxes[0]?.focus(),
    destroy: () => el.remove(),
  };
}
