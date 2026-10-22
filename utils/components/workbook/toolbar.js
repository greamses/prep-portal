/* ============================================================================
   THE WORKBOOK'S TOOLS, ON ANY PAGE
   ----------------------------------------------------------------------------
   The workbook's own rail lives inside interactive.js, where it is wired to
   the paper: modes, instruments laid on the sheet at the sheet's scale, the
   scribble layer, the marking. None of that means anything on a page that is
   not a workbook — but the TOOLS do. A child working out a shop bill wants the
   same calculator and the same written boards as a child working out a
   question on paper, and there is no reason for the site to own two of each.

   So this is the small rail: a key per tool, each opening the real component
   in the real panel (panels.js), with what it was showing kept between visits.
   It takes no paper and no modes, so any page can hang it on the body.

     mountTools(document.body, { tools: ["calculator", "column"] })

   The default set is the working-out tools, which is what a page that is not a
   workbook is going to want.
   ========================================================================== */

import { openPanel, needCss } from "./panels.js";
import { TOOL_ICONS } from "./instruments.js";
import { mountTooltips } from "../tooltip.js";

/* Each tool says only how to open itself. The components are imported when a
   key is first pressed, not before: a shop page should not pay for a long
   division board nobody opens. */
/** One written board, opened in a panel — the same component the workbook uses. */
const board = (id, label) => ({
  [id]: {
    label,
    size: { w: 460, h: 430 },
    async open(body) {
      needCss("/utils/components/boards.css");
      const { mountBoard } = await import("/utils/components/boards/sheet.js");
      /* the mounted board is left on its own element: a board knows the sum it
         is working and what figure comes next, and a tutor demonstrating on it
         needs to be able to ask (toy-shop/js/guide.js) */
      const board = mountBoard(body, { variant: id, base: 10 });
      if (board?.el) board.el.__board = board;
    },
  },
});

const TOOLS = {
  calculator: {
    label: "Calculator",
    size: { w: 340, h: 500 },
    async open(body) {
      /* THE SITE'S ONE CALCULATOR — the same machine as the chemistry bench
         (utils/components/calculator.js), in its paper skin. There is no
         second calculator to keep in step with this one. */
      needCss("/utils/components/calculator.css");
      body.classList.add("wb-panel__body--bare", "wb-panel__body--scroll");
      const { mountCalculator } = await import("/utils/components/calculator.js");
      const host = document.createElement("div");
      host.className = "cl-calc cl-calc--inline";
      host.tabIndex = 0;
      body.appendChild(host);
      const { saved, onChange } = kept("wb-calc");
      mountCalculator(host, {
        state: saved && typeof saved === "object" ? saved : undefined,
        onChange,
        brand: "PREP <b>fx-82</b>",
        theme: "paper",
      });
      host.focus({ preventScroll: true });
      return () => host.remove();
    },
  },
  ...board("column", "Column addition"),
  ...board("times", "Column multiplication"),
  ...board("criss", "Criss-cross multiplication"),
  ...board("shortdiv", "Short division"),
  ...board("longdiv", "Long division"),
  shift: {
    label: "Multiply and divide by ten",
    size: { w: 480, h: 440 },
    async open(body) {
      body.classList.add("wb-panel__body--bare");
      const { mountShift } = await import("./shift.js");
      const t = mountShift(body, kept("wb-shift"));
      return () => t.destroy();
    },
  },
  barmodel: {
    label: "Bar model",
    size: { w: 680, h: 520 },
    async open(body) {
      body.classList.add("wb-panel__body--bare");
      const { mountBarModel } = await import("./barmodel.js");
      const host = document.createElement("div");
      host.className = "mb-board wb-barmodel";
      body.appendChild(host);
      const { saved, onChange } = kept("wb-barmodel");
      const live = mountBarModel(host, {
        saved: saved && Array.isArray(saved.bars) ? saved : null,
        onChange,
      });
      return () => live.dispose();
    },
  },
  note: {
    label: "Notes",
    size: { w: 420, h: 380 },
    async open(body) {
      needCss("/utils/components/sticky-note.css");
      body.classList.add("wb-panel__body--bare");
      const [{ createStickyEditor }, { makeNote }] = await Promise.all([
        import("/utils/components/sticky-note-editor.js"),
        import("/utils/components/sticky-note.js"),
      ]);
      const KEY = `wb-note:${location.pathname}`;
      let saved = null;
      try { saved = JSON.parse(localStorage.getItem(KEY) || "null"); } catch { /* a fresh note */ }
      const note = makeNote(saved && Array.isArray(saved.runs) ? { runs: saved.runs, paper: saved.paper || 0 } : {});
      const keep = (n) => { try { localStorage.setItem(KEY, JSON.stringify({ runs: n.runs, paper: n.paper })); } catch { /* storage full or off */ } };
      let shut = false;
      const pad = createStickyEditor({
        host: body,
        onInput: keep,
        /* a pad stays open until its panel is shut */
        onDone: (n) => { keep(n); if (!shut) setTimeout(() => { if (!shut) pad.open(n); }, 0); },
      });
      pad.el.classList.add("pp-note--pad");
      pad.open(note);
      return () => { shut = true; pad.close(true); pad.destroy(); };
    },
  },
};

/** What a tool was showing last time, and how to keep what it shows now. */
function kept(key) {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(key) || "null"); } catch { /* a fresh one */ }
  return {
    saved,
    onChange: (st) => { try { localStorage.setItem(key, JSON.stringify(st)); } catch { /* not kept */ } },
  };
}

export const TOOL_IDS = Object.keys(TOOLS);

/**
 * Hang the rail on `host` (the body, normally).
 *
 *   tools   which ones, in order
 *   at      "left" or "right" — which side of the window it sits against
 * → { el, open(id), destroy() }
 */
export function mountTools(host = document.body, { tools = ["calculator", "column", "times", "shortdiv", "note"], at = "left" } = {}) {
  /* the rail fetches its own dress, so a page that wants tools needs one line
     and no stylesheet link of its own */
  needCss("/utils/components/workbook.css");
  const ids = tools.filter((id) => TOOLS[id]);

  const el = document.createElement("aside");
  el.className = `wb-tools wb-tools--${at}`;
  el.setAttribute("aria-label", "Tools");
  el.innerHTML = `<div class="wb-tools__paper pp-receipt__paper">`
    + ids.map((id) => `<button type="button" class="wb-tools__btn" data-wbtool="${id}"`
      + ` aria-pressed="false" aria-label="${TOOLS[id].label}"`
      + ` data-tip="${TOOLS[id].label}" data-tip-side="${at === "left" ? "right" : "left"}">`
      + `${TOOL_ICONS[id] || TOOL_ICONS.note}</button>`).join("")
    + `</div>`;
  host.appendChild(el);
  mountTooltips();

  /* one panel per tool, and pressing the key again puts it away — the same
     bargain the workbook's rail makes */
  const open = new Map();

  async function toggle(id) {
    const live = open.get(id);
    if (live) { live.close(); return; }
    const spec = TOOLS[id];
    const key = el.querySelector(`[data-wbtool="${id}"]`);
    key.setAttribute("aria-pressed", "true");
    const panel = openPanel({
      title: spec.label,
      size: spec.size,
      onClose: () => {
        const was = open.get(id);
        open.delete(id);
        key.setAttribute("aria-pressed", "false");
        if (was && was.undo) was.undo();
      },
    });
    open.set(id, panel);
    /* the component is imported and mounted after the panel is up, so the
       panel is never a blank rectangle waiting on a network */
    panel.undo = await spec.open(panel.body);
  }

  el.addEventListener("click", (e) => {
    const k = e.target.closest("[data-wbtool]");
    if (k) toggle(k.dataset.wbtool);
  });

  return {
    el,
    open: toggle,
    destroy() {
      [...open.values()].forEach((p) => p.close());
      el.remove();
    },
  };
}
